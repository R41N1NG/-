/* ═══════════════════════════════════════════════════════════
 * 十 · 玩家命令
 * ═══════════════════════════════════════════════════════════ */

const HELP = [
  '已知          —— 打印当前 known 表（以下命令**一律不带斜杠**）',
  '锚点          —— 列出全部锚点字段与说明',
  '解锁 <字段>   —— 手工翻开一个锚点（平时用不到：剧情走到时模型会自己在状态栏里记）',
  '回锁 <字段>   —— 撤销解锁',
  '身份          —— 列出身份清单；身份 <名字> 热切换（穿书模式）',
  '物品          —— 打印纳戒清单（行囊／纳戒同义）',
  '获得物品 <物品名> [简述] [详述] —— 手工把一件东西收进纳戒',
  '消耗物品 <物品名> —— 喝掉／用掉／丢掉一件东西，从纳戒里移除（面板里那条提示指的就是它）',
  '验收          —— 现场体检：物品数量、后台时点与状态栏时间、成形锚点有无破身证据（体检／自检同义）',
  '刷新开场白    —— 把第 0 楼的开场白按当前角色卡重刷（旧聊天看到的是开聊天时烧下的旧文案）',
].join('\n');

/* ⚠️ 2026-10-06：`/物品`／`/获得物品`／`/消耗物品` 三组处理器早就写在 `handleUserCommand` 里，
 *   可这份名单一直没收录它们 ⇒ `parseCommand` 在最后一步 `return null`，玩家照着面板提示
 *   发「消耗物品 醉春风」**一点反应都没有**（面板 line 1803 就是这么教玩家的）。
 *   名单补齐即通；不带斜杠时仍受「只能一个参数」那条从严规则约束。 */
const CMD_NAMES = [
  '撤销','已知', '锚点', '帮助', 'help', '解锁', '回锁', '身份', '设段', '继承', '读档', '刷新开场白', '刷新',
  '物品', '行囊', '纳戒', '获得物品', '添加物品', '消耗物品', '移除物品', '丢弃物品',
  '验收', '体检', '自检'];

/**
 * 剧情里程碑与特征词映射表（按段位从高到低排列，用于大总结智能识别）
 */
const STAGE_MILESTONES = [
  { stage: 15, kws: ['雀奴', '灼酒流炎穴二阶段', '彻底臣服'] },
  { stage: 14, kws: ['洞府调教', '相思豆', '赤羽沉沦', '残阳洞府'] },
  { stage: 13, kws: ['赤羽堕凡尘', '灼酒流炎穴成形', '孕炎乳', '破身'] },
  { stage: 12, kws: ['朱樱逢劫', '封元镇灵环暴露', '乳环暴露', '赵无忧坠渊', '坠入葬魔渊'] },
  { stage: 11, kws: ['天溪城破', '巨猿破城', '西南城破', '城池陷落'] },
  { stage: 10, kws: ['双姝回归', '魅骨生香', '安神香'] },
  { stage: 9, kws: ['血染天溪', '夜间失控', '越界温存', '赵无忧看见乳环'] },
  { stage: 8, kws: ['灵犀同心', '日月同辉', '双姝被困'] },
  { stage: 7, kws: ['兽潮血战', '玄机子装伤', '天溪城血战'] },
  { stage: 6, kws: ['初入天溪', '听雪双姝登场', '天音阁防区'] },
  { stage: 5, kws: ['孤剑崖送别', '赠送冰心泪', '孤月定情'] },
  { stage: 4, kws: ['南域大劫', '神诅', '天姝会成立'] },
  { stage: 3, kws: ['幽寂谷秘境', '幽寂谷历练', '玄机子胁迫过叶红缨'] },
  { stage: 2, kws: ['邪修洞府', '解毒救孤月', '极乐引入手', '口含阴津'] },
  { stage: 1, kws: ['墨山道', '墨山七贤'] }
];

/**
 * 智能检测文本是否包含新开对话的历史大总结
 * @param {string} text 用户输入文本
 * @param {number} messageId 消息楼号
 * @returns {{isInherited: boolean, targetStage: number, summaryText: string}|null}
 */
function detectInheritance(text, messageId) {
  const t = String(text || '').trim();
  if (!t) return null;

  // 0. 优先支持显式纯数字或短段位指令（如 "11"、"第11段"、"/继承 11"、"继承 11"、"/读档 11"）
  const numOnlyMatch = /^[\/／]?(?:继承|读档|恢复)?\s*(?:第)?\s*([一二三四五六七八九十\d]+)\s*(?:段|阶段)?$/i.exec(t);
  const CN_MAP = { 一:1, 二:2, 三:3, 四:4, 五:5, 六:6, 七:7, 八:8, 九:9, 十:10, 十一:11, 十二:12, 十三:13, 十四:14, 十五:15, 十六:16 };
  if (numOnlyMatch) {
    const raw = numOnlyMatch[1];
    let n = parseInt(raw, 10);
    if (isNaN(n) && CN_MAP[raw]) n = CN_MAP[raw];
    if (n >= 1 && n <= STAGE_STEPS.length) {
      return {
        isInherited: true,
        targetStage: n,
        summaryText: `显式继承至第 ${n} 段`
      };
    }
  }

  // 被动文本/总结文本检测：过滤过短文本
  if (t.length < 5) return null;

  // 1. 显式命令或显式前缀标识
  const hasExplicitTag = /(?:^\s*[\/／](?:继承|读档|恢复)|【(?:承接|继承|大总结|前情提要|前情回顾|存档|历史进度|接上把|接上回|转场继承)】|承接上一[把局段回篇]|接上一[把局段回篇]|前情继承|新开承接|重开承接|<阶段总结>|<结算>)/i.test(t);

  // 2. 检查是否包含显式段位号声明 (例: 第11段 / 段位11 / 阶段:11)
  const stageNumMatch = /(?:第\s*([一二三四五六七八九十\d]+)\s*段|段位\s*[:：]?\s*([一二三四五六七八九十\d]+)|阶段\s*[:：]?\s*([一二三四五六七八九十\d]+)|承接第\s*([一二三四五六七八九十\d]+))/i.exec(t);

  let explicitStage = 0;
  if (stageNumMatch) {
    const raw = stageNumMatch[1] || stageNumMatch[2] || stageNumMatch[3] || stageNumMatch[4];
    explicitStage = parseInt(raw, 10);
    if (isNaN(explicitStage) && CN_MAP[raw]) explicitStage = CN_MAP[raw];
  }

  // 3. 统计命中的里程碑
  let inferredStage = 0;
  let hitMilestoneCount = 0;
  for (const item of STAGE_MILESTONES) {
    const hit = item.kws.some(k => t.includes(k));
    if (hit) {
      hitMilestoneCount++;
      if (item.stage > inferredStage) inferredStage = item.stage;
    }
  }

  // 4. 防冲突判定：
  // 必须是：显式标识 或 (低楼层 <= 3 且 (有显式段位号 或 命中至少2个中后期里程碑且段位>=3))
  const isEarlyFloor = (Number(messageId) <= 3);
  /* 2026-10-08（gpt 04 号②）：**隐式检测一律不写盘**。
     旧写法把「低楼层（≤3）＋ 命中 2 个中后期里程碑」判成继承，玩家一句
     「本次开局不继承旧档，我还没遇到兽潮血战，也没有经历天溪城破」就命中 2 个 ⇒ 被判成继承第 11 段，
     写进 5 项 known 并把日期写到 1579 三月。特征检测不识别事实语义，不能据它改档。
     ⇒ 隐式分支降级为**只给建议**（打日志、不动盘）；只有**显式标识／显式命令**才算请求。 */
  const 隐式嫌疑 = !hasExplicitTag && (isEarlyFloor && (explicitStage > 1 || (hitMilestoneCount >= 2 && inferredStage >= 3)));
  if (隐式嫌疑) {
    console.warn(TAG, `⛔ [继承·只建议] 第 ${messageId} 楼疑似继承文案（命中 ${hitMilestoneCount} 个里程碑／显式段位号 ${explicitStage}），` +
      '但**没有显式继承标识** ⇒ 不改档、不写 known、不改日期。要真的继承请发「/继承 <段位>」或加【承接】／【大总结】一类标识。');
  }

  if (!hasExplicitTag) return null;

  const finalStage = Math.max(1, Math.min(STAGE_STEPS.length, explicitStage || inferredStage || 1));
  return {
    isInherited: true,
    targetStage: finalStage,
    summaryText: t.replace(/^[\/／]?(?:继承|读档|恢复)\s*/, '').trim()
  };
}

/**
 * 应用继承存档：设置段位基准、激活历史锚点、持久化阶段总结
 */
async function applyInheritedArchive(text, messageId, ports = {}) {
  const inh = detectInheritance(text, messageId);
  if (!inh) return { ok: false, why: '未识别到大总结或段位特征' };

  const targetStage = inh.targetStage;
  const summaryText = inh.summaryText;
  const shift = STAGE_BASE[targetStage - 1] - messageId;

  // 自动从总结文本中推导并恢复已解锁的历史锚点
  /* 2026-10-08（gpt 04 号②）：锚点恢复要过**事实语义 + 实证**两道，不能「关键词包含即置真」，
     更不能「按段位补」（旧写法 targetStage>=6 无条件补「已抵达天溪」）。
     ⇒ 关键词命中后仍过 anchorEvidenceIn（含否定窄闸）；落空的一律不写盘并记日志。 */
  const patchKnown = {};
  for (const f of ALL_FIELDS) {
    const kws = ANCHOR_KEYWORDS[f] || [];
    if (!kws.some(k => summaryText.includes(k))) continue;
    const ev = anchorEvidenceIn(summaryText, f);
    if (!ev.ok) {
      console.warn(TAG, `⛔ [继承·锚点] 第 ${messageId} 楼不恢复「${f}」：${ev.why}`);
      continue;
    }
    patchKnown[f] = true;
  }

  const patch = {
    [FLOOR_PIN]: { floor: messageId, shift },
    段位: targetStage,
    仙盟历: SEG_TIME[targetStage - 1],
    仙盟历文: fmtXianmeng(SEG_TIME[targetStage - 1]),
    窗口起点: 0,
    时点加速: 0,
    结算待办: 0,
    总结待办: 0,
    阶段总结: summaryText
  };
  if (Object.keys(patchKnown).length) {
    patch.known = patchKnown;
  }

  const r = await (ports.writeStat || writeStat)(patch, `识别大总结：继承至第 ${targetStage} 段`);
  if (!r || !r.ok) {
    console.warn(TAG, `❌ [继承存档] writeStat 写入失败：${(r && r.why) || '未知原因'}`);
    return { ok: false, why: (r && r.why) || '变量写入失败' };
  }
  console.log(TAG, `🎉 [继承存档] 第 ${messageId} 楼成功识别大总结！已平移至第 ${targetStage} 段（仙盟历 ${patch.仙盟历文}），恢复锚点 ${Object.keys(patchKnown).length} 个`);
  return { ok: true, targetStage, anchorCount: Object.keys(patchKnown).length };
}

/**
 * 解析一条玩家命令（**参数容错**与旧版一致，另加：斜杠可省、中英文空白都认、全角冒号也行）。
 * @returns {{cmd:string, arg:string}|null} 不是命令就返回 null
 */
function parseCommand(text) {
  const raw = String(text ?? '').trim();
  if (!raw) return null;
  const withSlash = raw.startsWith('/') || raw.startsWith('／');
  const body = withSlash ? raw.slice(1).trim() : raw;
  const isInheritCmd = /^(?:继承|读档)(?:[\s\u3000:：]|$)/.test(body);
  if (!isInheritCmd && raw.length > 40) return null;
  const parts = body.split(/[\s\u3000]+/).filter(Boolean);   // 半角空格 / Tab / 全角空格
  if (!parts.length) return null;

  let cmd = parts[0];
  const args = parts.slice(1);
  const colon = cmd.match(/^([^：:]+)[：:](.*)$/);            // /解锁：封元镇灵环
  if (colon) { cmd = colon[1]; if (colon[2]) args.unshift(colon[2]); }
  cmd = cmd.replace(/[「」"']/g, '');
  if (!CMD_NAMES.includes(cmd)) return null;
  // 不带斜杠时从严：整条消息只能是「命令词 [一个参数]」，避免把普通台词当命令（继承命令除外）
  if (!withSlash && !isInheritCmd && args.length > 1) return null;
  const arg = isInheritCmd ? body.slice(cmd.length).trim().replace(/^[:：]\s*/, '') : String(args[0] ?? '').replace(/[「」"']/g, '');
  return { cmd: '/' + cmd, arg };
}

function dumpKnown(where) {
  const k = readKnown();
  if (k === null) {
    console.warn(TAG, `[${where}] 读不到 known —— 变量表里还没有 stat_data（等一拍再试，或看 __xsdWho()）`);
    return null;
  }
  const on = ALL_FIELDS.filter((f) => k[f] === true);
  const missing = ALL_FIELDS.filter((f) => !(f in k));
  console.log(TAG, `[${where}] known ${Object.keys(k).length} 字段，已解锁 ${on.length}：${on.length ? on.join('、') : '（无）'}`);
  if (missing.length) console.warn(TAG, `[${where}] ⚠️ 缺失字段（初始化没跑到？）：${missing.join('、')}`);
  return k;
}

/** 处理玩家命令；返回 true 表示这是一条命令（调用方会把它从上下文里藏掉） */
async function handleUserCommand(text, messageId) {
  const p = parseCommand(text);
  if (!p) return false;
  console.log(TAG, `[命令] ${p.cmd}${p.arg ? ' ' + p.arg.slice(0, 20) : ''}（第 ${messageId} 楼）`);

  if (p.cmd === '/已知') { dumpKnown('命令'); toast('info', '已知表已打到控制台（F12）', 5000); return true; }

  if (p.cmd === '/刷新开场白' || p.cmd === '/刷新') {
    const r = await refreshGreetings();
    console.log(TAG, r.ok ? '✅ 已刷新' : '❌ 未刷新（看上面那行原因）');
    toast(r.ok ? 'info' : 'warning', r.ok ? `开场白已刷新（${r.count} 条，停在第 ${r.idx} 条）` : '开场白未刷新，看控制台原因', 8000);
    return true;
  }

  if (p.cmd === '/身份') {
    console.log(TAG, `当前身份：${readIdentity() ?? '未设'}｜阵营：${readFaction() ?? '未设'}`);
    if (!p.arg) {
      for (const it of IDENTITIES) console.log(`  · ${it.name}  —— ${it.desc}`);
      console.log(TAG, '切身份：不带斜杠发「身份 <名字>」（下一回合的闸门生效）');
      toast('info', `当前身份：${readIdentity() ?? '未设'}`, 6000);
      return true;
    }
    const r = await writeIdentity(p.arg);
    if (r.ok) {
      const e = r.entries
        ? `，身份条目已切到「${p.arg}」（世界书 ${r.entries.wb}，改动 ${r.entries.changed} 条）`
        : '（身份条目未找到，闸门仍生效）';
      console.log(TAG, `✅ 身份已切换为「${p.arg}」／阵营「${r.faction}」（via ${r.via}）${e} —— 下一回合生效`);
      toast('info', `身份：${p.arg}`, 8000);
    } else {
      console.warn(TAG, `❌ 切换失败：${r.why}`);
      toast('warning', `切换失败：${r.why}`, 8000);
    }
    return true;
  }

  if (p.cmd === '/锚点' || p.cmd === '/帮助' || p.cmd === '/help') {
    console.log(TAG, '锚点清单：');
    for (const f of ALL_FIELDS) {
      const kind = AI_FIELDS.includes(f) ? '剧情可推进' : '起手公开';
      console.log(`  · ${f}  [${kind}]  ${FIELD_DESC[f] ?? ''}`);
    }
    console.log(TAG, HELP);
    toast('info', '锚点清单已打到控制台（F12）', 5000);
    return true;
  }

  if (p.cmd === '/设段') {
    const n = parseInt(p.arg, 10);
    if (!(n >= 1 && n <= STAGE_STEPS.length)) {
      console.warn(TAG, `用法：不带斜杠发「设段 <1-${STAGE_STEPS.length}>」——把当前进度拨到第 N 段的起点（之后仍照楼层往下走）`);
      toast('warning', `用法：设段 <1-${STAGE_STEPS.length}>`, 8000);
      return true;
    }
    const shift = STAGE_BASE[n - 1] - messageId;
    const r = await writeStat({ [FLOOR_PIN]: { floor: messageId, shift }, 段位: n, 窗口起点: 0, 时点加速: 0, 结算待办: 0 }, `设段 ${n}`, true);
    console.log(TAG, `✅ 段位已拨到第 ${n} 段（第 ${messageId} 楼 ⇒ 时间轴平移 ${shift} 楼）via ${(r && r.via) || '?'}`);
    toast('info', `段位 → 第 ${n} 段`, 6000);
    return true;
  }

  if (p.cmd === '/继承' || p.cmd === '/读档') {
    if (!p.arg) {
      console.warn(TAG, '用法：发「/继承 <大总结文本或段位号>」——自动继承历史进度并平移时间轴');
      toast('warning', '用法：/继承 <大总结文本或段位号>', 8000);
      return true;
    }
    const r = await applyInheritedArchive(p.arg, messageId);
    if (r && r.ok) {
      toast('info', `✅ 成功继承至第 ${r.targetStage} 段！大总结已载入记忆`, 8000);
    } else {
      toast('warning', `继承未完成：${(r && r.why) || '未识别到有效段位或剧情'}`, 8000);
    }
    return true;
  }

  if (p.cmd === '/解锁' || p.cmd === '/回锁') {
    if (!p.arg) {
      console.warn(TAG, `用法：不带斜杠发「${p.cmd.replace("/", "")} <字段>」（发「锚点」查清单）`);
      toast('warning', `用法：不带斜杠发「${p.cmd.replace("/", "")} <字段>」（发「锚点」查清单）`, 8000);
      return true;
    }
    // 身份／阵营是特殊项：不走 /解锁，走 /身份
    if (p.arg === '身份') {
      console.warn(TAG, '⚠️ 「身份」不是 /解锁 能开的字段 —— 请发「身份 <名字>」（不带斜杠），或点第 0 楼的菜单');
      toast('warning', '身份请发「身份 <名字>」（或点第 0 楼菜单）', 8000);
      return true;
    }
    if (p.arg === '阵营') {
      console.warn(TAG, '⚠️ 「阵营」随身份自动写，不单独解锁 —— 请发「身份 <名字>」（不带斜杠）');
      toast('warning', '阵营随身份自动写，请发「身份 <名字>」', 8000);
      return true;
    }
    /* /回锁 <名器名>（不带后缀）＝**整件退回**：把「<名器>成形」与四个阶段条一起退回。
       为什么要它：只退「成形」时面板仍会亮纹章 —— 判据里「任一阶段条为真」也算成形，
       而脚本在成形时会自动派发一阶段条（玩家反馈「这个关不了好像」就是这个）。 */
    if (p.cmd === '/回锁') {
      const baseRelic = String(p.arg).replace(/[「」\s]/g, '');
      if (baseRelic && ALL_FIELDS.includes(baseRelic + '成形')) {
        const targets = [baseRelic + '成形'];
        for (const cn of ['一', '二', '三', '四']) { const fx = baseRelic + cn + '阶段'; if (ALL_FIELDS.includes(fx)) targets.push(fx); }
        const patchKnown = {};
        for (const fx of targets) patchKnown[fx] = false;
        const rr = await writeStat({ known: patchKnown }, `整件退回 ${baseRelic}`, true);
        if (rr && rr.ok) {
          console.log(TAG, `↩ ${baseRelic} 整件已退回（${targets.length} 条）：${targets.join('、')} —— 下一回合生效`);
          toast('info', `${baseRelic} 整件已退回`, 8000);
        } else {
          console.warn(TAG, `整件退回失败：${(rr && rr.why) || '写入接口不可用'}`);
          toast('warning', `整件退回失败：${(rr && rr.why) || '写入接口不可用'}`, 8000);
        }
        setTimeout(() => dumpKnown('整件退回后'), 200);
        return true;
      }
    }

    const val = p.cmd === '/解锁';
    const r = await writeKnownField(p.arg, val);
    if (r.ok) {
      /* 记一笔「最近解锁」——供 /撤销 一键回退（玩家打错字时不必背字段名） */
      if (val) { try { await writeStat({ 最近解锁: p.arg }, '记录最近解锁'); } catch (e) { /* 记账失败不影响解锁 */ } }
      console.log(TAG, `✅ ${p.arg} = ${val}（via ${r.via}）—— 下一回合生效`);
      toast('info', `${p.arg} = ${val}`, 6000);
      setTimeout(() => dumpKnown('写入后'), 200);
    } else {
      console.warn(TAG, `❌ 写入失败：${r.why}`);
      toast('warning', `写入失败：${r.why}`, 8000);
    }
    return true;
  }

  if (p.cmd === '/撤销') {
    const sdU = readStatData() || {};
    const lastU = String(sdU.最近解锁 || '').trim();
    if (!lastU || !ALL_FIELDS.includes(lastU)) {
      console.log(TAG, '没有可撤销的解锁（「最近解锁」是空的）—— 先用 /已知 看已经翻了哪些，再 /回锁 <字段>');
      toast('warning', '没有可撤销的解锁（可用 /已知 查看）', 7000);
      return true;
    }
    const rU = await writeKnownField(lastU, false);
    if (rU.ok) {
      try { await writeStat({ 最近解锁: '' }, '清空最近解锁'); } catch (e) { /* 忽略 */ }
      console.log(TAG, '↩ 已撤销：' + lastU + ' 退回未解锁（下一回合生效）');
      toast('info', '已撤销：' + lastU, 8000);
      setTimeout(() => dumpKnown('撤销后'), 200);
    } else {
      console.warn(TAG, '撤销失败：' + rU.why);
      toast('warning', '撤销失败：' + rU.why, 8000);
    }
    return true;
  }
  if (p.cmd === '/物品' || p.cmd === '/行囊' || p.cmd === '/纳戒') {
    const sd = readStatData() || {};
    const inv = normalizeInventory(Array.isArray(sd.inventory) ? sd.inventory : defaultInventoryFor(sd.身份));
    console.log(TAG, `【纳戒物品清单】共 ${inv.length} 种：`);
    inv.forEach((it, i) => console.log(`  [${i + 1}] ${it.name} ×${it.count} —— ${it.desc || '无描述'}\n      详述：${it.full || it.desc || '无'}`));
    toast('info', `纳戒中共有 ${inv.length} 种随身物品（F12控制台可查详情）`, 6000);
    return true;
  }

  
  if (p.cmd === '/验收' || p.cmd === '/体检' || p.cmd === '/自检') {
    const sd = readStatData() || {};
    const out = [];
    let bad = 0;
    const put = (ok, msg) => { out.push(`${ok ? '✔' : '✘'} ${msg}`); if (!ok) bad += 1; };

    /* ① 物品：数量与账本自洽 */
    const inv = normalizeInventory(sd.inventory);
    const badCount = inv.filter((it) => !(it.count >= 1) || !Number.isInteger(it.count));
    put(badCount.length === 0, `物品数量都是 ≥1 的整数（共 ${inv.length} 种：${inv.map((x) => x.name + '×' + x.count).join('、') || '空'}）`);
    const log = (sd.纳戒账本 && typeof sd.纳戒账本 === 'object') ? sd.纳戒账本 : {};
    const floors = Object.keys(log).filter((k) => /^\d+$/.test(k));
    out.push(`  纳戒账本记了 ${floors.length} 笔${floors.length ? '（第 ' + floors.slice(-5).join('、') + ' 楼）' : ''}`);

    /* ② 后台时点 vs 最近一楼状态栏里的 <时间> */
    const behind = String(sd.仙盟历文 || sd.仙盟历 || '').trim();
    let lastAi = '';
    for (let i = Math.max(0, messageId - 1); i >= 0 && i > messageId - 6; i -= 1) {
      let t = '';
      try { t = String(messageText(i) || ''); } catch (e) { t = ''; }
      if (t && !t.includes('/验收')) { lastAi = t; break; }
    }
    const wroteTime = (lastAi.match(/<时间>([\s\S]*?)<\/时间>/) || [])[1] || '';
    const same = !behind || !wroteTime
      || ((behind.match(/(\d{3,4})\s*年/) || [])[1] === (wroteTime.match(/(\d{3,4})\s*年/) || [])[1]
        && (behind.match(/(正月|冬月|腊月|闰?[一二三四五六七八九十]{1,2}月)/) || [])[1] === (wroteTime.match(/(正月|冬月|腊月|闰?[一二三四五六七八九十]{1,2}月)/) || [])[1]);
    put(same, `时点照抄：后台「${behind || '（没有）'}」／状态栏「${String(wroteTime).trim() || '（没读到）'}」`);

    /* ③ 成形锚点：翻真的必须带破身证据 */
    const kn = (sd.known && typeof sd.known === 'object') ? sd.known : {};
    const book = (sd.破处者 && typeof sd.破处者 === 'object') ? sd.破处者 : {};
    for (const fo of FORM_OF_HOLDERS) {
      const anchor = fo.form;
      if (kn[anchor] !== true) continue;
      const ok = fo.holders.some((h) => Boolean(book[h]) || kn[h + '处女丧失'] === true);
      put(ok, `${anchor} 已成形，${ok ? '有' : '**没有**'}破身证据（${fo.holders.join('／')}）`);
    }
    out.push(`  段位：${sd.段位 === undefined ? '（没设）' : sd.段位}｜身份：${sd.身份 || '（没设）'}`);

    const title = bad === 0 ? `✅ 体检通过（${out.filter((x) => /^[✔✘]/.test(x)).length} 项）` : `❌ 体检有 ${bad} 项不过`;
    const text = `【仙姝堕·现场体检】${title}\n` + out.join('\n') + `\n（时间：${new Date().toLocaleString()}）`;
    console.log(TAG, text);
    try {
      for (const line of out.slice(0, 6)) console.log('  ' + line);
    } catch (e) { /* 忽略 */ }
    toast(bad === 0 ? 'info' : 'warning', title.replace(/[（(].*$/, '') + '｜详情见变量「验收报告」', 10000);
    const r = await writeStat({ 验收报告: text }, '现场体检');
    if (r && r.ok) console.log(TAG, `✅ 体检报告已写进变量，可在下一条聊天记录里读出（via ${r.via}）`);
    else console.warn(TAG, `⚠️ 体检报告写盘失败：${(r && r.why) || '接口不可用'}（控制台里仍有全量）`);
    return true;
  }

  if (p.cmd === '/获得物品' || p.cmd === '/添加物品') {
    if (!p.arg) {
      toast('warning', '用法：/获得物品 <物品名> [数量] [简述] [详述]', 6000);
      return true;
    }
    const parts = p.arg.split(/\s+/);
    const itName = parts[0];
    const maybeN = /^\d+$/.test(parts[1] || '') ? Math.max(1, parseInt(parts[1], 10)) : 1;
    const rest = /^\d+$/.test(parts[1] || '') ? parts.slice(2) : parts.slice(1);
    const itDesc = rest[0] || '随身所得之物。';
    const itFull = rest.slice(1).join(' ') || itDesc;
    const sd = readStatData() || {};
    let inv = normalizeInventory(Array.isArray(sd.inventory) ? sd.inventory : defaultInventoryFor(sd.身份));
    const r = applyItemChange(inv, { kind: 'gain', name: itName, count: maybeN, desc: itDesc, full: itFull });
    inv = r.inv;
    await writeStat({ inventory: inv }, `获得物品「${itName}」×${r.applied}`);
    toast('info', `已将「${r.name}」×${r.applied} 收入纳戒`, 5000);
    return true;
  }

  if (p.cmd === '/消耗物品' || p.cmd === '/移除物品' || p.cmd === '/丢弃物品') {
    if (!p.arg) {
      toast('warning', '用法：/消耗物品 <物品名> [数量]（不写数量按 1 计）', 6000);
      return true;
    }
    const parts = p.arg.trim().split(/\s+/);
    const itName = parts[0];
    const n = /^\d+$/.test(parts[1] || '') ? Math.max(1, parseInt(parts[1], 10)) : 1;
    const sd = readStatData() || {};
    const inv0 = normalizeInventory(Array.isArray(sd.inventory) ? sd.inventory : defaultInventoryFor(sd.身份));
    const r = applyItemChange(inv0, { kind: 'loss', name: itName, count: n });
    if (!r.ok) {
      toast('warning', `纳戒中未找到「${itName}」`, 5000);
      return true;
    }
    await writeStat({ inventory: r.inv }, `消耗物品「${r.name}」×${r.applied}`);
    const left = r.inv.find((x) => x.name === r.name);
    toast('info', `已消耗「${r.name}」×${r.applied}${left ? `，还剩 ${left.count}` : '，已用尽并移出纳戒'}`, 6000);
    console.log(TAG, `[命令] 消耗「${r.name}」×${r.applied}（${r.note}）`);
    return true;
  }
  return false;
}

/**
 * 命令不该进模型上下文 ⇒ 把这条用户消息**隐藏**掉（酒馆里隐藏的楼层不参与生成）。
 * ⚠️ `MESSAGE_SENT` 是在消息 push 进聊天之后、`addOneMessage` 之前触发的，
 *    所以这里延后一拍再动手，避免和正在进行的渲染打架。
 * ⚠️ 失败了也不致命：只是那条命令文本会跟着进上下文，console 会给一条警告。
 */
function swallowCommandMessage(messageId) {
  if (!API.setChatMessages) {
    console.warn(TAG, '[命令] 没有 setChatMessages，命令楼藏不掉（命令文本会进上下文）');
    return;
  }
  /* ⚠️ v1.5（2026-09-28）：**藏完必须回读验证**。
   *   原实现只管调 `setChatMessages({is_hidden:true})`，成没成只能靠 promise 不抛错；
   *   若那一刻楼层还没写进聊天（或 JSR 还没就绪），它会**静默失败**，而命令文本照旧进上下文
   *   —— 而 `/已知` 这条命令一旦进上下文，等于把 13 个锚点全名每轮喂给模型一遍。 */
  const readHidden = () => {
    try {
      const m = API.getChatMessages(messageId, { include_swipes: false });
      const one = Array.isArray(m) ? m[0] : m;
      return !!(one && one.is_hidden === true);
    } catch (e) { return null; }                                // 回读不了 ⇒ 认不出成败
  };
  const attempt = (n) => {
    try {
      const ret = API.setChatMessages([{ message_id: messageId, is_hidden: true }], { refresh: 'affected' });
      const done = () => {
        const okv = readHidden();
        if (okv === true) {
          console.log(TAG, `✅ [命令] 第 ${messageId} 楼已隐藏并**回读确认**（命令不会进上下文）`
            + `${n > 1 ? `（第 ${n} 次尝试）` : ''}`);
          return;
        }
        if (n < 3) { setTimeout(() => attempt(n + 1), 220); return; }
        console.warn(TAG, `⚠️ [命令] 第 ${messageId} 楼隐藏后**回读仍不是 is_hidden**（尝试 ${n} 次）`
          + ' —— 这条命令文本可能会进上下文。请在聊天里确认该楼是否还在；'
          + '若反复如此，把控制台这几行发我，我改成「不吞楼」的 v0.7 行为。');
      };
      if (ret && typeof ret.then === 'function') ret.then(done).catch((e) => {
        console.warn(TAG, `[命令] 隐藏第 ${messageId} 楼失败（第 ${n} 次）：`, msgOf(e));
        if (n < 3) setTimeout(() => attempt(n + 1), 220);
      });
      else done();
    } catch (e) {
      console.warn(TAG, `[命令] 隐藏第 ${messageId} 楼抛错（第 ${n} 次）：`, msgOf(e));
      if (n < 3) setTimeout(() => attempt(n + 1), 220);
    }
  };
  setTimeout(() => attempt(1), 120);
}

