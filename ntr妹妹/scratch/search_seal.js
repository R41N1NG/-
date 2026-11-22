import https from 'https';

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

getJson('https://api.github.com/search/code?q=filename:wax-seal+extension:png').then(r => console.log(JSON.stringify(r).slice(0, 300)));
