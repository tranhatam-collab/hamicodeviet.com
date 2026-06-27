// Seed CodeLab exercises — 10 bài tập mẫu Python + JavaScript
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  const exercises = [
    {
      slug: 'python-hello-world',
      title: 'Hello World',
      title_vi: 'Xin Chào Thế Giới',
      description: 'Write a program that prints "Hello, World!" to the console.',
      description_vi: 'Viết chương trình in ra "Hello, World!" trên màn hình.',
      language: 'python',
      difficulty: 'beginner',
      category: 'basics',
      starter_code: '# Write your code here\n',
      solution_code: 'print("Hello, World!")',
      test_cases: JSON.stringify([{ name: 'test_hello', input: '', expected: 'Hello, World!' }]),
      hints: JSON.stringify(['Use the print() function']),
      points: 5,
    },
    {
      slug: 'python-variables',
      title: 'Variables and Types',
      title_vi: 'Biến và Kiểu Dữ Liệu',
      description: 'Create a variable named `name` with value "Alice" and print it.',
      description_vi: 'Tạo biến `name` có giá trị "Alice" và in ra.',
      language: 'python',
      difficulty: 'beginner',
      category: 'basics',
      starter_code: '# Create variable name and print it\n',
      solution_code: 'name = "Alice"\nprint(name)',
      test_cases: JSON.stringify([{ name: 'test_name', input: '', expected: 'Alice' }]),
      hints: JSON.stringify(['Variables are created with = operator', 'Use print() to output']),
      points: 5,
    },
    {
      slug: 'python-sum-two-numbers',
      title: 'Sum of Two Numbers',
      title_vi: 'Tổng Hai Số',
      description: 'Write a function `add(a, b)` that returns the sum of a and b.',
      description_vi: 'Viết hàm `add(a, b)` trả về tổng của a và b.',
      language: 'python',
      difficulty: 'beginner',
      category: 'functions',
      starter_code: 'def add(a, b):\n    # Write your code here\n    pass\n',
      solution_code: 'def add(a, b):\n    return a + b',
      test_cases: JSON.stringify([
        { name: 'test_1', input: 'add(1, 2)', expected: '3' },
        { name: 'test_2', input: 'add(5, 10)', expected: '15' },
        { name: 'test_3', input: 'add(-1, 1)', expected: '0' },
      ]),
      hints: JSON.stringify(['Use the + operator', 'Return the result']),
      points: 10,
    },
    {
      slug: 'python-fizzbuzz',
      title: 'FizzBuzz',
      title_vi: 'FizzBuzz',
      description: 'Print Fizz for multiples of 3, Buzz for multiples of 5, FizzBuzz for both, else the number. From 1 to 20.',
      description_vi: 'In Fizz cho bội số của 3, Buzz cho bội số của 5, FizzBuzz cho cả hai, còn lại in số. Từ 1 đến 20.',
      language: 'python',
      difficulty: 'intermediate',
      category: 'logic',
      starter_code: 'for i in range(1, 21):\n    # Write your code here\n    pass\n',
      solution_code: 'for i in range(1, 21):\n    if i % 15 == 0:\n        print("FizzBuzz")\n    elif i % 3 == 0:\n        print("Fizz")\n    elif i % 5 == 0:\n        print("Buzz")\n    else:\n        print(i)',
      test_cases: JSON.stringify([{ name: 'test_fizzbuzz', input: '', expected: '1\\n2\\nFizz\\n4\\nBuzz\\nFizz\\n7\\n8\\nFizz\\nBuzz\\n11\\nFizz\\n13\\n14\\nFizzBuzz\\n16\\n17\\nFizz\\n19\\nBuzz' }]),
      hints: JSON.stringify(['Check divisible by 15 first (3*5)', 'Use elif for remaining cases']),
      points: 15,
    },
    {
      slug: 'python-reverse-string',
      title: 'Reverse a String',
      title_vi: 'Đảo Ngược Chuỗi',
      description: 'Write a function `reverse(s)` that returns the reversed string.',
      description_vi: 'Viết hàm `reverse(s)` trả về chuỗi đảo ngược.',
      language: 'python',
      difficulty: 'beginner',
      category: 'strings',
      starter_code: 'def reverse(s):\n    # Write your code here\n    pass\n',
      solution_code: 'def reverse(s):\n    return s[::-1]',
      test_cases: JSON.stringify([
        { name: 'test_1', input: 'reverse("hello")', expected: 'olleh' },
        { name: 'test_2', input: 'reverse("world")', expected: 'dlrow' },
      ]),
      hints: JSON.stringify(['Use slicing: s[::-1]']),
      points: 10,
    },
    {
      slug: 'python-factorial',
      title: 'Factorial',
      title_vi: 'Giai Thừa',
      description: 'Write a function `factorial(n)` that returns n! (n factorial).',
      description_vi: 'Viết hàm `factorial(n)` trả về n giai thừa.',
      language: 'python',
      difficulty: 'intermediate',
      category: 'recursion',
      starter_code: 'def factorial(n):\n    # Write your code here\n    pass\n',
      solution_code: 'def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)',
      test_cases: JSON.stringify([
        { name: 'test_1', input: 'factorial(0)', expected: '1' },
        { name: 'test_2', input: 'factorial(5)', expected: '120' },
        { name: 'test_3', input: 'factorial(10)', expected: '3628800' },
      ]),
      hints: JSON.stringify(['Base case: factorial(0) = 1', 'Recursive case: n * factorial(n-1)']),
      points: 15,
    },
    {
      slug: 'js-hello-world',
      title: 'Hello World (JavaScript)',
      title_vi: 'Xin Chào Thế Giới (JavaScript)',
      description: 'Write a function that returns "Hello, World!".',
      description_vi: 'Viết hàm trả về "Hello, World!".',
      language: 'javascript',
      difficulty: 'beginner',
      category: 'basics',
      starter_code: 'function hello() {\n  // Write your code here\n}\n',
      solution_code: 'function hello() {\n  return "Hello, World!";\n}',
      test_cases: JSON.stringify([{ name: 'test_hello', input: 'hello()', expected: 'Hello, World!' }]),
      hints: JSON.stringify(['Use return statement']),
      points: 5,
    },
    {
      slug: 'js-sum-array',
      title: 'Sum of Array',
      title_vi: 'Tổng Mảng',
      description: 'Write a function `sumArray(arr)` that returns the sum of all elements.',
      description_vi: 'Viết hàm `sumArray(arr)` trả về tổng tất cả phần tử.',
      language: 'javascript',
      difficulty: 'beginner',
      category: 'arrays',
      starter_code: 'function sumArray(arr) {\n  // Write your code here\n}\n',
      solution_code: 'function sumArray(arr) {\n  return arr.reduce((a, b) => a + b, 0);\n}',
      test_cases: JSON.stringify([
        { name: 'test_1', input: 'sumArray([1, 2, 3])', expected: '6' },
        { name: 'test_2', input: 'sumArray([])', expected: '0' },
        { name: 'test_3', input: 'sumArray([10, 20, 30])', expected: '60' },
      ]),
      hints: JSON.stringify(['Use reduce() method', 'Initial value 0 for empty array']),
      points: 10,
    },
    {
      slug: 'js-palindrome',
      title: 'Check Palindrome',
      title_vi: 'Kiểm Tra Palindrome',
      description: 'Write a function `isPalindrome(s)` that returns true if s is a palindrome.',
      description_vi: 'Viết hàm `isPalindrome(s)` trả về true nếu s là chuỗi đối xứng.',
      language: 'javascript',
      difficulty: 'intermediate',
      category: 'strings',
      starter_code: 'function isPalindrome(s) {\n  // Write your code here\n}\n',
      solution_code: 'function isPalindrome(s) {\n  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return cleaned === cleaned.split("").reverse().join("");\n}',
      test_cases: JSON.stringify([
        { name: 'test_1', input: 'isPalindrome("racecar")', expected: 'true' },
        { name: 'test_2', input: 'isPalindrome("hello")', expected: 'false' },
        { name: 'test_3', input: 'isPalindrome("A man a plan a canal Panama")', expected: 'true' },
      ]),
      hints: JSON.stringify(['Clean string: lowercase + remove non-alphanumeric', 'Compare with reversed version']),
      points: 15,
    },
    {
      slug: 'python-fibonacci',
      title: 'Fibonacci Sequence',
      title_vi: 'Dãy Fibonacci',
      description: 'Write a function `fibonacci(n)` that returns the nth Fibonacci number. fib(0)=0, fib(1)=1.',
      description_vi: 'Viết hàm `fibonacci(n)` trả về số Fibonacci thứ n. fib(0)=0, fib(1)=1.',
      language: 'python',
      difficulty: 'intermediate',
      category: 'recursion',
      starter_code: 'def fibonacci(n):\n    # Write your code here\n    pass\n',
      solution_code: 'def fibonacci(n):\n    if n <= 0:\n        return 0\n    if n == 1:\n        return 1\n    return fibonacci(n-1) + fibonacci(n-2)',
      test_cases: JSON.stringify([
        { name: 'test_0', input: 'fibonacci(0)', expected: '0' },
        { name: 'test_1', input: 'fibonacci(1)', expected: '1' },
        { name: 'test_10', input: 'fibonacci(10)', expected: '55' },
      ]),
      hints: JSON.stringify(['Base cases: fib(0)=0, fib(1)=1', 'Recursive: fib(n) = fib(n-1) + fib(n-2)']),
      points: 20,
    },
  ];

  for (const ex of exercises) {
    const existing = await client.query('SELECT 1 FROM codelab_exercises WHERE slug = $1', [ex.slug]);
    if (existing.rows.length > 0) {
      console.log('EXISTS: ' + ex.slug);
      continue;
    }
    await client.query(
      `INSERT INTO codelab_exercises (slug, title, title_vi, description, description_vi, language, difficulty, category, starter_code, solution_code, test_cases, hints, points)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13)`,
      [ex.slug, ex.title, ex.title_vi, ex.description, ex.description_vi, ex.language, ex.difficulty, ex.category, ex.starter_code, ex.solution_code, ex.test_cases, ex.hints, ex.points]
    );
    console.log('INSERTED: ' + ex.slug + ' (' + ex.points + ' pts)');
  }

  const count = await client.query('SELECT count(*) as cnt, count(*) FILTER (WHERE language = $1) as python, count(*) FILTER (WHERE language = $2) as js FROM codelab_exercises', ['python', 'javascript']);
  console.log('\nTotal: ' + count.rows[0].cnt + ' exercises (Python: ' + count.rows[0].python + ', JS: ' + count.rows[0].js + ')');

  await client.end();
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
