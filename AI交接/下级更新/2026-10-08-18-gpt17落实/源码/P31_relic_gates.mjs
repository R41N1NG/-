/**
 * P31_relic_gates.mjs —— 只读核查：玩家说「名器四个阶段都是绿灯、触发词一样、怕 token 爆炸」到底对不对。
 * 逐条打印【名器】/【名器·阶段】条目的：id、comment、constant（绿灯＝常驻）、enabled、
 * keys（触发词）、内容首行（EJS 闸门）、内容字符数；并统计全卡常驻条数与名器部分的 token 估算。
 */
import fs from 'node:fs';

const CARD = process.argv.includes('--card') ? process.argv[process.argv.indexOf('--card') + 1] : '最新角色卡/仙姝堕.json';
const WB = 'references/仙姝墮-世界书.json';

const card = JSON.parse(fs.readFileSync(CARD, 'utf8'));
const es = card.data.character_book.entries || [];

const 名器条 = es.filter((e) => /名器/.test(e.comment || ''));
const 常驻 = es.filter((e) => e.constant === true);
const 估算 = (arr) => Math.round(arr.reduce((a, e) => a + (e.content || '').length, 0) * 0.75);  // 粗估：汉字≈0.75 token? 仅作量级

console.log('【卡】' + CARD + '　条目 ' + es.length + '　常驻(constant)= ' + 常驻.length + '　名器相关= ' + 名器条.length + '\n');
console.log('══ 名器相关条目逐条（绿灯＝constant:true）══');
for (const e of 名器条) {
  const s = e.content || '';
  const 首行 = (s.split('\n')[0] || '').slice(0, 90);
  const 闸 = /@@if/.test(s) ? 'EJS闸门✓' : '无EJS闸门';
  console.log(
    '· id' + String(e.id).padEnd(4) + ' ' + (e.comment || '').padEnd(30)
    + '｜constant=' + (e.constant === true) + '｜enabled=' + (e.enabled !== false)
    + '｜' + 闸 + '｜keys=' + JSON.stringify(e.keys || [])
    + '｜字数=' + s.length
  );
  console.log('      首行：' + 首行);
}
console.log('\n══ 全卡常驻（constant:true）条目 ══');
for (const e of 常驻) console.log('  id' + String(e.id).padEnd(4) + ' ' + (e.comment || '') + '｜字数=' + (e.content || '').length + '｜' + (/@@if/.test(e.content || '') ? 'EJS闸门✓' : '无闸门'));

console.log('\n【统计】名器条里 constant=true 的：' + 名器条.filter((e) => e.constant === true).length + ' / ' + 名器条.length);
console.log('【统计】名器条总字数 = ' + 名器条.reduce((a, e) => a + (e.content || '').length, 0) + '（≈ ' + 估算(名器条) + ' token 量级，粗估）');
console.log('【统计】全卡总字数 = ' + es.reduce((a, e) => a + (e.content || '').length, 0));

/* 真源对照 */
const wb = JSON.parse(fs.readFileSync(WB, 'utf8'));
const list = Array.isArray(wb.entries) ? wb.entries : Object.values(wb.entries || {});
const w名器 = list.filter((e) => /名器/.test(e.comment || ''));
console.log('\n══ 世界书真源 references/仙姝墮-世界书.json（' + list.length + ' 条）里的名器条 ══');
for (const e of w名器) {
  console.log('· uid' + String(e.uid).padEnd(5) + ' ' + (e.comment || '').padEnd(30)
    + '｜constant=' + (e.constant === true) + '｜enabled=' + (e.enabled !== false)
    + '｜keys=' + JSON.stringify(e.key || e.keys || [])
    + '｜' + (/@@if/.test(e.content || '') ? 'EJS闸门✓' : '无EJS闸门'));
}
