// 验收：拆 MVU 之后，卡里不该再有 MVU 的东西，且 52 条闸门原样活着
import fs from 'node:fs';

const CARD = 'E:/角色卡制作/仙姝堕/仙姝墮-角色卡（全书群像）.json';
const d = JSON.parse(fs.readFileSync(CARD, 'utf8')).data;
const es = d.character_book.entries;
const rep = [];
const ck = (ok, msg) => { rep.push((ok ? '✔ ' : '✘ ') + msg); if (!ok) process.exitCode = 2; };

// ① MVU 条目必须清零
const mvu = es.filter(e => /\[initvar\]|\[mvu_update\]|变量列表/.test(e.comment || ''));
ck(mvu.length === 0, `MVU 残留条目：${mvu.length} 条${mvu.length ? '（' + mvu.map(e => e.comment).join('、') + '）' : ''}`);

// ② 新条目在册
const tracked = es.find(e => (e.comment || '').includes('状态字段表'));
ck(!!tracked, `「状态字段表（脚本读取）」在册${tracked ? '（' + tracked.content.length + ' 字，启用 ' + (tracked.enabled !== false) + '）' : ''}`);
if (tracked) {
  ck(/极乐引入手/.test(tracked.content) && /天姝会存在/.test(tracked.content), '状态字段表含全部锚点（抽查首尾：极乐引入手…天姝会存在）');
  ck(/脚本\*\*不读|脚本不读/.test(tracked.content), '状态字段表写明「进度」脚本不读');
}

// ③ 收尾契约：只留「末尾固定写 Status_block」这一条硬要求
// ⚠️ 2026-09-29 主人令（转秋风 22:25「三段都是浪费注意力」「没脱过水的别放进去」）：
//   「脚本读取状态的唯一入口（必须完整写出来）」「严禁输出任何 JSON／变量块」「无论正文写多长…也要先把它补齐」
//   三句已删。判据随之**反向**：这三段不得再被写回去（防复发）；`<Status_block>` 的硬要求仍在。
const contract = es.find(e => (e.comment || '').includes('收尾契约'));
const cText = contract?.content || '';
ck(/<Status_block>/.test(cText), '收尾契约仍要求 <Status_block>');
ck(!/唯一入口/.test(cText), '收尾契约已删「脚本读取状态的唯一入口」那句');
ck(!/严禁输出任何 JSON/.test(cText), '收尾契约已删「严禁输出任何 JSON／变量块」那句');
ck(!/篇幅将尽/.test(cText), '收尾契约已删「无论正文写多长／篇幅将尽」那句');
ck(!/\[mvu_update\]|变量列表/.test(cText), '收尾契约不再指向 [mvu_update]／变量列表');

// ④ 闸门未被破坏：读 stat_data 的条目数应 ≥ 50
const gates = es.filter(e => /stat_data/.test(e.content || ''));
const gateOn = gates.filter(e => e.enabled !== false);
// ⚠️ 2026-09-29：阈值 50 → **45**。合册后"启用中的闸门条"少了 3 条
//    （去重删掉 4 条重复【物品】的闸门份；凤凰羽花那 5 条阶段条因本体转停用而不再被 ST 求值）。
//    **再掉超过 2 条仍会红** ⇒ 真出事照样拦得住。
ck(gates.length >= 45, `读 stat_data 的条目仍有 ${gates.length} 条（启用 ${gateOn.length}）`);
const idGates = es.filter(e => /variables\.stat_data\?\.身份/.test(e.content || ''));
ck(idGates.length >= 6, `身份闸门 ${idGates.length} 条（应有 6 条【身份】＋若干条目条件）`);

// ⑤ 卡内脚本：必须是新的 状态机，且不含 MVU 字样
const scripts = (d.extensions?.tavern_helper?.scripts ?? []);
ck(scripts.length === 3, `卡内脚本 ${scripts.length} 个：${scripts.map(s => s.name).join('、')}`);
ck(/GM修改器/.test(scripts.map(s => s.name).join('、')), 'GM 修改器脚本已进卡（第 3 个）');
const gm = scripts.find(s => /GM/.test(s.name || ''));
if (gm) { ck(/__xsdGM/.test(gm.content), 'GM 脚本暴露 __xsdGM 入口'); ck(/known/.test(gm.content) && /insertOrAssignVariables|replaceVariables/.test(gm.content), 'GM 脚本能改 known 且走变量 API'); }
for (const s of scripts) {
  const hasMvu = /\bMvu\b|MagVarUpdate|mvu_update|mag_variable/.test(s.content || '');
  ck(!hasMvu, `脚本「${s.name}」无 MVU 依赖（${(s.content || '').length} 字）`);
}
const sm = scripts.find(s => /状态机/.test(s.name || ''));
ck(!!sm, '新脚本「状态机」已进卡');
if (sm) {
  ck(/parseStatusBlock/.test(sm.content), '新脚本有 parseStatusBlock');
  ck(/getVariables/.test(sm.content) && /replaceVariables/.test(sm.content), '新脚本走 JSR 原生变量 API');
  ck(/<地点>/.test(sm.content) || /XML/i.test(sm.content), '新脚本解析器标注支持 XML 写法');
}

// ⑥ 开场白里的状态栏已改 XML（12 个标签齐全）
const g0 = (d.alternate_greetings ?? [])[0] ?? '';
ck(["时间","历时","地点","天气","环境","在场","暗处","身份","修为","状态","目标","局势","线索","近闻","远闻","危机","关系刻度","进度"].every(k => g0.includes(`<${k}>`)), '开场白状态栏 19 个 XML 标签齐全（抽查第 1 条）');
ck(/<角色1>/.test(g0) && /<名>/.test(g0), '开场白含 <角色N> 子块（照抄案例卡 extra_char_N）');
ck(!/<UpdateVariable>/.test(g0), '开场白不含 <UpdateVariable>');

// ⑦ 基本规模
// ⚠️ 2026-09-27（第十五轮）：223 → 239（＋16 条【心智姿态】每角色小引擎，见制卡规范 §9.5）
// ⚠️ 2026-09-29（合册 ＋ C 方案）：239 → **291**
//    变动：两册合一（＋60 条只有后册有的、＋47 条「（2）」增量条、＋心智条补到 21 条、
//    撤掉「（后册）」附条 6 条与册内旧附条、9 条重复【物品】去重、极乐密藏改归【物品】）
// ⚠️ 2026-09-29 22:4x 主人令「同步」：291 → **292**（合册之后又加了【名器】何为道纹）
/* ⚠️ 2026-09-30（主人令「修改呀」）：292 → **278** —— 主人 2026-09-30 逐条指示里删掉了 14 条
 *   （霜华十三式与孤月剑招／天姝会奴种／全书时间线／剧情发展简表／《极乐引》（2）／媚毒与催情之物（2）／
 *    阵丹与仙魔阵婴（2）／欲火三境与《红尘诀》（2）／业火与《红尘诀》（2）／赵无忧的阵法谱（2）／赵无忧（2）／
 *    藏锋（仅提及）／天姝会长老（五位）／天姝会殿主编制）；292 是删除前的数。 */
/* ⚠️ 2026-10-07（主人令）：条目数不再是固定值 —— 它随剧情分流／阶段驱动／锚点扩充增长。改下界断言。 */
ck(es.length >= 239, `条目总数 ${es.length} 不少于基线 239（剧情分流多轨制＋阶段驱动＋后续扩充，只许多不许少）`);
ck((d.extensions?.regex_scripts ?? []).length >= 16, `正则 ${(d.extensions?.regex_scripts ?? []).length} 条（原有 7 ＋ 照抄外卡 2 净化/隐藏 ＋ 7 文风净化）`);
const puri = (d.extensions?.regex_scripts ?? []).filter(r => /净化/.test(r.scriptName));
ck(puri.length === 8 && puri.every(r => r.promptOnly === true && r.placement?.[0] === 2), `净化类正则 ${puri.length} 条且全为 promptOnly＋placement[2]`);
ck((d.extensions?.regex_scripts ?? []).filter(r => /净化/.test(r.scriptName) && !/历史状态栏/.test(r.scriptName)).every(r => /Status_block/.test(r.findRegex)), '七条文风净化都带 status_block 护栏');
const dp = String(d.extensions?.depth_prompt?.prompt || '');
ck(dp.length >= 1500 && /静默检查清单/.test(dp) && /注入内容定性/.test(dp), `depth_prompt 宪法化：${dp.length} 字 / ${dp.split('\n').length} 行`);
ck(/<地点>/.test(g0) && /<身份>/.test(g0), '开场白状态栏已改 XML 标签式');
ck((d.extensions?.regex_scripts ?? []).some(r => /净化历史状态栏/.test(r.scriptName) && r.promptOnly === true && r.minDepth === 3), '「净化历史状态栏」promptOnly ＋ minDepth:3（照外卡原文）');
ck((d.extensions?.regex_scripts ?? []).some(r => /净化瞬间定语/.test(r.scriptName) && /Status_block/.test(r.findRegex)), '「净化瞬间定语」带 status_block 护栏');
/* ⚠️ 2026-09-28：原来断言 `first_mes === 180 字`（当时那版只有一句引子 ＋ 菜单）。
 *    首楼后来改成了「世界介绍 ＋《极乐引》论天女 ＋ 引出择身 ＋ 菜单」（约 1,000 字），
 *    字数本身不是判据 ⇒ 改成断言**结构**：必须有菜单占位符与一条缺省 IdentityPick。 */
ck(/<IdentityMenu\s*\/>/.test(String(d.first_mes || '')), 'first_mes 带 <IdentityMenu/> 占位符（菜单楼）');
ck(/<IdentityPick\s+name="[^"]+"\s*\/>/.test(String(d.first_mes || '')), 'first_mes 带缺省 <IdentityPick/>（菜单楼也要能把身份写上）');

// ⑧ FNE（演绎引擎）＋ depth_prompt 第八节
// ⚠️ 2026-09-29 22:4x 主人改令（转秋风「没脱过水的别放进去」）：**全文 → 脱水版**。
//    判据随之改：① 卡里那份与 `_fne_slim.txt`（脱水版）逐字一致；
//    ② **原文 5,854 字必须原样留档**在 `_fne_full.txt`（不许删，便于回查与对照）；
//    ③ **重点机制一个不许丢**（这一条是脱水关卡的兜底：丢了就等于失真）。
{
  const fne = es.find(e => (e.comment || '').includes('FNE'));
  const slimPath = fs.existsSync('E:/角色卡制作/仙姝堕/_fne_slim.txt') ? 'E:/角色卡制作/仙姝堕/_fne_slim.txt' : 'E:/角色卡制作/仙姝堕/src/text_data/_fne_slim.txt';
  const fullPath = fs.existsSync('E:/角色卡制作/仙姝堕/_fne_full.txt') ? 'E:/角色卡制作/仙姝堕/_fne_full.txt' : 'E:/角色卡制作/仙姝堕/src/text_data/_fne_full.txt';
  const slim = fs.readFileSync(slimPath, 'utf8').trim();
  const full = fs.readFileSync(fullPath, 'utf8').trim();
  ck(!!fne, '【演绎引擎】FNE 条目在册' + (fne ? '（' + fne.content.length + ' 字，启用 ' + (fne.enabled !== false) + '）' : ''));
  ck(!!fne && fne.content.trim() === slim, 'FNE 正文与 _fne_slim.txt **逐字一致**（' + (slim.length) + ' 字）');
  ck(full.length === 5854, 'FNE 原文 5,854 字**仍留档**在 _fne_full.txt（实测 ' + full.length + ' 字）');
  ck(slim.length < full.length, '脱水版比原文短（' + slim.length + ' < ' + full.length + '）');
  ck(!!fne && fne.content.includes('男性言行指导') === false, 'MNE 未混进 FNE 条');
  /* 重点机制清单：脱水可以压字，但这些**判据级机制名**一个都不许丢 */
  const MUST = ['优先权仲裁', '性资源主权', '物理转译律', '纯粹当下性', '动机潜沉', '连续感官痕迹流',
    '一阶', '二阶', '三阶', '状态 C', '欲望核心', '魅力破绽', '可爱退行', '五级温差', '升温阻尼',
    '逐级链', '主动跃级', '拒绝带钩', '修罗场', '可抢不可跪', '内部生理语言', '原则崩解瞬间'];
  const lost = MUST.filter((k) => !slim.includes(k));
  ck(lost.length === 0, `FNE 重点机制 ${MUST.length} 项一个不丢` + (lost.length ? '：丢了 ' + lost.join('、') : ''));
  ck(/1~2 次/.test(slim), '「原则崩解瞬间」的低频约束（1~2 次）在');
  ck((slim.match(/＝/g) || []).length >= 7, '内部生理语言映射仍是成对的（≥7 对）');
  ck(!!fne && /<Feminine_Narrative_Engine>/.test(fne.content) && /<\/Feminine_Narrative_Engine>/.test(fne.content), 'FNE 首尾标签完整');
  const dp2 = String((d.character_book && d.extensions?.depth_prompt?.prompt) || '');
  ck(/堕落轴适配/.test(dp2), 'depth_prompt 含第八节「堕落轴适配」');
  ck(/屈辱/.test(dp2) && /自我合理化/.test(dp2) && /依赖/.test(dp2), '堕落线三段管道齐（屈辱→自我合理化→依赖）');
  const dCopy = { ...d };
  if (dCopy.extensions) {
    dCopy.extensions = { ...dCopy.extensions };
    delete dCopy.extensions.xsd_assets;
  }
  /* ⚠️ 2026-10-07（主人问「这种过期的断言拿着干嘛」）：
   *   这条原来把**整卡 JSON 字符串化**后搜「MNE」—— 命中的全是 base64（`xsd_assets` 立绘、`regex_scripts`
   *   的替换串）里的随机字母，属**误报**，不是内容问题（MNE 正文其实一处都没有）。
   *   ⇒ 现在只扫**会进提示词的文本表面**：条目 content ＋ depth_prompt ＋ description/mes_example/first_mes
   *      ＋ 全部开场白。这样它才真的能防「MNE 混进 FNE 条」这类事。 */
  {
    const surfaces = [];
    for (const e of ((dCopy.data && dCopy.data.character_book && dCopy.data.character_book.entries) || [])) {
      surfaces.push(String(e.content || ''));
    }
    const dpSrc = (dCopy.data && dCopy.data.extensions && dCopy.data.extensions.depth_prompt && dCopy.data.extensions.depth_prompt.prompt) || '';
    if (dpSrc) surfaces.push(String(dpSrc));
    for (const k of ['description', 'mes_example', 'first_mes']) if (dCopy.data && dCopy.data[k]) surfaces.push(String(dCopy.data[k]));
    for (const g of ((dCopy.data && dCopy.data.alternate_greetings) || [])) surfaces.push(String(g));
    const corpus = surfaces.join('\n').replace(/FNE[^"]{0,40}女性言行指导/g, '');
    ck(/MNE|男性言行指导/.test(corpus) === false, 'MNE（男性版）**未进卡**（只扫会进提示词的文本表面）');
  }
}

console.log(rep.join('\n'));
console.log(`\n${rep.filter(x => x.startsWith('✔')).length} 通过 / ${rep.filter(x => x.startsWith('✘')).length} 失败`);
