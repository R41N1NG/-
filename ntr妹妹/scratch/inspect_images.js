import fs from 'fs';
import path from 'path';

const dir = 'E:/角色卡制作/ntr妹妹/assets/ui';
const files = fs.readdirSync(dir);
console.log('Assets in', dir);
for (const f of files) {
  const stat = fs.statSync(path.join(dir, f));
  console.log(`- ${f}: ${(stat.size / 1024).toFixed(1)} KB`);
}
