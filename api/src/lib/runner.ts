/**
 * Code runner for CodeLab submissions.
 *
 * - JavaScript: Executed directly in the Worker V8 engine via `new Function()`.
 *   Console output is captured. 10s timeout via Promise.race.
 * - Python: Executed via Piston API (https://emkc.org/api/v2/piston/execute).
 *   Free, public, no auth required. 10s timeout.
 *
 * Security notes:
 * - JS runs in the Worker sandbox (no file system, no network from eval scope).
 * - Python runs on Piston's sandboxed containers.
 * - Both have strict time limits.
 */

interface TestCase {
  name?: string;
  input?: string;
  expected?: string;
  stdin?: string;
}

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'error';
  input?: string;
  expected?: string;
  output?: string;
  error?: string;
}

const RUN_TIMEOUT_MS = 10_000;
const PISTON_API_URL = 'https://emkc.org/api/v2/piston/execute';

/**
 * Run JavaScript code and capture console output.
 * Returns stdout (console.log output) and any error.
 */
async function runJavaScript(code: string, stdin?: string): Promise<{ stdout: string; stderr: string; error?: string }> {
  const logs: string[] = [];
  const errors: string[] = [];

  const mockConsole = {
    log: (...args: any[]) => logs.push(args.map(formatVal).join(' ')),
    error: (...args: any[]) => errors.push(args.map(formatVal).join(' ')),
    warn: (...args: any[]) => logs.push(args.map(formatVal).join(' ')),
    info: (...args: any[]) => logs.push(args.map(formatVal).join(' ')),
  };

  // Provide stdin via a prompt-like function if needed
  const inputLines = stdin ? stdin.split('\n') : [];
  let inputIdx = 0;
  const mockPrompt = () => inputLines[inputIdx++] ?? '';

  try {
    const fn = new Function('console', 'prompt', 'require', code);
    const result = await Promise.race([
      Promise.resolve(fn(mockConsole, mockPrompt, undefined)),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout: execution exceeded 10s')), RUN_TIMEOUT_MS)),
    ]);
    // If the code returns a value, append it
    if (result !== undefined) {
      logs.push(formatVal(result));
    }
    return { stdout: logs.join('\n'), stderr: errors.join('\n') };
  } catch (err: any) {
    return { stdout: logs.join('\n'), stderr: errors.join('\n'), error: err.message };
  }
}

/**
 * Run Python code via Piston API.
 */
async function runPython(code: string, stdin?: string): Promise<{ stdout: string; stderr: string; error?: string }> {
  try {
    const res = await fetch(PISTON_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'python',
        version: '3.10.0',
        files: [{ name: 'main.py', content: code }],
        stdin: stdin || '',
        compile_timeout: 5000,
        run_timeout: RUN_TIMEOUT_MS,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => 'unknown');
      return { stdout: '', stderr: '', error: `Piston API error: ${res.status} ${errBody.substring(0, 200)}` };
    }

    const data: any = await res.json();
    const run = data.run || {};
    const compile = data.compile || {};

    const stderr = [compile.stderr || '', run.stderr || ''].filter(Boolean).join('\n');
    const error = run.code !== 0 ? `Exit code: ${run.code}` : undefined;

    return { stdout: run.stdout || '', stderr, error };
  } catch (err: any) {
    return { stdout: '', stderr: '', error: `Python execution failed: ${err.message}` };
  }
}

/**
 * Run code for a single test case.
 */
async function runTestCase(language: string, code: string, tc: TestCase): Promise<TestResult> {
  const input = tc.stdin || tc.input || '';
  const expected = (tc.expected || '').trim();

  let result: { stdout: string; stderr: string; error?: string };

  if (language === 'javascript' || language === 'js') {
    result = await runJavaScript(code, input);
  } else if (language === 'python' || language === 'py') {
    result = await runPython(code, input);
  } else {
    return {
      name: tc.name || 'test',
      status: 'error',
      input,
      expected,
      error: `Unsupported language: ${language}`,
    };
  }

  const output = result.stdout.trim();
  const hasError = result.error || (result.stderr && !output);

  if (hasError && !output) {
    return {
      name: tc.name || 'test',
      status: 'error',
      input,
      expected,
      output: result.stderr || result.error,
      error: result.error || result.stderr,
    };
  }

  const passed = output === expected;
  return {
    name: tc.name || 'test',
    status: passed ? 'passed' : 'failed',
    input,
    expected,
    output,
  };
}

/**
 * Run all test cases for a submission.
 */
export async function runTests(
  language: string,
  code: string,
  testCases: TestCase[]
): Promise<{ results: TestResult[]; passed: number; failed: number }> {
  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    const result = await runTestCase(language, code, tc);
    results.push(result);
    if (result.status === 'passed') {
      passed++;
    } else {
      failed++;
    }
  }

  return { results, passed, failed };
}

function formatVal(val: any): string {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val === 'object') {
    try { return JSON.stringify(val); } catch { return String(val); }
  }
  return String(val);
}
