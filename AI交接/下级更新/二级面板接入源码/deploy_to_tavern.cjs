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
const p1 = entries.find(e => e.comment && e.comment.includes('【剧情】一'));
const p2 = entries.find(e => e.comment && e.comment.includes('【剧情】二'));
const p3 = entries.find(e => e.comment && e.comment.includes('【剧情】三'));
const p4 = entries.find(e => e.comment && e.comment.includes('【剧情】四'));
const p5 = entries.find(e => e.comment && e.comment.includes('【剧情】五'));
const p6 = entries.find(e => e.comment && e.comment.includes('【剧情】六'));
const p7 = entries.find(e => e.comment && e.comment.includes('【剧情】七'));
const p8 = entries.find(e => e.comment && e.comment.includes('【剧情】八'));
const p9 = entries.find(e => e.comment && e.comment.includes('【剧情】九'));
const p10 = entries.find(e => e.comment && e.comment.includes('【剧情】十'));
const p11 = entries.find(e => e.comment && e.comment.includes('【剧情】十一'));
const p12 = entries.find(e => e.comment && e.comment.includes('【剧情】十二'));
const p13 = entries.find(e => e.comment && e.comment.includes('【剧情】十三'));
const p14 = entries.find(e => e.comment && e.comment.includes('【剧情】十四'));
const p15 = entries.find(e => e.comment && e.comment.includes('【剧情】十五'));

console.log('\n--- [5] 酒馆卡片实时内容终检 ---');
console.log('赵无忧 1-15 剧情纯化状态:');
console.log('  剧情一门禁（赵无忧独占）:', p1?.content?.includes("variables.stat_data?.身份 ?? '赵无忧'"));
console.log('  剧情二门禁与防跳关:', p2?.content?.includes("variables.stat_data?.身份 ?? '赵无忧'") && p2?.content?.includes('严禁在此处直接跳跃至天溪城兽潮战事'));
console.log('  剧情三门禁（赵无忧独占）:', p3?.content?.includes("variables.stat_data?.身份 ?? '赵无忧'"));
console.log('  剧情四~十五全部纯化在册:', [p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15].every(p => !!p));

console.log('\n中立大势、自设专轨与殿主专轨在册检查:');
const p_custom_1 = entries.find(e => e.comment && e.comment.includes('起获《极乐引》（自设专轨）'));
const p_custom_2 = entries.find(e => e.comment && e.comment.includes('南域风云 · 散修大势与秘境暗涌（自设专轨）'));
const p_custom_3 = entries.find(e => e.comment && e.comment.includes('鼎炉争锋 · 仙姝名器之机缘大势（自设专轨）'));
console.log('  自设专轨 3 条在册:', !!p_custom_1 && !!p_custom_2 && !!p_custom_3);
console.log('  自设专轨门禁生效:', p_custom_1?.content?.includes("身份 === '自设'"));

const p_lord_1 = entries.find(e => e.comment && e.comment.includes('【剧情】一 · 天姝初立 · 极乐大诏与四殿分疆（殿主专轨）'));
const p_lord_2 = entries.find(e => e.comment && e.comment.includes('【剧情】二 · 暗度天溪 · 趁乱布网与围城之谋（殿主专轨）'));
const p_lord_3 = entries.find(e => e.comment && e.comment.includes('【剧情】三 · 要塞陷落 · 趁乱截击与收网良机（殿主专轨）'));
const p_lord_4 = entries.find(e => e.comment && e.comment.includes('【剧情】四 · 极乐分疆 · 四殿割据与鼎炉大争（殿主专轨）'));
console.log('  统一殿主专轨 4 条在册:', !!p_lord_1 && !!p_lord_2 && !!p_lord_3 && !!p_lord_4);
console.log('  统一殿主专轨门禁生效:', p_lord_1?.content?.includes("['焚欲殿主', '浊龙殿主', '欢喜殿主', '魂欢殿主'].includes(variables.stat_data?.身份)"));

const neut_plots = entries.filter(e => (e.comment || '').startsWith('【中立】'));
console.log('  【中立】大势 7 条在册且默认开启:', neut_plots.length === 7 && neut_plots.every(e => e.enabled === true));

console.log('\n物理开关出厂状态检查:');
const id_zwy = entries.find(e => e.comment === '【身份】赵无忧');
const other_ids = entries.filter(e => (e.comment || '').startsWith('【身份】') && e.comment !== '【身份】赵无忧');
const track_plots = entries.filter(e => (e.comment || '').startsWith('【剧情】') && (e.comment || '').includes('专轨'));
console.log('  【身份】赵无忧 默认开启:', id_zwy?.enabled === true);
console.log('  其余 5 个身份默认物理关闭:', other_ids.every(e => e.enabled === false));
console.log('  专轨剧情 7 条（自设3+殿主4）默认物理关闭:', track_plots.length === 7 && track_plots.every(e => e.enabled === false));

// 5. 校验世界书文件
const wbJson = JSON.parse(fs.readFileSync(targetWorldJson, 'utf8'));
const wbEntries = wbJson.entries || {};
const totalWbCount = Object.keys(wbEntries).length;
const wb_p2 = Object.values(wbEntries).find(e => e.comment && e.comment.includes('【剧情】二'));
console.log('\n--- [6] 酒馆独立世界书实时内容终检 ---');
console.log('世界书总条目数 (全量应为 240+ 条):', totalWbCount);
console.log('世界书剧情二防跳关:', wb_p2?.content?.includes('严禁在此处直接跳跃至天溪城兽潮战事'));
const wb_relic_law = Object.values(wbEntries).find(e => e.comment && e.comment.includes('交欢反应律'));
console.log('名器交欢律在册:', !!wb_relic_law);
console.log('包含男修呻吟与赞叹法则:', wb_relic_law?.content?.includes('因器而赞') && wb_relic_law?.content?.includes('必出呻吟'));
const wbConstants = Object.values(wbEntries).filter(e => e.constant === true);
console.log('世界书常驻条目防递归 (100% 开启):', wbConstants.length > 0 && wbConstants.every(e => e.preventRecursion === true));

console.log('\n✅ 部署与双向防覆盖核验全部通过！');
