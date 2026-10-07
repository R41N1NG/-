'use strict';

/**
 * 太微百花谱 · 核心仙姝名录配置
 * 严格遵照官方原著与世界书设定：
 * - 孤月：墨山道四弟子 · 剑仙子（居孤剑崖，号「雪中仙姝」）
 * - 叶红缨：墨山道五弟子 · 炎姬（居赤焰居）
 * - 闻观语：墨山道大弟子 · 千叶先生（居千叶居，执掌宗门）
 * - 楚灵夜：墨山道七弟子 · 金花公主（居金蕊苑，司灵植药圃，宗内称「小灵夜」）
 * - 苏瑶：天音阁弟子 · 听雪双姝之姐（音修，抚琴）
 * - 苏玲：天音阁弟子 · 听雪双姝之妹（音修，持碧玉洞箫）
 *
 * 纹章映射：
 * 孤月 -> 九幽玄阴穴 · 极乐 (jiuyouxuanyinxue_4)
 * 叶红缨 -> 灼酒流炎穴 · 极乐 (zhuojiuliuyanxue_4)
 * 闻观语 -> 心魔茶璎乳 · 极乐 (xinmochayingru_4)
 * 楚灵夜 -> 般若菩提菊 · 极乐 (boruoputiju_4)
 * 苏瑶 -> 灵犀同心穴 · 极乐 (lingxitongxin_4)
 * 苏玲 -> 灵犀同心穴 · 极乐 (lingxitongxin_4)
 */
const FLOWER_ROSTER = [
  {
    id: 'guyue',
    name: '孤月',
    title: '墨山道四弟子 · 剑仙子',
    sect: '墨山道',
    image: '{{IMG_GUYUE}}',
    imageKey: 'guyue',
    relicIcon: '{{RELIC_JIUYOU_4}}',
    relicKey: 'jiuyouxuanyinxue_4',
    relicName: '九幽玄阴穴 · 极乐',
    quote: '剑心通明者不染尘念，守得冰心不与人欠。',
  },
  {
    id: 'yehongying',
    name: '叶红缨',
    title: '墨山道五弟子 · 炎姬',
    sect: '墨山道',
    image: '{{IMG_YEHONGYING}}',
    imageKey: 'yehongying',
    relicIcon: '{{RELIC_ZHUOJIU_4}}',
    relicKey: 'zhuojiuliuyanxue_4',
    relicName: '灼酒流炎穴 · 极乐',
    quote: '只要再快一步，便没什么扛不下来，哪怕最后焚尽自身。',
  },
  {
    id: 'wenguanyu',
    name: '闻观语',
    title: '墨山道大弟子 · 千叶先生',
    sect: '墨山道',
    image: '{{IMG_WENGUANYU}}',
    imageKey: 'wenguanyu',
    relicIcon: '{{RELIC_XINMO_4}}',
    relicKey: 'xinmochayingru_4',
    relicName: '心魔茶璎乳 · 极乐',
    quote: '心通天地则事无不可知；只要看得见「因」，就不必怕。',
  },
  {
    id: 'chulingye',
    name: '楚灵夜',
    title: '墨山道七弟子 · 金花公主',
    sect: '墨山道',
    image: '{{IMG_CHULINGYE}}',
    imageKey: 'chulingye',
    relicIcon: '{{RELIC_BORUO_4}}',
    relicKey: 'boruoputiju_4',
    relicName: '般若菩提菊 · 极乐',
    quote: '墨发短俏缀金花，指尖生灵蕴药香。',
  },
  {
    id: 'suyao',
    name: '苏瑶',
    title: '天音阁弟子 · 听雪双姝之姐',
    sect: '天音阁',
    image: '{{IMG_SUYAO}}',
    imageKey: 'suyao',
    relicIcon: '{{RELIC_LINGXI_4}}',
    relicKey: 'lingxitongxin_4',
    relicName: '灵犀同心穴 · 极乐',
    quote: '音由心生，心正则音正；只要护住妹妹，什么都不必怕。',
  },
  {
    id: 'suling',
    name: '苏玲',
    title: '天音阁弟子 · 听雪双姝之妹',
    sect: '天音阁',
    image: '{{IMG_SULING}}',
    imageKey: 'suling',
    relicIcon: '{{RELIC_LINGXI_4}}',
    relicKey: 'lingxitongxin_4',
    relicName: '灵犀同心穴 · 极乐',
    quote: '短发双髻伴阿姐，玉箫幽咽诉衷肠。',
  },
];

module.exports = { FLOWER_ROSTER };
