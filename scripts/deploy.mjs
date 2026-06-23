// Direct Cloudflare Pages deployment via API
// Account: 93112cc89181e75335cbd7ef7e392ba3 (owns hamicodeviet.com zone)
import { readFileSync, readdirSync, statSync } from 'fs';
import { createHash } from 'crypto';
import { join, relative, sep } from 'path';

const ACCOUNT_ID = '93112cc89181e75335cbd7ef7e392ba3';
const PROJECT_NAME = 'hamicodeviet-com';
const BRANCH = 'main';
const DIST_DIR = join(process.cwd(), 'dist');
const TOKEN = 'cfoat_8VvMUHlEpgKBbEAOtR1ufe_M1jZksGRZuR7KChv_flo.4sR_yi-H5NVjOslE8rwY-tnVDH07tR9ztcNKRbU53Y8';
const API = 'https://api.cloudflare.com/client/v4';

function getAllFiles(dir, base = dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const rel = relative(base, fullPath).split(sep).join('/');
    if (statSync(fullPath).isDirectory()) {
      results.push(...getAllFiles(fullPath, base));
    } else {
      results.push({ path: '/' + rel, abs: fullPath });
    }
  }
  return results;
}

async function main() {
  console.log('=== HaMi Code Việt — Direct API Deploy ===');
  console.log(`Account: ${ACCOUNT_ID} | Project: ${PROJECT_NAME}`);

  // 1. Collect files + hashes
  const files = getAllFiles(DIST_DIR);
  console.log(`Found ${files.length} files`);

  const manifest = files.map(f => {
    const content = readFileSync(f.abs);
    const hash = createHash('md5').update(content).digest('hex');
    return { file: f.path, hash, size: content.length, content };
  });

  // 2. Get JWT upload token
  console.log('Getting upload token...');
  const tokenRes = await fetch(
    `${API}/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/upload-token`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  const tokenJson = await tokenRes.json();
  if (!tokenJson.success) throw new Error('upload-token failed: ' + JSON.stringify(tokenJson.errors));
  const jwt = tokenJson.result.jwt;
  console.log('Upload token acquired');

  // 3. Check missing
  console.log('Checking existing assets...');
  const checkRes = await fetch(`${API}/pages/assets/check-missing`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ hashes: manifest.map(m => m.hash) }),
  });
  const checkJson = await checkRes.json();
  if (!checkJson.success) throw new Error('check-missing failed: ' + JSON.stringify(checkJson));
  const missingHashes = new Set(checkJson.result);
  const toUpload = manifest.filter(m => missingHashes.has(m.hash));
  console.log(`${toUpload.length} files need uploading (${manifest.length - toUpload.length} cached)`);

  // 4. Upload via POST /pages/assets/upload with FormData (key=hash, value=content)
  // Upload in small batches to avoid payload limits
  const BATCH = 3;
  for (let i = 0; i < toUpload.length; i += BATCH) {
    const batch = toUpload.slice(i, i + BATCH);
    const formData = new FormData();
    for (const item of batch) {
      const blob = new Blob([item.content], { type: 'application/octet-stream' });
      formData.append(item.hash, blob, item.hash);
    }
    console.log(`  Uploading ${i + 1}-${Math.min(i + BATCH, toUpload.length)}/${toUpload.length}...`);
    const upRes = await fetch(`${API}/pages/assets/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}` },
      body: formData,
    });
    if (!upRes.ok) {
      const t = await upRes.text();
      console.error(`Upload batch failed: ${upRes.status}`, t.slice(0, 300));
      throw new Error('Upload failed');
    }
  }
  console.log(`All ${toUpload.length} files uploaded`);

  // 5. Create deployment
  console.log('Creating deployment...');
  const deployRes = await fetch(
    `${API}/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        manifest: manifest.map(m => ({ file: m.file, hash: m.hash, size: m.size })),
        branch: BRANCH,
      }),
    }
  );
  const deployJson = await deployRes.json();
  if (!deployJson.success) {
    console.error('Deploy failed:', JSON.stringify(deployJson).slice(0, 500));
    throw new Error('Deployment creation failed');
  }
  const d = deployJson.result;
  console.log('=== Deployment complete! ===');
  console.log(`URL: https://${d.url}`);
  if (d.aliases?.length) console.log(`Aliases: ${d.aliases.join(', ')}`);
}

main().catch(err => {
  console.error('Deploy failed:', err.message);
  process.exit(1);
});
