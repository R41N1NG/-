function normItemName(s) {
  let t = String(s ?? '').trim();
  if (!t) return '';
  t = t.replace(/[（(][^）)]*[）)]/g, '');                 // 括号里的简述不参与判名
  t = t.replace(/[\s·・,，。.、'"「」『』]/g, '');
  const NUM = '[一二三四五六七八九十两双半几数]|\\d+';
  const UNIT = '壶|坛|瓶|罐|颗|枚|粒|丸|件|把|柄|张|袋|个|支|条|缕|滴|块|串|卷|册|本|面|幅|座|只|套|份|盒|匣|枚';
  t = t.replace(new RegExp(`^(?:${NUM})?(?:${UNIT})`, 'g'), '');   // 两壶灵酒 → 灵酒
  t = t.replace(new RegExp(`(?:${NUM})(?:${UNIT})$`, 'g'), '');    // 灵酒两壶 → 灵酒
  return t.trim();
}
/** 稳定 id：同一件东西在任何楼层都得同一个 id */
function itemIdOf(name) { return normItemName(name) || String(name ?? '').trim(); }

/** 老数据补 `id`／`count`，并把 count 规范成 ≥1 的整数 */
function normalizeInventory(inv) {
  const src = Array.isArray(inv) ? inv : [];
  return src.filter((it) => it && it.name).map((it) => {
    let n = parseInt(it.count, 10);
    if (!Number.isFinite(n) || n < 1) n = 1;
    return { ...it, id: it.id || itemIdOf(it.name), name: String(it.name), count: n };
  });
}

const ANCHOR_EVIDENCE = {
  天溪城破: /(城破|城陷|城池陷|城墙.{0,6}(?:塌|倒)|西南城破)/,   /* 2026-10-08（gpt 04 号③）：删去裸的「陷落」，它太泛（别处城池陷落也命中） */
  封元镇灵环: /(暴露|当众|看见|扯开|撕开|剥开|夺走|摘下|坦露|映入眼帘)/,
  双姝回归: /(回归|潜回|现身|回来了|回到)/,
  血染天溪: /(失控|越界|温存|血染|缠绵)/,
  /* 2026-10-08（gpt 04 号③）：原式 /(兽潮|血战|围城|攻城)/ 只要出现「兽潮」二字即放行——
     而「兽潮围城」是全书开篇就摆在那儿的既有局势，前六章满篇都是「兽潮」⇒ 等于没闸。
     现在要求**兽潮与围/攻/压/临城同句共现**，或「血战」明确落在城头/城下。 */
  兽潮血战: /((?:兽潮|妖潮)[^。；]{0,8}(?:围城|攻城|压城|临城|破城|血战)|血战[^。；]{0,8}(?:兽潮|妖潮|城头|城下|城前)|(?:围城|攻城)[^。；]{0,8}(?:兽潮|妖潮))/,
  天溪城兽潮: /((?:兽潮|妖潮)[^。；]{0,8}(?:围城|攻城|压城|临城|破城|血战)|血战[^。；]{0,8}(?:兽潮|妖潮|城头|城下|城前)|(?:围城|攻城)[^。；]{0,8}(?:兽潮|妖潮))/,
  玄机子装伤: /(装伤|诈伤|受伤.{0,8}(?:退|走|撤|离)|请返宗门)/,
  进入幽寂谷: /幽寂谷/,
  玄机子胁迫过叶红缨: /(胁迫|要挟|逼.{0,6}(?:她|叶红缨)|把柄|威胁)/,
  赵无忧坠渊: /(坠渊|坠入[^。；]{0,6}渊|跌入[^。；]{0,6}渊|坠落[^。；]{0,8}(?:渊|深渊)|金丹[^。；]{0,6}(?:击碎|碎|废))/,   /* 2026-10-08（gpt 04 号③）：删去裸的「葬魔渊」——那是地名，一到那儿就命中 */
  南域大劫: /(神诅|大劫|封印|再无元婴|天穹)/,
  已抵达天溪: /((?:抵达|到达|来到|抵临|进了?城|入城|踏上|上了)[^。；]{0,8}天溪|天溪[^。；]{0,8}(?:已?抵达|城墙下|城门|城中|城内|城头))/,
  赠送冰心泪: /冰心泪/,
  孤月定情: /(定情|说破|封吻|平安回来|心意)/,
  极乐引入手: /(极乐引|残卷|残篇)/,
  灵犀同心成形: /(灵犀同心|同心异体|日月同辉)/,
  灼酒流炎穴成形: /(灼酒流炎穴|名器.{0,6}(?:觉醒|成形)|初醒)/,
  残阳老怪洞府调教叶红缨: /(调教|洞府|囚|犬|锁链)/,
  叶红缨认残阳老怪为主: /(认主|为主|臣服|跪|主人)/,
  灼酒流炎穴二阶段: /(二阶段|二境|觉醒)/,
  
  楚灵夜后窍开发: /(后窍|谷道|后门|后庭|菊径|肛|撑开|开发)/,
};
/** 2026-10-08（gpt 04 号③）：否定／未发生语境的**窄闸** —— 只在同一个句子里判，不跨句。
 *  为什么需要：玩家写「本次开局不继承旧档，我还没遇到兽潮血战，也没有经历天溪城破」，
 *  旧闸门只看到词就放行。gpt 明确警告过「不要承诺靠追加否定词正则就完全解决」——
 *  所以这里只当**一道窄闸**，不宣称覆盖传闻／假设／反事实语境。 */
const NEG_RE = /(没|没有|未|未曾|不曾|尚未|别|勿|无需|并未|从未|不是|非|并不|谈不上|还没|不打算|不愿)/;
function negatedAround(text, re) {
  const t = String(text || '');
  const m = re.exec(t);
  if (!m) return false;
  const cut = (i) => i >= 0 && i < m.index;
  const cands = [t.lastIndexOf('。', m.index), t.lastIndexOf('；', m.index), t.lastIndexOf('！', m.index), t.lastIndexOf('？', m.index), t.lastIndexOf('\n', m.index)].filter(cut);
  const start = cands.length ? Math.max(...cands) + 1 : 0;
  const ends = [t.indexOf('。', m.index + m[0].length), t.indexOf('；', m.index + m[0].length), t.indexOf('！', m.index + m[0].length), t.indexOf('？', m.index + m[0].length), t.indexOf('\n', m.index + m[0].length)].filter((i) => i >= 0);
  const end = ends.length ? Math.min(...ends) : t.length;
  return NEG_RE.test(t.slice(start, end));
}
/** 本楼正文里有没有这个锚点的实证（不在表里的锚点一律放行）
 *  2026-10-08（gpt 04 号③）：空正文由「放行」改为 **fail-closed**（读不到正文就不予认定）。 */
function anchorEvidenceIn(prose, field) {
  const re = ANCHOR_EVIDENCE[field];
  if (!re) return { ok: true, why: '（该锚点无实证要求）' };
  if (!prose) return { ok: false, why: '（本楼读不到正文 ⇒ 不予认定；确实发生了就发「/解锁 …」手工补）' };
  if (!re.test(prose)) return { ok: false, why: `正文里没有「${field}」的实证` };
  if (negatedAround(prose, re)) return { ok: false, why: `正文里「${field}」的实证落在否定／未发生的那一句里` };
  return { ok: true, why: '' };
}

/** 去掉状态栏那一段，只留正文 —— 纳戒的「依据」只看正文，不看状态栏自己怎么写 */function stripStatusBlock(text) {
  return String(text || '')
    .replace(/<Status_block>[\s\S]*?<\/Status_block>/gi, ' ')
    .replace(/<StatusBlock>[\s\S]*?<\/StatusBlock>/gi, ' ')
    .replace(/<status>[\s\S]*?<\/status>/gi, ' ');
}

/**
 * 正文里有没有这一笔物品进出的依据。
 * 为什么需要：主人 2026-10-07 报「正文完全没提酒，可 `<纳戒>` 每楼都写消耗：醉春风×1」——
 *   根因是提示词的**写法示例里带了真实物品名**，模型照抄示例 ⇒ 两坛酒被抄光。
 * 认法（宽松但有底线，宁可漏认也不误扣）：
 *   ① 名称原样；② 归一化名（去数词量词与括号）；③ 名字 ≥4 字时另认**尾二字**（「墨山道佩剑」→「佩剑」）；
 *   ④ 去掉书名号等包裹符的裸名（「《极乐引》残篇」→「极乐引」）。
 */
function itemEvidenceIn(prose, name) {
  const p = String(prose || '');
  const full = String(name || '').trim();
  if (!p || !full) return false;
  const norm = normItemName(full) || full;
  const cands = [full, norm];
  if (norm.length >= 4) cands.push(norm.slice(-2));
  const bare = full.replace(/[《》〈〉「」『』【】（）()]/g, '');
  if (bare !== full) cands.push(bare);
  return cands.some((c) => c && c.length >= 2 && p.includes(c));
}

/** 在纳戒里找某件东西：①归一后全等 ②互为包含（词干长度 ≥2）⇒ 返回下标，找不到 -1 */function findItemIndex(inv, key) {
  const k = normItemName(key);
  if (!k) return -1;
  const norm = (it) => normItemName(it.name);
  let loose = -1;
  for (let i = 0; i < inv.length; i += 1) {
    const n = norm(inv[i]);
    if (n === k) return i;
    if (loose < 0 && k.length >= 2 && n.length >= 2 && (n.includes(k) || k.includes(n))) loose = i;
  }
  return loose;
}

/**
 * 施加一次变动（**纯函数**，返回新数组与执行报告）
 * @param {object[]} inv
 * @param {{kind:'gain'|'loss', name:string, count?:number, desc?:string, full?:string}} chg
 * @returns {{inv:object[], ok:boolean, name:string, asked:number, applied:number, note:string}}
 */
function applyItemChange(inv, chg) {
  const list = normalizeInventory(inv);
  const name = String(chg.name ?? '').trim();
  const asked = Math.max(1, parseInt(chg.count, 10) || 1);
  if (!name) return { inv: list, ok: false, name: '', asked, applied: 0, note: '名字为空' };
  const at = findItemIndex(list, name);
  if (chg.kind === 'gain') {
    if (at >= 0) list[at] = { ...list[at], count: list[at].count + asked };
    else list.push({ id: itemIdOf(name), name, desc: chg.desc || '随身所得之物。', full: chg.full || chg.desc || '随身所得之物。', count: asked });
    return { inv: list, ok: true, name: at >= 0 ? list[at].name : name, asked, applied: asked, note: '入账' };
  }
  if (at < 0) return { inv: list, ok: false, name, asked, applied: 0, note: '纳戒里没有这一件' };
  const real = Math.min(list[at].count, asked);          // ⚠️ 不许扣成负数：最多扣到 0
  const left = list[at].count - real;
  const hitName = list[at].name;
  if (left > 0) list[at] = { ...list[at], count: left };
  else list.splice(at, 1);                               // 扣到 0 才移除
  return { inv: list, ok: true, name: hitName, asked, applied: real, note: left > 0 ? `剩 ${left}` : '已用尽，移出纳戒' };
}

/**
 * 纳戒账本对账：**把已经不存在的那几楼的账回滚掉**（覆盖「删楼」这一种情形）。
 *   · 判据：`messageText(楼层)` 读不到内容 ⇒ 那一楼已被删；
 *   · 读消息本身抛错（接口没就绪）时**当作还在**，宁可留账也不误回滚；
 *   · 回滚 = 把该楼消耗过的加回去、该楼获得过的扣回去（与施加同一套，天然对称）。
 * 调用点：`applyStatusToVars`（每楼开始前）与 `boot`（开聊天/换聊天）。命令改纳戒**不进账本**（手动即最终）。
 */
async function reconcileNadeLedger(where) {
  const s = readStatData() || {};
  const log = (s.纳戒账本 && typeof s.纳戒账本 === 'object') ? { ...s.纳戒账本 } : null;
  if (!log) return false;
  const keys = Object.keys(log).filter((k) => /^\d+$/.test(k) && log[k] && typeof log[k] === 'object');
  if (!keys.length) return false;
  let inv = normalizeInventory(s.inventory);
  const gone = [];
  for (const k of keys) {
    let txt = null;
    try { txt = messageText(Number(k)); } catch (e) { txt = '（读不到，按还在算）'; }
    if (txt === null || txt === undefined) txt = '（读不到，按还在算）';
    if (String(txt).trim()) continue;                       // 这一楼还在 ⇒ 不动它
    const e = log[k];
    for (const x of (e.消耗 || [])) inv = applyItemChange(inv, { kind: 'gain', name: x.name, count: x.count }).inv;
    for (const x of (e.获得 || [])) inv = applyItemChange(inv, { kind: 'loss', name: x.name, count: x.count }).inv;
    delete log[k];   
    log[k] = null;
    gone.push(k);
  }
  if (!gone.length) return false;
  const r = await writeStat({ inventory: inv, 纳戒账本: log }, `${where}·纳戒对账`);
  console.log(TAG, `🧹 [纳戒对账]${where}：第 ${gone.join('、')} 楼已不存在 ⇒ 回滚它们的纳戒账`
    + `（${r && r.ok ? '已写盘 via ' + r.via : '⚠️ 写盘失败：' + ((r && r.why) || '接口不可用')}）`);
  return true;
}

/** 身份专属初始随身物品 */
function defaultInventoryRaw(identity) {
  const id = String(identity || '').trim();
  if (id === '赵无忧') {
    return [
      { name: '醉春风', desc: '墨山道佳酿两坛，酒香浓醇，可解忧畅怀。', full: '墨山道坊市所出的上等灵酿「醉春风」，甘冽清醇，入口温润，为赵无忧探望红缨师姐特备。' },
      { name: '墨山道佩剑', desc: '墨山道内门弟子制式青锋剑，温润坚韧。', full: '墨山道制式飞剑，通体以青灵寒铁锻打，刻有墨山宗纹，注入金丹灵力可御剑行空。' }
    ];
  }
  if (id === '焚欲殿主') {
    return [
      { name: '天姝令（焚欲）', desc: '天姝会焚欲殿殿主信物，正面刻曼妙天女，背面显墨山道。', full: '非金非木，触手冰凉。受极乐太子敕封之信物，可御使会中蛊火与死士，内蕴天姝秘力。' },
      { name: '《燎原蛊火诀》', desc: '极乐太子赐下的暴虐火道真法，以蛊引火。', full: '直指元婴大道的双修采补火诀，能以本源蛊火种入炉鼎，焚其神智、助其情动。' },
      { name: '《极乐引》', desc: '会中通传的名器总录，详载四域仙姝名器体质。', full: '软皮所制，记载落红、情动、沉沦三境之妙，标有墨山道叶红缨等绝品名器之线索。' }
    ];
  }
  if (id === '欢喜殿主') {
    return [
      { name: '天姝令（欢喜）', desc: '天姝会欢喜殿殿主信物，正面刻欢喜天女，背面显墨山道。', full: '极乐太子敕封信物，可号令欢喜殿魔僧与暗桩，调运南域寺院香火暗网。' },
      { name: '《旖旎梵音心经》', desc: '极乐太子赐下的淫靡佛门密经，梵音惑心。', full: '披着慈悲佛光的采补邪功，诵经如闻仙乐，最擅攻破女修心防，化其元阴为佛门甘露。' },
      { name: '《极乐引》', desc: '会中通传的名器总录，详载四域仙姝名器体质。', full: '软皮所制，记载落红、情动、沉沦三境之妙，标有楚灵夜「般若菩提菊」等妙相。' },
      { name: '积云檀木念珠', desc: '积云古寺方丈随身念珠，温润带香。', full: '百年雷击檀木打磨而成，常年受香火熏染，可遮蔽一身魔气、伪作慈悲高僧。' }
    ];
  }
  if (id === '浊龙殿主') {
    return [
      { name: '天姝令（浊龙）', desc: '天姝会浊龙殿殿主信物，正面刻九龙盘桓，背面显墨山道。', full: '极乐太子敕封信物，可调动皇朝暗卫与浊龙殿死士，威慑朝野。' },
      { name: '《极乐龙体诀》', desc: '以皇朝至尊龙气御万欲的霸道体修功法。', full: '龙气灌体、固本培元，能以至阳皇龙霸气彻底征服纯阴至寒体质，专克九幽玄阴脉。' },
      { name: '《极乐引》', desc: '会中通传的名器总录，详载四域仙姝名器体质。', full: '软皮所制，记载落红、情动、沉沦三境之妙，点明墨山道孤月「九幽玄阴穴」一阶未开。' },
      { name: '真龙暗卫密符', desc: '天龙皇朝九皇子私印密符，可调度死士南下。', full: '纯金镂空盘龙符节，持有者可秘密调度皇都死士暗线，执行渗透与截杀。' }
    ];
  }
  if (id === '魂欢殿主') {
    return [
      { name: '天姝令（魂欢）', desc: '天姝会魂欢殿殿主信物，正面刻粉色水滴邪徽。', full: '极乐太子敕封信物，执掌天姝会辨识名器之秘法与北域幽鬼坊市暗线。' },
      { name: '《情丝化灵录》', desc: '鬼医病相思主修的魔道密法，情丝寄魂。', full: '能化无形情愫为万千细密情丝，深入经脉骨髓，潜移默化篡改道心，最擅操控仙子心智。' },
      { name: '《极乐引》', desc: '会中通传的名器总录，详载四域仙姝名器体质。', full: '软皮所制，记载落红、情动、沉沦三境之妙，记有北域花芷凝「梅蕊穴」之秘。' },
      { name: '百毒百草囊', desc: '鬼医随身药囊，内藏无数奇诡灵蛊与迷情秘药。', full: '纳戒级灵丝皮囊，盛装幽冥蚀骨散、软筋融魂液及各类独门毒蛊，伤人于无形。' }
    ];
  }
  return [
    { name: '醉春风', desc: '南域佳酿两坛，酒香浓醇，可解忧畅怀。', full: '南域仙坊颇具盛名的上等灵酿「醉春风」，甘冽清醇，入口温润，最解行者客愁，为云游修士随身常备佳品。', count: 2 },
    { name: '随身青锋剑', desc: '入世防身佩剑，剑身清寒。', full: '随身淬炼多年的上好青锋剑，寒芒如雪，指使如臂，无论御剑凌风或近身防卫皆得心应手。' },
    { name: '《极乐引》残篇', desc: '记载天下诸般名器与双修造化之无上秘录。', full: '机缘所得的古旧皮质残卷，详载天下至阴名器之玄奥，能辨阴阳造化，推演仙姝命途。' }
  ];
}

/** 对外入口：起手行囊一律补上 `id` 与 `count`（⚠️ 赵无忧那份的「醉春风」是**两坛** ⇒ count 2） */
function defaultInventoryFor(identity) {
  const raw = defaultInventoryRaw(identity);
  if (identity === '赵无忧') {
    const i = raw.findIndex((x) => x.name === '醉春风');
    if (i >= 0) raw[i] = { ...raw[i], count: 2 };
  }
  return normalizeInventory(raw);
}

