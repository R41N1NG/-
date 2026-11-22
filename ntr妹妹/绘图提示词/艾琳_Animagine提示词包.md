# 艾琳 · Animagine XL 提示词包 v1

> **角色定位**：艾尔德兰王国王都上层贵族千金 · 特派边境三等巡查使
> **年龄**：20 岁 · 高挑纤细（约 170cm）
> **堕落曲线**：**尊严崩塌型**（高傲 → 动摇 → 惊惶 → 崩溃），与前两位角色的被动沉沦完全不同
> 目标模型：Animagine XL 4.0（主）/ 3.1（兼容）
> 来源：`设定_世界观与奥克赫斯城镇全案.md` 第七节

---

## 零、档案锚点串的问题修正

交接文档里给的原始锚点串有 9 处会失效或互相打架，先修正：

| # | 原写法 | 问题 | 修正 |
|---|---|---|---|
| 1 | `eileen` | 不是 Danbooru 角色 tag，模型不认识，只稀释权重 | 删掉 |
| 2 | `20yo` | 不是标准 tag | `adult, mature female` |
| 3 | `platinum blonde hair` | 不一定存在，可能被解析成两个词 | `blonde hair, (platinum blonde hair:1.2)` 双写兜底 |
| 4 | `ice blue eyes` | 同上 | `blue eyes, (ice blue eyes:1.15)` |
| 5 | `royal inspector uniform` | 不存在，会随机生成制服 | `white coat, military jacket, double-breasted, gold trim` 拆成实词 |
| 6 | `haughty expression` | 不一定存在 | `smug, confident, looking down on viewer` |
| 7 | `gold trim skirt` | 不存在 | 删除，`gold trim` 已在服装串里 |
| 8 | `white boots, knee boots, high heels` | 三个冲突，且 `high heels` 会压掉靴型 | `white boots, (knee boots:1.2), heeled boots` |
| 9 | `rapier at waist` | `at waist` 不认，会污染 | `rapier, ornate sword, jeweled hilt` |
| 10 | `royal crest brooch` | 不存在 | `brooch, gold trim` |
| 11 | 裙子写「膝上三寸」但 tag 是 `knee-length` | 自相矛盾 | 改用 `(knee-length skirt:1.15)` 取及膝偏上，视觉一致 |

---

## 一、锚点

### 1.1 外观锚点（锁定层）

```
blonde hair, (platinum blonde hair:1.2), long hair, wavy hair, half updo, parted bangs,
blue eyes, (ice blue eyes:1.15),
adult, mature female, tall female, slender, pale skin,
```

| tag | 对应设定 |
|---|---|
| `platinum blonde hair` + `blonde hair` | 铂金色长卷发（双写兜底） |
| `long hair, wavy hair` | 垂至后腰的卷发 |
| `half updo, parted bangs` | 半扎公主头 + 中分刘海 |
| `ice blue eyes` + `blue eyes` | 冰蓝双眸 |
| `tall female, slender` | 20 岁高挑纤细 |
| `adult, mature female` | 年龄锁定 |

### 1.2 服装锚点（白金制服礼服）

```
white coat, military jacket, double-breasted, gold buttons, gold trim, high collar,
epaulettes, gold fringed epaulettes, (blue ascot:1.35), cravat, brooch, white gloves,
black belt, gold belt buckle,
white skirt, pleated skirt, (knee-length skirt:1.15),
(white thighhighs:1.3), zettai ryouiki,
white boots, (knee boots:1.2), heeled boots, leather boots, gold buckles,
rapier, ornate sword, jeweled hilt,
```

| 分组 | tag | 对应设定 |
|---|---|---|
| 上身 | `white coat, military jacket, double-breasted` | 白底金边双排扣修身制服礼服 |
| 细节 | `gold trim, high collar` | 金边、立领 |
| 肩章 | `epaulettes, gold fringed epaulettes` | 金色流苏肩章（标准拼写是 epaulettes） |
| 领结 | `(blue ascot:1.35), cravat` | **深蓝领结，见 1.3 制服锁定** |
| 腰带 | `black belt, gold belt buckle` | 黑色腰带 + 金扣 |
| 纽扣 | `gold buttons` | 双排金色纽扣 |
| 徽章 | `brooch` | 胸前皇家金徽 |
| 手 | `white gloves` | 白手套 |
| 裙 | `white skirt, pleated skirt` | 白底金边百褶制服裙 |
| 腿 | `(white thighhighs:1.3), zettai ryouiki` | 白色过膝袜 + 绝对领域 |
| 靴 | `white boots, (knee boots:1.2), heeled boots, leather boots, gold buckles` | 白色及膝皮革高跟长靴，靴口金扣 |
| 剑 | `rapier, ornate sword, jeweled hilt` | 蓝鞘金柄王家礼仪细刺剑 |

> **`heeled boots` 替代 `high heels`** 是关键修正。写 `high heels` 会让模型画出普通高跟鞋，把及膝靴的形态压掉；`heeled boots` 是"带跟的靴子"，两个特征同时保住。

### 1.3 制服锁定（本次重点修正）

出图反馈：蓝色领结**时有时无**。同一套设定，有的图有、有的图没有。

#### 根本原因三条

| # | 原因 | 说明 |
|---|---|---|
| 1 | `royal blue ascot` 不是标准 tag | `ascot` 是 Danbooru 真 tag，但 `royal blue` 只是颜色词，两者拼在一起不构成一个稳定物件，模型只认出"有个领上的东西" |
| 2 | **场景 6~8 的制服串里完全没有领结词** | 写的是 `unbuttoned, torn clothes`，模型顺理成章把领饰省略了 |
| 3 | 没有反向压制 | 模型可以自由选领型——领带、蝴蝶结、敞领，什么都不选 |

#### 修法四条

**① 权重绑定**
```
(blue ascot:1.35)
```
颜色和物件写在一起，且给到 1.35——这是本套里权重最高的服装单品。

**② 双写兜底**
```
blue ascot, cravat
```
`cravat`（领巾）是打结式领饰的另一个词，和 `ascot` 语义重叠但形态更接近图里那种宽结。两个一起写，任一个生效都能出来。

**③ 全场景覆盖（最关键）**

场景 6~8 也**必须**保留领结词，只是状态从"端正"变成"松脱"：

| 场景 | 领结写法 | 语义 |
|---|---|---|
| 1~3 | `(blue ascot:1.35)` | 端正 |
| 4~5 | `(blue ascot:1.35)` | 仍端正（还没被碰） |
| 6 | `(blue ascot:1.25), loose ascot, disheveled` | 松了、歪了 |
| 7 | `(blue ascot:1.2), loose ascot, undone` | 散开了 |
| 8 | `(blue ascot:1.2), loose ascot` | 还是挂着，只是塌了 |

> **核心原则：制服的解体必须是渐进的，不是一步消失。**
> 领结从正 → 歪 → 松 → 塌，观众才能认出"这是同一件制服在一步步散架"。
> 一旦领结在某个场景彻底不见，那张图就不再是"艾琳的制服"，只是"一件白衣服"。

**④ 负面压制**

```
necktie, black necktie, red bowtie, bare neck, open collar
```

| tag | 压掉什么 |
|---|---|
| `necktie, black necktie` | 模型默认给军装配领带 |
| `red bowtie` | 领饰跑色 |
| `bare neck` | 干脆不画领饰 |
| `open collar` | 立领被画开，领结没地方挂 |

#### 完整制服锁定串（每个场景照抄，只改结尾状态词）

```
white coat, military jacket, double-breasted, gold buttons, gold trim, high collar,
epaulettes, gold fringed epaulettes, (blue ascot:1.35), cravat, brooch, white gloves,
black belt, gold belt buckle,
white skirt, pleated skirt, (knee-length skirt:1.15),
(white thighhighs:1.3), zettai ryouiki,
white boots, (knee boots:1.2), heeled boots, leather boots, gold buckles,
```

这一串里每个组件都对应出图里能看到的东西，一个不多一个不少：

| 组件 | tag | 图中位置 |
|---|---|---|
| 白外套 | `white coat, military jacket` | 主体 |
| 双排扣 | `double-breasted, gold buttons` | 胸前两列金扣 |
| 金边 | `gold trim` | 领口、袖口、裙摆边缘 |
| 立领 | `high collar` | 脖颈 |
| 肩章 | `epaulettes, gold fringed epaulettes` | 双肩金色流苏 |
| **蓝领结** | **`(blue ascot:1.35), cravat`** | **锁骨处** |
| 金徽 | `brooch` | 左胸 |
| 白手套 | `white gloves` | 双手 |
| 黑腰带 | `black belt, gold belt buckle` | 腰部 |
| 百褶裙 | `white skirt, pleated skirt` | 下身 |
| 过膝袜 | `(white thighhighs:1.3)` | 腿部 |
| 白长靴 | `white boots, (knee boots:1.2), heeled boots` | 小腿 |

### 1.4 表情锚点（骄傲崩塌四档）

| 阶段 | tag 组合 | 用于 |
|---|---|---|
| 高傲矜持 | `smug, confident, looking down on viewer, half-closed eyes, closed mouth` | 场景 1、2 |
| 虚妄自信 | `confident smile, closed eyes, smiling, holding scroll` | 场景 2、3 |
| 动摇惊惶 | `surprised, wide-eyed, flustered, nervous, sweatdrop, trembling, open mouth` | 场景 4、5 |
| 崩溃臣服 | `tears, crying, despair, empty eyes, broken, disheveled` | 场景 6、7、8 |

> 艾琳的表情主线和前两位角色相反：**奥萝拉是歉意→空洞，妮丝是坏笑→臣服，艾琳是俯视→仰视**。
> 这个"视线方向的变化"是她堕落曲线的核心视觉：场景 1 用 `looking down on viewer`，场景 8 一定要换成 `looking up` 或 `looking away`。

---

## 二、镜头设计的对称性

这一处值得单独说，因为它是艾琳和其他角色最大的区别：

| 角色 | 身高感 | 镜头 | 为什么 |
|---|---|---|---|
| 妮丝（娇小） | 要显小 | `from above` 俯拍 | 俯拍压低存在感 |
| **艾琳（高挑上位者）** | 要显威仪 | **`from below` 仰拍** | **仰拍抬高存在感** |

艾琳的身份是"王都来的大人"，所以场景 1~3 必须用 `from below`——让她看起来高高在上、不可撼动。**等到场景 6 之后，镜头要慢慢转成 `high angle`**，这个视角的翻转本身就是"权力翻转"的视觉语言。

---

## 三、8 场景完整提示词

### 挣扎强度曲线（按性格设计）

艾琳和奥萝拉、妮丝最大的行为差异就在这里。奥萝拉是"不会反抗"，妮丝是"半推半就"，**艾琳是"真的会还手"**——她是持剑的巡查使，有贵族式的骄横，也真的相信自己占着法理。所以她的挣扎不是装饰，是性格本身。

| 场景 | 阶段 | 情绪 | 挣扎 | 关键动作 |
|---|---|---|---|---|
| 1-3 | 莅临 / 亮诏 / 筵席 | 高傲 | ☆ | 手按腰际，俯视众人 |
| 4 | 察觉不对 | 不安 | ★ | 手按自己手臂，回头张望 |
| 5 | 被围 | 慌乱 | ★☆ | 后退贴墙，**剑还没拔** |
| 6 | 被抓住 | **愤怒** | **★★★★★** | **踢、扭、抓、喊、伸手够剑** |
| 6B | 被压住 | 僵持 | ★★★★ | 瞪视、咬到对方、攥拳 |
| 7 | 力尽 | **不甘** | ★★☆ | 瞪视、握拳、喘，**眼睛还是活的** |
| 8 | 崩溃 | 空洞 | ☆ | 抱膝、低头、不看人 |

**设计原则**：呻吟和眼泪不能替代反抗。她可以被打败，但不能一开始就怕——**怕得太早，前面三张的骄傲就白画了。**

### 挣扎强度的可调参数

主人如果要调力度，只动这三个权重：

| 想要的效果 | 写法 |
|---|---|
| 更激烈 | `(struggling:1.3), thrashing, kicking, motion blur` |
| 标准 | `struggling, fighting, kicking` |
| 减弱（快撑不住了） | `(struggling:0.8), exhausted, panting` |

---

### 场景 1 · 巡查使莅临（贵族风采 · 全套制服展示）

**分级**：`general` ｜ **镜头**：`from below` + `full body`

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
1girl, solo,
blonde hair, (platinum blonde hair:1.2), long hair, wavy hair, half updo, parted bangs,
blue eyes, (ice blue eyes:1.15),
adult, mature female, tall female, slender, pale skin,
white coat, military jacket, double-breasted, gold buttons, gold trim, high collar,
epaulettes, gold fringed epaulettes, (blue ascot:1.35), cravat, brooch, white gloves,
black belt, gold belt buckle,
white skirt, pleated skirt, (knee-length skirt:1.15),
(white thighhighs:1.3), zettai ryouiki,
white boots, (knee boots:1.2), heeled boots, leather boots, gold buckles,
rapier, ornate sword, jeweled hilt,
standing, hand on hip, wind, hair blowing,
smug, confident, looking down on viewer, half-closed eyes,
outdoor, town gate, dirt road, countryside, distant mountains,
full body, from below, sunlight, rim light, crisp atmosphere
```

### 场景 2 · 亮出诏书（公文护甲幻想）

**分级**：`general` ｜ **镜头**：`from below` + `cowboy shot`

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
1girl, solo,
blonde hair, (platinum blonde hair:1.2), long hair, wavy hair, half updo, parted bangs,
blue eyes, (ice blue eyes:1.15),
adult, mature female, tall female, slender, pale skin,
white coat, military jacket, double-breasted, gold buttons, gold trim, high collar,
epaulettes, gold fringed epaulettes, (blue ascot:1.35), cravat, brooch, white gloves,
black belt, gold belt buckle,
white skirt, pleated skirt, (knee-length skirt:1.15),
(white thighhighs:1.3), zettai ryouiki,
white boots, (knee boots:1.2), heeled boots, gold buckles,
rapier, ornate sword, jeweled hilt,
standing, arm raised, holding scroll, scroll, document, royal seal, golden seal,
confident smile, closed eyes, smug, proud,
indoor, lord's manor, audience hall, carpet, ornate pillars, chandelier,
cowboy shot, from below, warm lighting, formal atmosphere
```

> `royal seal, golden seal` 一起写——单写 `scroll` 会画成普通卷轴，"金印"这个关键道具出不来。

### 场景 3 · 领主府筵席（捧杀开始）

**分级**：`sensitive` ｜ **镜头**：`medium shot` + `from below`

```
masterpiece, best quality, very aesthetic, absurdres, newest, sensitive,
1girl, 1boy,
blonde hair, (platinum blonde hair:1.2), long hair, wavy hair, half updo, parted bangs,
blue eyes, (ice blue eyes:1.15),
adult, mature female, tall female, slender, pale skin,
white coat, military jacket, double-breasted, gold buttons, gold trim, high collar,
epaulettes, gold fringed epaulettes, (blue ascot:1.35), cravat, brooch, white gloves,
black belt, gold belt buckle,
white skirt, pleated skirt, (knee-length skirt:1.15),
(white thighhighs:1.3), zettai ryouiki,
white boots, (knee boots:1.2), heeled boots, gold buckles,
sitting, on chair, dining table, wine glass, food, candles,
fat man, older male, bald, expensive clothes, flattery, bowing,
confident smile, smug, blush, slightly drunk, closed eyes,
indoor, lord's manor, banquet hall, long table, chandelier, warm lighting,
medium shot, from below, soft lighting, decadent atmosphere
```

> `flattery, bowing` 是捧杀的核心动作——胖领主在她面前躬身奉承，这个姿态差正好反衬"她自以为掌握权力"的错觉。

### 场景 4 · 随从被调离（察觉不对）

**分级**：`sensitive` ｜ **镜头**：`full body` + `high angle`（视角开始翻转）

```
masterpiece, best quality, very aesthetic, absurdres, newest, sensitive,
1girl, solo,
blonde hair, (platinum blonde hair:1.2), long hair, wavy hair, half updo, parted bangs,
blue eyes, (ice blue eyes:1.15),
adult, mature female, tall female, slender, pale skin,
white coat, military jacket, double-breasted, gold buttons, gold trim, high collar,
epaulettes, gold fringed epaulettes, (blue ascot:1.35), cravat, brooch, white gloves,
black belt, gold belt buckle,
white skirt, pleated skirt, (knee-length skirt:1.15),
(white thighhighs:1.3), zettai ryouiki,
white boots, (knee boots:1.2), heeled boots, gold buckles,
standing, alone, looking around, looking back, turning head,
surprised, wide-eyed, flustered, nervous, sweatdrop, open mouth,
hand on own arm, uncertain,
indoor, lord's manor, empty corridor, long hallway, candlelight, closed doors,
full body, high angle, dim lighting, uneasy atmosphere
```

> 这套制服第一次出问题的地方：`hand on own arm` 是紧张时下意识的自我安抚动作。比起直接画"害怕"，这个小动作更能说明"她开始意识到自己一个人在陌生地方"。

### 场景 5 · 宴会后被围（孤立无援）

**分级**：`sensitive` ｜ **镜头**：`from above` + `full body`

```
masterpiece, best quality, very aesthetic, absurdres, newest, sensitive,
1girl, 2boys,
blonde hair, (platinum blonde hair:1.2), long hair, wavy hair, half updo, parted bangs,
blue eyes, (ice blue eyes:1.15),
adult, mature female, tall female, slender, pale skin,
white coat, military jacket, double-breasted, gold buttons, gold trim, high collar,
epaulettes, gold fringed epaulettes, (blue ascot:1.35), cravat, brooch, white gloves,
black belt, gold belt buckle,
white skirt, pleated skirt, (knee-length skirt:1.15),
(white thighhighs:1.3), zettai ryouiki,
white boots, (knee boots:1.2), heeled boots, gold buckles,
rapier, ornate sword,
standing, surrounded, cornered, against wall, backed against wall,
fat man, older male, muscular male, dark skin, tall male,
looming, hand on wall, height difference,
surprised, wide-eyed, flustered, fear, sweatdrop, trembling, open mouth,
indoor, lord's manor, corridor, wall, candlelight,
full body, from above, dim lighting, oppressive shadow
```

> 注意 `rapier` 还在腰上——**她还没想到拔剑**。这个细节比任何表情都更能说明"公文护甲幻想"：手里有武器，但脑子里根本没有用武器的概念。

### 场景 6 · 拼死反抗（制服被扯开 · 挣扎最强）

**分级**：`explicit` ｜ **镜头**：`high angle` + `dutch angle` ｜ **挣扎强度**：★★★★★

按她的性格，被抓住的第一反应**不是发抖，是把对方的手拧断**。她是持剑的巡查使，有贵族式的骄横，也真的相信自己占着法理——所以这一张要画出「她在打」，而不是「她在怕」。

```
masterpiece, best quality, very aesthetic, absurdres, newest, explicit,
1girl, 1boy,
blonde hair, (platinum blonde hair:1.2), messy hair, disheveled hair, half updo undone, flying hair,
blue eyes, (ice blue eyes:1.15),
adult, mature female, tall female, slender, pale skin,
white coat, military jacket, double-breasted, unbuttoned, torn clothes, clothes pull,
gold buttons, gold trim, high collar, epaulettes, gold fringed epaulettes,
(blue ascot:1.25), loose ascot, disheveled,
white gloves, one glove removed, white gloves on floor,
black belt, gold belt buckle,
white skirt, pleated skirt, (knee-length skirt:1.15), skirt lift,
(white thighhighs:1.3), zettai ryouiki,
white boots, (knee boots:1.2), heeled boots, gold buckles,
rapier, ornate sword, on hip, reaching for sword, outstretched arm,
struggling, fighting, thrashing, kicking, knee up, twisting,
wrist grab, arm grab, hair grab, grabbed from behind, held wrists,
angry, glare, glaring, defiant, gritted teeth, shouting, screaming,
open mouth, v-shaped eyebrows, sweat, disheveled,
scratch marks, bruises,
fat man, older male, muscular male, dark skin, tall male,
indoor, lord's manor, bedroom, canopy bed, candlelight,
medium shot, high angle, dutch angle, motion blur, dramatic shadow
```

**这一张的五个动作要件**：

| 要件 | tag | 画面里发生什么 |
|---|---|---|
| **她在打** | `struggling, fighting, thrashing, kicking, knee up, twisting` | 身体在扭、腿在踢，不是静止被压 |
| **她在够剑** | `reaching for sword, outstretched arm, rapier, on hip` | **最关键的一条**——伸手去够腰间的剑，但够不到 |
| **她被抓住了** | `wrist grab, arm grab, hair grab, grabbed from behind` | 三个不同部位同时被抓，说明对方人多 |
| **她在吼** | `angry, glare, glaring, defiant, gritted teeth, shouting, screaming, open mouth` | 不是哭，是骂 |
| **她咬到人了** | `scratch marks, bruises` | 对方身上有她留下的痕迹 |

> **`reaching for sword` 是这张的灵魂。** 场景 5 里她的手还在剑上——那是不敢用；这一张她是真的去抓了，只是被按住了。
> 从「不敢拔剑」到「够不到剑」，中间跨过的正是她整个世界观。

**镜头语言**：`dutch angle`（倾斜构图）+ `motion blur`（动态模糊）——这两个是唯一能表达「激烈动作」的镜头词。不加的话，`struggling` 会被画成一张静止的四格表情。

> **构图建议**：这一张用 `1girl, 1boy` 而不是 `1girl, 2boys`。激烈动作 + 三个人物，SDXL 很容易画崩成一团。1v1 反而更稳，压迫感靠 `high angle` 和体型差来给。

### 场景 6B · 被压制的僵持（变体）

**分级**：`explicit` ｜ **镜头**：`high angle` + `close-up`

打不动了，但还不认。这一张只换动作段和镜头：

```
pinned down, on bed, arms pinned, wrist grab, restrained,
staring, glare, glaring, defiant, gritted teeth,
angry, tears of frustration, sweat, heavy breathing,
blood on lips, bite mark on arm,
close-up, high angle, shallow depth of field
```

> `blood on lips` 和 `bite mark on arm` 是双向的——她也咬了对方。`tears of frustration`（气哭的泪）和 `crying`（崩溃的哭）完全不同，别用错。

---

### 场景 7 · 力尽（动不了了，但还在瞪）

**分级**：`explicit` ｜ **镜头**：`high angle` + `pov` ｜ **挣扎强度**：★★☆

反抗从"用力"退到"用眼神"。这一张**不能**用 `broken` 或 `empty eyes`——那是场景 8 的事。她的眼睛必须还是活的，还带着恨。

```
masterpiece, best quality, very aesthetic, absurdres, newest, explicit,
1girl, 1boy,
blonde hair, (platinum blonde hair:1.2), messy hair, disheveled hair,
blue eyes, (ice blue eyes:1.15), tearful,
adult, mature female, tall female, slender, pale skin,
torn clothes, torn uniform, unbuttoned, gold buttons,
(blue ascot:1.2), loose ascot, undone, missing brooch, dirty,
white skirt, pleated skirt, skirt lift, (white thighhighs:1.3), zettai ryouiki,
white boots, (knee boots:1.2), heeled boots,
white gloves on floor, rapier on floor, document on floor, scroll on floor,
paper scattered, documents scattered,
lying on back, on floor, spread legs, sex, missionary,
fat man, older male, muscular male,
exhausted, tired, panting, heavy breathing, sweat, no longer resisting,
glare, glaring, defiant, gritted teeth, tears, crying, drool,
hand on floor, clenched fist,
indoor, lord's manor, bedroom, carpet, candlelight,
high angle, pov, dim lighting, dramatic shadow, wet skin
```

**这一张的两个关键点**：

| 要点 | tag | 含义 |
|---|---|---|
| **不认输** | `glare, glaring, defiant, gritted teeth` | 眼睛还在瞪，牙还咬着 |
| **但动不了** | `exhausted, tired, panting, no longer resisting` | 身体已经到极限 |
| **还有最后一点力气** | `hand on floor, clenched fist` | 手掌按在地上，握紧——她想撑起来，撑不动 |

> `no longer resisting` 这个 tag 是精确的：它不是"顺从"，是"打完了"。
> 配上 `glare` 就变成"我不服，但我打不动了"——这才是艾琳该有的样子。

> **`clenched fist` 是这张最重要的细节。** 手腕被按住、身体动不了的时候，手指还在攥紧。这一个小动作把「没被征服」四个字写死了。

> **`rapier on floor, document on floor, paper scattered`** —— 这三个是这一整套里最重要的道具语言。
> 「公文护甲幻想」的实体就是剑和诏书。它们躺在地上的时候，她的整套世界观也跟着躺下了。

### 场景 8 · 终局差分（王都的千金）

**分级**：`sensitive` ｜ **镜头**：`high angle` + `full body`

```
masterpiece, best quality, very aesthetic, absurdres, newest, sensitive,
1girl, solo,
blonde hair, (platinum blonde hair:1.2), messy hair, disheveled hair, half updo undone,
blue eyes, (ice blue eyes:1.15), empty eyes, tearful,
adult, mature female, tall female, slender, pale skin,
torn uniform, torn clothes, unbuttoned, gold buttons,
(blue ascot:1.2), loose ascot, missing brooch, dirty, stains,
white skirt, pleated skirt, torn skirt, (white thighhighs:1.3), zettai ryouiki, torn thighhighs,
white boots, (knee boots:1.2), heeled boots, gold buckles, dirty boots,
sitting, on floor, knees up, hugging own knees, looking down, looking away,
empty eyes, broken, despair, tears, crying, disheveled,
indoor, lord's manor, bedroom corner, carpet, candlelight,
full body, high angle, dim lighting, cold color, desolate atmosphere
```

> 和场景 1 是同一套制服、同一个人、同一种构图（都是全身）。区别只有两处：**镜头从 `from below` 变成 `high angle`，视线从 `looking down on viewer` 变成 `looking down`（低头看地）**。
> 这两张放一起当角色卡的首尾图，她身上发生了什么，不用一个字解释。

---

## 三·补、场景 9 · 领主情妇（贵妇装 · 顺从 · 白金版）

**分级**：`sensitive` ｜ **镜头**：`full body` + `from front`（立绘式，展示服装）
**对应状态**：终局 · 成为领主情妇
**真源**：`04_外部特派与修会角色.md` L46–48（外貌）、L39–41（公文护甲幻想 / 实战脱节 / 孤立陷阱）；`反派设定.txt` L13「用金币购买女性的服务，以领主权力合法化」

### 9.1 与奥萝拉情妇装的区分（这是本案重点）

两位都被领主收进去，但**不能像同一套衣服换个人穿**。区分轴是四个：

| 维度 | 奥萝拉 | **艾琳** |
|---|---|---|
| **主色** | 深蓝丝绒 | **白底金边**（原军礼服配色升格） |
| **剪裁** | 蓬裙 `crinoline`，横向膨胀 | **鱼尾修身 `mermaid silhouette`，垂直线** |
| **鞋** | 黑色高跟 | **白色及膝高跟长靴**（保留她的靴子锚点） |
| **珠宝** | 珍珠（柔） | **蓝宝石 + 后冠**（冷、硬） |
| **肩章** | 无 | **金流苏肩章保留一半**（军礼服的残影） |
| **头饰** | 头饰 | **`(tiara:1.15)` 后冠 + 公主头** |
| **光** | 暖烛光 | **冷光、高窗、冬日色** |
| **表情** | 温婉疲惫的认命 | **绷着的顺从**（硬，不是软） |

> 一句话分界：**奥萝拉是"被换上了贵妇装的女仆"，艾琳是"被卸了王徽的巡查使"。**

### 9.2 服装槽（白金贵妇装）

```
(gold dress:1.25), (golden gown:1.2), (long dress:1.2), (floor-length:1.1),
(champagne gold:1.15), (golden yellow:1.1), gold trim, (gold embroidery:1.25), (gold thread:1.15),
(ivory trim:1.05), gold brocade, satin, silk, (stiff fabric:1.1), (metallic sheen:1.1),
(mermaid silhouette:1.15), (fitted dress:1.2), (high waist:1.1), (vertical lines:1.05),
(high collar:1.2), (covered chest:1.15), (long sleeves:1.05),
(off shoulder:1.05), (bare shoulders:1.1), (backless:1.1),
(white fur trim:1.15), (ermine:1.1), (fur stole:1.05),
(diamond necklace:1.15), (sapphire:1.15), (blue gemstone:1.1), (jewelry:1.15),
(tiara:1.15), (crown:1.05), (hair ornament:1.05),
(gold epaulettes:1.1), (shoulder tassels:1.05), (brooch:1.1),
(opera gloves:1.2), (white gloves:1.15),
(white thigh boots:1.25), (knee-high boots:1.2), (high heels:1.15), (gold buckles:1.1),
```

| 部件 | 为什么这么给 |
|---|---|
| `(gold dress:1.25), (champagne gold:1.15), gold trim` | **金色主调**——她军礼服的配色，材质从呢料升成缎面，颜色往**香槟金**压，不是纯白 |
| `(gold embroidery:1.25), (gold thread:1.15), (metallic sheen:1.1)` | 金线刺绣 + 金线织物，让整件裙子在光下泛金 |
| **`(mermaid silhouette:1.15), (fitted dress:1.2)`** | **鱼尾修身**，与奥萝拉的 `crinoline` 蓬裙形成垂直 vs 横向的对立 |
| `(high collar:1.2), (covered chest:1.15)` | 胸口同样严实，领口立起——但她的立领是"军礼服立领"的余绪 |
| `(off shoulder:1.05), (backless:1.1)` | 肩与背仍可露，与奥萝拉同区但更少 |
| **`(sapphire:1.15), (diamond necklace:1.15)`** | **蓝宝石**呼应她的冰蓝双眸，与奥萝拉的珍珠各走一路 |
| **`(tiara:1.15)`** | 后冠——贵族的东西还留着，但主导权换了 |
| **`(gold epaulettes:1.1), (shoulder tassels:1.05)`** | **金流苏肩章留一半**：这是"她曾是谁"的唯一残影 |
| **`(brooch:1.1)`** | 胸前这枚胸针**替掉了原来的王徽**——她代表的王权被换成一件首饰 |
| **`(white thigh boots:1.25), (gold buckles:1.1)`** | **白色及膝高跟长靴**，她原设定里就有，必须留 |

> 🔴 **鱼尾裙配长靴要开衩**：`(side slit:1.2), (high slit:1.1)` 补上，否则靴子被裙摆完全吞掉，区分点就没了。

### 9.3 顺从表情（绷着的，不是软的）

```
(submissive:1.2), (obedient:1.15), (meek:1.1), (humble:1.05),
(downcast eyes:1.2), (lowered eyes:1.15), (looking down:1.15),
(expressionless:1.15), (tense:1.1), (stiff:1.1), (lips pressed:1.1),
(cold expression:1.05), (defeated:1.15), (resigned:1.05),
(light blush:1.0), (sweatdrop:1.0),
```

| 组 | tag | 说明 |
|---|---|---|
| 顺 | `(submissive:1.2), (obedient:1.15), (meek:1.1)` | 顺从 |
| 眼 | **`(downcast eyes:1.2), (lowered eyes:1.15)`** | 她的招牌是"下巴微扬、目光俯视"，现在反过来 |
| 绷 | **`(tense:1.1), (stiff:1.1), (lips pressed:1.1)`** | **关键的硬**：她不是在笑，是在忍 |
| 冷 | `(cold expression:1.05), (expressionless:1.15)` | 冷艳的底子还在，只是不朝向人 |
| 折 | `(defeated:1.15)` | 被压服，不是想通了 |

> **与奥萝拉的最大区别**：奥萝拉是 `(gentle smile:1.1), (sad smile:1.15)` —— 她还在笑；艾琳**一条 `smile` 都不给**，`(lips pressed:1.1)` + `(tense:1.1)` 才是"名门千金被磨平"的样子。
> 也不给 `(crying:1.1)`：她不哭，她绷着。哭是破防，绷着是还没认。

### 9.4 场景与镜头

```
indoor, (manor:1.15), (great hall:1.15), (marble floor:1.15), (tall windows:1.1),
(warm light:1.15), (candle light:1.15), (golden light:1.15), (luxurious:1.15), (chandelier:1.15),
(gold ornaments:1.1), (red carpet:1.05), (velvet curtains:1.1),
full body, from front, standing, (shoulders slumped:1.05), (head down:1.1),
(hands clasped in front:1.15),
(depth of field:1.1), wide shot,
```

**光线用暖金，不用清冷**：`(warm light:1.15), (candle light:1.15), (golden light:1.15)`。领主府是金碧辉煌的地方，冷光会把"被收进豪门"这件事拍成"被关进地牢"，情绪就偏了。
与奥萝拉的区分改在**色温之外的三个点**：主色（金 vs 深蓝）、剪裁（鱼尾 vs 蓬裙）、鞋（白长靴 vs 黑高跟）。

**姿态**：`(shoulders slumped:1.05), (head down:1.1)`——她原本是「脊背挺直、下巴微扬」（真源 L19），现在这两条都要反着给。

### 9.5 完整正面（主图 · 直接粘贴）

```
masterpiece, best quality, very aesthetic, absurdres, newest, sensitive,
1girl, solo, adult, mature female, tall female, slim,
platinum blonde hair, (platinum:1.2), (pale gold hair:1.15), long hair, wavy hair, (half updo:1.15),
(princess hairstyle:1.1), (center parting:1.1), blunt bangs,
blue eyes, (ice blue eyes:1.15), (sharp eyes:1.05), (eyelashes:1.05),
pale skin, (pale skin:1.05), (cold beauty:1.1), (sharp jawline:1.05),
(gold dress:1.25), (golden gown:1.2), (long dress:1.2), (floor-length:1.1),
(champagne gold:1.15), (golden yellow:1.1), gold trim, (gold embroidery:1.25), (gold thread:1.15),
(ivory trim:1.05), gold brocade, satin, silk, (stiff fabric:1.1), (metallic sheen:1.1),
(mermaid silhouette:1.15), (fitted dress:1.2), (high waist:1.1),
(high collar:1.2), (covered chest:1.15), (long sleeves:1.05),
(off shoulder:1.05), (bare shoulders:1.1), (backless:1.1),
(side slit:1.2), (high slit:1.1),
(white fur trim:1.15), (ermine:1.1),
(diamond necklace:1.15), (sapphire:1.15), (jewelry:1.15),
(tiara:1.15), (gold epaulettes:1.1), (shoulder tassels:1.05), (brooch:1.1),
(opera gloves:1.2), (white gloves:1.15),
(white thigh boots:1.25), (knee-high boots:1.2), (high heels:1.15), (gold buckles:1.1),
(submissive:1.2), (obedient:1.15), (meek:1.1),
(downcast eyes:1.2), (lowered eyes:1.15), (looking down:1.15),
(expressionless:1.15), (tense:1.1), (stiff:1.1), (lips pressed:1.1),
(cold expression:1.05), (defeated:1.15),
standing, (shoulders slumped:1.05), (head down:1.1), (hands clasped in front:1.15),
indoor, (manor:1.15), (great hall:1.15), (marble floor:1.15), (tall windows:1.1),
(warm light:1.15), (candle light:1.15), (golden light:1.15), (luxurious:1.15), (chandelier:1.15),
(gold ornaments:1.1), (red carpet:1.05), (velvet curtains:1.1), (portrait painting:1.05),
full body, from front, wide shot, (depth of field:1.1),
```

### 9.6 负面

```
(worst quality, low quality:1.4), bad anatomy, extra fingers, fused fingers, missing fingers,
deformed, disfigured, malformed limbs, mutated, extra arms, extra legs,
text, watermark, signature, censored, mosaic censoring,
(white shirt:1.1), (double breasted:1.15), (military uniform:1.2), (military jacket:1.15),
pleated skirt, (white pleated skirt:1.2), short skirt, miniskirt, (thighhighs:1.15), zettai ryouiki,
(pale blue necktie:1.1), necktie, (kingdom emblem:1.1), (royal crest:1.1), (badge:1.05),
smile, smiling, gentle smile, happy, laughing, coy, seductive, playful, teasing,
smug, evil smile, arrogant, confident, (proud:1.1), glaring, angry,
crying, tears, sobbing, ahegao, tongue out, half-closed eyes,
1boy, 2boys, male, older male, fat man, multiple boys, (male focus:1.1),
cleavage, nipples, areolae, exposed chest, breasts out, (deep neckline:1.15),
crinoline, (wide skirt:1.2), (puffy skirt:1.1), (navy dress:1.15), (dark blue dress:1.1), (velvet:1.1), (pearl necklace:1.15),
(white dress:1.25), (white gown:1.2), (pure white:1.15), (silver dress:1.1), (silver embroidery:1.15),
white hair, silver hair, (grey hair:1.1), ash blonde, bleached hair,
(cold light:1.2), (winter light:1.15), (blue tint:1.15), (cold color:1.1), (desaturated:1.05),
modern, office, business suit, necktie,
```

> 三组关键：
> - **压原制服**：`(military uniform:1.2), (double breasted:1.15), (white shirt:1.1), pleated skirt, thighhighs, necktie, (royal crest:1.1)` —— 不压的话会把军礼服加回来。
> - **压"另一套"**：`crinoline, (wide skirt:1.2), (navy dress:1.15), (velvet:1.1), (pearl necklace:1.15)` —— **这是防止撞奥萝拉的关键**，整套深蓝蓬裙珍珠都要压掉。
> - **压笑与哭**：`smile, happy, coy, seductive`（她不该笑）＋ `crying, tears`（她也不该哭，要绷着）。

### 9.7 参数

| 参数 | 值 |
|---|---|
| 分辨率 | **832×1216**（立绘竖构图，鱼尾裙与长靴都要进画） |
| Steps | 27 |
| CFG | 6.0 |
| Sampler | euler_ancestral |
| CLIP Set Last Layer | -2 |

### 9.8 三个可选变体

**变体 A · 跪姿奏事**（顺从最强，反差最大）

```
kneeling, (seiza:1.1), (kneeling on one knee:1.05), (head down:1.2), (eyes down:1.15),
(hands on own lap:1.1), (shoulders slumped:1.1),
(full dress spread on floor:1.1),
high angle, from above, (looking down at her:1.05),
```

**变体 B · 摘下的王徽**（把"她失去什么"摆在画里）

```
(broken emblem:1.1), (royal crest on floor:1.1), (discarded badge:1.05), (blue sheath rapier on floor:1.15),
on floor, (marble floor:1.15), (looking at floor:1.15), (downcast eyes:1.25), (tense:1.15),
```

**变体 C · 领主在侧**（接 `反派设定.txt` 胖领主）

```
1girl, 1boy, (fat man:1.2), (older male:1.15), (ugly:1.05), (rich clothes:1.1),
standing beside her, (hand on her shoulder:1.15), (possessive:1.1),
height difference, (downcast eyes:1.2), (lips pressed:1.15), (stiff:1.15), (submissive:1.15),
```

### 9.9 排错速查

| 症状 | 原因 | 修法 |
|---|---|---|
| 画成军礼服 | 原制服词回流 | 负面必加 `(military uniform:1.2), (double breasted:1.15), (white shirt:1.1), pleated skirt, thighhighs, necktie` |
| **和奥萝拉撞了** | 深蓝/蓬裙/珍珠没压 | 负面必加 `crinoline, (wide skirt:1.2), (navy dress:1.15), (velvet:1.1), (pearl necklace:1.15)`；正面锁 `(white gold:1.2), (mermaid silhouette:1.15)` |
| 长靴看不见 | 鱼尾裙遮住了 | `(side slit:1.2), (high slit:1.1), (white thigh boots:1.25)` 三条一起 |
| 表情还是骄傲 | 缺顺从组 | `(submissive:1.2), (downcast eyes:1.2), (shoulders slumped:1.05), (head down:1.1)` |
| 表情在笑 | 加了 `smile` 系列 | 删掉，只留 `(lips pressed:1.1), (tense:1.1), (expressionless:1.15)`；负面压 `smile, happy` |
| 表情在哭 | 顺从被理解成崩溃 | 负面压 `crying, tears, sobbing`；她要绷着不哭 |
| 认不出是艾琳 | 铂金发或冰蓝眼丢了 | `(silver blonde hair:1.15), (ice blue eyes:1.15), (half updo:1.15)` 三条锁死 |
| 王徽还在胸口 | 未替换 | 正面 `(brooch:1.1)`，负面压 `(kingdom emblem:1.1), (royal crest:1.1)` |
| 裙子画成纯白 | 缺金色主调 | `(gold dress:1.25), (champagne gold:1.15), (gold embroidery:1.25)`；负面压 `(white dress:1.25), (pure white:1.15), (silver dress:1.1)` |
| 发色发白 / 近银 | 铂金被读成银白 | `(platinum:1.2), (pale gold hair:1.15)`；负面压 `white hair, silver hair, ash blonde, grey hair` |
| 背景清冷 | 抄了旧版冷调 | `(warm light:1.15), (candle light:1.15), (golden light:1.15), (luxurious:1.15)`；负面压 `(cold light:1.2), (winter light:1.15), (blue tint:1.15), (cold color:1.1)` |

### 9.10 两张情妇装的并排对照

| | 奥萝拉 | 艾琳 |
|---|---|---|
| 头 | 深蓝直发 + **金丝圆框眼镜** | 铂金卷发 + **后冠** |
| 领 | 高领丝绒 | 立领军礼服式 + **金流苏肩章残影** |
| 胸 | 严实 + 珍珠 | 严实 + **蓝宝石** |
| 身 | **蓬裙**，横向 | **鱼尾**，竖向 |
| 主色 | **深蓝丝绒** | **香槟金缎面** |
| 脚 | 黑色高跟 | **白色及膝高跟长靴** |
| 手 | 白色及肘手套 | 及肘歌剧手套 |
| 光 | 暖烛光 | **暖金烛光 + 吊灯** |
| 表情 | 温婉的笑 + 疲 | **绷着的顺从，不笑** |
| 留下的旧物 | **眼镜** | **靴子、肩章、后冠** |
| 一句话 | 被换上贵妇装的女仆 | 被卸了王徽的巡查使 |

---

## 三·补二、场景 10 · 幸福的婚纱（好结局）

**分级**：`general`／`sensitive`（婚纱立绘，无露点）｜ **镜头**：`full body` + `from front`
**定位**：**全线唯一的好结局**。她没落进领主的圈套，正常嫁了人。
**与场景 5 的关系**：场景 5 是「婚礼当众 · 被围观的羞辱」，场景 10 是「婚礼当天 · 被祝福的」。同一个仪式，两种结局，正好互为反证。

### 10.1 与场景 5 婚礼的区分（关键）

| 维度 | 场景 5（坏结局） | **场景 10（好结局）** |
|---|---|---|
| 光线 | 阴冷、灰 | **阳光 + 彩窗 + 金色暖光** |
| 表情 | 隐忍、屈辱、强撑 | **真正的喜悦，眼睛在笑** |
| 婚纱状态 | 被弄乱、脏 | **整洁、金线完整** |
| 周围 | 觊觎的目光、围观 | **祝福的宾客、花瓣、钟声** |
| 姿态 | 被按住 / 被摆布 | **站直，主动伸手** |
| 主色 | 白（被剥掉金饰） | **香槟金 + 象牙白，金线满满** |

### 10.2 婚纱服装槽

```
wedding dress, (gold wedding dress:1.2), (champagne gold:1.2), (ivory:1.15),
(long dress:1.2), (floor-length:1.1), (layered skirt:1.15), (tulle:1.1), (fluffy skirt:1.05),
(gold embroidery:1.25), (gold thread:1.2), (lace:1.2), (frills:1.05),
(bridal veil:1.25), (long veil:1.15), (veil over shoulder:1.05),
(bouquet:1.2), (roses:1.15), (white flowers:1.1),
(tiara:1.2), (jewelry:1.15), (sapphire:1.1), (diamond:1.1),
(opera gloves:1.15), (white gloves:1.1),
(white heels:1.15), (high heels:1.1),
```

| 部件 | 说明 |
|---|---|
| `(gold wedding dress:1.2), (champagne gold:1.2)` | **金色主调不变**——这是她的身份色，从小礼服到婚纱一路贯下来 |
| `(gold embroidery:1.25), (gold thread:1.2), (lace:1.2)` | 金线与蕾丝堆满，**贵气但不冷** |
| `(bridal veil:1.25), (long veil:1.15)` | 头纱要长，这是"新娘"最直接的符号 |
| `(bouquet:1.2), (roses:1.15)` | 手捧花，好结局的证物 |
| `(tiara:1.2)` | 后冠延续——**这一次是她自己戴的**，不是别人给的 |

> 与场景 9 情妇装的差别不在材质，在**完整度与光**：同一套金线，一处被摆着看，一处在阳光下被人祝福。

### 10.3 表情（真正的喜悦）

```
(happy:1.25), (joyful:1.2), (radiant smile:1.25), (genuine smile:1.2), (laughing:1.1),
(eyes shining:1.15), (tears of joy:1.15), (blush:1.2), (smile with eyes:1.1),
(looking at viewer:1.1), (head tilted:1.05), (open mouth:1.05),
```

| 组 | tag | 说明 |
|---|---|---|
| 笑 | **`(radiant smile:1.25), (genuine smile:1.2), (joyful:1.2)`** | 从心里出来的笑 |
| 眼 | **`(eyes shining:1.15), (smile with eyes:1.1)`** | 眼睛也在笑——这是真笑与假笑的唯一分界 |
| 泪 | `(tears of joy:1.15)` | **喜极而泣**，与悲伤的眼泪在 tag 上就分开了 |
| 羞 | `(blush:1.2)` | 新娘的健康羞涩 |

> **`(smile with eyes:1.1)` 是本场景的钥匙**。嘴角上扬可以是假的，眼睛弯起来才是真的。
> 与场景 9 的 `(lips pressed:1.1), (tense:1.1)` 正好相反——一个绷着，一个开怀。

### 10.4 场景与光

**主选 · 教堂**

```
indoor, church, (stained glass:1.2), (sunlight:1.25), (god rays:1.2), (warm light:1.2),
(golden light:1.15), (candles:1.1), (flower arch:1.15), (wooden pews:1.05),
(rose petals:1.1), (confetti:1.05), (light particles:1.05),
(full body:1.05), from front, standing, (depth of field:1.15), wide shot,
```

**备选 · 花园**

```
outdoor, (garden:1.2), (flower field:1.15), (blue sky:1.1), (sunlight:1.25),
(blooming flowers:1.15), (arch of flowers:1.15), (petals in air:1.15),
(warm light:1.2), (bright:1.15),
```

### 10.5 完整正面（主图 · 教堂版 · 直接粘贴）

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
1girl, solo, adult, mature female, tall female, slim,
platinum blonde hair, (platinum:1.2), (pale gold hair:1.15), long hair, wavy hair, (half updo:1.15),
(princess hairstyle:1.1), (center parting:1.1),
blue eyes, (ice blue eyes:1.15), (eyes shining:1.15), (smile with eyes:1.1),
pale skin, (pale skin:1.05), (blush:1.2),
wedding dress, (gold wedding dress:1.2), (champagne gold:1.2), (ivory:1.15),
(long dress:1.2), (floor-length:1.1), (layered skirt:1.15), (tulle:1.1),
(gold embroidery:1.25), (gold thread:1.2), (lace:1.2),
(bridal veil:1.25), (long veil:1.15),
(bouquet:1.2), (roses:1.15), (white flowers:1.1),
(tiara:1.2), (jewelry:1.15), (sapphire:1.1),
(opera gloves:1.15), (white gloves:1.1),
(white heels:1.15), (high heels:1.1),
(happy:1.25), (joyful:1.2), (radiant smile:1.25), (genuine smile:1.2), (laughing:1.1),
(tears of joy:1.15), (head tilted:1.05), (looking at viewer:1.1),
standing, (hands holding bouquet:1.15), (contrapposto:1.05),
indoor, church, (stained glass:1.2), (sunlight:1.25), (god rays:1.2), (warm light:1.2),
(golden light:1.15), (candles:1.1), (flower arch:1.15), (rose petals:1.1),
(light particles:1.05), (depth of field:1.15),
full body, from front, wide shot,
```

### 10.6 负面

```
(worst quality, low quality:1.4), bad anatomy, extra fingers, fused fingers, missing fingers,
deformed, disfigured, malformed limbs, mutated, extra arms, extra legs,
text, watermark, signature, censored, mosaic censoring,
sad, unhappy, (crying:1.2), (tears:1.2), (sad smile:1.15), forced smile, pained, suffering,
(submissive:1.15), defeated, (tense:1.15), (lips pressed:1.15), expressionless, cold expression,
resigned, melancholy, tired eyes, hollow eyes,
torn clothes, dirty, (cum:1.2), bruises, scratches, (handprint:1.1), (messy hair:1.1),
1boy, 2boys, male, older male, fat man, multiple boys, crowd of men, (male focus:1.1),
(white dress:1.25), (pure white:1.2), (silver dress:1.15), (silver embroidery:1.15),
white hair, silver hair, (grey hair:1.1), ash blonde,
(cold light:1.2), (winter light:1.15), (blue tint:1.15), (cold color:1.1), (dark background:1.15), (dim lighting:1.1),
nude, cleavage, nipples, areolae, exposed chest, breasts out,
military uniform, (double breasted:1.15), pleated skirt, thighhighs, necktie,
```

> 三组关键：
> - **压悲伤**：`sad, (crying:1.2), (sad smile:1.15), forced smile, pained` —— 好结局不能有半点苦相。
> - **压屈辱**：`torn clothes, dirty, (cum:1.2), bruises, scratches, messy hair` —— 这是场景 5 的语言，不能带进来。
> - **压冷白**：`(white dress:1.25), (pure white:1.2), white hair, silver hair, (cold light:1.2), (dark background:1.15)` —— 保持金色 + 明亮。

### 10.7 参数

| 参数 | 值 |
|---|---|
| 分辨率 | **832×1216**（立绘竖构图）；教堂全景用 **1216×832** |
| Steps | 27 |
| CFG | 6.0 |
| Sampler | euler_ancestral |
| CLIP Set Last Layer | -2 |

### 10.8 三个可选变体

**变体 A · 交换戒指**（手部特写，最动人）

```
upper body, close-up, (hands clasped:1.2), (ring:1.2), (wedding ring:1.2),
(opera gloves:1.15), (gold thread:1.15),
(happy:1.2), (tears of joy:1.2), (radiant smile:1.2), (looking down at hands:1.15),
(sunlight:1.25), (god rays:1.15), (depth of field:1.2),
```

**变体 B · 抛花束**

```
(full body:1.1), (throwing bouquet:1.2), (bouquet in air:1.15), (arms up:1.15),
(laughing:1.2), (joyful:1.25), (hair floating:1.1), (dress flowing:1.15),
(outdoor:1.1), (garden:1.2), (sunlight:1.25), (petals in air:1.2), (bright:1.15),
```

**变体 C · 与新郎并肩**（不指定脸，留白）

```
1girl, 1boy, (groom:1.2), (from behind:1.1), (facing each other:1.15), (holding hands:1.2),
(full dress:1.1), (veil:1.2), (radiant smile:1.25), (happy:1.2),
(church:1.15), (stained glass:1.2), (sunlight:1.25), (flower arch:1.15),
```

### 10.9 排错速查

| 症状 | 原因 | 修法 |
|---|---|---|
| 表情像在忍着 | 混进场景 9 的词 | 删 `submissive, tense, lips pressed, expressionless`；负面必压 `sad, forced smile, (crying:1.2)` |
| 眼睛没笑 | 缺眼笑 tag | `(eyes shining:1.15), (smile with eyes:1.1)` |
| 婚纱变成纯白 | 金色主调丢了 | `(gold wedding dress:1.2), (champagne gold:1.2), (gold embroidery:1.25)`；负面压 `(white dress:1.25), (pure white:1.2)` |
| 画面阴冷 | 光没给暖 | `(sunlight:1.25), (god rays:1.2), (warm light:1.2), (golden light:1.15)`；负面压 `(cold light:1.2), (dim lighting:1.1), (dark background:1.15)` |
| 混进场景 5 的乱 | 屈辱词回流 | 负面必压 `torn clothes, dirty, (cum:1.2), bruises, (messy hair:1.1)` |
| 冒出围观的男人 | 负面没压 | 负面加 `1boy, 2boys, male, crowd of men, (male focus:1.1)` |
| 发色发白 | 铂金被读成银 | `(platinum:1.2), (pale gold hair:1.15)`；负面压 `white hair, silver hair, ash blonde` |
| 头纱没画出来 | 缺长度 | `(bridal veil:1.25), (long veil:1.15)` |

### 10.10 艾琳三个终局并排

| 场景 | 身份 | 服装 | 表情 | 光 | 结局 |
|---|---|---|---|---|---|
| 9 | 领主情妇 | 金色鱼尾 + 后冠 + 白长靴 | **绷着的顺从** | 暖金烛光 | 坏结局 |
| **10** | **新娘** | **香槟金婚纱 + 头纱 + 捧花** | **真正喜悦、眼在笑** | **阳光 + 彩窗** | **好结局** |
| 5 | 婚礼当众（旧场景） | 长裙婚纱被弄乱 | 隐忍屈辱 | 阴冷 | 坏结局 |

> 9 与 10 的服装**同为金色、同为立绘、同一个角色**，靠三件事分开：**完整度、表情、光**。这三样一变，同一件金线裙就有了两种命。

---

## 四、负面提示词

```
(low quality, worst quality:1.4), (bad anatomy), (inaccurate limb:1.2),
bad composition, inaccurate eyes, extra digit, fewer digits, (extra arms:1.2),
extra fingers, fused fingers, missing fingers, deformed, disfigured, mutated,
text, error, signature, watermark, username, logo, blurry, lowres, jpeg artifacts,
multiple views, comic, 2koma, speech bubble,
child, loli, shota, toddler, aged down, flat chest,
short, short stature, chibi,
pink hair, silver hair, blue hair, brown hair, red hair, black hair,
green eyes, red eyes, heterochromia, eyepatch,
casual clothes, t-shirt, jeans, armor, breastplate, chainmail,
necktie, black necktie, red bowtie, bare neck, open collar,
sneakers, sandals, barefoot, high heels,
censored, mosaic censoring, bar censor, pixelated
```

三组特别说明：

| 分组 | tag | 作用 |
|---|---|---|
| **身高** | `short, short stature, chibi` | 艾琳必须是高挑的，和妮丝完全相反，负面要顶死 |
| **发色** | `pink hair, silver hair, blue hair, brown hair, red hair, black hair` | 保住铂金（很容易变成纯白或银色） |
| **服装** | `casual clothes, t-shirt, jeans, armor, breastplate, chainmail` | 她的制服是**礼服**不是盔甲，模型容易自动加护甲 |

> `silver hair` 必须压。铂金色在训练数据里和银色高度重叠，不压的话一半的图会是银白发，和塞西莉亚撞色。

---

## 五、采样参数

| 参数 | Animagine 4.0 | Animagine 3.1 |
|---|---|---|
| CLIP Set Last Layer | **-2** | **-2** |
| Steps | 25 ~ 28 | 28 ~ 30 |
| CFG | 5.0 ~ 7.0 | 4.0 ~ 7.0 |
| Sampler | euler_ancestral | euler_ancestral |
| Scheduler | normal | normal |
| 分辨率 | 832×1216 | 832×1216 |

**艾琳专用分辨率**：用 **832×1216**（2:3 长画幅）。
理由和妮丝相反——妮丝要压身高所以用 4:5，艾琳是 170cm 高挑女性，**长画幅正好突出她的修长身形**。全身立绘用 2:3，靴子和腿部线条会更完整。

---

## 六、4.0 自然语言补句

**场景 1（高贵威仪版）**
```
..., A twenty-year-old noblewoman from the royal capital, standing at the town gate
of a remote border settlement, her tall slender figure immaculate in a white
double-breasted military dress uniform with gold trim, gold-fringed epaulets,
and a royal crest brooch at her chest, a knee-length pleated white skirt,
white thighhighs and knee-high white leather boots with gold buckles,
a ceremonial rapier with a jeweled hilt hanging at her waist,
platinum blonde hair in a half updo with long wavy locks reaching her lower back,
her ice-blue eyes looking down at the viewer with cool, unwavering confidence,
as if the entire town were already hers to judge.
```

**场景 8（崩塌版）**
```
..., the same white uniform now torn and stained, its double-breasted front
hanging open, one epaulet missing, the royal crest brooch gone from her chest,
white gloves and a jeweled rapier lying abandoned on the floor nearby,
her platinum blonde hair fallen out of its half updo, sticking to her tear-streaked
cheeks, sitting on the floor of a candlelit bedroom with her knees drawn up,
ice-blue eyes empty and unfocused, staring at nothing, the pride that once
filled the town gate completely gone.
```

关键对照：**第一句的 `immaculate` 和最后一句的 `torn and stained`**，**`the entire town were already hers to judge` 和 `the pride ... completely gone`**。同一套描述框架，只换评价词。

---

## 七、文件清单

| 文件 | 内容 |
|---|---|
| `comfyui/eileen_workflow.json` | 完整工作流，CLIP Set Last Layer -2 |
| `comfyui/wildcards/eileen_anchor.txt` | 锚点（单行） |
| `comfyui/wildcards/eileen_negative.txt` | 负面（单行） |
| `comfyui/wildcards/eileen_inspector.txt` | 场景 1-3（贵族期）3 行 |
| `comfyui/wildcards/eileen_corruption.txt` | 场景 4-6（动摇期）3 行 |
| `comfyui/wildcards/eileen_finale.txt` | 场景 7-8（崩塌期）2 行 |

用法：
```
__eileen_inspector__     ← 场景 1~3
__eileen_corruption__    ← 场景 4~6
__eileen_finale__        ← 场景 7~8
```
negative：`__eileen_negative__`

---

## 八、排错速查

| 症状 | 原因 | 修法 |
|---|---|---|
| 头发变银白 | 铂金和银色在训练集重叠 | 正面 `(platinum blonde hair:1.3)`，负面必留 `silver hair` |
| 衣服画成盔甲 | 缺反推 | 负面 `armor, breastplate, chainmail`，正面强调 `military jacket, formal` |
| 靴子变高跟鞋 | `high heels` 残留 | 删干净，只用 `heeled boots, knee boots` |
| 裙长到脚踝 | `pleated skirt` 被理解成长裙 | `(knee-length skirt:1.3)`，负面加 `long skirt` |
| 人物偏矮 | 缺身高反推 | 负面 `short, short stature, chibi`，正面 `tall female` |
| 剑画成普通木棍 | 缺装饰词 | `rapier, ornate sword, jeweled hilt` 三个一起 |
| 金徽画不出来 | `brooch` 太泛 | 加 `gold trim`，或用自然语言 `royal crest brooch at her chest` |
| **蓝领结消失** | 场景串漏写，或权重不足 | **`(blue ascot:1.35), cravat`**，负面压 `necktie, bare neck, open collar` |
| **领结变黑/变红** | 缺颜色锁定 | 正面 `blue` 和 `ascot` 紧邻，负面压 `red bowtie, black necktie` |
| 领结被立领盖住 | 缺领口层次 | 加 `cravat` 双写，或自然语言 `a blue cravat knotted at her throat, visible above the high collar` |
| 制服饰品不全 | 缺组件词 | 照抄 1.3 节的完整锁定串，逐项对照表格核对 |
| 肩章画成普通肩章 | 缺流苏 | `epaulettes, gold fringed epaulettes` 两个都写 |
| **挣扎画成站着不动** | 缺动作词和镜头语言 | `struggling, fighting, thrashing, kicking` + `dutch angle, motion blur` |
| 挣扎画成表情包 | 动作复杂度超过构图承载 | 减到 `1girl, 1boy`，删掉多余人物 |
| 愤怒画成恐惧 | 表情词选错 | 用 `angry, glare, defiant, gritted teeth`，删 `fear, trembling` |
| 眼泪画成崩溃哭 | 用了 `crying, despair` | 用 `tears of frustration`；`despair` 留给场景 8 |
| 够剑动作出不来 | 缺方位词 | `reaching for sword, outstretched arm, rapier, on hip` 四个一起 |
| 场景 8 不够惨 | 只靠表情 | 加道具：`white gloves on floor, rapier on floor, document on floor` |
| 高傲表情变成讨厌 | `smug` 权重过高 | 降到 0.9，配 `confident, closed mouth`，删 `evil smile` |

---

*肥鱼备注：艾琳这套的核心是**道具叙事**——她的「公文护甲幻想」在画面上就是三件东西：**胸前的金徽、腰间的刺剑、手里的诏书**。这三件事物在场景 1 全都在，到场景 8 全部消失或落地。角色堕落的过程，用道具的位移就能讲完，不必靠露多少肉。*
