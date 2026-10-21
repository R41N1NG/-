const https = require('https');

async function searchAndInspect(query) {
  const url = 'https://freesound.org/search/?q=' + encodeURIComponent(query);
  const html = await new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d));
    });
  });
  const links = [...new Set(html.match(/\/people\/[a-zA-Z0-9_\-]+\/sounds\/\d+\//g) || [])].slice(0, 5);
  console.log(`\n=== Query: "${query}" ===`);
  for (const p of links) {
    const detail = await new Promise(resolve => {
      https.get('https://freesound.org' + p, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
        let d = ''; res.on('data', c => d += c);
        res.on('end', () => {
          const title = (d.match(/<title>([^<]+)<\/title>/) || [])[1] || 'N/A';
          const mp3 = (d.match(/content="(https:\/\/cdn\.freesound\.org\/previews\/[^"]+?)"/) || [])[1] || null;
          resolve({ p, title: title.replace('Freesound - ', '').trim(), mp3 });
        });
      });
    });
    console.log(`  ${detail.title} -> ${detail.mp3}`);
    await new Promise(r => setTimeout(r, 600));
  }
}

(async () => {
  await searchAndInspect('sandals footsteps');
  await searchAndInspect('platform shoes footsteps');
  await searchAndInspect('cicada');
})();
