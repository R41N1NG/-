const fs = require('fs');

const dbPath = 'E:/火狐下载/酒馆插件-名器阶段注入/mingqi-db.js';
const raw = fs.readFileSync(dbPath, 'utf8');
const i = raw.indexOf('export const MINGQI_DB = ');
const j = raw.indexOf('\n};', i);
const db = eval('(' + raw.slice(i + 'export const MINGQI_DB = '.length, j + 2) + ')');

const chart = JSON.parse(fs.readFileSync('卡片脚本/_src/名器图鉴数据.json', 'utf8'));

console.log('Comparing stages between mingqi-db and 名器图鉴数据:');
for (const [k, v] of Object.entries(db)) {
  const match = Object.values(chart).find(c => c.name === v.name);
  if (!match) {
    console.log(`[!] Not found in chart: ${v.name}`);
    continue;
  }
  const dbS = Object.keys(v.stages || {}).length;
  const chS = Object.keys(match.stages || {}).length;
  console.log(`- ${v.name} (宿主: ${match.carrier}): db has ${dbS} stages, chart has ${chS} stages`);
  // sample first stage
  const dbFirstKey = Object.keys(v.stages)[0];
  const chFirstKey = Object.keys(match.stages)[0];
  console.log(`   db[${dbFirstKey}] len=${v.stages[dbFirstKey].length}`);
  console.log(`   chart[${chFirstKey}] len=${match.stages[chFirstKey].desc.length}`);
}
