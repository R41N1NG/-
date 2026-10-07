const fs = require('fs');
const path = require('path');

const novelPath = 'E:/火狐下载/[仙姝墮] 1-49+番外 作者：_肉山佛.txt';
const wbPath = 'references/仙姝墮-世界书.json';

const novelLines = fs.readFileSync(novelPath, 'utf8').split('\n');

// 1. Chapter 2 core erotic excerpt: lines 243 to 274
const ch2CoreLines = novelLines.slice(243, 274).map(l => l.trim()).filter(l => l.length > 0);
const ch2CoreText = ch2CoreLines.join('\n\n');

// 2. Chapter 3 core erotic excerpt: lines 634 to 676
const ch3CoreLines = novelLines.slice(634, 676).map(l => l.trim()).filter(l => l.length > 0);
const ch3CoreText = ch3CoreLines.join('\n\n');

console.log('Ch2 core text length:', ch2CoreText.length);
console.log('Ch3 core text length:', ch3CoreText.length);

const entry30Content = `@@if (variables.stat_data?.段位 >= 1 || true)
<plot>
<!-- 〔质检豁免〕 原文照录 -->
# 邪修洞府解毒、极乐引与九幽玄阴穴暴露
## 时点
- 时点：第二章 · 全书总引线。｜仙盟历时点：1578 年 · 四月。

## 背景过场（极简交代）
- 墨山道二人剿灭花间二鬼。暗室伏击中，伏兵袖中暴射出「鎏金缠情丝」纯金灵蛇，{{user}} 挺身为掩护孤月被噬中蛊。
- 洞内密室搜出《极乐引》，名器谱曝光孤月至阴体质「九幽玄阴穴」，并明载唯一解法：男子中蛊，需纯阴灵脉女子口含玄阴甘津，度入阳根本源导引归元方解；十二时辰不解则经脉焚尽、爆体而亡。孤月断然决定施救。

## 核心事件 · 密室解蛊（关键福利段落 · 原文照录）
- 【节奏约束】：本回合正文必须专注展开密室解毒互动的神态、触感与冰火交锋，严禁一笔带过，严禁擅自跳至换衣离开或回宗门！

${ch2CoreText}

## 事后平复与后续铁律承接（必须在解毒交互充分展开后方可过渡）
- 待神智清明，孤月立起平复喘息，强撑淡漠：「不必。方才若非你推开我，此刻中毒的便是我。若是我……便需男女阴阳交合方能解毒。」随后命其背身，未设防护结界，当场褪下染污外袍更衣，二人由此暗生不可言说的至密信任。
- 孤月以剑气轰塌摧毁密室。回宗后炎雷子当面以紫色雷殛彻底焚毁《极乐引》。
- 随后接天枢剑宗传讯：幽寂谷秘境开启，上古禁制仅容元婴以下修士进入。炎雷子命玄机子、叶红缨与同行领队带队前往。
- 【红线警告】：严禁在此处直接跳跃至天溪城兽潮战事！下一步必须严格进入幽寂谷秘境！
- 【收尾铁律】：本轮输出正文（及总结）后，结尾必须严格输出完整的 <Status_block> … </Status_block>，绝对严禁遗漏！
</plot>`;

const entry31Content = `@@if (variables.stat_data?.段位 >= 2 || true)
<plot>
<!-- 〔质检豁免〕 原文照录 -->
# 幽寂谷秘境 · 禁制幻境与红尘业火
## 时点
- 时点：第四—五章。｜仙盟历时点：1578 年 · 六月—七月。

## 背景过场（极简交代）
- 天枢剑宗传讯幽寂谷秘境开启，上古禁制仅容元婴以下进入。墨山道炎雷子命赵无忧、叶红缨、玄机子三人带队，率二十名核心弟子历练。
- 谷内战退裂地妖熊后，玄机子以探查未启古阵为由，劝说叶红缨同往，将其诱入幽谷最深处的隐秘石室，其余人留守营地。
- 石室为四壁如镜之粉雾温汤洞窟，四周石壁激射粉色能量枷锁紧缚手足，引动情欲幻障。玄机子佩戴清凉玉佩保持清醒，叶红缨深陷幻境将眼前之人错认为赵无忧，由刚烈化为迷离娇软。

## 核心事件 · 幽谷石室危机（关键福利段落 · 原文照录）
- 【节奏约束】：本回合正文必须专注展开幽谷石室内的试探、私密饰物暴露与肢体推拉，细致展开动作、触感与神态拉扯，严禁一笔带过，严禁擅自跳至脱困归营或回宗门！

${ch3CoreText}

## 事后要挟与剧情推进（必须在石室危机充分展开后方可过渡）
- 玄机子苏醒后，以地面未干的爱液水渍与守身秘密要挟叶红缨隐忍封口；叶红缨盛怒羞愤之下顾念大局未下杀手，强撑冷峻同回营地。
- 暮风拂过空无一物下身的微颤，面对赵无忧迎面关切，叶红缨眼神闪烁慌乱遮掩；赵无忧虽心生疑虑，仍按下未表。拐角处叶红缨低声警告，玄机子反唇相讥。
- **强制承接导轨（下一步必经大势 · 严禁跳步）**：
  1. 历练归宗后，第一步必经【剧情】四：天地剧变，南域神诅降临（元婴尽陨），魔道四殿主秘密立「天姝会」（关键词：**南域大劫**／**天姝会**／**神诅**／**天姝令**）；
  2. 第二步必经【剧情】五：墨山道孤剑崖洞府送别，孤月主动仰头封吻赵无忧，并亲手为其戴上定情信物「冰心泪」（关键词：**孤剑崖**／**冰心泪**／**送别**／**定情**）；
  3. 第三步方可开拔南下并触发【剧情】六（初抵天溪与结识听雪双姝）；
  - 【红线死锁警告】：严禁在未完成南域神诅降临与孤剑崖送别赠泪之前，擅自跳关提前开赴任何外宗战事！
- 旁白禁泄：秘境洞中丑事不得由旁白提前断言；叶红缨之避人只许以神情举止侧写。
- 【收尾铁律】：本轮输出正文（及总结）后，结尾必须严格输出完整的 <Status_block> … </Status_block>，绝对严禁遗漏！
</plot>`;

const wb = JSON.parse(fs.readFileSync(wbPath, 'utf8'));
wb.entries['30'].content = entry30Content;
wb.entries['31'].content = entry31Content;

fs.writeFileSync(wbPath, JSON.stringify(wb, null, 2), 'utf8');
console.log('Successfully refined Chapter 2 and Chapter 3 in references/仙姝墮-世界书.json!');
console.log('Entry 30 total length:', entry30Content.length);
console.log('Entry 31 total length:', entry31Content.length);
