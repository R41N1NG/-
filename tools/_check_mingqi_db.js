const fs = require('fs');
const path = require('path');

const dbPath = 'E:/火狐下载/_酒馆备份_20260922/备份_最新/名器词库_mingqi-db.js';
const raw = fs.readFileSync(dbPath, 'utf8');
const i = raw.indexOf('export const MINGQI_DB = ');
const j = raw.indexOf('\n};', i);
const db = eval('(' + raw.slice(i + 'export const MINGQI_DB = '.length, j + 2) + ')');

console.log('Total entries in mingqi-db:', Object.keys(db).length);
for (const [k, v] of Object.entries(db)) {
  console.log(`- ${k}: name="${v.name}", carrier="${v.carrier || ''}", stages=${Object.keys(v.stages || {}).join(', ')}`);
}
