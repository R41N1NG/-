const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const SOUND_TARGETS = [
  { key: 'slippers', id: 369887, name: '拖鞋 (Slippers)' },
  { key: 'sandals', id: 525381, name: '凉鞋 (Sandals)' },
  { key: 'boots', id: 275685, name: '靴子 (Boots)' },
  { key: 'leather_shoes', id: 272304, name: '小皮鞋 (Leather Shoes)' },
  { key: 'flats', id: 244310, name: '平底鞋 (Flats)' },
  { key: 'barefoot', id: 424911, name: '赤脚 (Barefoot)' }
];

function fetchWithRedirect(targetUrl, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    client.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let nextUrl = res.headers.location;
        if (nextUrl.startsWith('/')) {
          nextUrl = `${parsed.protocol}//${parsed.host}${nextUrl}`;
        }
        return fetchWithRedirect(nextUrl, maxRedirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP status: ${res.statusCode} for ${targetUrl}`));
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

function extractMp3Url(html) {
  const m = html.match(/content="(https:\/\/cdn\.freesound\.org\/previews\/[^"]+?)"/);
  if (m) return m[1];
  const m2 = html.match(/"(https:\/\/cdn\.freesound\.org\/previews\/[^"]+?\.mp3)"/);
  if (m2) return m2[1];
  return null;
}

function downloadWithRedirect(targetUrl, dest, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    client.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let nextUrl = res.headers.location;
        if (nextUrl.startsWith('/')) {
          nextUrl = `${parsed.protocol}//${parsed.host}${nextUrl}`;
        }
        return downloadWithRedirect(nextUrl, dest, maxRedirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP status: ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function main() {
  const outDir = path.join(__dirname, 'audio_assets');
  fs.mkdirSync(outDir, { recursive: true });

  for (const item of SOUND_TARGETS) {
    try {
      console.log(`[正在检索] ${item.name} (Freesound ID: ${item.id})...`);
      const pageUrl = `https://freesound.org/s/${item.id}/`;
      const html = await fetchWithRedirect(pageUrl);
      let mp3Url = extractMp3Url(html);
      if (!mp3Url) {
        console.error(`未在页面解析到 MP3 地址: ${item.id}`);
        continue;
      }
      const hqUrl = mp3Url.replace(/-lq\.mp3$/, '-hq.mp3');
      const dest = path.join(outDir, `${item.key}.mp3`);
      console.log(`[正在下载] ${item.name} -> ${hqUrl}`);
      try {
        await downloadWithRedirect(hqUrl, dest);
      } catch (err) {
        console.log(`HQ 失败，回退 LQ: ${mp3Url}`);
        await downloadWithRedirect(mp3Url, dest);
      }
      const stat = fs.statSync(dest);
      console.log(`[完成] ${item.name} 已保存到 ${dest} (大小: ${(stat.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`处理 ${item.name} 失败:`, err.message);
    }
    await new Promise(r => setTimeout(r, 1500));
  }
}

main();
