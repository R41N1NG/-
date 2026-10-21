const { URL } = require('url');
const https = require('https');
const http = require('http');
const fs = require('fs');

function fetchWithRedirect(targetUrl, maxRedirects = 5) {
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
        if (nextUrl.startsWith('/')) nextUrl = parsed.protocol + '//' + parsed.host + nextUrl;
        return fetchWithRedirect(nextUrl, maxRedirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error('Status: ' + res.statusCode));
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

function downloadWithRedirect(targetUrl, dest, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    client.get(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let nextUrl = res.headers.location;
        if (nextUrl.startsWith('/')) nextUrl = parsed.protocol + '//' + parsed.host + nextUrl;
        return downloadWithRedirect(nextUrl, dest, maxRedirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error('Status: ' + res.statusCode));
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

(async () => {
  console.log('Fetching platform shoes 541249...');
  const html = await fetchWithRedirect('https://freesound.org/s/541249/');
  const m = html.match(/content="(https:\/\/cdn\.freesound\.org\/previews\/[^"]+?)"/);
  if (!m) throw new Error('No mp3 in page');
  const hqUrl = m[1].replace(/-lq\.mp3$/, '-hq.mp3');
  console.log('Downloading platform shoes ->', hqUrl);
  await downloadWithRedirect(hqUrl, 'work/audio_assets/platform.mp3');
  console.log('platform.mp3 downloaded successfully! Size:', fs.statSync('work/audio_assets/platform.mp3').size);
})();
