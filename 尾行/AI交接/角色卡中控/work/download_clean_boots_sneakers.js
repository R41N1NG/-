const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const DOWNLOADS = [
  {
    key: 'boots.mp3',
    url: 'https://cdn.freesound.org/previews/213/213602_3883757-hq.mp3',
    name: '靴子 (boots on floor.mp3 by mtws)'
  },
  {
    key: 'leather_shoes.mp3',
    url: 'https://cdn.freesound.org/previews/742/742971_10996917-hq.mp3',
    name: '小皮鞋 (Male_Leather_sole_shoes_walking by Artninja)'
  },
  {
    key: 'sneakers.mp3',
    url: 'https://cdn.freesound.org/previews/170/170506_1480854-hq.mp3',
    name: '运动鞋 (Footsteps Tile Sneakers Slow Pace by SpliceSound)'
  }
];

function downloadFile(targetUrl, dest) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    client.get(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let nextUrl = res.headers.location;
        if (nextUrl.startsWith('/')) nextUrl = parsed.protocol + '//' + parsed.host + nextUrl;
        return downloadFile(nextUrl, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error('Status: ' + res.statusCode));
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function main() {
  const dir = path.join(__dirname, 'audio_assets');
  for (const item of DOWNLOADS) {
    const dest = path.join(dir, item.key);
    console.log(`[下载纯净音效] ${item.name} -> ${item.key}`);
    try {
      await downloadFile(item.url, dest);
      const stat = fs.statSync(dest);
      console.log(`  ✓ 完成: ${item.key} (${(stat.size / 1024).toFixed(1)} KB)`);
    } catch (e) {
      console.error(`  ✗ 失败: ${item.key}`, e.message);
    }
  }
}

main();
