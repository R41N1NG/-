const https = require('https');

function searchFreesound(query) {
  return new Promise((resolve, reject) => {
    const url = 'https://freesound.org/search/?q=' + encodeURIComponent(query) + '&f=license:%22Creative+Commons+0%22';
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        // 提取搜索结果条目
        const matches = [];
        const regex = /<a class="bw-link--black" href="(\/people\/[^\/]+\/sounds\/(\d+)\/)">([^<]+)<\/a>/g;
        let m;
        while ((m = regex.exec(d)) !== null) {
          matches.push({ href: m[1], id: m[2], title: m[3].trim() });
          if (matches.length >= 4) break;
        }
        resolve(matches);
      });
    }).on('error', reject);
  });
}

(async () => {
  for (const q of ['barefoot footsteps', 'sandals footsteps', 'cicada', 'platform shoes footsteps', 'thick sole footsteps']) {
    console.log('=== Query:', q, '===');
    const res = await searchFreesound(q);
    res.forEach(r => console.log(`  [ID: ${r.id}] "${r.title}" -> https://freesound.org${r.href}`));
    await new Promise(r => setTimeout(r, 1200));
  }
})();
