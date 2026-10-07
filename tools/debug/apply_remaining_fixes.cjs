const fs = require('fs');
const { execSync } = require('child_process');

console.log('=== 开始执行剩余修复落盘（不重复另一个对话已完成的内容） ===\n');

const wbPath = '仙姝墮-世界书.json';
const cardPath = '仙姝墮-角色卡（全书群像）.json';
const smPath = '卡片脚本/状态机.js';
const p3TxtPath = 'scratch/plot3_v5.txt';

const wb = JSON.parse(fs.readFileSync(wbPath, 'utf8'));
const card = JSON.parse(fs.readFileSync(cardPath, 'utf8'));
let smContent = fs.readFileSync(smPath, 'utf8');

// 1. 同步 P3 内容（消除诱跳词，正向焊死主线导轨）
console.log('1. 同步 P3 导轨更新...');
const p3UpdatedContent = fs.readFileSync(p3TxtPath, 'utf8');
const wbKeys = Object.keys(wb.entries);
const wbP3Key = wbKeys.find(k => wb.entries[k]?.comment?.includes('【剧情】三'));
if (wbP3Key) {
  wb.entries[wbP3Key].content = p3UpdatedContent;
  console.log(`  世界书 Entry ${wbP3Key} (P3) 已更新。`);
}

const cardEntries = card.data.character_book.entries;
const cardP3 = cardEntries.find(e => e.comment && e.comment.includes('【剧情】三'));
if (cardP3) {
  cardP3.content = p3UpdatedContent;
  console.log('  角色卡 P3 已更新。');
}

// 2. 解除【剧情四】至【剧情十五】宏门禁时序死锁 (J1 铁律)
console.log('\n2. 解除【剧情四】至【剧情十五】宏门禁时序死锁...');
const plotNames = ['四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'];

plotNames.forEach(num => {
  const commentTag = `【剧情】${num}`;
  
  // 世界书处理
  const wbKey = wbKeys.find(k => wb.entries[k]?.comment?.includes(commentTag));
  if (wbKey) {
    const entry = wb.entries[wbKey];
    let lines = entry.content.split('\n');
    if (lines[0].includes('@@if') && lines[0].includes('仙盟历')) {
      lines[0] = `@@if ((variables.stat_data?.身份 ?? '赵无忧') === '赵无忧')`;
      entry.content = lines.join('\n');
      console.log(`  世界书 ${commentTag} 门禁已放宽: ${lines[0]}`);
    }
    
    // 针对 P4 / P5 / P6 强化关键触发词与末尾闭环
    if (num === '四') {
      const extraKeys = ['整队回宗', '历练归来', '幽寂谷历练落幕', '回宗', '大殿复命'];
      entry.key = Array.from(new Set([...(entry.key || []), ...extraKeys]));
      if (!entry.content.includes('【收尾铁律】')) {
        entry.content = entry.content.replace('</plot>', '- 【收尾铁律】：本轮输出正文（及总结）后，结尾必须严格输出完整的 <Status_block> … </Status_block>，绝对严禁遗漏！\n</plot>');
      }
    } else if (num === '五') {
      const extraKeys = ['驰援', '准备出发', '南下', '动身', '行装'];
      entry.key = Array.from(new Set([...(entry.key || []), ...extraKeys]));
      if (!entry.content.includes('【收尾铁律】')) {
        entry.content = entry.content.replace('</plot>', '- 【收尾铁律】：本轮输出正文（及总结）后，结尾必须严格输出完整的 <Status_block> … </Status_block>，绝对严禁遗漏！\n</plot>');
      }
    } else if (num === '六') {
      const extraKeys = ['抵达天溪', '初入天溪', '天溪城外', '天溪城下'];
      entry.key = Array.from(new Set([...(entry.key || []), ...extraKeys]));
      if (!entry.content.includes('【收尾铁律】')) {
        entry.content = entry.content.replace('</plot>', '- 【收尾铁律】：本轮输出正文（及总结）后，结尾必须严格输出完整的 <Status_block> … </Status_block>，绝对严禁遗漏！\n</plot>');
      }
    }
  }

  // 角色卡处理
  const cardEntry = cardEntries.find(e => e.comment && e.comment.includes(commentTag));
  if (cardEntry) {
    let lines = cardEntry.content.split('\n');
    if (lines[0].includes('@@if') && lines[0].includes('仙盟历')) {
      lines[0] = `@@if ((variables.stat_data?.身份 ?? '赵无忧') === '赵无忧')`;
      cardEntry.content = lines.join('\n');
    }
    if (num === '四') {
      const extraKeys = ['整队回宗', '历练归来', '幽寂谷历练落幕', '回宗', '大殿复命'];
      cardEntry.key = Array.from(new Set([...(cardEntry.key || []), ...extraKeys]));
      if (!cardEntry.content.includes('【收尾铁律】')) {
        cardEntry.content = cardEntry.content.replace('</plot>', '- 【收尾铁律】：本轮输出正文（及总结）后，结尾必须严格输出完整的 <Status_block> … </Status_block>，绝对严禁遗漏！\n</plot>');
      }
    } else if (num === '五') {
      const extraKeys = ['驰援', '准备出发', '南下', '动身', '行装'];
      cardEntry.key = Array.from(new Set([...(cardEntry.key || []), ...extraKeys]));
      if (!cardEntry.content.includes('【收尾铁律】')) {
        cardEntry.content = cardEntry.content.replace('</plot>', '- 【收尾铁律】：本轮输出正文（及总结）后，结尾必须严格输出完整的 <Status_block> … </Status_block>，绝对严禁遗漏！\n</plot>');
      }
    } else if (num === '六') {
      const extraKeys = ['抵达天溪', '初入天溪', '天溪城外', '天溪城下'];
      cardEntry.key = Array.from(new Set([...(cardEntry.key || []), ...extraKeys]));
      if (!cardEntry.content.includes('【收尾铁律】')) {
        cardEntry.content = cardEntry.content.replace('</plot>', '- 【收尾铁律】：本轮输出正文（及总结）后，结尾必须严格输出完整的 <Status_block> … </Status_block>，绝对严禁遗漏！\n</plot>');
      }
    }
  }
});

// 3. 状态机脚本增加容错保底推进 (applyStatusToVars)
console.log('\n3. 为状态机增加容错保底时钟推进...');
const oldCheck = `  if (!p.found) {
    console.log(TAG, \`[状态条] 第 \${messageId} 楼没有状态条（<Status_block>／<status>／<StatusBlock> 都没找到）\`);
    return null;
  }`;

const newFallback = `  if (!p.found) {
    console.log(TAG, \`[状态条] 第 \${messageId} 楼没有状态条（<Status_block>／<status>／<StatusBlock> 都没找到），启动容错保底时钟推进\`);
    try { await ensureInit(\`第 \${messageId} 楼前·容错\`); } catch (e) {}
    try {
      const sdNow = readStatData() || {};
      const pin = (sdNow[FLOOR_PIN] && typeof sdNow[FLOOR_PIN] === 'object') ? sdNow[FLOOR_PIN] : null;
      const stg = stageOfFloor(messageId, pin ? pin.shift : 0);
      if (stg >= 1) {
        const segIdx = Math.max(0, Math.min(SEG_TIME.length - 1, stg - 1));
        const baseT = SEG_TIME[segIdx];
        const patch = {
          段位: stg,
          仙盟历: baseT,
          仙盟历文: fmtXianmeng(baseT)
        };
        await writeStat(patch, \`第 \${messageId} 楼容错保底时钟推进\`);
      }
    } catch (err) {
      console.warn(TAG, \`[状态条·容错保底] 异常：\`, msgOf(err));
    }
    return null;
  }`;

if (smContent.includes(oldCheck)) {
  smContent = smContent.replace(oldCheck, newFallback);
  fs.writeFileSync(smPath, smContent, 'utf8');
  console.log('  卡片脚本/状态机.js 已注入容错保底推进。');
} else {
  console.log('  状态机.js 中未匹配到旧检测代码或已更新过。');
}

// 同步状态机到 card.data.extensions.tavern_helper.scripts[1]
if (card.data.extensions?.tavern_helper?.scripts?.[1]) {
  let cardSmContent = card.data.extensions.tavern_helper.scripts[1].content;
  if (cardSmContent.includes(oldCheck)) {
    cardSmContent = cardSmContent.replace(oldCheck, newFallback);
    card.data.extensions.tavern_helper.scripts[1].content = cardSmContent;
    console.log('  角色卡内嵌状态机脚本已同步更新。');
  }
}

// 保存世界书与角色卡 JSON
fs.writeFileSync(wbPath, JSON.stringify(wb, null, 2), 'utf8');
fs.writeFileSync(cardPath, JSON.stringify(card, null, 2), 'utf8');
console.log('\n4. 世界书与角色卡 JSON 已落盘保存。');

// 5. 重新生成角色卡 PNG
console.log('\n5. 重新打包角色卡 PNG...');
try {
  const buildOut = execSync('& "C:\\Program Files\\nodejs\\node.exe" _make_card_png.mjs --apply', {
    shell: 'powershell.exe',
    encoding: 'utf8'
  });
  console.log(buildOut.trim());
} catch (e) {
  console.error('打包 PNG 失败:', e.message);
  process.exit(1);
}

// 6. 执行酒馆实机部署
console.log('\n6. 执行部署到酒馆并反向核验...');
try {
  const deployOut = execSync('& "C:\\Program Files\\nodejs\\node.exe" deploy_to_tavern.cjs', {
    shell: 'powershell.exe',
    encoding: 'utf8'
  });
  console.log(deployOut.trim());
} catch (e) {
  console.error('部署失败:', e.message);
  process.exit(1);
}

console.log('\n=== 全部剩余项修改与酒馆实机部署大功告成！===');
