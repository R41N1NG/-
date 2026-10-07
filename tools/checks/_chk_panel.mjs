// 复核：面板格子、字段表、状态栏模板、纪律 是否都改到了
import fs from 'fs';
const D = 'E:/角色卡制作/仙姝堕/';
const card = JSON.parse(fs.readFileSync(D + '仙姝墮-角色卡（全书群像）.json', 'utf8').replace(/^\uFEFF/, ''));
const d = card.data ?? card;

const panel = d.extensions.regex_scripts.find((x) => x.scriptName.includes('状态栏'));
const html = panel.replaceString;
const KEYS = ['loc', 'time', 'who', 'dark', 'id', 'realm', 'state', 'mq', 'goal', 'sit', 'rel'];
console.log('=== 面板格子 ===');
console.log(KEYS.map((k) => `${k}:${html.includes(`data-xds="${k}"`) ? '有' : '缺'}`).join('  '));
console.log('进度格子（应为 false）:', html.includes('data-xds="prog"'));
console.log('三区小标题:', ['场', '我', '局'].map((s) => `${s}:${html.includes(`>${s}</div>`) || html.includes(`>${s}<`)}`).join(' '));

const script = Object.values(d.extensions.tavern_helper.scripts).map((s) => s.content).join('\n');
const m = script.match(/const FIELD_MAP = \{[\s\S]*?\};/);
console.log('\n=== 卡内脚本 FIELD_MAP ===');
console.log(m ? m[0].replace(/\s+/g, ' ') : '（找不到）');
console.log('进度是否混进表里（应为 false）:', /prog:/.test(script));

const tpl = d.character_book.entries.find((e) => e.comment === '状态栏模板');
console.log('\n=== 状态栏模板 ===');
console.log('三区都在:', ['【场】', '【我】', '【局】'].every((s) => tpl.content.includes(s)));
console.log('含 暗处/身份/目标/进度:', ['暗处：', '身份：', '目标：', '进度：'].every((s) => tpl.content.includes(s)));
console.log('名器双轨说明:', /双轨/.test(tpl.content));
const rules = d.character_book.entries.find((e) => e.comment.includes('运行规则'));
console.log('\n=== 状态栏纪律 ===');
for (const line of rules.content.split('\n')) if (line.includes('状态栏纪律')) console.log('  ' + line.slice(0, 150) + '…');
console.log('\n条目总数:', d.character_book.entries.length, '｜启用', d.character_book.entries.filter((e) => e.enabled).length);
