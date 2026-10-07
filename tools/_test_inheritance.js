// 测试继承进度识别器
const STAGE_BASE = [1, 31, 51, 76, 96, 111, 131, 161, 181, 206, 226, 246, 266, 296, 326, 361];
const SEG_TIME = [1578.03,1578.04,1578.06,1578.08,1578.11,1578.11,1578.12,1579.01,1579.01,1579.02,1579.03,1579.04,1579.04,1579.05,1579.06,1580.01];

const STAGE_MILESTONES = [
  { stage: 15, kws: ['雀奴', '灼酒流炎穴二阶段', '彻底臣服'] },
  { stage: 14, kws: ['洞府调教', '相思豆', '赤羽沉沦'] },
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

function detectInheritance(text, messageId, curStage) {
  const t = String(text || '').trim();
  if (!t) return null;

  // 1. 显式命令或显式前缀标识
  const hasExplicitTag = /(?:^\s*[\/／](?:继承|读档|恢复)|【(?:承接|继承|大总结|前情提要|前情回顾|存档|历史进度|接上把|接上回|转场继承)】|承接上一[把局段回篇]|接上一[把局段回篇]|前情继承|新开承接|重开承接|<阶段总结>|<结算>)/i.test(t);

  // 2. 检查是否包含显式段位号声明 (例: 第11段 / 段位11 / 阶段:11)
  const stageNumMatch = /(?:第\s*([一二三四五六七八九十\d]+)\s*段|段位\s*[:：]?\s*([一二三四五六七八九十\d]+)|阶段\s*[:：]?\s*([一二三四五六七八九十\d]+)|承接第\s*([一二三四五六七八九十\d]+))/i.exec(t);

  const CN_MAP = { 一:1, 二:2, 三:3, 四:4, 五:5, 六:6, 七:7, 八:8, 九:9, 十:10, 十一:11, 十二:12, 十三:13, 十四:14, 十五:15, 十六:16 };
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

  // 4. 防冲突判定 (必须满足继承条件才放行)
  // 条件一：显式命令或带前缀；
  // 条件二：在低楼层 (<= 3) 且 (有显式段位号 或 命中了至少2个中后期里程碑且段位>=3)
  const isEarlyFloor = (Number(messageId) <= 3);
  const isQualified = hasExplicitTag || (isEarlyFloor && (explicitStage > 1 || (hitMilestoneCount >= 2 && inferredStage >= 3)));

  if (!isQualified) return null; // 判定为普通对话，不触发继承

  const finalStage = Math.max(1, Math.min(16, explicitStage || inferredStage || 1));
  return {
    isInherited: true,
    targetStage: finalStage,
    summaryText: t.replace(/^[\/／](?:继承|读档|恢复)\s*/, '')
  };
}

console.log('--- 测试用例 1: 玩家第 1 楼发大总结（带前缀） ---');
const sample1 = '【前情大总结】我们在天溪城破之后，玄机子装伤脱身，叶红缨灼酒流炎穴成形破身。如今天溪城破，赵无忧坠入葬魔渊，孤月前往中洲。承接本段继续。';
console.log(detectInheritance(sample1, 1, 1));

console.log('--- 测试用例 2: 玩家第 1 楼发命令 ---');
const sample2 = '/继承 第12段 封元镇灵环暴露，叶红缨被残阳老怪擒获，赵无忧坠渊。';
console.log(detectInheritance(sample2, 1, 1));

console.log('--- 测试用例 3: 玩家第 1 楼发无前缀总结但包含核心剧情 ---');
const sample3 = '承接上一把，天溪城破之后巨猿破城，赵无忧坠入葬魔渊醒来。';
console.log(detectInheritance(sample3, 1, 1));

console.log('--- 测试用例 4: 玩家正常开局聊天（绝不能误触发！） ---');
const sample4 = '大师姐，今日天气不错，我们去孤剑崖练剑吧。';
console.log(detectInheritance(sample4, 1, 1));

console.log('--- 测试用例 5: 在第 50 楼正常聊天偶然提到“上一次”（绝不能误触发！） ---');
const sample5 = '红缨，上一次在墨山道我们也是这般说话的。';
console.log(detectInheritance(sample5, 50, 4));
