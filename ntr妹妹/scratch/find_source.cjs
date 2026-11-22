const fs = require('fs');
const path = require('path');

function searchFiles(dir, term) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      searchFiles(full, term);
    } else if (e.name.endsWith('.js') || e.name.endsWith('.cjs') || e.name.endsWith('.json') || e.name.endsWith('.md')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes(term)) {
        console.log(`Found [${term}] in ${full}`);
      }
    }
  }
}

searchFiles('奥森德', 'gulan');
searchFiles('src', 'gulan');
searchFiles('规范', 'gulan');
