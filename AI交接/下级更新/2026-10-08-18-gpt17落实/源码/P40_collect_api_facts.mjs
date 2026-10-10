/**
 * P40_collect_api_facts.mjs —— 为 gpt 的《接口与接入说明》收集**可核事实**（只读）。
 * 逐项打印：写入入口调用点、事件注册点、字段注册表、日期函数、灵犀／烟霞相关门与字段、chatId/双层读法。
 */
import fs from 'node:fs';

const SM = '卡片脚本/状态机.js';
const GM = '卡片脚本/GM修改器.js';
const PANEL = '卡片脚本/状态栏面板.js';
const sm = fs.readFileSync(SM, 'utf8');
const gm = fs.readFileSync(GM, 'utf8');
const panel = fs.readFileSync(PANEL, 'utf8');

const 行 = (s, re) => {
  const out = [];
  s.split('\n').forEach((l, i) => { if (re.test(l)) out.push((i + 1) + ': ' + l.trim().slice(0, 150)); });
  return out;
};
const 印 = (标题, arr, n = 12) => { console.log('\n=== ' + 标题 + '（' + arr.length + ' 处，取前 ' + n + '）==='); arr.slice(0, n).forEach((x) => console.log('  ' + x)); };

console.log('【版本事实】');
console.log('  酒馆: 1.14.0（E:/tavern/SillyTavern/package.json）');
console.log('  ST-Prompt-Template: manifest.version 1.17.9（package.json version 1.17）');
console.log('  酒馆助手扩展目录名: JS-Slash-Runner（需读其 manifest 取版本）');

印('状态机·写入底层与调用者（writeStat／insertOrAssignVariables）', 行(sm, /writeStat\(|insertOrAssignVariables|replaceVariables/), 14);
印('状态机·事件注册（eventOn／tavern_events／消息与聊天切换）', 行(sm, /eventOn\(|tavern_events|MESSAGE_RECEIVED|MESSAGE_SENT|CHAT_CHANGED|GENERATION_AFTER_COMMANDS/), 14);
印('状态机·变量读取与双层（L_CHAT／L_MSG／readLayer／readStatData）', 行(sm, /const L_CHAT|const L_MSG|function readLayer|function readStatData|LAYER_LABEL/), 10);
印('状态机·日期台账函数（nextAcc／parseLishi／ymToMonths／monthsToYm／仙盟历）', 行(sm, /function nextAcc|function parseLishi|function ymToMonths|function monthsToYm|function fmtXianmengDay|仙盟历\s*=|历时累计|历基准|初始时点/), 16);
印('状态机·名器注册表与政策（ALL_FIELDS／MINGQI_PREREQ／FORM_OF_HOLDERS／HOLDER_TO_RELIC）', 行(sm, /const ALL_FIELDS|const MINGQI_PREREQ|const FORM_OF_HOLDERS|const HOLDER_TO_RELIC|MINGQI_PREREQ\s*=/), 8);
印('状态机·灵犀相关字段（实际注册键）', 行(sm, /灵犀同心/), 12);
印('状态机·烟霞／阎雷子相关（实际政策）', 行(sm, /烟霞|阎雷子|出场实证/), 12);
印('GM修改器·写盘与 DOM 入口', 行(gm, /insertOrAssignVariables|replaceVariables|function save|data-known|addEventListener|撤销/), 14);
印('面板·宿主 document 与父窗口', 行(panel, /window\.parent|window\.top|DOC\(|getContext\(\)/), 10);
印('面板·变量读取', 行(panel, /getVariables\(|insertOrAssignVariables\(|replaceVariables\(/), 10);

console.log('\n=== 卡内（当前卡）灵犀／烟霞相关条目的门 ===');
const card = JSON.parse(fs.readFileSync('最新角色卡/仙姝堕.json', 'utf8'));
for (const e of card.data.character_book.entries) {
  const c = e.comment || '';
  if (!/灵犀同心|烟霞|阎雷子/.test(c)) continue;
  const 首行 = String(e.content).split('\n')[0];
  console.log('  id' + e.id + ' ' + c);
  console.log('     ' + 首行.slice(0, 260));
}

console.log('\n=== 酒馆助手（JS-Slash-Runner）manifest ===');
const dir = 'E:/tavern/SillyTavern/data/default-user/extensions/JS-Slash-Runner';
for (const f of ['manifest.json', 'package.json']) {
  const p = dir + '/' + f;
  if (!fs.existsSync(p)) { console.log('  ' + f + '：不存在'); continue; }
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    console.log('  ' + f + '：display_name=' + (j.display_name || '-') + '｜version=' + (j.version || '-'));
  } catch (e) { console.log('  ' + f + '：解析失败（可能是带 BOM/非 UTF-8）'); }
}

console.log('\n=== 浏览器自动化 / 最小测试页 ===');
for (const p of ['tools/previews', 'node_modules/puppeteer', 'node_modules/playwright', 'package.json']) {
  console.log('  ' + p + '：' + (fs.existsSync(p) ? '存在' : '不存在'));
}
if (fs.existsSync('tools/previews')) {
  const f = fs.readdirSync('tools/previews').slice(0, 12);
  console.log('    tools/previews 内容（前 12）：' + f.join('、'));
}
