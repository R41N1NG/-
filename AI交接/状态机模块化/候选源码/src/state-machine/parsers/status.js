/* ═══════════════════════════════════════════════════════════
 * 六 · 状态条解析 → 变量
 * ═══════════════════════════════════════════════════════════ */

/* ── 字段名归一：繁简 / 大小写 / 同义 / 分隔符（· ・ - _ /）都收 ── */
/** 繁体 → 简体（只收本卡字段名里会出现的字，够用就好，不引整张转换表）
 *  ⚠️ 两串必须**逐位对齐**（同一个下标是一对）。v1.3 追加的 7 对：
 *     歷→历（历时）· 氣→气（天气）· 環→环（环境）· 線→线（线索）· 遠→远（远闻）· 聞→闻（近闻）· 機→机（危机） */
const TRAD_CHARS = '場處間時點關係態狀為標勢員體們進潛龍與冊歷氣環線遠聞機';
const SIMP_CHARS = '场处间时点关系态状为标势员体们进潜龙与册历气环线远闻机';
function toSimp(s) {
  let out = '';
  for (const ch of String(s)) {
    const i = TRAD_CHARS.indexOf(ch);
    out += i >= 0 ? SIMP_CHARS[i] : ch;
  }
  return out;
}
/** 去掉装饰（【】（）「」<>…）／空白（含全角空格）／分隔符，再转简体小写 —— 归一后的串拿去查表 */
function normalizeLabel(raw) {
  return toSimp(
    String(raw ?? '')
      .replace(/[【】\[\]（）()<>「」『』"'`\s\u3000]/g, '')
      .replace(/[·・•‧．.\-_/]/g, ''),
  ).toLowerCase();
}

/** 规范键 → 别名（含规范键自己）。
 *  ⚠️ `名器·在册`／`名器`／`名器在册` 归一后是同一个串，所以只需写一条。
 *  ⚠️ 这里只管「读得到」，写进 stat_data 的**永远是规范键**。 */
const FIELD_ALIAS = {
  时间: ['时间', '时辰', '时刻'],
  历时: ['历时', '经过时长', '所历'],   /* 2026-10-08（gpt 04 号④）：删「倒计时」——『距启程 3 日』是计划/倒计时，不是已过历时 */
  地点: ['地点', '位置', '所在', '地址'],
  天气: ['天气', '天候'],
  环境: ['环境', '氛围', '周遭', '周遭环境'],
  在场: ['在场', '人物', '在场人物', '场上'],
  暗处: ['暗处', '潜伏', '暗中', '暗桩'],
  身份: ['身份', '角色', '当前身份'],
  修为: ['修为', '境界', '修境'],
  状态: ['状态', '身心'],
  目标: ['目标', '目的', '意图'],
  局势: ['局势', '局面', '大势'],
  线索: ['线索', '痕迹', '蛛丝马迹'],
  近闻: ['近闻', '近处风声', '近处传闻'],
  远闻: ['远闻', '远处风声', '远处传闻'],
  危机: ['危机', '危局', '迫近之危'],
  // ⚠️ 刻意**不**把「角色」列成 在场角色 的别名 —— `身份` 已占了那个别名，
  //    同名别名会互相覆盖（ALIAS_LOOKUP 后写者胜）。
  [CAST_FIELD]: [CAST_FIELD, '在场要角', '角色块'],
  关系刻度: ['关系刻度', '关系', '关系·刻度', '关系值'],
};
/** 归一化后的别名 → 规范键 */
const ALIAS_LOOKUP = (() => {
  const m = {};
  for (const key of Object.keys(FIELD_ALIAS)) {
    m[normalizeLabel(key)] = key;
    for (const a of FIELD_ALIAS[key]) m[normalizeLabel(a)] = key;
  }
  return m;
})();

/** 标签 → 规范键。先查别名表（归一后精确匹配），查不到再退回面板口径的「互相包含」。
 *  ⚠️ v1.3 两条护栏：
 *    ① 归一后**只剩一个字的标签一律不认** —— 子块里的 `<名>` 与「名器」互相包含
 *       （`名器`.includes(`名`）），不挡会拿人物名去覆盖名器栏；
 *    ② `在场角色` 不参与「互相包含」兜底 —— 它与 `在场` 互相包含，会把 `<在场>` 拽过去。 */
function matchField(label) {
  const n = normalizeLabel(label);
  if (!n || n.length < 2) return null;
  if (ALIAS_LOOKUP[n]) return ALIAS_LOOKUP[n];
  for (const key of Object.keys(FIELD_MAP)) {
    if (key === CAST_FIELD) continue;
    const want = normalizeLabel(FIELD_MAP[key]);
    if (!want) continue;
    if (n.includes(want) || want.includes(n)) return key;
  }
  return null;
}
/** 这一行／这个标签是不是「进度」（进度不进面板，也不写变量，只做一致性校验） */
function isProgressLabel(label) {
  return normalizeLabel(label).includes('进度');
}

function isMilestoneLabel(label) {
  const n = normalizeLabel(label);
  return n.includes('实际发生') || n.includes('里程碑');
}
/** `<实际发生>` 的值 → 字段名数组（空串／无／破折号 ⇒ []） */
function parseMilestones(value) {
  const v = String(value ?? '').trim().replace(/[（(]\s*无\s*[）)]/g, '无');
  if (!v || v === '无' || v === '-' || v === '—' || /^none$/i.test(v)) return [];
  return v.split(/[、,，/｜|；;\s]+/).map((x) => x.trim()).filter(Boolean);
}
/** 「进度」的值 → 字段名数组（空串／无／破折号 ⇒ []，自动剥除「已达成/已完成」等自然语言后缀） */
function parseProgress(value) {
  const v = String(value ?? '').trim().replace(/[（(]\s*无\s*[）)]/g, '无');
  if (!v || v === '无' || v === '-' || v === '—' || /^none$/i.test(v)) return [];
  return v.split(/[、,，/｜|；;\n]/)
    .map((x) => x.trim().replace(/(?:已达成|已完成|已触发|已解锁|已激活|达成|完成|[（(][^）)]*[）)]|\[[^\]]*\])$/g, '').trim())
    .filter(Boolean);
}

function normalizeAnchorName(f) {
  const s = String(f ?? '').trim();
  if (!s) return s;
  if (ALL_FIELDS.includes(s)) return s;
  for (const syn of DEFLOWER_SYN) {
    if (syn === '处女丧失' || !s.endsWith(syn)) continue;
    const cand = s.slice(0, s.length - syn.length) + '处女丧失';
    if (ALL_FIELDS.includes(cand)) return cand;
  }
  return s;
}

/** `<破处>` 破处簿那个栏（玩家看不见，与 `<实际发生>`／`<进度>` 同款待遇：不进面板、不渲染） */
function isDeflowerLabel(label) {
  const n = normalizeLabel(label);
  return n.includes('破处') || n.includes('破身簿');
}

function isNadeLabel(label) {
  const n = normalizeLabel(label);
  return n.includes('纳戒') || n.includes('行囊') || n.includes('物品栏');
}
/** `<纳戒>` 的值 → `{ 获得: [{name,desc,full,count}], 消耗: [{name,count}] }`
 *  体例：「获得：A×2、B（简述）｜消耗：C×1」（顿号分件，竖线分两类，没有就写「无」）。
 *  ⚠️ 数量写法认 `×n`／`xn`／`*n`／末尾空格数字；**不写数量按 1 计**（喝一壶就写 ×1，别写「两壶」当名字）。 */
function parseNade(value) {
  const v = String(value ?? '').trim().replace(/[（(]\s*无\s*[）)]/g, '无');
  const out = { 获得: [], 消耗: [] };
  if (!v || v === '无' || v === '-' || v === '—' || /^none$/i.test(v)) return out;
  /* 件内的数量后缀：`醉春风×2` / `醉春风x2` / `醉春风*2` / `醉春风 2` */
  const takeCount = (s) => {
    const m = String(s).match(/(?:[×xX*]\s*(\d+))\s*$/) || String(s).match(/\s+(\d+)\s*$/);
    return m ? Math.max(1, parseInt(m[1], 10)) : 1;
  };
  for (const seg of v.split(/[｜|；;\n]+/)) {
    const m = seg.match(/^\s*(获得|拿到|收入|消耗|用掉|喝掉|吃掉|丢掉|失去|使用)\s*[:：]\s*(.*)$/);
    if (!m) continue;
    const isGain = ['获得', '拿到', '收入'].includes(m[1]);
    for (const one of String(m[2]).split(/[、,，]+/)) {
      const raw = one.trim();
      if (!raw) continue;
      const cnt = takeCount(raw);
      const t = raw.replace(/[×xX*]\s*\d+\s*$/, '').replace(/\s+\d+\s*$/, '').trim();
      if (!t) continue;
      if (!isGain) {
        const nm = t.replace(/[（(].*$/, '').trim();
        if (nm) out.消耗.push({ name: nm, count: cnt });
        continue;
      }
      const mm = t.match(/^(.+?)[（(](.+?)[）)]$/);          // 「青锋剑（入世防身）」
      out.获得.push(mm
        ? { name: mm[1].trim(), desc: mm[2].trim(), full: mm[2].trim(), count: cnt }
        : { name: t, desc: '随身所得之物。', full: '随身所得之物。', count: cnt });
    }
  }
  return out;
}
/** `<破处>` 的值 → `[{ 持有者, 破处者 }]`
 *  体例照「关系刻度」：条目之间用「｜」，条目内部用「、」。
 *  ⚠️ 认不出的持有者一律丢弃（不许拿正文外的名字记账）；写不成两个人的条目也丢。 */
function parseDeflowerBook(value) {
  const v = String(value ?? '').trim().replace(/[（(]\s*无\s*[）)]/g, '无');
  if (!v || v === '无' || v === '-' || v === '—' || /^none$/i.test(v)) return [];
  const out = [];
  for (const one of v.split(/[｜|；;\n]+/)) {
    const parts = one.split(/[、,，]+/).map((x) => x.trim()).filter(Boolean);
    if (parts.length < 2) continue;
    const holder = parts[0], who = parts[1];
    if (!HOLDER_TO_RELIC[holder]) continue;
    out.push({ 持有者: holder, 破处者: who });
  }
  return out;
}

function nearDeflowerWord(text, name) {
  const t = String(text ?? '');
  if (!t || !name) return '';
  const others = Object.keys(HOLDER_TO_RELIC).filter((h) => h !== name);
  /** 某个名字在正文里离命中点最近的一次距离 */
  const dist = (h, at) => {
    let d = Infinity, i = t.indexOf(h);
    while (i !== -1) { d = Math.min(d, Math.abs(i - at)); i = t.indexOf(h, i + h.length); }
    return d;
  };
  for (const [re, label] of DEFLOWER_HARD_RES) {
    const g = new RegExp(re.source, 'g');
    let m;
    while ((m = g.exec(t))) {
      const at = m.index;
      const dName = dist(name, at);
      /* ⚠️ 命中点离**别的持有者**更近 ⇒ 这不是这个人的现场。
       *    例：「叶红缨那一夜破了身，孤月在门外守着」—— 不许拿它替孤月开成形。 */
      if (dName <= 80 && !others.some((h) => dist(h, at) < dName)) return label;
      if (m.index === g.lastIndex) g.lastIndex += 1;      // 防零宽匹配死循环
    }
  }
  return '';
}

/* ── 状态条外壳：三种写法都认 ──
 *   ① `<Status_block> … </Status_block>`（现在的主格式）
 *   ② `<StatusBlock> … </StatusBlock>`
 *   ③ `<status> … </status>`
 * ⚠️ 一律用**惰性 ＋ `[\s\S]`** 取内容，保证**值里的换行不被吃掉**。
 * ⚠️ 外壳名必须是**非捕获组** —— 否则 `match()` 的第 1 组会变成标签名而不是内容。 */
const STATUS_TAG = '(?:Status_block|StatusBlock|status)';
const STATUS_OPEN_RE = new RegExp('<' + STATUS_TAG + '\\b[^>]*>', 'i');
const STATUS_PAIR_RE = new RegExp('<' + STATUS_TAG + '\\b[^>]*>([\\s\\S]*?)<\\/' + STATUS_TAG + '>', 'i');
const STATUS_STRIP_RE = new RegExp('<\\/?' + STATUS_TAG + '\\b[^>]*>', 'gi');
/** 正文里有没有状态条（三种外壳任一即可）—— 收尾自检用 */
function hasStatusBlock(text) {
  return STATUS_OPEN_RE.test(String(text ?? ''));
}
/** XML 式字段对：`<标签>值</标签>`。
 *  ⚠️ 值用 `[^<]*`：**保留换行**，又绝不可能越过下一个标签把正文吞掉。 */
const XML_PAIR_RE = /<([A-Za-z\u4e00-\u9fff][A-Za-z0-9\u4e00-\u9fff·・_\-]{0,24})>([^<]*)<\/\1>/g;

/* ── 在场角色子块（照抄外卡《大乾风华录 Ver2.0》的 extra_char_N）──────────
 * 外卡那六件套 favor_char／favor_stage／favor_aura／favor_reason／favor_mind／
 * favor_companion 折算成我们的五个中文标签：
 *   对象名＝<名>　关系阶段＝<阶段>　情况＝<情况>　心意缘由 ＋ 对方心中所想＝<心境>　对方此刻姿态＝<神态>
 * ⚠️ 最多 3 个（`<角色1>…<角色3>`）；`<角色1>无</角色1>` 表示这一档没人，不计数。
 * ⚠️ 英文标签（name／stage／aura／mind／demeanor）也认 —— 模型偶尔会回落成外卡写法。
 * ⚠️ 外层用**惰性 `[\s\S]*?` ＋ 反向引用配对的闭合标签**：既不会把外层整体吃掉，
 *    也不会让兄弟子块串味（`<角色1>…</角色1>` 绝不吃到 `<角色2>` 之后）。 */
const CAST_BLOCK_RE = /<角色\s*([0-9０-９一二三四五六七八九]+)\s*>([\s\S]*?)<\/角色\s*\1\s*>/g;
const CAST_FIELD_RE = /<(名|名称|name|对象|阶段|stage|情况|aura|心境|mind|心意缘由|reason|神态|demeanor|姿态|companion)>([^<]*)<\/\1>/g;
const CAST_KEYS = ['名', '阶段', '情况', '心境', '神态'];
/** 子块内的标签别名 → 我们五个规范键 */
const CAST_FIELD_ALIAS = {
  name: '名', 名称: '名', 对象: '名',
  stage: '阶段',
  aura: '情况',
  情况: '情况',
  mind: '心境', reason: '心境', 心意缘由: '心境',
  demeanor: '神态', companion: '神态', 姿态: '神态',
};
const CAST_MAX = 3;
const CAST_EMPTY_RE = /^[无無—\-]+$/;

/**
 * 从状态条内文里摘出全部 `<角色N>` 子块，聚合成数组。
 * @returns {{list:object[], rest:string, 空档:number}}
 *   · `list`：`[{ 序号, 名, 阶段, 情况, 心境, 神态 }, …]`，最多 3 个，全是空标签的档位不算
 *   · `rest`：**摘掉子块之后**的内文（顶层字段正则必须在这上面跑，否则子块里的 `<名>`
 *     会被「名器」栏的互相包含规则吃掉）
 * ⚠️ 用 `String.replace(正则, 函数)` 而不是替换串 —— 替换串里的 `$&`／`$'` 是特殊序列，
 *    传错会把内文写坏（本仓库铁律 26）。
 */
function parseCastBlocks(inner) {
  const list = [];
  let 空档 = 0;
  const rest = String(inner ?? '').replace(CAST_BLOCK_RE, (whole, no, body) => {
    const b = String(body ?? '').trim();
    if (!b || CAST_EMPTY_RE.test(b)) { 空档++; return '\n'; }
    const one = { 序号: String(no ?? '').trim(), 名: '', 阶段: '', 情况: '', 心境: '', 神态: '' };
    for (const mm of b.matchAll(CAST_FIELD_RE)) {
      const k = CAST_FIELD_ALIAS[mm[1]] || mm[1];
      const v = String(mm[2] ?? '').trim();
      if (CAST_KEYS.includes(k) && !one[k]) one[k] = v;
    }
    // 裸文本子块（模型没写内层标签，只丢了个名字）：整段当对象名，别丢信息
    if (!CAST_KEYS.some((k) => one[k]) && !b.includes('<')) one.名 = b;
    if (CAST_KEYS.some((k) => one[k])) list.push(one);
    else 空档++;
    return '\n';
  });
  return { list: list.slice(0, CAST_MAX), rest, 空档 };
}

/**
 * 从 AI 正文里抽状态条，**同时兼容两种写法**：
 *   ① 主格式（YAML 式）：`地点：墨山道·赤焰居` —— 全／半角冒号，标签前后可有空白，值为空记空串
 *   ② 备用格式（XML 式）：`<地点>墨山道·赤焰居</地点>`
 * 口径：**先逐行扫 `标签：值`；同一字段若没被扫到，再用 `<标签>值</标签>` 补**。
 * 两种写法的字段名都先做**别名归一**（见 FIELD_ALIAS），统一落到 stat_data 的规范键。
 * ⚠️ 行匹配正则与 `状态栏面板.js` **逐字同源**，两边口径必须一致：
 *    `^\s*([^：:]{1,14})[：:]\s*(.*)$`
 * @returns {{found:boolean, raw:string, fields:object, 进度:string[]|null, 里程碑:string[]|null, 未识别:string[], YAML行数:number, XML标签数:number, 在场角色:object[]}}
 *   · `fields` 按规范键归并（含 `身份`）
 *   · `在场角色` 是 `<角色N>` 子块聚合出来的数组（最多 3 个；没有子块就是空数组）
 *   · `进度` 为 null 表示**没有这一行／这个标签**；为 `[]` 表示写了「无」
 *   · `里程碑`（`<实际发生>`，玩家看不见的那一栏）同上：模型写出"本回合确实发生了"的锚点字段名，
 *     由 `applyMilestones()` **自动写进账本**（2026-09-29 主人选 B：不弹提示、不问玩家）
 *   · `未识别` 是没归进面板的标签（排障用）
 */
function parseStatusBlock(text) {
  const out = { found: false, raw: '', fields: {}, 进度: null, 里程碑: null, 破处: null, 纳戒: null, 名器互动: null, 未识别: [], YAML行数: 0, XML标签数: 0, 在场角色: [] };
  const t = String(text ?? '');
  const m = t.match(STATUS_PAIR_RE);
  let inner = null;
  if (m) {
    inner = m[1];
  } else if (STATUS_OPEN_RE.test(t)) {
    // 只开了没闭（多半被截断）—— 取开标签之后的全部内容，尽力解析
    const at = t.search(STATUS_OPEN_RE);
    inner = t.slice(at).replace(/^<[^>]*>/, '');
    console.warn(TAG, '[状态条] 只有开标签没有闭标签（多半是回复被截断），按「尽力解析」处理');
  }
  if (inner === null) return out;
  out.found = true;
  out.raw = inner;
  inner = inner.replace(STATUS_STRIP_RE, '');   // 去掉可能嵌套的 status 外壳

  // ⓪ **先**把 `<角色N>` 子块整块摘走（子块里的 `<名>` 会与「名器」栏互相包含）
  const cast = parseCastBlocks(inner);
  inner = cast.rest;
  out.在场角色 = cast.list;
  if (cast.list.length || cast.空档) {
    console.log(TAG, `[状态条] 在场角色子块：解析出 ${cast.list.length} 个要角`
      + (cast.空档 ? `（另有 ${cast.空档} 档写「无」）` : '')
      + (cast.list.length ? ` —— ${cast.list.map((c) => c.名 || '未具名').join('、')}` : ''));
  }

  // ① 主格式：XML 式 `<标签>值</标签>`
  //   2026-09-27 升为主格式：边界明确（值里换行不会被下一行吃掉），且外卡《大乾风华录》全卡走 XML 已被实践验证。
  for (const mm of inner.matchAll(XML_PAIR_RE)) {
    const label = mm[1];
    const value = String(mm[2] ?? '').trim();
    if (isProgressLabel(label)) {
      if (out.进度 === null) out.进度 = parseProgress(value);
      out.XML标签数++;
      continue;
    }
    if (isMilestoneLabel(label)) {
      if (out.里程碑 === null) out.里程碑 = parseMilestones(value);
      out.XML标签数++;
      continue;
    }
    if (isDeflowerLabel(label)) {
      if (out.破处 === null) out.破处 = parseDeflowerBook(value);
      out.XML标签数++;
      continue;
    }
    if (isNadeLabel(label)) {
      if (out.纳戒 === null) out.纳戒 = parseNade(value);
      out.XML标签数++;
      continue;
    }
    if (isRelicActionLabel(label)) {
      if (out.名器互动 === null) out.名器互动 = [];
      const act = parseRelicAction(value);
      if (act) out.名器互动.push(act);
      out.XML标签数++;
      continue;
    }
    const key = matchField(label);
    if (!key) { if (!out.未识别.includes(label)) out.未识别.push(label); continue; }
    if (out.fields[key] === undefined) out.fields[key] = value;
    out.XML标签数++;
  }

  // ② 兼容格式：YAML 式「标签：值」逐行扫（XML 已写过的字段不覆盖）
  for (const line of inner.split(/\r?\n/)) {
    const mm = line.match(/^\s*([^：:]{1,14})[：:]\s*(.*)$/);
    if (!mm) continue;
    const label = mm[1].trim();
    let value = mm[2].trim();
    if (value === '—' || value === '-') value = '';        // 破折号 ＝「空」，与面板同口径
    if (isProgressLabel(label)) {
      if (out.进度 === null) out.进度 = parseProgress(value);
      out.YAML行数++;
      continue;
    }
    if (isMilestoneLabel(label)) {
      if (out.里程碑 === null) out.里程碑 = parseMilestones(value);
      out.YAML行数++;
      continue;
    }
    if (isDeflowerLabel(label)) {
      if (out.破处 === null) out.破处 = parseDeflowerBook(value);
      out.YAML行数++;
      continue;
    }
    if (isNadeLabel(label)) {
      if (out.纳戒 === null) out.纳戒 = parseNade(value);
      out.YAML行数++;
      continue;
    }
    if (isRelicActionLabel(label)) {
      if (out.名器互动 === null) out.名器互动 = [];
      const act = parseRelicAction(value);
      if (act) out.名器互动.push(act);
      out.YAML行数++;
      continue;
    }
    const key = matchField(label);
    if (key) { if (out.fields[key] === undefined) out.fields[key] = value; out.YAML行数++; }   // XML 已写过就不覆盖
    else out.未识别.push(label);
  }

  // ③ 漏闭合或截断回退：行内单标签防护（防越界吞噬下一 XML 字段）
  if (out.名器互动 === null) {
    const unclosedM = inner.match(/<名器互动>([^<>\r\n]+)(?:<\/名器互动>|(?=<)|$)/i);
    if (unclosedM) {
      const act = parseRelicAction(unclosedM[1]);
      if (act) out.名器互动 = [act];
    }
  }

  return out;
}

/** 2026-10-08（gpt 04 号①）：把「<实际发生> 申报 → 已校验锚点」这一段抽成**纯函数**。
 *  记账（applyMilestones）与推进（checkFastForwardStage 用到的 knownAhead）**共用同一份结果**，
 *  不再各自解读原始申报。纯函数、无副作用，可离线抠出单测。 */
/** 2026-10-08（主人当面指定）：**名器成形的前置** —— 持有者必须先被破身，否则不成形。
 *  依据：字段表里每条 `X处女丧失` 的 desc 原文，例：
 *    · 「叶红缨处女丧失 · 灼酒流炎穴的持有者被破身」
 *    · 「楚灵夜后窍开发 …与『楚灵夜处女丧失』同时为真，般若菩提菊才成形」
 *    · 「苏瑶处女丧失 · …与苏玲两个都丧失，灵犀同心才成形」
 *  ⇒ 写入侧（记账）此前没有这条校验，所以模型在 <实际发生> 里写一句「X成形」就能解锁
 *    （2026-10-08 真机事故：与苏瑶的戏里解锁了**慕容清歌**的「清歌弦鸣穴」）。
 *  **例外**：烟霞灵乳（昨日欢）没有「成形」这一步（持有者出场即二境、反色、占据者阎雷子），
 *    其条目由 `known['阎雷子脱困']` 注入 ⇒ 本表不收它。 */
