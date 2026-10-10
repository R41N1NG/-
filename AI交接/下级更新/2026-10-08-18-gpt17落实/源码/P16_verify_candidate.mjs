/**
 * P16_verify_candidate.mjs —— 对**隔离暂存候选卡**做验收（不碰交付目录）：
 *   ① 候选卡 id7 content 用最小 EJS 跑 16 格矩阵（与 P14 同一套用例，但输入换成**卡内 content**）；
 *   ② 状态栏模板（id2）示例里的事件占位是否已中性化；
 *   ③ 结构不变量：条目数 241、原四段标题已换成世界轴/个人舞台、`<Status_block>` 仍在；
 *   ④ 与交付卡（旧）逐条比：只有预期的条目变了。
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const OLD = 'E:/角色卡制作/仙姝堕/最新角色卡/仙姝堕.json';
const NEW = 'E:/角色卡制作/仙姝堕/_staging_2026-10-08-18/仙姝堕.json';
const OUT = 'E:/角色卡制作/仙姝堕/AI交接/下级更新/2026-10-08-18-gpt17落实/材料/18b_候选卡验收.json';

function compileEJS(tplText) {
  const re = /<%([_\-=]?)([\s\S]*?)([_\-]?)%>/g;
  let src = 'var __out = [];\n';
  let last = 0, m, slurp = false;
  const push = (s) => { if (s) src += '__out.push(' + JSON.stringify(s) + ');\n'; };
  while ((m = re.exec(tplText))) {
    let text = tplText.slice(last, m.index);
    const open = m[1], body = m[2], close = m[3];
    if (slurp) text = text.replace(/^[ \t]*\r?\n?/, '');
    if (open === '_') text = text.replace(/[ \t]*$/, '');
    push(text);
    if (open === '=' || open === '-') src += '__out.push(String(' + body + '));\n';
    else src += body + '\n';
    slurp = close === '_';
    last = re.lastIndex;
  }
  push(tplText.slice(last));
  src += 'return __out.join("");';
  // eslint-disable-next-line no-new-func
  return new Function('variables', src);
}

const sha = (s) => crypto.createHash('sha256').update(Buffer.from(s, 'utf8')).digest('hex');
const oldCard = JSON.parse(fs.readFileSync(OLD, 'utf8'));
const newCard = JSON.parse(fs.readFileSync(NEW, 'utf8'));
const oldE = oldCard.data.character_book.entries;
const newE = newCard.data.character_book.entries;
const get = (arr, id) => arr.find((e) => e.id === id);

const KN = (o) => Object.assign({ 南域大劫: false, 天溪城兽潮: false, 兽潮血战: false, 天溪城破: false, 极乐引入手: false, 玄机子胁迫过叶红缨: false }, o || {});
const V = (段位, 仙盟历, known, 身份) => ({ stat_data: { 段位, 仙盟历, 身份: 身份 || '赵无忧', known: KN(known) } });
const WAR_RE = /兽潮一波接一波|围城数日|城墙段化作血腥炼狱/;

const id7 = get(newE, 7);
const render = compileEJS(id7.content);
const cases = [
  ['1577.07/段2/known空', V(2, 1577.07, {}), { 禁战: 1, 世界: '大劫之前' }],
  ['1577.07/段8/known空', V(8, 1577.07, {}), { 禁战: 1, 世界: '大劫之前' }],
  ['1578.03/段8/known空', V(8, 1578.03, {}), { 禁战: 1, 世界: '大劫之前' }],
  ['1578.08/段8/大劫未建立', V(8, 1578.08, {}), { 禁战: 1, 世界: '大劫已降（正式兽潮尚未到期）' }],
  ['1578.08/段8/大劫已建立', V(8, 1578.08, { 南域大劫: true }), { 禁战: 1, 世界: '大劫已降（正式兽潮尚未到期）' }],
  ['1579.01/段8/兽潮未建立', V(8, 1579.01, { 南域大劫: true }), { 禁战: 1, 世界: '正式兽潮期' }],
  ['1579.01/段8/兽潮已建立', V(8, 1579.01, { 南域大劫: true, 天溪城兽潮: true }), { 允战: 1, 世界: '正式兽潮期' }],
  ['1579.03/段8/城破未建立', V(8, 1579.03, { 南域大劫: true, 天溪城兽潮: true }), { 禁战: 1, 世界: '城破之后' }],
  ['1579.06/段2/城破已建立', V(2, 1579.06, { 天溪城破: true }), { 禁战: 1, 世界: '城破之后' }],
  ['缺日期/段8', V(8, undefined, {}), { 禁战: 1, 世界: '中性世界规则' }],
  ['缺日期/污染known', V(8, undefined, { 天溪城兽潮: true, 天溪城破: true }), { 禁战: 1, 世界: '中性世界规则' }],
  ['1577.07/段2/污染known', V(2, 1577.07, { 天溪城兽潮: true, 天溪城破: true }), { 禁战: 1, 世界: '大劫之前' }],
  ['非法日期9999.99', V(8, 9999.99, {}), { 禁战: 1, 世界: '中性世界规则' }],
  ['殿主身份1577.07/段2', V(2, 1577.07, {}, '焚欲殿主'), { 禁战: 1, 世界: '大劫之前' }],
  ['月份型日期1578.11（无日）', V(8, 1578.11, {}), { 禁战: 1, 世界: '大劫已降（正式兽潮尚未到期）' }],
  ['无 stat_data', {}, { 禁战: 1 }],
];
const rows = cases.map(([name, vars, exp]) => {
  let text = '', err = null, hasWar = false, 世界 = '（无）';
  try {
    text = render(vars);
    hasWar = WAR_RE.test(text);
    世界 = (text.match(/## 世界压力 · ([^\n]+)/) || [, /## 中性世界规则/.test(text) ? '中性世界规则' : '（无）'])[1].trim();
  } catch (e) { err = String(e && e.message || e); }
  const ok = !err && (exp.禁战 ? !hasWar : true) && (exp.允战 ? hasWar : true) && (exp.世界 ? 世界 === exp.世界 : true);
  return { 用例: name, 通过: ok, 世界轴: 世界, 含战争句: hasWar, 抛错: err };
});

/* ② 状态栏模板示例中性化 */
const id2new = get(newE, 2).content;
const 旧占位 = ['天溪城兽潮已破两处防区', '兽潮三日内必至', '南域大劫之夜', '邻县驿馆进驻大批披甲', '茶客议论北面商道封禁'];
const 新占位 = ['按当前已验证世界状态填写', '照抄【阶段驱动】「后台当前时点」那一行的仙盟历年月日'];

/* ③ 结构不变量 */
const struct = {
  旧条目数: oldE.length, 新条目数: newE.length,
  id7字符数_旧: get(oldE, 7).content.length, id7字符数_新: id7.content.length,
  id7SHA_旧: sha(get(oldE, 7).content), id7SHA_新: sha(id7.content),
  旧四段标题残留: (id7.content.match(/## 阶段[一二三四] · /g) || []).length,
  新世界轴标题: (id7.content.match(/## 世界压力 · /g) || []).length,
  新个人舞台标题: (id7.content.match(/## 个人舞台 · /g) || []).length,
  状态栏条目含Status_block: id2new.includes('<Status_block>'),
  depth_prompt含Status_block: ((newCard.data.extensions.depth_prompt || {}).prompt || '').includes('<Status_block>'),
  卡内脚本数: (newCard.data.extensions.tavern_helper.scripts || []).length,
};

/* ④ 与旧卡逐条比：只有预期条目变了 */
const 变化条目 = [];
for (const e of newE) {
  const o = get(oldE, e.id);
  if (!o) { 变化条目.push({ id: e.id, 变化: '新增' }); continue; }
  const k1 = ['content', 'keys', 'constant', 'enabled', 'prevent_recursion', 'insertion_order'];
  const bad = k1.filter((k) => JSON.stringify(e[k]) !== JSON.stringify(o[k]));
  if (bad.length) 变化条目.push({ id: e.id, 标题: e.comment, 变化字段: bad, 旧字符: (o.content || '').length, 新字符: (e.content || '').length });
}

const out = {
  候选卡: NEW, 候选字节: fs.statSync(NEW).size, 交付卡字节: fs.statSync(OLD).size,
  id7矩阵通过: rows.filter((r) => r.通过).length + '/' + rows.length, id7矩阵: rows,
  状态栏示例: { 旧占位是否仍在: 旧占位.filter((s) => id2new.includes(s)), 新占位是否在位: 新占位.filter((s) => id2new.includes(s)) },
  结构: struct,
  与旧卡相比变化了的条目: 变化条目,
};
fs.mkdirSync(OUT.replace(/\/[^/]+$/, ''), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
console.log('候选 ' + out.候选字节 + ' 字节（旧 ' + out.交付卡字节 + '）');
console.log('id7 卡内 content 矩阵：' + out.id7矩阵通过);
for (const r of rows) if (!r.通过) console.log('  ✘ ' + r.用例 + ' ｜世界=' + r.世界轴 + ' ｜含战争句=' + r.含战争句 + (r.抛错 ? ' ｜' + r.抛错 : ''));
console.log('旧事件占位残留：' + JSON.stringify(out.状态栏示例.旧占位是否仍在));
console.log('新中性占位在位：' + JSON.stringify(out.状态栏示例.新占位是否在位));
console.log('结构：' + JSON.stringify(struct));
console.log('变化条目 ' + 变化条目.length + ' 条：' + JSON.stringify(变化条目.map((x) => x.id + (x.变化 ? '(' + x.变化 + ')' : ''))));
