/**
 * Post-build script: generate /en/ versions of all pages.
 *
 * The site uses client-side language toggle (data-vi/data-en spans).
 * CSS rule: [data-lang="en"] [data-vi] { display: none; }
 * So /en/ pages just need <html lang="en" data-lang="en"> to show English content.
 *
 * This script:
 * 1. Copies all HTML files from dist/ to dist/en/
 * 2. Replaces lang="vi" → lang="en", data-lang="vi" → data-lang="en"
 * 3. Updates canonical URLs to point to /en/ versions
 * 4. Updates og:locale to en_US
 */
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, dirname, relative, sep } from 'node:path';

const DIST = 'dist';
const EN_DIST = 'dist/en';

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(full));
    } else if (entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  const htmlFiles = await walk(DIST);
  let count = 0;

  for (const file of htmlFiles) {
    // Skip files already in /en/
    const rel = relative(DIST, file);
    if (rel.startsWith('en' + sep)) continue;

    let content = await readFile(file, 'utf-8');

    // Replace language attributes — ONLY in <html> tag, not in hreflang
    content = content.replace(/<html\s+lang="vi"/g, '<html lang="en"');
    content = content.replace(/<html\s+([^>]*)data-lang="vi"/g, '<html $1data-lang="en"');

    // Update canonical URL to /en/ version
    // e.g., canonical https://hamicodeviet.com/hoc-mien-phi/ → https://hamicodeviet.com/en/hoc-mien-phi/
    content = content.replace(
      /<link rel="canonical" href="(https:\/\/hamicodeviet\.com\/?[^"]*)"/g,
      (match, url) => {
        if (url === 'https://hamicodeviet.com/') {
          return `<link rel="canonical" href="https://hamicodeviet.com/en/"`;
        }
        return `<link rel="canonical" href="${url.replace('hamicodeviet.com/', 'hamicodeviet.com/en/')}"`;
      }
    );

    // Update og:locale
    content = content.replace(
      /<meta property="og:locale" content="vi_VN"/g,
      '<meta property="og:locale" content="en_US"'
    );

    // Update hreflang: on /en/ pages, vi and en should swap
    // vi version: hreflang vi → /path/, hreflang en → /en/path/
    // en version: hreflang vi → /path/, hreflang en → /en/path/ (same, but canonical is /en/)
    // Actually hreflang should point to the actual URLs, so no swap needed — just ensure correct.

    // Write to /en/ directory
    const enFile = join(EN_DIST, rel);
    await mkdir(dirname(enFile), { recursive: true });
    await writeFile(enFile, content, 'utf-8');
    count++;
  }

  console.log(`[en-generator] Generated ${count} English pages in ${EN_DIST}`);
}

main().catch((err) => {
  console.error('[en-generator] Failed:', err);
  process.exit(1);
});
