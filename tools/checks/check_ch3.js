const fs = require('fs');
const path = require('path');

const wbPath = path.resolve(__dirname, '../../references/仙姝墮-世界书.json');
console.log('Trying path:', wbPath, 'exists:', fs.existsSync(wbPath));
const actualPath = path.resolve('E:/角色卡制作/仙姝堕/references/仙姝墮-世界书.json');
console.log('Actual path:', actualPath, 'exists:', fs.existsSync(actualPath));

const wb = JSON.parse(fs.readFileSync(actualPath, 'utf8'));

for (const [k, v] of Object.entries(wb.entries)) {
  if (v.comment && (v.comment.includes('三') || v.comment.includes('幽寂谷'))) {
    console.log(`=== Entry ${k}: ${v.comment} ===`);
    console.log(v.content);
    console.log('--------------------------------------------------');
  }
}
