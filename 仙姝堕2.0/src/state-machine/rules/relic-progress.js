
/** ═════════════════════════════════════════════════════════════════════
 * 名器动作申报、严格事实核验与浸润累进（MVU 状态机数值扩展 · 首期试点）
 * ─────────────────────────────────────────────────────────────────────
 * 遵循 GPT RFC-001 审核与 RFC-002 规范：
 *   1. 封闭动作枚举，模型严禁输出数字或 +1；
 *   2. 严格正文事实核验（持有者在场 + 内射硬词 + 否定句拦截 + 成形硬前置）；
 *   3. 接入统一 writeStat 队列，消息层历史快照与 Swipe 隔离（替换本楼贡献，绝不跨 Swipe 累加）；
 *   4. 首期不自动晋阶（恪守 GEMINI.md 铁律 36：达成 5 次仅标记 ready，真正晋阶须剧情生理自发迎合质变或 GM 解锁）；
 *   5. GM 人工回锁绝对优先。
 * ═════════════════════════════════════════════════════════════════════ */
const COMMON_STAGE2_ACTIONS = ['高潮', '绝顶', '内射高潮', '动情配合', '深度交合', '神魂交契', '神魂双修', '神魂禁制', '植入禁制', '奴种侵蚀', '奴种深植'];
const COMMON_STAGE3_ACTIONS = ['极乐双修', '本源共鸣', '天地机缘', '极乐交欢', '道韵化形', '神异质变', '天魔同化'];
const RELIC_PILOT_CONFIG = {
  zhuojiu: {
    id: 'zhuojiu',
    names: ['灼酒流炎穴', '灼酒流炎', '灼酒', 'zhuojiu', 'zhuojiuliuyanxue'],
    owner: '叶红缨',
    ownerAliases: ['叶红缨', '红绡', '红缨'],
    formKey: '灼酒流炎穴成形',
    stage1Key: '灼酒流炎穴一阶段',
    stage2Key: '灼酒流炎穴二阶段',
    stage3Key: '灼酒流炎穴三阶段',
    stage4Key: '灼酒流炎穴四阶段',
    target: 3,
    validActions: ['内射', '深度交合内射', '精液灌注', '至阳本源浸润', '本源浸润', '破身', ...COMMON_STAGE2_ACTIONS, ...COMMON_STAGE3_ACTIONS],
    evidenceRegex: /(内射|阳精|精液|白浊|尽数灌入|射入|注入|深处射|尽数射|全数灌|至阳本源|本源浸润)/,
    responseRegex: /(自发迎合|生理自发|本能迎合|自发蠕动|名器本能|本能.*唤醒|动起来|咬得?好?紧|咬紧|抽搐|吮吸|紧紧缠裹|主动缠裹|吸附|内壁痉挛|花房痉挛|质变|情动)/,
  },
  jiuyou: {
    id: 'jiuyou',
    names: ['九幽玄阴穴', '九幽玄阴', '九幽玄陰', '九幽', 'jiuyou', 'jiuyouxuanyinxue'],
    owner: '孤月',
    ownerAliases: ['孤月', '冷月', '师姐'],
    formKey: '九幽玄阴穴成形',
    stage1Key: '九幽玄阴穴一阶段',
    stage2Key: '九幽玄阴穴二阶段',
    stage3Key: '九幽玄阴穴三阶段',
    stage4Key: '九幽玄阴穴四阶段',
    target: 3,
    validActions: ['内射', '深度交合内射', '精液灌注', '至阳本源浸润', '本源浸润', '破身', ...COMMON_STAGE2_ACTIONS, ...COMMON_STAGE3_ACTIONS],
    evidenceRegex: /(内射|阳精|精液|白浊|尽数灌入|射入|注入|深处射|尽数射|全数灌|至阳本源|本源浸润)/,
    responseRegex: /(自发迎合|生理自发|本能迎合|自发蠕动|名器本能|咬得?好?紧|咬紧|抽搐|吮吸|紧紧缠裹|主动缠裹|吸附|内壁痉挛|花房痉挛|冰棱漩涡|质变|情动)/,
  },
  xinmo: {
    id: 'xinmo',
    names: ['心魔茶璎乳', '心魔茶璎', '心魔茶树', '心魔', 'xinmo', 'xinmochayingru'],
    owner: '闻观语',
    ownerAliases: ['闻观语', '观语'],
    formKey: '心魔茶璎乳成形',
    stage1Key: '心魔茶璎乳一阶段',
    stage2Key: '心魔茶璎乳二阶段',
    stage3Key: '心魔茶璎乳三阶段',
    stage4Key: '心魔茶璎乳四阶段',
    target: 3,
    validActions: ['内射', '深度交合内射', '精液灌注', '至阳本源浸润', '本源浸润', '口吮灵乳', '乳交灌注', '破身', ...COMMON_STAGE2_ACTIONS, ...COMMON_STAGE3_ACTIONS],
    evidenceRegex: /(内射|阳精|精液|白浊|尽数灌入|射入|注入|深处射|尽数射|全数灌|至阳本源|本源浸润|吮吸灵乳|溢出灵乳|含住乳尖)/,
    responseRegex: /(自发迎合|生理自发|本能迎合|自发蠕动|名器本能|咬得?好?紧|咬紧|抽搐|吮吸|紧紧缠裹|主动缠裹|吸附|内壁痉挛|花房痉挛|双峰共鸣|茶蕊.*缠绕|质变|情动)/,
  },
  boruo: {
    id: 'boruo',
    names: ['般若菩提菊', '般若菩提', '菩提菊', '般若', 'boruo', 'boruoputiju'],
    owner: '楚灵夜',
    ownerAliases: ['楚灵夜', '灵夜'],
    formKey: '般若菩提菊成形',
    stage1Key: '般若菩提菊一阶段',
    stage2Key: '般若菩提菊二阶段',
    stage3Key: '般若菩提菊三阶段',
    stage4Key: '般若菩提菊四阶段',
    target: 3,
    validActions: ['内射', '后窍内射', '深度交合内射', '精液灌注', '至阳本源浸润', '本源浸润', '谷道灌注', '破身', ...COMMON_STAGE2_ACTIONS, ...COMMON_STAGE3_ACTIONS],
    evidenceRegex: /(内射|阳精|精液|白浊|尽数灌入|射入|注入|深处射|尽数射|全数灌|至阳本源|本源浸润|灌满后庭|注入谷道)/,
    responseRegex: /(自发迎合|生理自发|本能迎合|自发蠕动|名器本能|咬得?好?紧|咬紧|抽搐|吮吸|紧紧缠裹|主动缠裹|吸附|后庭痉挛|菊径痉挛|双穴互通|叶脉.*蠕动|质变|情动)/,
  },
  beiming: {
    id: 'beiming',
    names: ['北冥潮生穴', '北冥潮生', '潮汐源涡', '北冥', 'beiming', 'beimingchaoshengxue'],
    owner: '雨霏柔',
    ownerAliases: ['雨霏柔', '霏柔'],
    formKey: '北冥潮生穴成形',
    stage1Key: '北冥潮生穴一阶段',
    stage2Key: '北冥潮生穴二阶段',
    stage3Key: '北冥潮生穴三阶段',
    stage4Key: '北冥潮生穴四阶段',
    target: 3,
    validActions: ['内射', '深度交合内射', '精液灌注', '至阳本源浸润', '本源浸润', '破身', ...COMMON_STAGE2_ACTIONS, ...COMMON_STAGE3_ACTIONS],
    evidenceRegex: /(内射|阳精|精液|白浊|尽数灌入|射入|注入|深处射|尽数射|全数灌|至阳本源|本源浸润)/,
    responseRegex: /(自发迎合|生理自发|本能迎合|自发蠕动|名器本能|咬得?好?紧|咬紧|抽搐|吮吸|紧紧缠裹|主动缠裹|吸附|内壁痉挛|花房痉挛|暗流漩涡|源涡逆转|质变|情动)/,
  },
  lingxi: {
    id: 'lingxi',
    names: ['灵犀同心穴', '灵犀同心', '同心异体', 'lingxi', 'lingxitongxin'],
    owner: '苏瑶',
    ownerAliases: ['苏瑶', '苏玲', '听雪双姝', '双姝'],
    formKey: '灵犀同心成形',
    stage1Key: '灵犀同心穴一阶段',
    stage2Key: '灵犀同心穴二阶段',
    stage3Key: '灵犀同心穴三阶段',
    stage4Key: '灵犀同心穴四阶段',
    target: 3,
    validActions: ['内射', '深度交合内射', '精液灌注', '至阳本源浸润', '本源浸润', '破身', ...COMMON_STAGE2_ACTIONS, ...COMMON_STAGE3_ACTIONS],
    evidenceRegex: /(内射|阳精|精液|白浊|尽数灌入|射入|注入|深处射|尽数射|全数灌|至阳本源|本源浸润)/,
    responseRegex: /(自发迎合|生理自发|本能迎合|自发蠕动|名器本能|咬得?好?紧|咬紧|抽搐|吮吸|紧紧缠裹|主动缠裹|吸附|内壁痉挛|花房痉挛|同心通感|冰火漩涡|质变|情动)/,
  },
  yuhu: {
    id: 'yuhu',
    names: ['玉虎噙香乳', '月下蜜桃', '玉虎噙香', 'yuhu', 'yuhuxiangru'],
    owner: '云织梦',
    ownerAliases: ['云织梦', '织梦'],
    formKey: '玉虎噙香乳成形',
    stage1Key: '玉虎噙香乳一阶段',
    stage2Key: '玉虎噙香乳二阶段',
    stage3Key: '玉虎噙香乳三阶段',
    stage4Key: '玉虎噙香乳四阶段',
    target: 3,
    validActions: ['内射', '深度交合内射', '精液灌注', '至阳本源浸润', '本源浸润', '口吮玉乳', '乳交灌注', '破身', ...COMMON_STAGE2_ACTIONS, ...COMMON_STAGE3_ACTIONS],
    evidenceRegex: /(内射|阳精|精液|白浊|尽数灌入|射入|注入|深处射|尽数射|全数灌|至阳本源|本源浸润|吮吸玉乳|溢出桃蜜)/,
    responseRegex: /(自发迎合|生理自发|本能迎合|自发蠕动|名器本能|咬得?好?紧|咬紧|抽搐|吮吸|紧紧缠裹|主动缠裹|吸附|内壁痉挛|花房痉挛|双峰共鸣|白虎灵络|质变|情动)/,
  },
  yanxia: {
    id: 'yanxia',
    names: ['烟霞灵乳', '昨日欢', '烟霞', 'yanxia', 'yanxialingru'],
    owner: '柳含烟',
    ownerAliases: ['柳含烟', '含烟'],
    formKey: '烟霞灵乳一阶段',
    stage1Key: '烟霞灵乳一阶段',
    stage2Key: '烟霞灵乳二阶段',
    stage3Key: '烟霞灵乳三阶段',
    stage4Key: '烟霞灵乳四阶段',
    target: 3,
    validActions: ['内射', '深度交合内射', '精液灌注', '至阳本源浸润', '本源浸润', '口吮灵乳', '乳交灌注', '破身', ...COMMON_STAGE2_ACTIONS, ...COMMON_STAGE3_ACTIONS],
    evidenceRegex: /(内射|阳精|精液|白浊|尽数灌入|射入|注入|深处射|尽数射|全数灌|至阳本源|本源浸润|吮吸灵乳|溢出烟霞)/,
    responseRegex: /(自发迎合|生理自发|本能迎合|自发蠕动|名器本能|咬得?好?紧|咬紧|抽搐|吮吸|紧紧缠裹|主动缠裹|吸附|内壁痉挛|花房痉挛|双峰翻涌|幽昙翻张|质变|情动)/,
  },
  meirui: {
    id: 'meirui',
    names: ['梅蕊穴', '梅蕊', 'meirui', 'meiruixue'],
    owner: '花芷凝',
    ownerAliases: ['花芷凝', '芷凝', '花城主'],
    formKey: '梅蕊穴成形',
    stage1Key: '梅蕊穴一阶段',
    stage2Key: '梅蕊穴二阶段',
    stage3Key: '梅蕊穴三阶段',
    stage4Key: '梅蕊穴四阶段',
    target: 3,
    validActions: ['内射', '深度交合内射', '精液灌注', '至阳本源浸润', '本源浸润', '破身', ...COMMON_STAGE2_ACTIONS, ...COMMON_STAGE3_ACTIONS],
    evidenceRegex: /(内射|阳精|精液|白浊|尽数灌入|射入|注入|深处射|尽数射|全数灌|至阳本源|本源浸润)/,
    responseRegex: /(自发迎合|生理自发|本能迎合|自发蠕动|名器本能|咬得?好?紧|咬紧|抽搐|吮吸|紧紧缠裹|主动缠裹|吸附|内壁痉挛|花房痉挛|蕊瓣翻张|蕊状结构|质变|情动)/,
  },
  bingpo: {
    id: 'bingpo',
    names: ['冰魄剑心穴', '冰魄剑心', 'bingpo', 'bingpojianxinxue'],
    owner: '苏倾寒',
    ownerAliases: ['苏倾寒', '倾寒'],
    formKey: '冰魄剑心穴成形',
    stage1Key: '冰魄剑心穴一阶段',
    stage2Key: '冰魄剑心穴二阶段',
    stage3Key: '冰魄剑心穴三阶段',
    stage4Key: '冰魄剑心穴四阶段',
    target: 3,
    validActions: ['内射', '深度交合内射', '精液灌注', '至阳本源浸润', '本源浸润', '破身', ...COMMON_STAGE2_ACTIONS, ...COMMON_STAGE3_ACTIONS],
    evidenceRegex: /(内射|阳精|精液|白浊|尽数灌入|射入|注入|深处射|尽数射|全数灌|至阳本源|本源浸润)/,
    responseRegex: /(自发迎合|生理自发|本能迎合|自发蠕动|名器本能|咬得?好?紧|咬紧|抽搐|吮吸|紧紧缠裹|主动缠裹|吸附|内壁痉挛|花房痉挛|剑意封膜|寒棱贴合|质变|情动)/,
  },
  qingge: {
    id: 'qingge',
    names: ['清歌弦鸣穴', '清歌弦鸣', 'qingge', 'qinggexianmingxue'],
    owner: '慕容清歌',
    ownerAliases: ['慕容清歌', '清歌'],
    formKey: '清歌弦鸣穴成形',
    stage1Key: '清歌弦鸣穴一阶段',
    stage2Key: '清歌弦鸣穴二阶段',
    stage3Key: '清歌弦鸣穴三阶段',
    stage4Key: '清歌弦鸣穴四阶段',
    target: 3,
    validActions: ['内射', '深度交合内射', '精液灌注', '至阳本源浸润', '本源浸润', '破身', ...COMMON_STAGE2_ACTIONS, ...COMMON_STAGE3_ACTIONS],
    evidenceRegex: /(内射|阳精|精液|白浊|尽数灌入|射入|注入|深处射|尽数射|全数灌|至阳本源|本源浸润)/,
    responseRegex: /(自发迎合|生理自发|本能迎合|自发蠕动|名器本能|咬得?好?紧|咬紧|抽搐|吮吸|紧紧缠裹|主动缠裹|吸附|内壁痉挛|花房痉挛|束状结构|同频共振|啼啼紧夹|质变|情动)/,
  },
  liuyan: {
    id: 'liuyan',
    names: ['流焰叠薪穴', '流焰叠薪', 'liuyan', 'liuyandiexinxue'],
    owner: '顾云舒',
    ownerAliases: ['顾云舒', '云舒'],
    formKey: '流焰叠薪穴成形',
    stage1Key: '流焰叠薪穴一阶段',
    stage2Key: '流焰叠薪穴二阶段',
    stage3Key: '流焰叠薪穴三阶段',
    stage4Key: '流焰叠薪穴四阶段',
    target: 3,
    validActions: ['内射', '深度交合内射', '精液灌注', '至阳本源浸润', '本源浸润', '破身', ...COMMON_STAGE2_ACTIONS, ...COMMON_STAGE3_ACTIONS],
    evidenceRegex: /(内射|阳精|精液|白浊|尽数灌入|射入|注入|深处射|尽数射|全数灌|至阳本源|本源浸润)/,
    responseRegex: /(自发迎合|生理自发|本能迎合|自发蠕动|名器本能|咬得?好?紧|咬紧|抽搐|吮吸|紧紧缠裹|主动缠裹|吸附|内壁痉挛|花房痉挛|游移热痕|深处热源|质变|情动)/,
  },
  fenghuang: {
    id: 'fenghuang',
    names: ['凤凰羽花', '凤羽花', 'fenghuang', 'fenghuangyuhua'],
    owner: '陆烬颜',
    ownerAliases: ['陆烬颜', '烬颜'],
    formKey: '凤凰羽花成形',
    stage1Key: '凤凰羽花一阶段',
    stage2Key: '凤凰羽花二阶段',
    stage3Key: '凤凰羽花三阶段',
    stage4Key: '凤凰羽花四阶段',
    target: 3,
    validActions: ['内射', '深度交合内射', '精液灌注', '至阳本源浸润', '本源浸润', '足心承欢', '足交灌注', '破身', ...COMMON_STAGE2_ACTIONS, ...COMMON_STAGE3_ACTIONS],
    evidenceRegex: /(内射|阳精|精液|白浊|尽数灌入|射入|注入|深处射|尽数射|全数灌|至阳本源|本源浸润|灌注足心|足间射入)/,
    responseRegex: /(自发迎合|生理自发|本能迎合|自发蠕动|名器本能|咬得?好?紧|咬紧|抽搐|吮吸|紧紧缠裹|主动缠裹|吸附|内壁痉挛|花房痉挛|足心开合|双足扣握|双腿绞缠|羽纹|质变|情动)/,
  },
};


/** 计算名器当前在 known 中已觉醒的最高境界（0:未成形, 1:落红, 2:情动, 3:沉沦, 4:极乐） */
function getRelicStage(relicId, known) {
  const cfg = RELIC_PILOT_CONFIG[relicId];
  if (!cfg) return 0;
  const K = known || {};
  if (K[cfg.stage4Key] === true) return 4;
  if (K[cfg.stage3Key] === true) return 3;
  if (K[cfg.stage2Key] === true) return 2;
  if (K[cfg.stage1Key] === true || K[cfg.formKey] === true) return 1;
  const sd = typeof readStatData === 'function' ? readStatData() : null;
  if (sd && (sd.名器归属?.[cfg.names[0]] || sd.名器归属?.[relicId] || sd.破处者?.[cfg.owner])) {
    return 1;
  }
  return 0;
}

function isRelicActionLabel(label) {
  const n = normalizeLabel(label);
  return n.includes('名器互动') || n.includes('名器动作') || n === '名器' || n === 'relic_action';
}

/** `<名器互动>` 的值 → `{ relicId, relicName, actor, action, raw }`
 *  封闭事实枚举：例如「灼酒流炎穴|赵无忧|内射」或「zhuojiu|player|内射」
 *  严格去除模型自造的 +1、数字或 delta，只取名器、行为者、动作事实。 */
function parseRelicAction(value) {
  const v = String(value ?? '').trim().replace(/[（(]\s*无\s*[）)]/g, '无');
  if (!v || v === '无' || v === '-' || v === '—' || /^none$/i.test(v)) return null;
  // 防跨标签越界（如果带了 < 标签残余，截断到第一个 < 之前）
  const cleanV = v.split('<')[0].trim();
  if (!cleanV) return null;

  const segs = cleanV.split(/[；;\n]+/);
  for (const seg of segs) {
    const rawSeg = seg.trim();
    if (!rawSeg) continue;
    const parts = rawSeg.split(/[|｜、:：]+/).map((x) => x.trim()).filter(Boolean);
    if (!parts.length) continue;

    // 清理模型自加的 +1、数字等
    const cleanedParts = parts.map((p) => p.replace(/\s*\+?\d+.*$/, '').trim()).filter(Boolean);
    if (!cleanedParts.length) continue;

    for (const [id, cfg] of Object.entries(RELIC_PILOT_CONFIG)) {
      const matchRelic = cleanedParts.some((p) => cfg.names.includes(p) || cfg.ownerAliases.includes(p) || p.toLowerCase() === id.toLowerCase());
      if (!matchRelic) continue;

      let matchedAction = '';
      for (const p of cleanedParts) {
        if (cfg.validActions.includes(p)) {
          matchedAction = p;
          break;
        }
      }
      if (!matchedAction) {
        if (cleanedParts.some((p) => p.includes('内射') || p.includes('灌注'))) matchedAction = '内射';
        else if (cleanedParts.some((p) => p.includes('破身') || p.includes('初破'))) matchedAction = '破身';
      }

      if (matchedAction) {
        const actorPart = cleanedParts.find((p) => !cfg.names.includes(p) && !cfg.ownerAliases.includes(p) && p !== matchedAction && p.toLowerCase() !== id.toLowerCase());
        const curId = (typeof readIdentity === 'function' ? readIdentity() : null) || '赵无忧';
        const actor = actorPart || curId;
        return {
          relicId: id,
          relicName: cfg.names[0],
          actor,
          action: matchedAction,
          raw: rawSeg
        };
      }
    }
  }
  return null;
}

/** 核验名器互动申报（纯函数） */
function validateRelicAction(act, prose, known, currentIdentity) {
  if (!act || !act.relicId) return { ok: false, why: '无效或未知的动作申报' };
  const cfg = RELIC_PILOT_CONFIG[act.relicId];
  if (!cfg) return { ok: false, why: '未知或未支持的名器申报' };

  // 1. 成形检查（前置硬闸门：known 状态 ＋ 账本归属实证兜底）
  const K = known || {};
  let isFormed = K[cfg.formKey] === true;
  if (!isFormed) {
    const sd = typeof readStatData === 'function' ? readStatData() : null;
    if (sd && (sd.名器归属?.[cfg.names[0]] || sd.名器归属?.[act.relicId] || sd.破处者?.[cfg.owner])) {
      isFormed = true;
    }
  }
  if (!isFormed) {
    return { ok: false, why: `名器「${cfg.names[0]}」尚未成形，不可累积互动或晋阶` };
  }

  const curStage = getRelicStage(act.relicId, K);

  // 2. 阶段闭环检查
  if (curStage >= 4) {
    return { ok: false, why: `名器「${cfg.names[0]}」已达第四境（极乐），四阶大圆满已闭合` };
  }

  const pText = String(prose || '');

  // 3. 阶段准入与进阶动作检查（守卫反例 9：已达成第二境拒计一升二点数）
  const STAGE2_ACTIONS = ['高潮', '绝顶', '内射高潮', '动情配合', '深度交合', '神魂交契', '神魂双修', '神魂禁制', '植入禁制', '奴种侵蚀', '奴种深植'];
  const STAGE3_ACTIONS = ['极乐双修', '本源共鸣', '天地机缘', '极乐交欢', '道韵化形', '神异质变', '天魔同化'];

  if (curStage === 2) {
    const isStage2Act = STAGE2_ACTIONS.includes(act.action) || STAGE3_ACTIONS.includes(act.action);
    const hasStage2Prose = /(高潮|绝顶|丢盔弃甲|神魂|交契|奴种|禁制|道纹|失守|动情|配合|依附|沉沦|失控|痉挛|泄身)/.test(pText);
    if (!isStage2Act && !hasStage2Prose) {
      return { ok: false, why: `名器「${cfg.names[0]}」已达第二境（情动），一升二浸润计数已闭合` };
    }
  }

  if (curStage === 3) {
    const isStage3Act = STAGE3_ACTIONS.includes(act.action);
    const hasStage3Prose = /(极乐|天魔|本源共鸣|异化|化形|展翼|神异|同化|生角|凤羽化形|龙纹)/.test(pText);
    if (!isStage3Act && !hasStage3Prose) {
      return { ok: false, why: `名器「${cfg.names[0]}」已达第三境（沉沦），二升三沉沦计数已闭合` };
    }
  }

  // 动作枚举检查
  if (!cfg.validActions.includes(act.action)) {
    return { ok: false, why: `动作「${act.action}」不在合法枚举表内（支持：${cfg.validActions.join('、')}）` };
  }

  // 动作是破身：属于一阶成形动作，不增加入二阶浸润
  if (act.action === '破身') {
    return { ok: true, delta: 0, why: '破身属于一阶成形动作，不计入二阶浸润' };
  }

  // 4. 正文事实校验（Strict Evidence Check）
  if (!pText) {
    return { ok: false, why: '本楼读不到正文文本，无法核验动作事实实证（fail-closed）' };
  }

  // 4a. 持有者在场实证
  const ownerPresent = cfg.ownerAliases.some((alias) => pText.includes(alias));
  if (!ownerPresent) {
    return { ok: false, why: `正文中未见持有者「${cfg.owner}」在场参与互动` };
  }

  // 4b. 动作证据词实证
  let currentEvidenceRegex = cfg.evidenceRegex;
  if (curStage === 2) {
    currentEvidenceRegex = /(高潮|绝顶|丢盔弃甲|神魂|交契|奴种|禁制|道纹|失守|动情|配合|依附|沉沦|失控|痉挛|泄身|内射|阳精|精液|白浊|尽数灌入|射入|注入)/;
  } else if (curStage === 3) {
    currentEvidenceRegex = /(极乐|天魔|本源共鸣|异化|化形|展翼|神异|同化|生角|凤羽化形|龙纹|高潮|绝顶|神魂|交契)/;
  }

  if (!currentEvidenceRegex.test(pText)) {
    return { ok: false, why: `正文中未见「${act.action}」事实实证（须出现内射/精液灌注等硬词）` };
  }

  // 4c. 否定句拦截
  if (typeof negatedAround === 'function' && negatedAround(pText, currentEvidenceRegex)) {
    return { ok: false, why: `正文中「${act.action}」实证落在否定或未发生分句中` };
  }

  return { ok: true, delta: 1, target_stage: curStage + 1, why: `正文事实核验通过（${cfg.owner}在场且有明确${act.action}实证）` };
}

/** 累进/回溯名器浸润进度（纯函数） */
function calcRelicProgress(allProgress, validAction, floor, swipeId, textHash, known) {
  const next = Object.assign({}, allProgress || {});
  if (!validAction || !validAction.relicId) return next;
  const id = validAction.relicId;
  const cfg = RELIC_PILOT_CONFIG[id];
  if (!cfg) return next;

  const curStage = getRelicStage(id, known) || 1;
  const targetStage = Math.max(2, Math.min(4, validAction.target_stage || (curStage + 1)));

  const cur = Object.assign({
    id,
    name: cfg.names[0],
    owner: cfg.owner,
    count: 0,
    target: cfg.target,
    ready: false,
    last_floor: 0,
    history: []
  }, next[id] || {});

  // 维护 stages 分阶段台账
  cur.stages = Object.assign({
    2: { count: 0, target: cfg.target || 3, ready: false },
    3: { count: 0, target: 3, ready: false },
    4: { count: 0, target: 3, ready: false }
  }, cur.stages || {});

  // 自愈与旧结构映射
  if (!cur.stages[2].count && curStage >= 2) {
    cur.stages[2].count = cfg.target || 3;
    cur.stages[2].ready = true;
  } else if (!cur.stages[2].count && curStage === 1 && cur.count > 0) {
    cur.stages[2].count = Math.floor(Number(cur.count) || 0);
    cur.stages[2].ready = cur.stages[2].count >= (cfg.target || 3);
  }

  const stageObj = cur.stages[targetStage] || { count: 0, target: 3, ready: false };
  const stageTarget = Math.max(1, Math.floor(Number(stageObj.target) || 3));
  stageObj.target = stageTarget;
  let count = Math.max(0, Math.min(stageTarget, Math.floor(Number(stageObj.count) || 0)));

  const fNum = Number(floor) || 0;
  const sNum = Number(swipeId) || 0;
  const hash = String(textHash || '');
  const delta = (validAction.ok !== false && Number.isFinite(Number(validAction.delta))) ? Math.floor(Number(validAction.delta)) : 0;

  let history = Array.isArray(cur.history) ? [...cur.history] : [];
  const existingIdx = history.findIndex((h) => Number(h.floor) === fNum);

  if (existingIdx >= 0) {
    const prev = history[existingIdx];
    // 同楼同分支同正文：幂等，不重复增减
    if (Number(prev.swipeId) === sNum && prev.hash === hash) {
      stageObj.count = count;
      stageObj.ready = count >= stageTarget;
      cur.stages[targetStage] = stageObj;
      cur.count = count;
      cur.target = stageTarget;
      cur.ready = count >= stageTarget;
      cur.target_stage = targetStage;
      next[id] = cur;
      return next;
    }
    // 同楼换分支(Swipe)或编辑：撤销旧贡献，加上新贡献
    const prevDelta = Math.floor(Number(prev.delta) || 0);
    count = Math.max(0, Math.min(stageTarget, count - prevDelta + delta));
    history[existingIdx] = {
      floor: fNum,
      swipeId: sNum,
      hash,
      actor: validAction.actor || 'player',
      action: validAction.action || '',
      delta,
      target_stage: targetStage,
      timestamp: Date.now()
    };
  } else {
    // 新楼记录
    count = Math.max(0, Math.min(stageTarget, count + delta));
    history.push({
      floor: fNum,
      swipeId: sNum,
      hash,
      actor: validAction.actor || 'player',
      action: validAction.action || '',
      delta,
      target_stage: targetStage,
      timestamp: Date.now()
    });
  }

  // 约束审计账本大小，保留最近 20 笔
  if (history.length > 20) history = history.slice(-20);

  stageObj.count = count;
  stageObj.ready = count >= stageTarget;
  cur.stages[targetStage] = stageObj;

  cur.count = count;
  cur.target = stageTarget;
  cur.ready = count >= stageTarget;
  cur.target_stage = targetStage;
  cur.last_floor = fNum;
  cur.history = history;
  next[id] = cur;
  return next;
}

/** 身份：gpt。核验落在名器持有者上的已发生生理自发迎合或名器二阶成形实证。 */
function hasRelicPhysiologicalResponse(relicId, prose) {
  const cfg = RELIC_PILOT_CONFIG[relicId];
  if (!cfg) return false;
  const nonFact = /据说|听说|传闻|谣传|计划|打算|准备|想要|希望|将要|即将|可能|或将|若是|假如|倘若|万一|是否|未|没有|没能|不曾|并不|不是|不会|不愿|讨论|提及|解释|说明/;
  const counterNeg = /不仅没有|非但没有|不仅不|非但非|反而|不再/;
  const response = /自发迎合|生理自发|本能迎合|自发蠕动|紧紧缠裹|主动缠裹|疯狂绞吸|情动迎合|名器二阶|二阶「?情动」?|(?:自发|主动|不由自主|本能地?).{0,15}(?:绞紧|吮吸|收缩|蠕动|迎合|吸附|抽搐|拖拽|咬噬|吞咽|绞吸)|(?:内壁|花房|媚肉|穴肉|甬道|名器|阴道|小穴|蜜穴|玉穴|肉壁|肉穴|花穴|穴口|子宫|后庭|菊径|谷道|后门|双峰|雪乳|乳房|乳肉|乳尖|双足|足心|足趾|肉芽).{0,25}(?:痉挛|蠕动|抽搐|吮吸|缠裹|吸附|收缩|开合|扣握|绞吸|吞咽|咬噬)|(?:本能|自主|自发|不由自主|生理).{0,20}(?:迎合|蠕动|缠裹|吸附|收缩|吮吸|开合|绞吸|抽搐|吞咽|咬噬)/g;

  const proseStr = String(prose || '');
  const hasOwner = cfg.ownerAliases.some(a => proseStr.includes(a)) || cfg.names.some(n => proseStr.includes(n));
  if (!hasOwner) return false;

  const otherHolders = Object.keys(HOLDER_TO_RELIC).filter(h => !cfg.ownerAliases.includes(h));

  // 显式二阶成形描写判定（带名器名或持有者）
  if (new RegExp('(?:名器二阶|二阶「?情动」?|二阶异象.*成形|情动.*成形).*' + cfg.names[0] + '|' + cfg.names[0] + '.*(?:名器二阶|二阶「?情动」?|二阶异象.*成形|情动.*成形)').test(proseStr)) {
    return true;
  }
  if (/名器二阶「?情动」?的异象.*已然.*成形/.test(proseStr)) {
    return true;
  }

  // 句级生理迎合判定（排除逗号拆分导致的指代断裂）
  const sentences = proseStr.split(/[。！？\n]/);
  for (const sentence of sentences) {
    if (!sentence.trim()) continue;
    // 若该完整句明确仅属于其他女方且未提及当前持有者，则跳过
    if (otherHolders.some(o => sentence.includes(o)) && !cfg.ownerAliases.some(a => sentence.includes(a))) {
      continue;
    }
    // 拦截否定句（除非有反折肯定的「不仅没有……反而……」）
    if (nonFact.test(sentence) && !counterNeg.test(sentence)) continue;
    if (!/(名器|内壁|花房|媚肉|穴肉|甬道|阴道|小穴|蜜穴|玉穴|肉壁|肉穴|花穴|穴口|子宫|后庭|菊径|谷道|后门|双峰|雪乳|乳房|乳肉|乳尖|双足|足心|足趾|肉芽|异象|情动)/.test(sentence)) continue;

    response.lastIndex = 0;
    if (response.test(sentence)) {
      return true;
    }
  }
  return false;
}

/** 身份：gpt。核验落在名器持有者上的已发生二升三（情动 -> 沉沦）心智质变或阶段声明。 */
function hasRelicStage3Response(relicId, prose) {
  const cfg = RELIC_PILOT_CONFIG[relicId];
  if (!cfg) return false;
  const proseStr = String(prose || '');
  if (!proseStr) return false;

  const hasOwner = cfg.ownerAliases.some(a => proseStr.includes(a)) || cfg.names.some(n => proseStr.includes(n));
  if (!hasOwner) return false;

  // 显式三阶声明判定
  if (new RegExp('(?:名器三阶|三阶「?沉沦」?|三阶异象.*成形|沉沦.*成形).*' + cfg.names[0] + '|' + cfg.names[0] + '.*(?:名器三阶|三阶「?沉沦」?|三阶异象.*成形|沉沦.*成形)').test(proseStr)) {
    return true;
  }
  if (/名器三阶「?沉沦」?的异象.*已然.*成形|进入名器三阶|达成三阶段|突破至三阶/.test(proseStr)) {
    return true;
  }

  const sentences = proseStr.split(/[。！？\n]/);
  const nonFact = /据说|听说|传闻|谣传|计划|打算|准备|想要|希望|将要|即将|可能|或将|若是|假如|倘若|万一|是否|未|没有|没能|不曾|并不|不是|不会|不愿|讨论|提及|解释|说明/;
  const counterNeg = /不仅没有|非但没有|不仅不|非但非|反而|不再/;
  const stage3Regex = /(动情配合|神魂交契|神魂共鸣|奴种|魔念深植|理智防线失守|心智沉沦|依附|甘愿|主动索求|尊严荡然无存|万念俱灰.*沉沦|道心蒙尘.*沉沦)/;

  for (const sentence of sentences) {
    if (!sentence.trim()) continue;
    if (nonFact.test(sentence) && !counterNeg.test(sentence)) continue;
    if (stage3Regex.test(sentence)) {
      return true;
    }
  }
  return false;
}

/** 身份：gpt。核验落在名器持有者上的已发生三升四（沉沦 -> 极乐）外貌异相神异质变或阶段声明。 */
function hasRelicStage4Response(relicId, prose) {
  const cfg = RELIC_PILOT_CONFIG[relicId];
  if (!cfg) return false;
  const proseStr = String(prose || '');
  if (!proseStr) return false;

  const hasOwner = cfg.ownerAliases.some(a => proseStr.includes(a)) || cfg.names.some(n => proseStr.includes(n));
  if (!hasOwner) return false;

  // 显式四阶声明判定
  if (new RegExp('(?:名器四阶|四阶「?极乐」?|四阶异象.*成形|极乐.*成形|大圆满).*' + cfg.names[0] + '|' + cfg.names[0] + '.*(?:名器四阶|四阶「?极乐」?|四阶异象.*成形|极乐.*成形|大圆满)').test(proseStr)) {
    return true;
  }
  if (/名器四阶「?极乐」?的异象.*已然.*成形|进入名器四阶|达成四阶段|突破至四阶|极乐大圆满/.test(proseStr)) {
    return true;
  }

  const sentences = proseStr.split(/[。！？\n]/);
  const nonFact = /据说|听说|传闻|谣传|计划|打算|准备|想要|希望|将要|即将|可能|或将|若是|假如|倘若|万一|是否|未|没有|没能|不曾|并不|不是|不会|不愿|讨论|提及|解释|说明/;
  const counterNeg = /不仅没有|非但没有|不仅不|非但非|反而|不再/;
  const stage4Regex = /(生角|展翼|黑翼|羽翼|道韵化形|天魔道体|极乐天魔|神异质变|肉身异化|不可逆.*质变)/;

  for (const sentence of sentences) {
    if (!sentence.trim()) continue;
    if (nonFact.test(sentence) && !counterNeg.test(sentence)) continue;
    if (stage4Regex.test(sentence)) {
      return true;
    }
  }
  return false;
}

