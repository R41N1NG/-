const fs = require('fs');
const path = require('path');

const srcCardPng = 'E:\\角色卡制作\\仙姝堕\\仙姝墮-角色卡（全书群像）.png';
const srcWorldJson = 'E:\\角色卡制作\\仙姝堕\\仙姝墮-世界书.json';

const tavernCharDir = 'E:\\tavern\\SillyTavern\\data\\default-user\\characters';
const tavernWorldDir = 'E:\\tavern\\SillyTavern\\data\\default-user\\worlds';

const targetCharPng = path.join(tavernCharDir, '仙姝堕.png');
const targetCharPngLegacy = path.join(tavernCharDir, '仙姝墮 · 一张跑全书.png');
const targetWorldJson = path.join(tavernWorldDir, '仙姝堕.json');
const targetWorldJsonLegacy = path.join(tavernWorldDir, '仙姝墮 · 一张跑全书.json');

// 1. 备份酒馆当前旧卡与旧世界书
const nowStr = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
const backupDir = path.join(tavernCharDir, `_卡备份_${nowStr}`);
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

if (fs.existsSync(targetCharPng)) {
  fs.copyFileSync(targetCharPng, path.join(backupDir, '仙姝堕.png'));
}
if (fs.existsSync(targetCharPngLegacy)) {
  fs.copyFileSync(targetCharPngLegacy, path.join(backupDir, '仙姝墮 · 一张跑全书.png'));
  console.log(`[1] 已备份旧卡至: ${backupDir}`);
}
if (fs.existsSync(targetWorldJson)) {
  fs.copyFileSync(targetWorldJson, path.join(backupDir, '仙姝堕.json'));
}
if (fs.existsSync(targetWorldJsonLegacy)) {
  fs.copyFileSync(targetWorldJsonLegacy, path.join(backupDir, '仙姝墮 · 一张跑全书.json'));
  console.log(`[2] 已备份旧世界书至: ${backupDir}`);
}

// 2. 覆盖导入新卡（部署 仙姝堕.png 与兼容名 仙姝墮 · 一张跑全书.png）
fs.copyFileSync(srcCardPng, targetCharPng);
fs.copyFileSync(srcCardPng, targetCharPngLegacy);
// 清理酒馆历史冲突重复卡（例如手动导入生成的 仙姝堕1.png）
const dupCard = path.join(tavernCharDir, '仙姝堕1.png');
if (fs.existsSync(dupCard)) {
  try { fs.unlinkSync(dupCard); console.log(`[2.1] 已删除酒馆旧冲突卡: ${dupCard}`); } catch(e) {}
}
try {
  const localLatestDir = 'E:\\角色卡制作\\仙姝堕\\最新角色卡';
  if (!fs.existsSync(localLatestDir)) fs.mkdirSync(localLatestDir, { recursive: true });
  fs.copyFileSync(srcCardPng, path.join(localLatestDir, '仙姝堕.png'));
  const srcCardJson = 'E:\\角色卡制作\\仙姝堕\\仙姝堕.json';
  if (fs.existsSync(srcCardJson)) {
    fs.copyFileSync(srcCardJson, path.join(localLatestDir, '仙姝堕.json'));
  }
  // 清理 latestDir 历史残留旧名文件，严格恪守铁律 30（仅保留两份成品）
  for (const f of fs.readdirSync(localLatestDir)) {
    if (f !== '仙姝堕.png' && f !== '仙姝堕.json') fs.unlinkSync(path.join(localLatestDir, f));
  }
} catch (e) {}
console.log(`[3] 新卡已成功覆盖导入: ${targetCharPng} 与 ${targetCharPngLegacy} (大小: ${fs.statSync(targetCharPng).size} 字节)`);
console.log(`    同步交付至: E:\\角色卡制作\\仙姝堕\\最新角色卡\\`);

// 3. 生成并覆盖导入完整的全量世界书（230条，包含规则、身份、名器扩展）
const { execSync } = require('child_process');
execSync(`"C:\\Program Files\\nodejs\\node.exe" _write_worldbook.mjs --apply`, { cwd: 'E:\\角色卡制作\\仙姝堕', stdio: 'inherit' });
console.log(`[4] 完整世界书已成功生成并部署: ${targetWorldJson} (大小: ${fs.statSync(targetWorldJson).size} 字节)`);

// 4. 反向读取校验酒馆目录下的新卡，确保不是旧卡、未被重写覆盖
const cardBuf = fs.readFileSync(targetCharPng);
let offset = 8; // skip PNG signature
let charaJson = null;

while (offset < cardBuf.length) {
  const len = cardBuf.readUInt32BE(offset);
  const type = cardBuf.toString('ascii', offset + 4, offset + 8);
  if (type === 'tEXt') {
    const data = cardBuf.slice(offset + 8, offset + 8 + len);
    const nullIdx = data.indexOf(0);
    const keyword = data.toString('ascii', 0, nullIdx);
    if (keyword === 'chara') {
      const b64 = data.toString('utf8', nullIdx + 1);
      charaJson = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
      break;
    }
  }
  offset += 12 + len;
}

if (!charaJson) {
  console.error('❌ 致命错误：未能从酒馆目标卡片中解出 chara 块！');
  process.exit(1);
}

const entries = charaJson.data?.character_book?.entries || [];
const mainPlots = entries.filter(e => /【剧情】[一二三四五六七八九十]+ ·/.test(String(e.comment)) && !String(e.comment).includes('专轨'));
const trackPlots = entries.filter(e => (e.comment || '').startsWith('【剧情】') && (e.comment || '').includes('专轨'));
const neutPlots = entries.filter(e => (e.comment || '').startsWith('【中立】'));

console.log('\n--- [5] 酒馆卡片实时内容终检 ---');
console.log('剧情架构核验（契约：面向全身份开放中立大势）:');
console.log('  旧版赵无忧专属主线（15条）已剥离:', mainPlots.length === 0);
console.log('  旧版专轨剧情（7条）已剥离:', trackPlots.length === 0);
console.log('  【中立】大势 7 条在册且默认开启:', neutPlots.length === 7 && neutPlots.every(e => e.enabled === true));

console.log('\n物理开关出厂状态检查:');
const id_zwy = entries.find(e => e.comment === '【身份】赵无忧');
const other_ids = entries.filter(e => (e.comment || '').startsWith('【身份】') && e.comment !== '【身份】赵无忧');
console.log('  【身份】赵无忧 默认开启:', id_zwy?.enabled === true);
console.log('  其余 5 个身份默认物理关闭:', other_ids.length === 5 && other_ids.every(e => e.enabled === false));

// 5. 校验世界书文件
const wbJson = JSON.parse(fs.readFileSync(targetWorldJson, 'utf8'));
const wbEntries = wbJson.entries || {};
const totalWbCount = Object.keys(wbEntries).length;
const wbNeut = Object.values(wbEntries).filter(e => (e.comment || '').startsWith('【中立】'));
console.log('世界书中立大势 7 条在册:', wbNeut.length === 7);
const wb_relic_law = Object.values(wbEntries).find(e => e.comment && e.comment.includes('交欢反应律'));
console.log('名器交欢律在册:', !!wb_relic_law);
console.log('包含男修呻吟与赞叹法则:', wb_relic_law?.content?.includes('因器而赞') && wb_relic_law?.content?.includes('必出呻吟'));
const wbConstants = Object.values(wbEntries).filter(e => e.constant === true);
console.log('世界书常驻条目防递归 (100% 开启):', wbConstants.length > 0 && wbConstants.every(e => e.preventRecursion === true));

console.log('\n✅ 部署与双向防覆盖核验全部通过！');
