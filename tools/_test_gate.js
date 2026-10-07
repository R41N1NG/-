const MQ_ANCHOR = {
  九幽玄阴穴: '九幽玄阴穴成形', 灼酒流炎穴: '灼酒流炎穴成形', 心魔茶璎乳: '心魔茶璎乳成形',
  般若菩提菊: '般若菩提菊成形', 北冥潮生穴: '北冥潮生穴成形', 灵犀同心穴: '灵犀同心成形',
  玉虎噙香乳: '玉虎噙香乳成形', 梅蕊穴: '梅蕊穴成形', 冰魄剑心穴: '冰魄剑心穴成形',
  清歌弦鸣穴: '清歌弦鸣穴成形', 流焰叠薪穴: '流焰叠薪穴成形', 凤凰羽花: '凤凰羽花成形',
};

const CN_NUMS = ['一', '二', '三', '四'];

function testGate(mqName, stageName, maxStages) {
  const cn = String(stageName).trim().slice(0, 1);
  const idx = CN_NUMS.indexOf(cn);
  if (idx < 0) return '';
  const currNum = idx + 1;
  const sa = `${mqName}${cn}阶段`;
  
  const parts = [];
  if (MQ_ANCHOR[mqName]) {
    parts.push(`variables.stat_data?.known?.['${MQ_ANCHOR[mqName]}'] === true`);
  }
  parts.push(`variables.stat_data?.known?.['${sa}'] === true`);
  
  if (currNum < maxStages) {
    const nextCn = CN_NUMS[currNum];
    const nextSa = `${mqName}${nextCn}阶段`;
    parts.push(`!variables.stat_data?.known?.['${nextSa}']`);
  }
  
  return '@@if ' + parts.map(x => `(${x})`).join(' && ');
}

console.log('--- 灼酒流炎穴 (4 stages) ---');
console.log('Stage 1:', testGate('灼酒流炎穴', '一阶段（落红）', 4));
console.log('Stage 2:', testGate('灼酒流炎穴', '二阶段（情动）', 4));
console.log('Stage 3:', testGate('灼酒流炎穴', '三阶段（沉沦）', 4));
console.log('Stage 4:', testGate('灼酒流炎穴', '四阶段（极乐）', 4));

console.log('--- 北冥潮生穴 (3 stages) ---');
console.log('Stage 1:', testGate('北冥潮生穴', '一阶段（落红）', 3));
console.log('Stage 2:', testGate('北冥潮生穴', '二阶段（情动）', 3));
console.log('Stage 3:', testGate('北冥潮生穴', '三阶段（沉沦）', 3));

console.log('--- 烟霞灵乳 (3 stages, no anchor) ---');
console.log('Stage 1:', testGate('烟霞灵乳', '一阶段（落红）', 3));
console.log('Stage 2:', testGate('烟霞灵乳', '二阶段（情动）', 3));
console.log('Stage 3:', testGate('烟霞灵乳', '三阶段（沉沦）', 3));
