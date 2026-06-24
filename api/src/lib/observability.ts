/**
 * Observability utilities for HaMi Code Việt API
 * Includes request ID tracking, structured logging, and metrics
 */

import { Context } from 'hono';

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Request ID middleware
 * Generates or retrieves request ID and adds to context
 */
export function requestIdMiddleware() {
  return async (c: Context, next: () => Promise<void>) => {
    const requestId = c.req.header('x-request-id') || generateRequestId();
    c.set('requestId', requestId);
    c.header('x-request-id', requestId);
    await next();
  };
}

/**
 * Structured logger
 * JSON-formatted logs with consistent structure
 */
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private log(level: string, message: string, data?: Record<string, unknown>) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      requestId: (globalThis as any).requestId || 'unknown',
      ...data,
    };

    // In production, this would send to a log aggregation service
    // For now, we'll use console.log with JSON formatting
    console.log(JSON.stringify(logEntry));
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, unknown>) {
    this.log('error', message, data);
  }

  debug(message: string, data?: Record<string, unknown>) {
    this.log('debug', message, data);
  }
}

/**
 * Create a logger instance for a specific context
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}

/**
 * Metrics collector
 * Simple in-memory metrics for Cloudflare Workers
 */
export class Metrics {
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  increment(name: string, value = 1) {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }

  timing(name: string, duration: number) {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, []);
    }
    this.histograms.get(name)!.push(duration);
  }

  getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }

  getHistogram(name: string): number[] {
    return this.histograms.get(name) || [];
  }

  reset() {
    this.counters.clear();
    this.histograms.clear();
  }

  toJSON() {
    return {
      counters: Object.fromEntries(this.counters),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([name, values]) => [
          name,
          {
            count: values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
          },
        ])
      ),
    };
  }
}

/**
 * Global metrics instance
 */
export const metrics = new Metrics();

/**
 * Metrics middleware
 * Tracks request counts and response times
 */
export function metricsMiddleware() {
  return async (c: Context, next: () => Promise<void>) => {
    const startTime = Date.now();
    const path = c.req.path;
    const method = c.req.method;

    await next();

    const duration = Date.now() - startTime;
    const status = c.res.status;

    // Track request count
    metrics.increment(`requests.total`);
    metrics.increment(`requests.${method.toLowerCase()}.${path}`);

    // Track response time
    metrics.timing(`response_time.${path}`, duration);

    // Track status codes
    metrics.increment(`status.${status}`);
  };
}

/**
 * Sensitive data redaction
 * Removes sensitive data from logs
 */
export function redactSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'authorization',
    'creditCard',
    'ssn',
    'email',
  ];

  const redacted = { ...data };

  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = '[REDACTED]';
    }
  }

  return redacted;
}

/**
 * Error logging middleware
 * Logs errors with context
 */
export function errorLoggingMiddleware(logger: Logger) {
  return async (c: Context, next: () => Promise<void>) => {
    try {
      await next();
    } catch (error) {
      logger.error('Request error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        path: c.req.path,
        method: c.req.method,
        status: c.res.status,
      });
      throw error;
    }
  };
}
