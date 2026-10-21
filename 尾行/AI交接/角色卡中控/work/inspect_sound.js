const https = require('https');

function inspect(path) {
  return new Promise(resolve => {
    https.get('https://freesound.org' + path, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const titleMatch = d.match(/<title>([^<]+)<\/title>/);
        const descMatch = d.match(/<meta property="og:description" content="([^"]+)"/);
        const mp3Match = d.match(/content="(https:\/\/cdn\.freesound\.org\/previews\/[^"]+?)"/);
        resolve({
          path,
          title: titleMatch ? titleMatch[1].trim() : 'N/A',
          desc: descMatch ? descMatch[1].trim() : 'N/A',
          mp3: mp3Match ? mp3Match[1] : null
        });
      });
    }).on('error', err => resolve({ path, err: err.message }));
  });
}

(async () => {
  const list = [
    '/people/SpliceSound/sounds/369642/',
    '/people/SpliceSound/sounds/197404/',
    '/people/SpliceSound/sounds/338106/',
    '/people/jedg/sounds/505836/',
    '/people/sillygrizzlies/sounds/635054/'
  ];
  for (const p of list) {
    const res = await inspect(p);
    console.log(res);
  }
})();
