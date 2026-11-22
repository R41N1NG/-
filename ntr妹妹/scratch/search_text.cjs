const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === '.git' || f === 'dist' || f === '.gemini') continue;
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      searchDir(full, pattern);
    } else if (f.endsWith('.js') || f.endsWith('.cjs') || f.endsWith('.html') || f.endsWith('.json') || f.endsWith('.md')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes(pattern)) {
        console.log(`Found in: ${full}`);
      }
    }
  }
}

searchDir('.', '心相底模');
searchDir('.', 'Gulan Ziegler');
