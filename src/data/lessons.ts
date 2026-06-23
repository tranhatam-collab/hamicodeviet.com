import type { Bilingual } from './i18n';

export interface Lesson {
  id: string;
  slug: string;
  number: number;
  trackId: string;
  title: Bilingual;
  description: Bilingual;
  duration: number; // minutes
  level: 'beginner' | 'elementary' | 'intermediate';
  tags: string[];
  objectives: Bilingual[];
  buildOutput: Bilingual;
  codeSnippet?: string;
  codeLanguage?: string;
  status: 'free' | 'premium';
}

export const lessons: Lesson[] = [
  // ─── Creative Explorer (8–10) ─── Lessons 1–6
  {
    id: 'l01',
    slug: 'may-tinh-nghi-nhu-the-nao',
    number: 1,
    trackId: 'creative-explorer',
    title: { vi: 'Máy tính nghĩ như thế nào?', en: 'How does a computer think?' },
    description: {
      vi: 'Khám phá cách máy tính nhận lệnh và thực hiện từng bước theo thứ tự. Hiểu khái niệm algorithm qua trò chơi làm sandwich.',
      en: 'Discover how a computer receives commands and executes them step by step. Understand the concept of algorithms through a sandwich-making game.',
    },
    duration: 20,
    level: 'beginner',
    tags: ['algorithm', 'thinking', 'scratch'],
    objectives: [
      { vi: 'Hiểu máy tính thực hiện lệnh theo thứ tự', en: 'Understand computers follow commands in order' },
      { vi: 'Nhận biết algorithm trong cuộc sống', en: 'Recognize algorithms in daily life' },
      { vi: 'Biết từ: command, step, order, algorithm', en: 'Know words: command, step, order, algorithm' },
    ],
    buildOutput: { vi: 'Bản đồ thuật toán làm sandwich', en: 'A sandwich-making algorithm map' },
    status: 'free',
  },
  {
    id: 'l02',
    slug: 'scratch-nhan-vat-dau-tien',
    number: 2,
    trackId: 'creative-explorer',
    title: { vi: 'Nhân vật Scratch đầu tiên', en: 'Your first Scratch character' },
    description: {
      vi: 'Tạo nhân vật Scratch, thêm backdrop và lập trình nhân vật chào hỏi. Làm quen với khối lệnh event và motion.',
      en: 'Create a Scratch sprite, add a backdrop, and program the character to say hello. Learn event and motion blocks.',
    },
    duration: 25,
    level: 'beginner',
    tags: ['scratch', 'sprite', 'event', 'motion'],
    objectives: [
      { vi: 'Tạo sprite và thêm backdrop', en: 'Create a sprite and add a backdrop' },
      { vi: 'Dùng khối when flag clicked', en: 'Use when flag clicked block' },
      { vi: 'Lập trình nhân vật nói và di chuyển', en: 'Program character to speak and move' },
    ],
    buildOutput: { vi: 'Nhân vật biết chào và di chuyển', en: 'A character that greets and moves' },
    codeSnippet: `when flag clicked
say "Xin chào! / Hello!" for 2 seconds
move 100 steps
turn 15 degrees`,
    codeLanguage: 'scratch',
    status: 'free',
  },
  {
    id: 'l03',
    slug: 'vong-lap-va-su-lap-lai',
    number: 3,
    trackId: 'creative-explorer',
    title: { vi: 'Vòng lặp và sự lặp lại', en: 'Loops and repetition' },
    description: {
      vi: 'Học khái niệm vòng lặp qua hoạt động vẽ hình tròn nhiều lần. Hiểu tại sao vòng lặp giúp code ngắn hơn.',
      en: 'Learn the concept of loops through drawing circles repeatedly. Understand why loops make code shorter.',
    },
    duration: 20,
    level: 'beginner',
    tags: ['loop', 'repeat', 'scratch', 'pattern'],
    objectives: [
      { vi: 'Hiểu khái niệm vòng lặp', en: 'Understand the concept of loops' },
      { vi: 'Dùng khối repeat trong Scratch', en: 'Use the repeat block in Scratch' },
      { vi: 'Vẽ hình bằng pen', en: 'Draw shapes with pen' },
    ],
    buildOutput: { vi: 'Họa tiết hình học bằng Scratch', en: 'A geometric pattern in Scratch' },
    codeSnippet: `when flag clicked
repeat 6
  move 100 steps
  turn 60 degrees`,
    codeLanguage: 'scratch',
    status: 'free',
  },
  {
    id: 'l04',
    slug: 'ieu-kien-va-quyet-dinh',
    number: 4,
    trackId: 'creative-explorer',
    title: { vi: 'Điều kiện và quyết định', en: 'Conditions and decisions' },
    description: {
      vi: 'Học về câu lệnh if-then qua trò chơi đèn giao thông. Nhân vật sẽ hành động khác nhau tùy theo màu đèn.',
      en: 'Learn about if-then statements through a traffic light game. The character acts differently depending on the light color.',
    },
    duration: 25,
    level: 'beginner',
    tags: ['condition', 'if-then', 'decision', 'scratch'],
    objectives: [
      { vi: 'Hiểu câu lệnh if-then', en: 'Understand if-then statements' },
      { vi: 'Dùng khối if trong Scratch', en: 'Use the if block in Scratch' },
      { vi: 'Lập trình nhân vật phản ứng', en: 'Program character reactions' },
    ],
    buildOutput: { vi: 'Game đèn giao thông tương tác', en: 'An interactive traffic light game' },
    status: 'free',
  },
  {
    id: 'l05',
    slug: 'ke-chuyen-bang-scratch',
    number: 5,
    trackId: 'creative-explorer',
    title: { vi: 'Kể chuyện bằng Scratch', en: 'Tell a story with Scratch' },
    description: {
      vi: 'Kết hợp nhân vật, backdrop, âm thanh và hội thoại để tạo một câu chuyện ngắn. Học cách đồng bộ sự kiện giữa các sprite.',
      en: 'Combine characters, backdrops, sounds, and dialogue to create a short story. Learn to sync events between sprites.',
    },
    duration: 30,
    level: 'beginner',
    tags: ['storytelling', 'events', 'broadcast', 'scratch'],
    objectives: [
      { vi: 'Kết hợp nhiều sprite và scene', en: 'Combine multiple sprites and scenes' },
      { vi: 'Dùng broadcast để đồng bộ', en: 'Use broadcast to synchronize' },
      { vi: 'Thêm âm thanh vào câu chuyện', en: 'Add sounds to the story' },
    ],
    buildOutput: { vi: 'Câu chuyện ngắn 3 cảnh', en: 'A short story with 3 scenes' },
    status: 'free',
  },
  {
    id: 'l06',
    slug: 'mini-game-bat-trai-cay',
    number: 6,
    trackId: 'creative-explorer',
    title: { vi: 'Mini-game: Bắt trái cây', en: 'Mini-game: Catch the fruits' },
    description: {
      vi: 'Xây dựng mini-game đơn giản: nhân vật di chuyển bắt trái cây rơi, tính điểm khi bắt được. Áp dụng vòng lặp, điều kiện và biến điểm.',
      en: 'Build a simple mini-game: a character moves to catch falling fruits and scores points when caught. Apply loops, conditions, and score variables.',
    },
    duration: 35,
    level: 'beginner',
    tags: ['game', 'variable', 'collision', 'scratch'],
    objectives: [
      { vi: 'Dùng biến để lưu điểm', en: 'Use variables to store score' },
      { vi: 'Lập trình va chạm giữa sprite', en: 'Program sprite collision' },
      { vi: 'Tạo vật thể rơi ngẫu nhiên', en: 'Create randomly falling objects' },
    ],
    buildOutput: { vi: 'Mini-game bắt trái cây có tính điểm', en: 'A fruit-catching mini-game with score' },
    status: 'free',
  },

  // ─── Junior Builder (11–13) ─── Lessons 7–12
  {
    id: 'l07',
    slug: 'html-trang-web-dau-tien',
    number: 7,
    trackId: 'junior-builder',
    title: { vi: 'HTML: Trang web đầu tiên', en: 'HTML: Your first web page' },
    description: {
      vi: 'Hiểu cấu trúc của một trang HTML. Tạo trang giới thiệu bản thân với tiêu đề, đoạn văn, danh sách và hình ảnh.',
      en: 'Understand the structure of an HTML page. Create a personal intro page with headings, paragraphs, lists, and images.',
    },
    duration: 25,
    level: 'beginner',
    tags: ['html', 'web', 'structure', 'tags'],
    objectives: [
      { vi: 'Hiểu cấu trúc HTML cơ bản', en: 'Understand basic HTML structure' },
      { vi: 'Dùng tag h1-h6, p, ul, img, a', en: 'Use tags h1-h6, p, ul, img, a' },
      { vi: 'Tạo trang giới thiệu bản thân', en: 'Create a personal intro page' },
    ],
    buildOutput: { vi: 'Trang HTML giới thiệu bản thân', en: 'A personal HTML intro page' },
    codeSnippet: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Trang của tôi / My Page</title>
</head>
<body>
  <h1>Xin chào! / Hello!</h1>
  <p>Tôi là / I am <strong>Hà Mi</strong>.</p>
  <ul>
    <li>Lập trình / Coding</li>
    <li>Toán học / Math</li>
  </ul>
</body>
</html>`,
    codeLanguage: 'html',
    status: 'free',
  },
  {
    id: 'l08',
    slug: 'css-lam-dep-trang-web',
    number: 8,
    trackId: 'junior-builder',
    title: { vi: 'CSS: Làm đẹp trang web', en: 'CSS: Style your web page' },
    description: {
      vi: 'Thêm CSS để thay đổi màu sắc, font chữ, khoảng cách và tạo bố cục cơ bản. Hiểu selector, property và value.',
      en: 'Add CSS to change colors, fonts, spacing, and create basic layout. Understand selectors, properties, and values.',
    },
    duration: 30,
    level: 'beginner',
    tags: ['css', 'style', 'color', 'layout'],
    objectives: [
      { vi: 'Hiểu selector, property, value', en: 'Understand selector, property, value' },
      { vi: 'Thay đổi màu sắc và font', en: 'Change colors and fonts' },
      { vi: 'Dùng margin, padding, border', en: 'Use margin, padding, border' },
    ],
    buildOutput: { vi: 'Trang HTML đã được tạo kiểu với CSS', en: 'A styled HTML page with CSS' },
    codeSnippet: `body {
  font-family: 'Segoe UI', sans-serif;
  background: #F7FAFC;
  color: #102A43;
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

h1 {
  color: #00A8CC;
  border-bottom: 3px solid #FFC857;
  padding-bottom: 8px;
}`,
    codeLanguage: 'css',
    status: 'free',
  },
  {
    id: 'l09',
    slug: 'javascript-bien-va-lenh-in',
    number: 9,
    trackId: 'junior-builder',
    title: { vi: 'JavaScript: Biến và lệnh in', en: 'JavaScript: Variables and output' },
    description: {
      vi: 'Bước đầu với JavaScript: khai báo biến, gán giá trị và hiển thị kết quả lên màn hình. Hiểu let, const và console.log.',
      en: 'First steps with JavaScript: declare variables, assign values and display results. Understand let, const, and console.log.',
    },
    duration: 25,
    level: 'elementary',
    tags: ['javascript', 'variable', 'let', 'const'],
    objectives: [
      { vi: 'Khai báo biến với let và const', en: 'Declare variables with let and const' },
      { vi: 'Gán và thay đổi giá trị biến', en: 'Assign and change variable values' },
      { vi: 'Dùng console.log và alert', en: 'Use console.log and alert' },
    ],
    buildOutput: { vi: 'Script tính tuổi và hiển thị lời chào', en: 'A script that calculates age and greets' },
    codeSnippet: `// Tiếng Việt / English: Variables
const ten = "Hà Mi";       // name
const namSinh = 2016;      // birth year
const namNay = 2026;       // current year
let tuoi = namNay - namSinh; // age

console.log(\`Xin chào \${ten}! / Hello \${ten}!\`);
console.log(\`Bạn \${tuoi} tuổi. / You are \${tuoi} years old.\`);`,
    codeLanguage: 'javascript',
    status: 'free',
  },
  {
    id: 'l10',
    slug: 'javascript-if-else-game-so',
    number: 10,
    trackId: 'junior-builder',
    title: { vi: 'JavaScript: if/else — Game đoán số', en: 'JavaScript: if/else — Number guessing game' },
    description: {
      vi: 'Xây dựng game đoán số với if/else: người dùng đoán một số bí mật, chương trình phản hồi "quá cao", "quá thấp" hoặc "chính xác".',
      en: 'Build a number guessing game with if/else: user guesses a secret number, the program responds "too high", "too low", or "correct".',
    },
    duration: 30,
    level: 'elementary',
    tags: ['javascript', 'if-else', 'game', 'input'],
    objectives: [
      { vi: 'Viết câu lệnh if/else/else if', en: 'Write if/else/else if statements' },
      { vi: 'Nhận input từ người dùng', en: 'Get user input' },
      { vi: 'Tạo số ngẫu nhiên với Math.random()', en: 'Generate random numbers with Math.random()' },
    ],
    buildOutput: { vi: 'Game đoán số ngẫu nhiên', en: 'A random number guessing game' },
    codeSnippet: `const bíMật = Math.floor(Math.random() * 10) + 1; // 1-10
const đoán = parseInt(prompt("Đoán số từ 1-10 / Guess 1-10:"));

if (đoán === bíMật) {
  alert("🎉 Chính xác! / Correct!");
} else if (đoán > bíMật) {
  alert("📉 Quá cao! / Too high!");
} else {
  alert("📈 Quá thấp! / Too low!");
}`,
    codeLanguage: 'javascript',
    status: 'free',
  },
  {
    id: 'l11',
    slug: 'javascript-vong-lap-for',
    number: 11,
    trackId: 'junior-builder',
    title: { vi: 'JavaScript: Vòng lặp for', en: 'JavaScript: for loops' },
    description: {
      vi: 'Học vòng lặp for trong JavaScript để tạo danh sách, tính tổng và tạo hoa văn. Hiểu cú pháp init, condition và update.',
      en: 'Learn for loops in JavaScript to create lists, calculate sums, and draw patterns. Understand init, condition, and update syntax.',
    },
    duration: 25,
    level: 'elementary',
    tags: ['javascript', 'loop', 'for', 'array'],
    objectives: [
      { vi: 'Viết vòng lặp for cơ bản', en: 'Write basic for loops' },
      { vi: 'Dùng vòng lặp tạo danh sách HTML', en: 'Use loops to generate HTML lists' },
      { vi: 'Hiểu chỉ số i và điều kiện dừng', en: 'Understand index i and stop condition' },
    ],
    buildOutput: { vi: 'Bảng cửu chương hiển thị trên web', en: 'A multiplication table displayed on the web' },
    codeSnippet: `// Bảng cửu chương số 3 / Multiplication table of 3
for (let i = 1; i <= 10; i++) {
  const kếtQuả = 3 * i;
  document.write(\`3 × \${i} = \${kếtQuả}<br>\`);
}`,
    codeLanguage: 'javascript',
    status: 'free',
  },
  {
    id: 'l12',
    slug: 'an-toan-so-co-ban',
    number: 12,
    trackId: 'junior-builder',
    title: { vi: 'An toàn số cơ bản', en: 'Basic digital safety' },
    description: {
      vi: 'Học cách bảo vệ tài khoản online: mật khẩu mạnh, nhận biết phishing, quyền riêng tư và nguyên tắc chia sẻ thông tin an toàn.',
      en: 'Learn to protect online accounts: strong passwords, recognizing phishing, privacy, and safe information sharing principles.',
    },
    duration: 20,
    level: 'beginner',
    tags: ['safety', 'password', 'privacy', 'phishing'],
    objectives: [
      { vi: 'Tạo mật khẩu mạnh', en: 'Create strong passwords' },
      { vi: 'Nhận biết email/link lừa đảo', en: 'Recognize phishing emails/links' },
      { vi: 'Hiểu quyền riêng tư online', en: 'Understand online privacy' },
    ],
    buildOutput: { vi: 'Checklist an toàn số cá nhân', en: 'A personal digital safety checklist' },
    status: 'free',
  },

  // ─── Young Creator (14–17) ─── Lessons 13–18
  {
    id: 'l13',
    slug: 'python-bien-va-kieu-du-lieu',
    number: 13,
    trackId: 'young-creator',
    title: { vi: 'Python: Biến và kiểu dữ liệu', en: 'Python: Variables and data types' },
    description: {
      vi: 'Bắt đầu với Python: kiểu dữ liệu str, int, float, bool và cách khai báo biến. Dùng print() và type() để kiểm tra.',
      en: 'Start with Python: data types str, int, float, bool and how to declare variables. Use print() and type() to inspect.',
    },
    duration: 25,
    level: 'beginner',
    tags: ['python', 'variable', 'data-type', 'string'],
    objectives: [
      { vi: 'Hiểu 4 kiểu dữ liệu cơ bản', en: 'Understand 4 basic data types' },
      { vi: 'Khai báo và in biến', en: 'Declare and print variables' },
      { vi: 'Dùng f-string', en: 'Use f-strings' },
    ],
    buildOutput: { vi: 'Script giới thiệu bản thân bằng Python', en: 'A Python self-introduction script' },
    codeSnippet: `# Tiếng Việt / English comments
ten = "Hà Mi"           # name (str)
tuoi = 16               # age (int)
diem_tb = 9.5           # avg score (float)
thich_code = True       # likes coding (bool)

print(f"Xin chào! Tôi là {ten}.")
print(f"Hello! I am {ten}.")
print(f"Tuổi / Age: {tuoi}")
print(f"Điểm TB / Avg: {diem_tb}")
print(f"Kiểu tuổi / Type: {type(tuoi)}")`,
    codeLanguage: 'python',
    status: 'free',
  },
  {
    id: 'l14',
    slug: 'python-ham-va-module',
    number: 14,
    trackId: 'young-creator',
    title: { vi: 'Python: Hàm và module', en: 'Python: Functions and modules' },
    description: {
      vi: 'Học cách định nghĩa hàm với def, truyền tham số và trả về giá trị. Import module random và math để tính toán.',
      en: 'Learn to define functions with def, pass parameters, and return values. Import random and math modules for calculations.',
    },
    duration: 30,
    level: 'elementary',
    tags: ['python', 'function', 'def', 'module', 'import'],
    objectives: [
      { vi: 'Định nghĩa và gọi hàm', en: 'Define and call functions' },
      { vi: 'Dùng tham số và return', en: 'Use parameters and return' },
      { vi: 'Import và dùng module', en: 'Import and use modules' },
    ],
    buildOutput: { vi: 'Bộ hàm tính toán học', en: 'A set of math calculation functions' },
    codeSnippet: `import math
import random

def tinh_chu_vi(ban_kinh):
    """Tính chu vi hình tròn / Calculate circle circumference"""
    return 2 * math.pi * ban_kinh

def so_ngau_nhien(min_val, max_val):
    """Số ngẫu nhiên / Random number"""
    return random.randint(min_val, max_val)

# Gọi hàm / Call functions
r = 5
print(f"Chu vi / Circumference: {tinh_chu_vi(r):.2f}")
print(f"Số ngẫu nhiên / Random: {so_ngau_nhien(1, 100)}")`,
    codeLanguage: 'python',
    status: 'free',
  },
  {
    id: 'l15',
    slug: 'git-quan-ly-phien-ban',
    number: 15,
    trackId: 'young-creator',
    title: { vi: 'Git: Quản lý phiên bản code', en: 'Git: Version control your code' },
    description: {
      vi: 'Học Git cơ bản: init, add, commit, log. Hiểu tại sao quản lý phiên bản quan trọng và cách đọc lịch sử commit.',
      en: 'Learn basic Git: init, add, commit, log. Understand why version control matters and how to read commit history.',
    },
    duration: 25,
    level: 'elementary',
    tags: ['git', 'version-control', 'commit', 'terminal'],
    objectives: [
      { vi: 'Khởi tạo repo với git init', en: 'Initialize a repo with git init' },
      { vi: 'Stage và commit với git add/commit', en: 'Stage and commit with git add/commit' },
      { vi: 'Xem lịch sử với git log', en: 'View history with git log' },
    ],
    buildOutput: { vi: 'Repo Git với 5 commit lịch sử', en: 'A Git repo with 5 commits' },
    codeSnippet: `# Các lệnh Git cơ bản / Basic Git commands
git init                         # Tạo repo mới
git add .                        # Stage tất cả file
git commit -m "feat: first page" # Tạo commit
git log --oneline                # Xem lịch sử
git status                       # Kiểm tra trạng thái`,
    codeLanguage: 'bash',
    status: 'free',
  },
  {
    id: 'l16',
    slug: 'web-dong-dom-va-su-kien',
    number: 16,
    trackId: 'young-creator',
    title: { vi: 'Web động: DOM và sự kiện', en: 'Dynamic web: DOM and events' },
    description: {
      vi: 'Học cách JavaScript thao tác DOM: chọn phần tử, thay đổi nội dung và CSS, lắng nghe sự kiện click, input.',
      en: 'Learn how JavaScript manipulates the DOM: select elements, change content and CSS, listen to click and input events.',
    },
    duration: 35,
    level: 'elementary',
    tags: ['javascript', 'dom', 'event', 'dynamic'],
    objectives: [
      { vi: 'Chọn phần tử với querySelector', en: 'Select elements with querySelector' },
      { vi: 'Thay đổi textContent và style', en: 'Change textContent and style' },
      { vi: 'Lắng nghe sự kiện click', en: 'Listen to click events' },
    ],
    buildOutput: { vi: 'Bộ đếm click có animation', en: 'A click counter with animation' },
    codeSnippet: `const btn = document.querySelector('#btn-click');
const counter = document.querySelector('#counter');
let count = 0;

btn.addEventListener('click', () => {
  count++;
  counter.textContent = count;
  // Đổi màu / Change color
  counter.style.color = count > 10 ? '#20A779' : '#00A8CC';
});`,
    codeLanguage: 'javascript',
    status: 'free',
  },
  {
    id: 'l17',
    slug: 'ai-literacy-ai-hoat-dong-nhu-the-nao',
    number: 17,
    trackId: 'young-creator',
    title: { vi: 'AI Literacy: AI hoạt động như thế nào?', en: 'AI Literacy: How does AI work?' },
    description: {
      vi: 'Hiểu AI là gì, machine learning học từ dữ liệu ra sao, tại sao AI có thể sai và cách sử dụng AI có trách nhiệm.',
      en: 'Understand what AI is, how machine learning learns from data, why AI can be wrong, and how to use AI responsibly.',
    },
    duration: 25,
    level: 'elementary',
    tags: ['ai', 'machine-learning', 'ethics', 'literacy'],
    objectives: [
      { vi: 'Mô tả AI và machine learning', en: 'Describe AI and machine learning' },
      { vi: 'Giải thích bias trong AI', en: 'Explain bias in AI' },
      { vi: 'Liệt kê nguyên tắc dùng AI', en: 'List principles for using AI' },
    ],
    buildOutput: { vi: 'Bản tóm tắt nguyên tắc dùng AI có trách nhiệm', en: 'A summary of responsible AI principles' },
    status: 'free',
  },
  {
    id: 'l18',
    slug: 'python-xay-web-scraper-don-gian',
    number: 18,
    trackId: 'young-creator',
    title: { vi: 'Python: Xây web scraper đơn giản', en: 'Python: Build a simple web scraper' },
    description: {
      vi: 'Dùng requests và BeautifulSoup để lấy dữ liệu từ trang web. Học cách phân tích HTML và trích xuất thông tin.',
      en: 'Use requests and BeautifulSoup to fetch data from web pages. Learn to parse HTML and extract information.',
    },
    duration: 35,
    level: 'intermediate',
    tags: ['python', 'web-scraping', 'requests', 'beautifulsoup'],
    objectives: [
      { vi: 'Dùng requests.get()', en: 'Use requests.get()' },
      { vi: 'Parse HTML với BeautifulSoup', en: 'Parse HTML with BeautifulSoup' },
      { vi: 'Trích xuất và lưu dữ liệu', en: 'Extract and save data' },
    ],
    buildOutput: { vi: 'Script lấy dữ liệu từ web và lưu CSV', en: 'A script that fetches web data and saves as CSV' },
    codeSnippet: `import requests
from bs4 import BeautifulSoup
import csv

# Lấy trang / Fetch page
url = "https://books.toscrape.com"
response = requests.get(url)
soup = BeautifulSoup(response.text, 'html.parser')

# Lấy tên sách / Get book titles
books = soup.find_all('h3')
for book in books[:5]:
    print(book.find('a')['title'])`,
    codeLanguage: 'python',
    status: 'free',
  },

  // ─── Product Developer (18–20) ─── Lessons 19–24
  {
    id: 'l19',
    slug: 'rest-api-voi-nodejs',
    number: 19,
    trackId: 'product-developer',
    title: { vi: 'REST API với Node.js', en: 'REST API with Node.js' },
    description: {
      vi: 'Xây dựng REST API đơn giản với Node.js và Express: GET, POST, PUT, DELETE endpoints. Hiểu HTTP methods và status codes.',
      en: 'Build a simple REST API with Node.js and Express: GET, POST, PUT, DELETE endpoints. Understand HTTP methods and status codes.',
    },
    duration: 40,
    level: 'intermediate',
    tags: ['nodejs', 'express', 'rest-api', 'http'],
    objectives: [
      { vi: 'Khởi tạo Express app', en: 'Initialize an Express app' },
      { vi: 'Tạo CRUD endpoints', en: 'Create CRUD endpoints' },
      { vi: 'Dùng Postman test API', en: 'Use Postman to test API' },
    ],
    buildOutput: { vi: 'API quản lý danh sách task', en: 'A task list management API' },
    codeSnippet: `const express = require('express');
const app = express();
app.use(express.json());

let tasks = [];

// GET tất cả / GET all
app.get('/tasks', (req, res) => {
  res.json({ success: true, data: tasks });
});

// POST tạo mới / POST create
app.post('/tasks', (req, res) => {
  const task = { id: Date.now(), ...req.body };
  tasks.push(task);
  res.status(201).json({ success: true, data: task });
});

app.listen(3000, () => console.log('API running on port 3000'));`,
    codeLanguage: 'javascript',
    status: 'free',
  },
  {
    id: 'l20',
    slug: 'database-sql-co-ban',
    number: 20,
    trackId: 'product-developer',
    title: { vi: 'Database: SQL cơ bản', en: 'Database: Basic SQL' },
    description: {
      vi: 'Học SQL với SQLite: tạo bảng, INSERT, SELECT, WHERE, JOIN và aggregation functions. Tích hợp database vào Node.js.',
      en: 'Learn SQL with SQLite: create tables, INSERT, SELECT, WHERE, JOIN, and aggregation functions. Integrate database into Node.js.',
    },
    duration: 40,
    level: 'intermediate',
    tags: ['sql', 'sqlite', 'database', 'query'],
    objectives: [
      { vi: 'Tạo bảng với CREATE TABLE', en: 'Create tables with CREATE TABLE' },
      { vi: 'Thực hiện CRUD với SQL', en: 'Perform CRUD with SQL' },
      { vi: 'Dùng JOIN nối bảng', en: 'Use JOIN to link tables' },
    ],
    buildOutput: { vi: 'Database sinh viên với query thống kê', en: 'A student database with statistical queries' },
    codeSnippet: `-- Tạo bảng / Create table
CREATE TABLE students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER,
  score REAL
);

-- Thêm dữ liệu / Insert data
INSERT INTO students (name, age, score)
VALUES ('Hà Mi', 18, 9.5);

-- Truy vấn / Query
SELECT name, score
FROM students
WHERE score >= 8.0
ORDER BY score DESC;`,
    codeLanguage: 'sql',
    status: 'free',
  },
  {
    id: 'l21',
    slug: 'fullstack-todo-app',
    number: 21,
    trackId: 'product-developer',
    title: { vi: 'Full-stack: Ứng dụng Todo', en: 'Full-stack: Todo application' },
    description: {
      vi: 'Kết hợp frontend (HTML/CSS/JS), backend (Node.js/Express) và database (SQLite) để xây ứng dụng Todo hoàn chỉnh.',
      en: 'Combine frontend (HTML/CSS/JS), backend (Node.js/Express), and database (SQLite) to build a complete Todo application.',
    },
    duration: 50,
    level: 'intermediate',
    tags: ['fullstack', 'nodejs', 'sqlite', 'crud', 'spa'],
    objectives: [
      { vi: 'Kết nối frontend với backend API', en: 'Connect frontend to backend API' },
      { vi: 'Lưu dữ liệu vào SQLite', en: 'Save data to SQLite' },
      { vi: 'Xây UI update không reload trang', en: 'Build UI that updates without reload' },
    ],
    buildOutput: { vi: 'Ứng dụng Todo full-stack có database', en: 'A full-stack Todo app with database' },
    status: 'free',
  },
  {
    id: 'l22',
    slug: 'ai-agent-tich-hop-openai',
    number: 22,
    trackId: 'product-developer',
    title: { vi: 'AI Agent: Tích hợp OpenAI API', en: 'AI Agent: Integrate OpenAI API' },
    description: {
      vi: 'Học cách gọi OpenAI API từ Node.js để tạo chatbot đơn giản. Hiểu prompt engineering, token limit và error handling.',
      en: 'Learn to call OpenAI API from Node.js to create a simple chatbot. Understand prompt engineering, token limits, and error handling.',
    },
    duration: 40,
    level: 'intermediate',
    tags: ['ai', 'openai', 'api', 'chatbot', 'nodejs'],
    objectives: [
      { vi: 'Gọi OpenAI Chat Completions API', en: 'Call OpenAI Chat Completions API' },
      { vi: 'Viết system prompt hiệu quả', en: 'Write effective system prompts' },
      { vi: 'Xử lý lỗi và rate limit', en: 'Handle errors and rate limits' },
    ],
    buildOutput: { vi: 'Chatbot song ngữ Việt–Anh đơn giản', en: 'A simple bilingual Viet–English chatbot' },
    codeSnippet: `import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function chat(userMessage) {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'Bạn là trợ lý giáo dục song ngữ Việt–Anh. / You are a bilingual Viet–English education assistant.'
      },
      { role: 'user', content: userMessage }
    ],
    max_tokens: 500,
  });
  return response.choices[0].message.content;
}`,
    codeLanguage: 'javascript',
    status: 'free',
  },
  {
    id: 'l23',
    slug: 'deploy-cloudflare-pages',
    number: 23,
    trackId: 'product-developer',
    title: { vi: 'Deploy lên Cloudflare Pages', en: 'Deploy to Cloudflare Pages' },
    description: {
      vi: 'Học cách deploy website lên Cloudflare Pages: cấu hình wrangler.toml, build và publish. Cấu hình custom domain.',
      en: 'Learn to deploy a website to Cloudflare Pages: configure wrangler.toml, build, and publish. Configure custom domain.',
    },
    duration: 30,
    level: 'intermediate',
    tags: ['cloudflare', 'deployment', 'hosting', 'domain', 'wrangler'],
    objectives: [
      { vi: 'Cấu hình wrangler.toml', en: 'Configure wrangler.toml' },
      { vi: 'Deploy với wrangler pages deploy', en: 'Deploy with wrangler pages deploy' },
      { vi: 'Gắn custom domain', en: 'Attach custom domain' },
    ],
    buildOutput: { vi: 'Website đã live trên Cloudflare Pages', en: 'A website live on Cloudflare Pages' },
    codeSnippet: `# wrangler.toml
name = "my-project"
compatibility_date = "2026-06-23"
pages_build_output_dir = "dist"

# Build & Deploy
npm run build
npx wrangler pages deploy dist --project-name my-project`,
    codeLanguage: 'bash',
    status: 'free',
  },
  {
    id: 'l24',
    slug: 'bao-mat-ung-dung-co-ban',
    number: 24,
    trackId: 'product-developer',
    title: { vi: 'Bảo mật ứng dụng cơ bản', en: 'Basic application security' },
    description: {
      vi: 'Các lỗ hổng phổ biến: SQL injection, XSS, CSRF. Cách phòng chống và best practices bảo mật cho ứng dụng web.',
      en: 'Common vulnerabilities: SQL injection, XSS, CSRF. How to prevent them and security best practices for web apps.',
    },
    duration: 35,
    level: 'intermediate',
    tags: ['security', 'sql-injection', 'xss', 'csrf', 'best-practices'],
    objectives: [
      { vi: 'Nhận biết SQL injection và XSS', en: 'Recognize SQL injection and XSS' },
      { vi: 'Sanitize input và output', en: 'Sanitize input and output' },
      { vi: 'Dùng environment variables đúng cách', en: 'Use environment variables correctly' },
    ],
    buildOutput: { vi: 'Security checklist cho ứng dụng web', en: 'A security checklist for web apps' },
    status: 'free',
  },

  // ─── Builder & Entrepreneur (21–24) ─── Lessons 25–30
  {
    id: 'l25',
    slug: 'saas-architecture-co-ban',
    number: 25,
    trackId: 'builder-entrepreneur',
    title: { vi: 'SaaS Architecture cơ bản', en: 'Basic SaaS architecture' },
    description: {
      vi: 'Hiểu kiến trúc SaaS: multi-tenancy, subscription billing, user management, feature flags và scalability patterns.',
      en: 'Understand SaaS architecture: multi-tenancy, subscription billing, user management, feature flags, and scalability patterns.',
    },
    duration: 40,
    level: 'intermediate',
    tags: ['saas', 'architecture', 'multi-tenancy', 'subscription'],
    objectives: [
      { vi: 'Giải thích multi-tenancy', en: 'Explain multi-tenancy' },
      { vi: 'Thiết kế user/subscription schema', en: 'Design user/subscription schema' },
      { vi: 'Hiểu feature flag pattern', en: 'Understand feature flag patterns' },
    ],
    buildOutput: { vi: 'Bản thiết kế kiến trúc SaaS nhỏ', en: 'A small SaaS architecture blueprint' },
    status: 'free',
  },
  {
    id: 'l26',
    slug: 'cloudflare-workers-edge',
    number: 26,
    trackId: 'builder-entrepreneur',
    title: { vi: 'Cloudflare Workers: Edge Computing', en: 'Cloudflare Workers: Edge computing' },
    description: {
      vi: 'Xây serverless function với Cloudflare Workers: xử lý request, KV storage, D1 database và Workers AI.',
      en: 'Build serverless functions with Cloudflare Workers: handle requests, KV storage, D1 database, and Workers AI.',
    },
    duration: 45,
    level: 'intermediate',
    tags: ['cloudflare', 'workers', 'serverless', 'edge', 'kv'],
    objectives: [
      { vi: 'Tạo Worker xử lý HTTP request', en: 'Create a Worker handling HTTP requests' },
      { vi: 'Dùng KV để lưu dữ liệu', en: 'Use KV to store data' },
      { vi: 'Deploy và monitor Worker', en: 'Deploy and monitor the Worker' },
    ],
    buildOutput: { vi: 'API edge function trên Cloudflare Workers', en: 'An edge API function on Cloudflare Workers' },
    codeSnippet: `// Cloudflare Worker
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/hello') {
      return Response.json({
        message: 'Xin chào từ Edge! / Hello from Edge!',
        region: request.cf?.country ?? 'unknown',
      });
    }
    
    return new Response('Not found', { status: 404 });
  },
};`,
    codeLanguage: 'javascript',
    status: 'free',
  },
  {
    id: 'l27',
    slug: 'product-launch-checklist',
    number: 27,
    trackId: 'builder-entrepreneur',
    title: { vi: 'Product Launch: Checklist ra mắt', en: 'Product launch: Launch checklist' },
    description: {
      vi: 'Các bước cần thiết trước khi ra mắt sản phẩm: testing, security review, performance, SEO, analytics, legal và support.',
      en: 'Essential steps before launching a product: testing, security review, performance, SEO, analytics, legal, and support.',
    },
    duration: 30,
    level: 'intermediate',
    tags: ['product', 'launch', 'checklist', 'testing', 'seo'],
    objectives: [
      { vi: 'Lập checklist ra mắt sản phẩm', en: 'Create a product launch checklist' },
      { vi: 'Kiểm tra performance và SEO', en: 'Check performance and SEO' },
      { vi: 'Chuẩn bị kế hoạch support', en: 'Prepare a support plan' },
    ],
    buildOutput: { vi: 'Checklist ra mắt sản phẩm số đầy đủ', en: 'A complete digital product launch checklist' },
    status: 'free',
  },
  {
    id: 'l28',
    slug: 'ai-workflow-n8n',
    number: 28,
    trackId: 'builder-entrepreneur',
    title: { vi: 'AI Workflow với n8n', en: 'AI workflow with n8n' },
    description: {
      vi: 'Xây dựng workflow tự động hóa với n8n: kết nối webhook, AI model, database và email notification thành pipeline.',
      en: 'Build automation workflows with n8n: connect webhooks, AI models, databases, and email notifications into a pipeline.',
    },
    duration: 45,
    level: 'intermediate',
    tags: ['workflow', 'automation', 'n8n', 'webhook', 'ai'],
    objectives: [
      { vi: 'Tạo workflow cơ bản với n8n', en: 'Create basic workflows with n8n' },
      { vi: 'Kết nối AI model vào workflow', en: 'Connect AI model to workflow' },
      { vi: 'Xây pipeline xử lý data tự động', en: 'Build automated data processing pipeline' },
    ],
    buildOutput: { vi: 'Workflow tự động phân loại email với AI', en: 'An automated email classification workflow with AI' },
    status: 'free',
  },
  {
    id: 'l29',
    slug: 'marketplace-listing-guide',
    number: 29,
    trackId: 'builder-entrepreneur',
    title: { vi: 'Marketplace: Chuẩn bị đăng sản phẩm', en: 'Marketplace: Preparing your listing' },
    description: {
      vi: 'Hướng dẫn chuẩn bị sản phẩm số để đăng marketplace: tài liệu, license, demo, pricing, marketing copy và support policy.',
      en: 'Guide to preparing a digital product for marketplace listing: documentation, licensing, demo, pricing, marketing copy, and support policy.',
    },
    duration: 30,
    level: 'intermediate',
    tags: ['marketplace', 'product', 'license', 'pricing', 'documentation'],
    objectives: [
      { vi: 'Viết tài liệu sản phẩm đầy đủ', en: 'Write complete product documentation' },
      { vi: 'Chọn license phù hợp', en: 'Choose appropriate licensing' },
      { vi: 'Xác định giá và chính sách hoàn tiền', en: 'Set pricing and refund policy' },
    ],
    buildOutput: { vi: 'Hồ sơ sản phẩm hoàn chỉnh để đăng marketplace', en: 'A complete product profile for marketplace listing' },
    status: 'free',
  },
  {
    id: 'l30',
    slug: 'startup-mvp-va-go-to-market',
    number: 30,
    trackId: 'builder-entrepreneur',
    title: { vi: 'Startup: MVP và Go-to-Market', en: 'Startup: MVP and go-to-market' },
    description: {
      vi: 'Từ ý tưởng đến MVP: cách xác định core value, xây bản MVP tối giản, tìm early adopters và lập kế hoạch go-to-market.',
      en: 'From idea to MVP: how to identify core value, build a minimal MVP, find early adopters, and create a go-to-market plan.',
    },
    duration: 40,
    level: 'intermediate',
    tags: ['startup', 'mvp', 'go-to-market', 'product', 'growth'],
    objectives: [
      { vi: 'Xác định core value proposition', en: 'Define core value proposition' },
      { vi: 'Lập kế hoạch MVP tối giản', en: 'Plan a minimal MVP' },
      { vi: 'Xây go-to-market strategy cơ bản', en: 'Build a basic go-to-market strategy' },
    ],
    buildOutput: { vi: 'Bản kế hoạch MVP và go-to-market 1 trang', en: 'A one-page MVP and go-to-market plan' },
    status: 'free',
  },
];
