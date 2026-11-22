import https from 'https';
import fs from 'fs';

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed with status ${res.statusCode}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function run() {
  const url = 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Waxseal.png';
  const dest = 'E:/角色卡制作/ntr妹妹/assets/ui/wax_seal_real.png';
  try {
    console.log('Downloading wax seal from wikimedia...');
    await download(url, dest);
    console.log('Success! File size:', fs.statSync(dest).size);
  } catch (err) {
    console.error('Download error:', err.message);
  }
}

run();
