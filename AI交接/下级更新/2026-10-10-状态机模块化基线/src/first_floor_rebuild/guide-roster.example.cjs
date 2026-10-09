'use strict';

// 标准占位符保留在数据层；图片优先读取角色卡内嵌资源，不依赖本地图包。
// 下面三项按任务指南提供，均可修改；不要将示例配对当成原著设定校正。
const FLOWER_ROSTER = [
  {
    id: 'guyue', name: '孤月', title: '天枢剑尊 · 太上忘情', sect: '天枢剑宗',
    image: '{{IMG_GUYUE}}', imageKey: 'guyue',
    relicIcon: '{{RELIC_BINGPO_4}}', relicKey: 'bingpojianxinxue_4',
    relicName: '冰魄剑心穴 · 极乐',
    quote: '霜刃斩断七情网，冰心难渡极乐劫。',
  },
  {
    id: 'chulingye', name: '楚灵夜', title: '合欢圣女 · 幽冥情刺', sect: '阴煞魔宗 / 天姝会',
    image: '{{IMG_CHULINGYE}}', imageKey: 'chulingye',
    relicIcon: '{{RELIC_JIUYOU_4}}', relicKey: 'jiuyouxuanyinxue_4',
    relicName: '九幽玄阴穴 · 极乐',
    quote: '红绫半遮媚骨生，玄阴深处锁情蛊。',
  },
  {
    id: 'wenguanyu', name: '温莞玉', title: '医仙素手 · 玉壶冰清', sect: '太微杏林',
    image: '{{IMG_WENGUANYU}}', imageKey: 'wenguanyu',
    // 现有面板只有「玉虎噙香乳」，不能将它冒充「玉壶香乳」，也不回退到一阶图。
    // 为此项提供 tokenMap['RELIC_YUHU_4'] 或卡内 xsd_assets.menu.RELIC_YUHU_4。
    relicIcon: '{{RELIC_YUHU_4}}', relicKey: '',
    relicName: '玉壶香乳 · 极乐',
    quote: '能医天下长生骨，难解怀中合欢香。',
  },
];

module.exports = { FLOWER_ROSTER };
