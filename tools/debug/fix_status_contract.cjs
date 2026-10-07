const fs = require('fs');

const wbPath = '仙姝墮-世界书.json';
const cardPath = '仙姝墮-角色卡（全书群像）.json';

const wb = JSON.parse(fs.readFileSync(wbPath, 'utf8'));
const card = JSON.parse(fs.readFileSync(cardPath, 'utf8'));

const p1 = fs.readFileSync('scratch/plot1_v2.txt', 'utf8');
const p2 = fs.readFileSync('scratch/plot2_v5.txt', 'utf8');
const p3 = fs.readFileSync('scratch/plot3_v5.txt', 'utf8');

const enhancedContract = `<output_contract>
# 收尾契约（最高优先级硬约束）
## 绝对格式铁律
- 每回合输出的**绝对末尾**必须包含状态栏：\`<Status_block> … </Status_block>\`（字段与格式严格依照「状态栏模板」条，19个XML标签完整闭合）。
- 无论输出正文后是否带有 \`</game>\` 或 \`<summary>\`，\`<Status_block>\` 必须作为整条回复的**最终收尾段落**输出！
- 严禁在正文或 \`<summary>\` 之后直接终止！若未输出 \`<Status_block>\` 则判定为输出格式残缺！
</output_contract>
`;

// 1. 更新世界书条目
wb.entries[29].content = p1;
wb.entries[30].content = p2;
wb.entries[31].content = p3;
wb.entries[4].content = enhancedContract;
wb.entries[4].position = 'at_depth';
wb.entries[4].depth = 0;
wb.entries[4].insertion_order = 9999;
fs.writeFileSync(wbPath, JSON.stringify(wb, null, 2), 'utf8');
console.log('[1] 世界书更新完成 (Entry 4, 29, 30, 31)');

// 2. 更新角色卡条目与 depth_prompt
const entries = card.data.character_book.entries;
const c_p1 = entries.find(e => e.comment && e.comment.includes('【剧情】一'));
const c_p2 = entries.find(e => e.comment && e.comment.includes('【剧情】二'));
const c_p3 = entries.find(e => e.comment && e.comment.includes('【剧情】三'));
const c_e4 = entries.find(e => e.comment && e.comment.includes('收尾契约'));

if (c_p1) c_p1.content = p1;
if (c_p2) c_p2.content = p2;
if (c_p3) c_p3.content = p3;
if (c_e4) {
  c_e4.content = enhancedContract;
  c_e4.position = 'at_depth';
  c_e4.depth = 0;
  c_e4.insertion_order = 9999;
}

// 强化 depth_prompt
if (card.data.extensions && card.data.extensions.depth_prompt) {
  let dp = card.data.extensions.depth_prompt.prompt || '';
  if (!dp.includes('【终极格式铁律】')) {
    dp = `【终极格式铁律】：每条回复的绝对最后一段必须是 <Status_block> … </Status_block>！即使正文末尾包含 </game> 或 <summary> 标签，也必须在它们之后紧随输出完整的 <Status_block> … </Status_block>，绝对严禁遗漏！\n\n` + dp;
    card.data.extensions.depth_prompt.prompt = dp;
    console.log('[2] depth_prompt 已强化注入状态栏终极铁律');
  }
}

fs.writeFileSync(cardPath, JSON.stringify(card, null, 2), 'utf8');
console.log('[3] 角色卡 JSON 更新完成');
