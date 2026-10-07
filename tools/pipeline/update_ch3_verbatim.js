const fs = require('fs');
const path = require('path');

const novelPath = 'E:/火狐下载/[仙姝墮] 1-49+番外 作者：_肉山佛.txt';
const wbPath = 'references/仙姝墮-世界书.json';

const novelLines = fs.readFileSync(novelPath, 'utf8').split('\n');
// Chapter 5 is lines 553 to 731 (0-indexed lines 553 to 730)
// Let's get lines 553 to 731
const ch5Lines = novelLines.slice(553, 731);
const ch5Text = ch5Lines.map(l => l.trim()).filter(l => l.length > 0).join('\n\n');

console.log('Chapter 5 text lines count:', ch5Lines.length);
console.log('Chapter 5 text char count:', ch5Text.length);

const entry31Content = `@@if (variables.stat_data?.段位 >= 2 || true)
<plot>
<!-- 〔质检豁免〕 原文照录 -->
# 幽寂谷秘境 · 禁制幻境与红尘业火（原文全篇照录）
## 时点
- 时点：第四—五章。｜仙盟历时点：1578 年 · 六月—七月。

## 背景过场（极简交代）
- 天枢剑宗传讯幽寂谷秘境开启，上古禁制仅容元婴以下进入。墨山道炎雷子命赵无忧、叶红缨、玄机子三人带队，率二十名核心弟子历练。
- 谷内灰瘴密布，战退裂地妖熊后，玄机子以探查未启古阵为由，当着赵无忧面劝说叶红缨，将其单独诱入幽谷最深处的隐秘石室，其余人留守营地。
- 石室为四壁如镜之粉雾温汤洞窟，四周石壁激射粉色能量枷锁禁锢行动，并释放惑心幻力侵入识海。玄机子佩戴清凉玉佩保持清醒，叶红缨则深陷情欲幻障，将眼前之人错认为赵无忧。

## 核心事件 · 原文全篇照录（严禁跳步概括）
- 【节奏约束】：本回合正文必须完全专注描写幽谷深处石室内的试探、情欲幻境与肢体推拉，细致展开动作、触感与神态拉扯，严禁一笔带过，严禁擅自跳至脱困归营或回宗门！

${ch5Text}

## 剧情推进与后续承接（必须在石室危机充分展开后方可过渡）
- 幽寂谷历练落幕，墨山道队伍整队回宗。
- **强制承接导轨（下一步必经大势 · 严禁跳步）**：
  1. 历练归宗后，第一步必经【剧情】四：天地剧变，南域神诅降临（全书天花板，元婴尽陨），魔道四殿主秘密立「天姝会」（关键词：**南域大劫**／**天姝会**／**神诅**／**天姝令**）；
  2. 第二步必经【剧情】五：墨山道孤剑崖洞府送别，孤月主动仰头封吻赵无忧，并亲手为其戴上定情信物「冰心泪」（关键词：**孤剑崖**／**冰心泪**／**送别**／**定情**）；
  3. 第三步方可开拔南下并触发【剧情】六（初抵天溪与结识听雪双姝）；
  - 【红线死锁警告】：严禁在未完成南域神诅降临与孤剑崖送别赠泪之前，擅自跳关提前开赴任何外宗战事！
- 旁白禁泄：秘境洞中丑事不得由旁白提前断言；叶红缨之避人只许以神情举止侧写。
- 【收尾铁律】：本轮输出正文（及总结）后，结尾必须严格输出完整的 <Status_block> … </Status_block>，绝对严禁遗漏！
</plot>`;

const wb = JSON.parse(fs.readFileSync(wbPath, 'utf8'));
wb.entries['31'].content = entry31Content;

fs.writeFileSync(wbPath, JSON.stringify(wb, null, 2), 'utf8');
console.log('Successfully written verbatim Chapter 5 to references/仙姝墮-世界书.json (entry 31).');
console.log('Total content length of entry 31:', entry31Content.length);
