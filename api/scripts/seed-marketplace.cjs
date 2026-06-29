const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });

(async () => {
  await client.connect();

  // Get a user to be the seller (first user)
  const { rows: users } = await client.query("SELECT id FROM users LIMIT 1");
  if (users.length === 0) {
    console.error('No users found. Create a user first.');
    process.exit(1);
  }
  const sellerId = users[0].id;

  const listings = [
    {
      title: 'Python Web Scraper Template',
      title_vi: 'Mẫu Web Scraper Python',
      description: 'A beginner-friendly Python web scraper template using requests and BeautifulSoup.',
      description_vi: 'Mẫu web scraper Python thân thiện với người mới bắt đầu, sử dụng requests và BeautifulSoup.',
      category: 'programming',
      type: 'template',
      tags: ['python', 'web-scraping', 'beautifulsoup'],
      language: 'vi',
      price_cents: 0,
    },
    {
      title: 'HTML/CSS Landing Page Kit',
      title_vi: 'Bộ Landing Page HTML/CSS',
      description: 'Responsive landing page templates for tech education sites.',
      description_vi: 'Mẫu landing page responsive cho trang giáo dục công nghệ.',
      category: 'template',
      type: 'template',
      tags: ['html', 'css', 'responsive'],
      language: 'vi',
      price_cents: 0,
    },
    {
      title: 'JavaScript Game: Snake',
      title_vi: 'Game JavaScript: Rắn săn mồi',
      description: 'Complete Snake game in vanilla JavaScript with source code.',
      description_vi: 'Game Rắn săn mồi hoàn chỉnh bằng JavaScript thuần kèm source code.',
      category: 'game',
      type: 'source_code',
      tags: ['javascript', 'game', 'canvas'],
      language: 'vi',
      price_cents: 0,
    },
    {
      title: 'Python Lesson Pack: Loops & Functions',
      title_vi: 'Gói bài học Python: Vòng lặp & Hàm',
      description: '10 lesson plans covering Python loops and functions with exercises.',
      description_vi: '10 giáo án về vòng lặp và hàm Python kèm bài tập.',
      category: 'lesson_pack',
      type: 'lesson_pack',
      tags: ['python', 'loops', 'functions', 'education'],
      language: 'vi',
      price_cents: 0,
    },
    {
      title: 'React Todo App Starter',
      title_vi: 'Khởi đầu App Todo React',
      description: 'A clean React todo app starter with hooks and localStorage.',
      description_vi: 'Mẫu khởi đầu app todo React với hooks và localStorage.',
      category: 'programming',
      type: 'template',
      tags: ['react', 'todo', 'hooks'],
      language: 'vi',
      price_cents: 0,
    },
    {
      title: 'Algorithm Cheat Sheet (Python)',
      title_vi: 'Tóm tắt Thuật toán (Python)',
      description: 'Quick reference for common algorithms: sorting, searching, graph traversal.',
      description_vi: 'Tài liệu tham khảo nhanh các thuật toán phổ biến: sắp xếp, tìm kiếm, duyệt đồ thị.',
      category: 'resource',
      type: 'resource',
      tags: ['python', 'algorithms', 'reference'],
      language: 'vi',
      price_cents: 0,
    },
    {
      title: 'CSS Animation Collection',
      title_vi: 'Bộ sưu tập CSS Animation',
      description: '20 ready-to-use CSS animations for web projects.',
      description_vi: '20 animation CSS sẵn sàng sử dụng cho dự án web.',
      category: 'asset',
      type: 'asset',
      tags: ['css', 'animation', 'ui'],
      language: 'vi',
      price_cents: 0,
    },
  ];

  for (const l of listings) {
    await client.query(
      `INSERT INTO marketplace_listings (seller_id, type, title, title_vi, description, description_vi, price_cents, currency, category, tags, status, review_status, language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'USD', $8, $9, 'published', 'approved', $10)
       ON CONFLICT DO NOTHING`,
      [sellerId, l.type, l.title, l.title_vi, l.description, l.description_vi, l.price_cents, l.category, JSON.stringify(l.tags), l.language]
    );
  }

  const { rows } = await client.query("SELECT count(*) as cnt FROM marketplace_listings WHERE status='published' AND review_status='approved'");
  console.log('Marketplace listings seeded. Total approved:', rows[0].cnt);
  await client.end();
})();
