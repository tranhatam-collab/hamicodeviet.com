import type { APIRoute } from 'astro';

const staticRoutes = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/hoc-mien-phi', priority: 0.9, changefreq: 'monthly' },
  { path: '/lo-trinh', priority: 0.9, changefreq: 'monthly' },
  { path: '/khoa-hoc', priority: 0.9, changefreq: 'weekly' },
  { path: '/codelab', priority: 0.8, changefreq: 'weekly' },
  { path: '/marketplace', priority: 0.8, changefreq: 'daily' },
  { path: '/portfolio', priority: 0.7, changefreq: 'weekly' },
  { path: '/du-an', priority: 0.7, changefreq: 'monthly' },
  { path: '/san-pham', priority: 0.8, changefreq: 'weekly' },
  { path: '/chuoi-san-pham', priority: 0.8, changefreq: 'monthly' },
  { path: '/bat-dau', priority: 0.9, changefreq: 'monthly' },
  { path: '/xuong-du-an', priority: 0.7, changefreq: 'monthly' },
  { path: '/phu-huynh', priority: 0.8, changefreq: 'monthly' },
  { path: '/giao-vien', priority: 0.7, changefreq: 'monthly' },
  { path: '/truong-hoc', priority: 0.7, changefreq: 'monthly' },
  { path: '/hoc-bong', priority: 0.6, changefreq: 'monthly' },
  { path: '/ve-chung-toi', priority: 0.5, changefreq: 'monthly' },
  { path: '/an-toan', priority: 0.8, changefreq: 'monthly' },
  { path: '/lien-he', priority: 0.6, changefreq: 'monthly' },
  { path: '/phap-ly', priority: 0.3, changefreq: 'yearly' },
  { path: '/danh-gia-dau-vao', priority: 0.7, changefreq: 'monthly' },
  { path: '/tai-lieu', priority: 0.5, changefreq: 'monthly' },
  { path: '/chinh-sach-bao-mat', priority: 0.3, changefreq: 'yearly' },
  { path: '/dieu-khoan-su-dung', priority: 0.3, changefreq: 'yearly' },
  { path: '/phap-ly/cookie', priority: 0.3, changefreq: 'yearly' },
  { path: '/status', priority: 0.4, changefreq: 'daily' },
  { path: '/verify', priority: 0.5, changefreq: 'monthly' },
];

const trackSlugs = ['web-tu-tinh-den-ung-dung', 'python-cho-nguoi-moi', 'ai-va-machine-learning', 'lap-trinh-game-2d', 'thiet-ke-web-toan-dien'];
const lessonSlugs = Array.from({ length: 30 }, (_, i) => `bai-${i + 1}`);

export const GET: APIRoute = ({ site }) => {
  const baseUrl = site?.toString().replace(/\/$/, '') || 'https://hamicodeviet.com';

  const urls: string[] = [];

  for (const r of staticRoutes) {
    urls.push(`  <url>
    <loc>${baseUrl}${r.path}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority.toFixed(1)}</priority>
  </url>`);
  }

  for (const slug of trackSlugs) {
    urls.push(`  <url>
    <loc>${baseUrl}/lo-trinh/${slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  for (const slug of lessonSlugs) {
    urls.push(`  <url>
    <loc>${baseUrl}/bai-hoc/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
