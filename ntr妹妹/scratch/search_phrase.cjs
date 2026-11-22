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
        if (text.includes('心相底模') || text.includes('因果心智')) {
          console.log('Found [心相底模] in:', full);
        }
        if (text.includes('户籍身世与立身之本')) {
          console.log('Found [户籍身世与立身之本] in:', full);
        }
      } catch (e) {}
    }
  }
}

searchAll('.');
