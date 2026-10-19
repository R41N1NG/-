"use strict";

const PALACE_LORDS = new Set(["焚欲殿主", "欢喜殿主", "浊龙殿主", "魂欢殿主"]);

function isPalaceLord(identity) {
  return PALACE_LORDS.has(String(identity || "").trim());
}

const CORRUPTION_STAGES = [
  { stage: 0, id: "shoudao", label: "守道", title: "守道 · 冰清", relicStageName: "未成形", desc: "道心澄澈，宁折不弯；誓死不从，宁死不作鼎炉。" },
  { stage: 1, id: "ranchen", label: "染尘", title: "染尘 · 破禁", relicStageName: "一阶·初生", desc: "首次元阴受夺，破身见红；道心染垢，身心惊惶。" },
  { stage: 2, id: "shixin",  label: "蚀心", title: "蚀心 · 情动", relicStageName: "二阶·情动", desc: "魔息浸润，名器觉醒自发迎合吸吮；身心撕裂，罪恶沉沦。" },
  { stage: 3, id: "chenlun", label: "沉沦", title: "沉沦 · 归附", relicStageName: "三阶·沉沦", desc: "道心失守，神魂依附；奴种深植，主动迎合求欢。" },
  { stage: 4, id: "jile",    label: "极乐", title: "极乐 · 天姝", relicStageName: "四阶·极乐", desc: "双生凤翼/异化命脉大成；魔道鼎炉，与殿主命脉相系。" }
];

const HOLDER_TO_RELIC_ID = {
  叶红缨: "zhuojiu",
  孤月: "jiuyou",
  闻观语: "xinmo",
  楚灵夜: "boruo",
  雨霏柔: "beiming",
  苏瑶: "lingxi",
  苏玲: "lingxi",
  云织梦: "yuhu",
  柳含烟: "yanxia",
  花芷凝: "meirui",
  苏倾寒: "bingpo",
  慕容清歌: "qingge",
  顾云舒: "liuyan",
  陆烬颜: "fenghuang"
};

const HOLDER_TO_RELIC_NAME = {
  叶红缨: "灼酒流炎穴",
  孤月: "九幽玄阴穴",
  闻观语: "心魔茶璎乳",
  楚灵夜: "般若菩提菊",
  雨霏柔: "北冥潮生穴",
  苏瑶: "灵犀同心穴",
  苏玲: "灵犀同心穴",
  云织梦: "玉虎噙香乳",
  柳含烟: "烟霞灵乳",
  花芷凝: "梅蕊穴",
  苏倾寒: "冰魄剑心穴",
  慕容清歌: "清歌弦鸣穴",
  顾云舒: "流焰叠薪穴",
  陆烬颜: "凤凰羽花"
};

const FALLBACK_RELIC_KEYS = {
  zhuojiu: { form: "灼酒流炎穴成形", s1: "灼酒流炎穴一阶段", s2: "灼酒流炎穴二阶段", s3: "灼酒流炎穴三阶段", s4: "灼酒流炎穴四阶段" },
  jiuyou: { form: "九幽玄阴穴成形", s1: "九幽玄阴穴一阶段", s2: "九幽玄阴穴二阶段", s3: "九幽玄阴穴三阶段", s4: "九幽玄阴穴四阶段" },
  xinmo: { form: "心魔茶璎乳成形", s1: "心魔茶璎乳一阶段", s2: "心魔茶璎乳二阶段", s3: "心魔茶璎乳三阶段", s4: "心魔茶璎乳四阶段" },
  boruo: { form: "般若菩提菊成形", s1: "般若菩提菊一阶段", s2: "般若菩提菊二阶段", s3: "般若菩提菊三阶段", s4: "般若菩提菊四阶段" },
  beiming: { form: "北冥潮生穴成形", s1: "北冥潮生穴一阶段", s2: "北冥潮生穴二阶段", s3: "北冥潮生穴三阶段", s4: "北冥潮生穴四阶段" },
  lingxi: { form: "灵犀同心成形", s1: "灵犀同心穴一阶段", s2: "灵犀同心穴二阶段", s3: "灵犀同心穴三阶段", s4: "灵犀同心穴四阶段" },
  yuhu: { form: "玉虎噙香乳成形", s1: "玉虎噙香乳一阶段", s2: "玉虎噙香乳二阶段", s3: "玉虎噙香乳三阶段", s4: "玉虎噙香乳四阶段" },
  yanxia: { form: "烟霞灵乳一阶段", s1: "烟霞灵乳一阶段", s2: "烟霞灵乳二阶段", s3: "烟霞灵乳三阶段", s4: "烟霞灵乳四阶段" },
  meirui: { form: "梅蕊穴成形", s1: "梅蕊穴一阶段", s2: "梅蕊穴二阶段", s3: "梅蕊穴三阶段", s4: "梅蕊穴四阶段" },
  bingpo: { form: "冰魄剑心穴成形", s1: "冰魄剑心穴一阶段", s2: "冰魄剑心穴二阶段", s3: "冰魄剑心穴三阶段", s4: "冰魄剑心穴四阶段" },
  qingge: { form: "清歌弦鸣穴成形", s1: "清歌弦鸣穴一阶段", s2: "清歌弦鸣穴二阶段", s3: "清歌弦鸣穴三阶段", s4: "清歌弦鸣穴四阶段" },
  liuyan: { form: "流焰叠薪穴成形", s1: "流焰叠薪穴一阶段", s2: "流焰叠薪穴二阶段", s3: "流焰叠薪穴三阶段", s4: "流焰叠薪穴四阶段" },
  fenghuang: { form: "凤凰羽花成形", s1: "凤凰羽花一阶段", s2: "凤凰羽花二阶段", s3: "凤凰羽花三阶段", s4: "凤凰羽花四阶段" }
};

function getNextRequirement(stage) {
  switch (stage) {
    case 0: return "需实质破身见红，夺取首次元阴。";
    case 1: return "需足量本源浸润且名器产生生理自发迎合。";
    case 2: return "需心理深层依附（动情配合）或植入专属奴种。";
    case 3: return "需大势终局质变或极乐密藏双修大成。";
    case 4: return "已臻极乐天姝大成境界。";
    default: return "";
  }
}

function getCharacterCorruption(character, statData, rules) {
  if (!character) return null;
  const relicId = HOLDER_TO_RELIC_ID[character];
  if (!relicId) return null;
  const relicName = HOLDER_TO_RELIC_NAME[character] || "专属名器";

  let stage = 0;
  const r = typeof rules === "function" ? rules(statData) : rules;
  if (r && typeof r.getRelicStage === "function") {
    stage = r.getRelicStage(relicId, statData?.known || {});
  } else if (statData?.known) {
    const K = statData.known;
    const cfg = r?.RELIC_PILOT_CONFIG?.[relicId] || FALLBACK_RELIC_KEYS[relicId];
    if (cfg) {
      const s4 = cfg.stage4Key || cfg.s4, s3 = cfg.stage3Key || cfg.s3, s2 = cfg.stage2Key || cfg.s2, s1 = cfg.stage1Key || cfg.s1, form = cfg.formKey || cfg.form;
      if (K[s4] === true) stage = 4;
      else if (K[s3] === true) stage = 3;
      else if (K[s2] === true) stage = 2;
      else if (K[s1] === true || K[form] === true) stage = 1;
    }
  }

  const def = CORRUPTION_STAGES[stage] || CORRUPTION_STAGES[0];
  return {
    character,
    relicId,
    relicName,
    stage: def.stage,
    id: def.id,
    label: def.label,
    title: def.title,
    relicStageName: def.relicStageName,
    desc: def.desc,
    nextRequirement: getNextRequirement(stage)
  };
}

function resolveCorruption(s, rules, profiles = {}) {
  const stat = s?.stat_data || s || {};
  const ident = stat.身份 || s.identity;
  if (!isPalaceLord(ident)) {
    stat.corruption_active = false;
    delete stat.character_corruption;
    return s;
  }

  stat.corruption_active = true;
  stat.character_corruption ||= {};
  for (const name of Object.keys(HOLDER_TO_RELIC_ID)) {
    const c = getCharacterCorruption(name, stat, rules);
    if (c) {
      stat.character_corruption[name] = c;
    }
  }
  return s;
}

module.exports = {
  PALACE_LORDS,
  isPalaceLord,
  CORRUPTION_STAGES,
  HOLDER_TO_RELIC_ID,
  HOLDER_TO_RELIC_NAME,
  FALLBACK_RELIC_KEYS,
  getNextRequirement,
  getCharacterCorruption,
  resolveCorruption
};
