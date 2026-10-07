const fs = require('fs');
const path = require('path');

const novelPath = 'E:/火狐下载/[仙姝墮] 1-49+番外 作者：_肉山佛.txt';
const wbPath = 'references/仙姝墮-世界书.json';

const novelLines = fs.readFileSync(novelPath, 'utf8').split('\n');
// Chapter 2 intimacy: lines 180 to 296
const ch2Lines = novelLines.slice(180, 296);
const ch2Text = ch2Lines.map(l => l.trim()).filter(l => l.length > 0).join('\n\n');

console.log('Chapter 2 text lines count:', ch2Lines.length);
console.log('Chapter 2 text char count:', ch2Text.length);

const entry30Content = `@@if (variables.stat_data?.段位 >= 1 || true)
<plot>
<!-- 〔质检豁免〕 原文照录 -->
# 邪修洞府解毒、极乐引与九幽玄阴穴暴露（原文全篇照录）
## 时点
- 时点：第二章 · 全书总引线。｜仙盟历时点：1578 年 · 四月。

## 核心事件 · 原文全篇照录（严禁跳步概括）
- 【节奏约束】：本回合正文必须完全专注描写密室施救当面互动，细致展开动作、触感与神态拉扯，严禁一笔带过，严禁擅自跳至换衣离开或回宗门！

${ch2Text}

## 这一段是全书引线与后续铁律承接（必须在解毒交互充分完成后方可过渡）
- 密室摧毁掩埋，回宗后炎雷子当面以紫色雷殛彻底焚毁《极乐引》。
- 随后接天枢剑宗传讯：幽寂谷秘境开启，上古禁制仅容元婴以下修士进入。炎雷子命玄机子、叶红缨与同行领队带队前往。
- 【红线警告】：严禁在此处直接跳跃至天溪城兽潮战事！下一步必须严格进入幽寂谷秘境！
- 【收尾铁律】：本轮输出正文（及总结）后，结尾必须严格输出完整的 <Status_block> … </Status_block>，绝对严禁遗漏！
</plot>`;

const wb = JSON.parse(fs.readFileSync(wbPath, 'utf8'));
wb.entries['30'].content = entry30Content;

fs.writeFileSync(wbPath, JSON.stringify(wb, null, 2), 'utf8');
console.log('Successfully written verbatim Chapter 2 to references/仙姝墮-世界书.json (entry 30).');
console.log('Total content length of entry 30:', entry30Content.length);
