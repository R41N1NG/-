const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const DOWNLOADS = [
  {
    key: 'platform.mp3',
    url: 'https://cdn.freesound.org/previews/85/85110_1059930-hq.mp3',
    name: '松糕鞋 (JK Clogs on Concrete by cmusounddesign)'
  },
  {
    key: 'sandals.mp3',
    url: 'https://cdn.freesound.org/previews/119/119912_1990698-hq.mp3',
    name: '凉鞋 (Footsteps Sandals on Concrete by ftpalad)'
  },
  {
    key: 'barefoot.mp3',
    url: 'https://cdn.freesound.org/previews/338/338106_1480854-hq.mp3',
    name: '赤脚 (Footsteps barefoot on wet tile by SpliceSound)'
  },
  {
    key: 'cicada.mp3',
    url: 'https://cdn.freesound.org/previews/272/272169_3186672-hq.mp3',
    name: '蝉鸣 (Cicadas natural ambience by dethrok)'
  }
];

function downloadFile(targetUrl, dest) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    client.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let nextUrl = res.headers.location;
        if (nextUrl.startsWith('/')) nextUrl = parsed.protocol + '//' + parsed.host + nextUrl;
        return downloadFile(nextUrl, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error('Status: ' + res.statusCode));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function main() {
  const dir = path.join(__dirname, 'audio_assets');
  fs.mkdirSync(dir, { recursive: true });

  for (const item of DOWNLOADS) {
    const dest = path.join(dir, item.key);
    console.log(`[开始重下纯净素材] ${item.name} -> ${item.key}`);
    try {
      await downloadFile(item.url, dest);
      const stat = fs.statSync(dest);
      console.log(`  ✓ 成功下载: ${item.key} (${(stat.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ✗ 下载失败 ${item.key}:`, err.message);
    }
  }
}

main();
