const fs = require('fs');

const cardPath = '最新角色卡/奥克赫斯.json';
const card = JSON.parse(fs.readFileSync(cardPath, 'utf8'));

function findKey(obj, path = '') {
  for (const k in obj) {
    const curPath = path ? `${path}.${k}` : k;
    const v = obj[k];
    if (typeof v === 'string') {
      if (v.includes('okh-member-card') || v.includes('Gulan Ziegler') || v.includes('心相底模')) {
        console.log(`Found target in: ${curPath}, length: ${v.length}`);
      }
    } else if (typeof v === 'object' && v !== null) {
      findKey(v, curPath);
    }
  }
}

findKey(card);
