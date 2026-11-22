const fs = require('fs');
const path = require('path');

function findHtml(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      if (f.name === 'node_modules' || f.name === '.git') continue;
      findHtml(full);
    } else if (f.name.endsWith('.html')) {
      console.log('HTML file:', full);
    }
  }
}

findHtml('.');
