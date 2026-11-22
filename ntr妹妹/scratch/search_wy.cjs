const fs = require('fs');
const path = require('path');

function searchAll(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.gemini') continue;
      searchAll(full);
    } else {
      try {
        const text = fs.readFileSync(full, 'utf8');
        if (text.includes('威严端庄')) {
          console.log('Found [威严端庄] in:', full);
        }
      } catch (e) {}
    }
  }
}

searchAll('.');
