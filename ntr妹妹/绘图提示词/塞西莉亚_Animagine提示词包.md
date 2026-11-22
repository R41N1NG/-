# 塞西莉亚 · Animagine XL 提示词包 v1

> **角色定位**：晨曦大教堂下辖修道院修女长 · 圣职导师（奥萝拉的前辈）
> **年龄**：26 岁 · 丰腴成熟（约 168cm）
> **堕落曲线**：**道德绑架型**——用「为主受难、忍辱负重换取孩子们活命」自我麻痹
> **场景配比**：2 个铺垫（sensitive）+ 7 个正戏（explicit）
> 来源：`设定_世界观与奥克赫斯城镇全案.md` 第八节

---

## 零、锚点

### 0.1 外观锚点

```
blonde hair, long hair, hair bun, low bun, blunt bangs,
green eyes, (emerald green eyes:1.15),
adult, mature female, tall female, voluptuous,
large breasts, wide hips, thick thighs, pale skin,
```

| tag | 对应设定 |
|---|---|
| `blonde hair, long hair, hair bun, low bun` | 柔顺金发在脑后挽起低发髻 |
| `blunt bangs` | 头巾边缘露出的齐刘海 |
| `green eyes, (emerald green eyes:1.15)` | 清澈翠绿眼眸 |
| `adult, mature female, tall female, voluptuous` | 26 岁丰腴成熟 |
| `large breasts, wide hips, thick thighs` | 丰腴身段的实体表达 |

### 0.2 服装锚点（修女服）

```
nun, nun habit, veil, black veil, white headpiece, wimple,
nun dress, long dress, (ankle-length skirt:1.3), high collar, modest clothes, long sleeves,
cross necklace, pectoral cross, rosary,
(white pantyhose:1.3), white tights, covered legs,
black shoes, flat shoes, mary janes,
holding holy book, bible,
```

| 分组 | tag | 对应设定 |
|---|---|---|
| 头巾 | `nun habit, veil, black veil, white headpiece, wimple` | 黑白双色修女头巾（`wimple` 是包裹脖颈的那层，不可省） |
| 长袍 | `nun dress, long dress, (ankle-length skirt:1.3), high collar, modest clothes, long sleeves` | 深色高领长袖长袍，**裙摆及踝，完全遮住大腿** |
| 圣徽 | `cross necklace, pectoral cross` | 胸前金质圣徽十字架 |
| 念珠 | `rosary` | 腰间纯银念珠 |
| 腿 | `(white pantyhose:1.3), white tights, covered legs` | **纯白连裤袜**——这是她最重要的身体特征之一 |
| 鞋 | `black shoes, flat shoes, mary janes` | 黑色方头**平底**皮鞋（玛丽珍款式，带一根搭扣） |
| 圣典 | `holding holy book, bible` | 厚重皮面《晨曦圣典》 |

> **`pectoral cross` 和 `wimple` 是最容易漏的两个词。**
> `pectoral cross` 是"胸前挂的十字架"，单写 `cross necklace` 会画成小项链；`wimple` 是修女头巾包住脖子和肩的那层，缺了就只有一块布盖头，没有修女味。
> 这两个都是本角色的宗教符号核心，**任何场景都不能删**。

### 0.3 裙长与鞋（v2 修正）

**裙长**：非 NSFW 场景，黑袍必须**完全遮住大腿**。

```
nun dress, long dress, (ankle-length skirt:1.3), covered legs
```

| tag | 作用 |
|---|---|
| `long dress` | 基础长袍 |
| `(ankle-length skirt:1.3)` | **及踝**，这是本条的核心，权重给到 1.3 |
| `covered legs` | 帮模型理解"整条腿被布料覆盖" |

负面同时压：
```
short skirt, miniskirt, bare thighs, thigh gap
```

> `long dress` 单用只在 60% 的情况下能到脚踝，模型经常画成及膝或小腿。**`ankle-length skirt` 是长度明确的 tag**，加上去才能锁死。这是和之前艾琳「膝上三寸」完全相反的处理——她俩的裙长必须在画面上拉开距离。

**鞋**：平底，不要跟。

```
black shoes, flat shoes, mary janes
```

| tag | 作用 |
|---|---|
| `flat shoes` | **平底**，这是本条的核心 |
| `mary janes` | 玛丽珍款，带一根搭扣，是修女/教会学校的标准鞋型 |
| `black shoes` | 黑色 |

负面压：
```
high heels, low heels, pumps, stiletto heels, boots, platform shoes
```

> 之前写的 `low heels` 是错的——**低跟也是跟**。修女穿任何带跟的鞋都不对味，改成 `flat shoes` 才对。
> `low heels` 从正面移到负面，这一步很关键：不压的话，模型会自己把平底鞋画成小低跟。

### 0.4 姿态（v2 修正：减少跪姿）

跪姿在画面里容易显得刻意、不自然，除了宗教上确实必要的场合，一律改用**站姿或坐姿**。

| 场景 | 原姿态 | 改后 | 理由 |
|---|---|---|---|
| 1 募捐恳求 | `kneeling, seiza` | **`standing, hands clasped at chest, bowing, shoulders slumped`** | 站着低头求人，比跪着更符合"修女长"的身份 |
| 2 圣堂祈祷 | `kneeling, praying` | **`sitting, on pew, church pew, praying`** | 坐在长椅上祷告，是教堂里最常见的画面 |
| 4 忏悔室 | `kneeling` | **`sitting, leaning against lattice`** | 忏悔室有座板，坐着倚着木格更自然 |
| 3/5/6/7/8 | 趴桌/躺床/伏祭坛/站立/躺地 | 不变 | 这些是 NSFW 必需姿态，与"跪"无关 |

> **站姿求人反而更有压迫感**：`bowing` + `shoulders slumped`（肩膀塌下来）+ `hands clasped at chest`——一个成年女性站着，把身体缩起来求人，比跪着更让人不适。
> 跪姿画出来常常像"投降"或"服侍"，站着的低头才是"求"。这个差别挺大的。

### 0.3 表情锚点（慈悲崩坏四档）

| 阶段 | tag 组合 | 心理 |
|---|---|---|
| 慈悲温和 | `gentle smile, closed eyes, kind expression, sad smile` | 表面 |
| 隐忍承受 | `troubled, blush, tears, biting lip, eyes closed, wincing` | 「为主受难」 |
| 罪疚羞耻 | `guilty, ashamed, crying, blush, averting eyes, covering face` | 开始撑不住 |
| 崩坏臣服 | `ahegao, empty eyes, broken smile, drooling, mind break` | 自我麻痹失效 |

> 修女的堕落不是「爽到失神」，是「一边哭一边告诉自己这是为了孩子们」。
> 所以**中期最重要的一档是 `guilty, ashamed`**，而不是直接跳 `ahegao`。

---

## 一、8 场景（2 铺垫 + 6 正戏）

| # | 场景 | 分级 | 镜头 | 升级点 |
|---|---|---|---|---|
| 1 | 募捐恳求 | `sensitive` | `high angle` | 起点：站姿低头，捧圣典 |
| 2 | 圣堂祈祷被打断 | `sensitive` | `from behind` | 有人在身后，她还在合掌 |
| 3 | 书房·口交 | `explicit` | `high angle` | **第一次越界**：自己俯下去 |
| 4 | 忏悔室·乳交 | `explicit` | `pov` | 从交易变羞辱，只解上身 |
| 5 | 修女院·素股 | `explicit` | `high angle` | 最后的自我欺骗：没进去就不算 |
| 6 | 第一次·落红 | `explicit` | `close-up` | **分水岭**：白裤袜上的红 |
| 7 | 祭坛前 | `explicit` | `low angle` | 把罪带到神面前 |
| 8 | 分发救济粮时 | `explicit` | `medium shot` | 递面包给孩子同时被进入 |
| 9 | 终局·圣徽落地 | `explicit` | `high angle` | 十字架碎裂、念珠散落 |

### 升级曲线

```
场景 1-2  接触       ← 她还在位置上（修女长的身份完整）
场景 3    口腔       ← 主动，但是交易
场景 4    胸部       ← 被动，开始羞辱
场景 5    股间       ← 最后一道防线：「只要没进去」
场景 6    插入       ← 破了。白裤袜上的红
场景 7-9  彻底       ← 从私密到公开，从身体到信仰
```

> **这个顺序不能乱。** 每一张的前提都是前一张已经发生——她的心理防线是一格一格退的，不是一下子崩的。
> 场景 5 的「素股」是整条线的关键：她愿意做这件事，正是因为**它还不是那件事**。

---

## 二、场景 1 · 募捐恳求（铺垫）

**分级**：`sensitive` ｜ **镜头**：`high angle` ｜ **姿态**：跪

```
masterpiece, best quality, very aesthetic, absurdres, newest, sensitive,
1girl, 1boy,
blonde hair, long hair, hair bun, low bun, blunt bangs,
green eyes, (emerald green eyes:1.15),
adult, mature female, tall female, voluptuous,
large breasts, wide hips, thick thighs, pale skin,
nun, nun habit, veil, black veil, white headpiece, wimple,
nun dress, long dress, (ankle-length skirt:1.3), high collar, modest clothes, long sleeves,
cross necklace, pectoral cross, rosary,
(white pantyhose:1.3), white tights, covered legs,
black shoes, flat shoes, mary janes,
holding holy book, bible,
standing, hands clasped at chest, hands together, pleading, head down, bowing,
shoulders slumped, humble,
gentle smile, sad smile, closed eyes, troubled, blush,
fat man, older male, sitting, on chair, looking down,
indoor, lord's manor, study, desk, bookshelf, candlelight,
high angle, medium shot, dim lighting, oppressive atmosphere
```

> 这是整套的开场，但**不是 SFW**——站姿低头 + 俯视 + 捧着圣典求人，这个画面本身就是「低位」。所谓道德绑架的前提，是她先把姿态放下去了。

---

## 三、场景 2 · 圣堂祈祷被打断（铺垫）

**分级**：`sensitive` ｜ **镜头**：`from behind` ｜ **姿态**：跪祷

```
masterpiece, best quality, very aesthetic, absurdres, newest, sensitive,
1girl, 1boy,
blonde hair, long hair, hair bun, low bun, blunt bangs,
green eyes, (emerald green eyes:1.15),
adult, mature female, tall female, voluptuous,
large breasts, wide hips, thick thighs, pale skin,
nun, nun habit, veil, black veil, white headpiece, wimple,
nun dress, long dress, (ankle-length skirt:1.3), high collar, modest clothes, long sleeves,
cross necklace, pectoral cross, rosary,
(white pantyhose:1.3), white tights, covered legs,
black shoes, flat shoes, mary janes,
sitting, on pew, church pew, praying, hands clasped, rosary in hand, head bowed,
from behind, someone approaching, hand on shoulder, shadow,
fat man, older male, standing, behind,
eyes closed, troubled, biting lip, blush,
indoor, church, chapel, pews, stained glass, candles, crucifix,
from behind, medium shot, backlighting, god rays, solemn atmosphere
```

> 这张的张力全在**「她还在祈祷，身后已经站了人」**。
> `hands clasped` + `rosary in hand` + `hand on shoulder` 三个一起给——神圣与侵犯在同一帧里，比直接画性行为更有压迫感。

---

## 四、场景 3 · 书房「资助协议」· 口交（第一次越界）

**分级**：`explicit` ｜ **镜头**：`high angle` ｜ **姿态**：跪在桌边 / 俯身

> 这是第一次真正意义上的越界，性质是**交易**：她把它当成"签字前的最后一步"。
> 所以这张的姿态是**主动但僵硬**——她自己俯下去，不是被按下去。

```
masterpiece, best quality, very aesthetic, absurdres, newest, explicit,
1girl, 1boy,
blonde hair, long hair, hair bun, low bun, blunt bangs, messy hair,
green eyes, (emerald green eyes:1.15), tearful,
adult, mature female, tall female, voluptuous,
large breasts, wide hips, thick thighs, pale skin,
nun, nun habit, veil, black veil, white headpiece, wimple,
nun dress, long dress, (ankle-length skirt:1.3), high collar, long sleeves,
cross necklace, pectoral cross, rosary,
(white pantyhose:1.3), white tights, covered legs,
black shoes, flat shoes, mary janes,
kneeling, on floor, beside desk, bent over, leaning forward,
fellatio, oral, deepthroat, sucking, hand on another's thigh,
holding holy book, bible, bible on floor,
fat man, older male, standing, large penis,
troubled, blush, tears, crying, eyes closed, wince, eyebrows furrowed,
guilty, ashamed, averting eyes,
paper, document, contract, quill, ink, candle,
indoor, lord's manor, study, desk, bookshelf, candlelight,
high angle, medium shot, dim lighting, dramatic shadow
```

> **`bible on floor` 是这张的签名。**
> 场景 1 她还捧着那本圣典求人；这一张它躺在脚边。`holding holy book` 到 `bible on floor` 的位移，比任何表情都更清楚地说出——她为了那份契约，把手里最后一样东西放下了。
>
> `document, contract, quill, ink` 四个道具保留：桌上摊着那份「资助协议」，**她一边做这件事，一边还在看那张纸**。这就是「善款债务死穴」的具象化。

---

## 五、场景 4 · 忏悔室 · 乳交

**分级**：`explicit` ｜ **镜头**：`pov` ｜ **场景**：圣堂木格

> 第二次越界，性质从「交易」变成「羞辱」——**在忏悔室里**。
> 这是她第一次意识到对方不想要她的忠诚，只想要她的身体。

```
masterpiece, best quality, very aesthetic, absurdres, newest, explicit,
1girl, 1boy,
blonde hair, long hair, hair bun, low bun, blunt bangs, messy hair,
green eyes, (emerald green eyes:1.15), tearful,
adult, mature female, tall female, voluptuous,
large breasts, huge breasts, wide hips, thick thighs, pale skin,
nun, nun habit, veil, black veil, white headpiece, wimple, veil askew,
nun dress, long dress, (ankle-length skirt:1.3), high collar, long sleeves, unbuttoned,
breasts out, cleavage, nipples,
cross necklace, pectoral cross, rosary,
(white pantyhose:1.3), white tights, covered legs,
black shoes, flat shoes, mary janes,
sitting, confessional, wooden booth, wooden lattice, curtain, leaning against lattice,
paizuri, titjob, breast squeeze, breasts together, penis between breasts, hand on own breast,
fat man, older male, noble, large penis,
troubled, blush, tears, crying, eyes closed, praying, hands clasped,
guilty, ashamed, biting lip, grimace,
indoor, church, confessional booth, wooden lattice, candle,
pov, close-up, high angle, dim lighting, claustrophobic atmosphere
```

> **`praying, hands clasped` 和 `paizuri` 同时出现**——这一张的核心。
> 忏悔室是「说出罪的地方」，而她正在里面犯罪，一边双手还合着掌。
> `wooden lattice`（木格窗）把它框成一个封闭的小盒子，`claustrophobic atmosphere` 让空间感压下来。
>
> **上身的衣服只解到必要位置**：`unbuttoned` + `breasts out`，但 `wimple`、`veil`、`pectoral cross` 全都还在身上。这个「只露出胸，其余一切照旧」的对比，比全脱更刺人。

---

## 六、场景 5 · 修女院房间 · 素股

**分级**：`explicit` ｜ **镜头**：`from side` + `close-up` ｜ **场景**：她自己的房间

> 第三次越界，性质是**「还没到最后一步」的最后抵抗**。
> 她把裙子撩起来、让他贴着大腿之间磨蹭——这是她能给自己的最后一点体面：**只要没进去，就还算没破戒**。

```
masterpiece, best quality, very aesthetic, absurdres, newest, explicit,
1girl, 1boy,
blonde hair, long hair, hair bun, low bun, blunt bangs, messy hair, hair loose,
green eyes, (emerald green eyes:1.15), tearful,
adult, mature female, tall female, voluptuous,
large breasts, wide hips, thick thighs, pale skin,
nun, nun habit, veil, black veil, white headpiece, wimple, veil askew,
nun dress, long dress, (ankle-length skirt:1.3), high collar, long sleeves, unbuttoned,
cross necklace, pectoral cross, rosary,
(white pantyhose:1.3), white tights, pantyhose pull, covered legs, shiny pantyhose,
black shoes, flat shoes, mary janes,
lying on side, on bed, thighs together, thighs pressed together, thigh gap,
intercrural sex, thigh sex, sumata, grinding, clothed sex,
penis, (penis head:1.3), glans, glistening, precum, veins,
penis between thighs, protruding, emerging,
hand on another's thigh, holding sheets, gripping sheet,
fat man, older male, muscular male, dark skin,
troubled, blush, tears, crying, eyes closed, wincing, biting lip,
guilty, ashamed, covering face, arm over eyes,
indoor, convent, bedroom, small bed, crucifix on wall, candle, rosary on bed,
from side, close-up, focus on penis, low angle, dim lighting, dramatic shadow
```

### 6.1 让「龟头露出来」的四个技术要件

只写 `intercrural sex`，模型只会画两条腿叠在一起，前端什么都没有。必须同时给四样：

| 要件 | tag | 作用 |
|---|---|---|
| **物件本身** | `penis, (penis head:1.3), glans` | 三个词一起给，`penis head` 和 `glans` 互相兜底 |
| **穿出关系** | `penis between thighs, protruding, emerging` | **这是最关键的一组**——`protruding`（凸出）和 `emerging`（探出）明确要求"伸到外面" |
| **质感** | `glistening, precum, veins` | 有湿润感和血管，模型才会把它画成一个立体的、真实的器官而不是一条线 |
| **视角** | **`from side` + `close-up` + `low angle`** | **侧面视角**才能看到"从腿缝穿到前面"；正面或背面都看不出来 |

> **`from side` 是这一张的命门。** 素股的本质是"夹在两腿之间、前端从缝隙里探出来"——这是一个**侧视才能看见的空间关系**。
> 用 `from behind` 你只能看到臀部；用 `from front` 你只能看到大腿正面。只有 `from side`，才能同时看见"腿、腿缝、穿出来的部分"三样东西。

### 6.2 构图优先级

```
close-up（特写）> medium shot（中景）
focus on penis（对焦在器官上）> focus on face
```

这一张**不需要露脸**。素股的核心信息全在下半身，用 `close-up` + `focus on penis` 把画面重心压到腿缝，脸可以切出画外或者只露下巴。

### 6.3 如果 tag 还是压不住

`penis head` 这类细节 tag 在 Animagine 上的命中率大约七成。三级兜底：

**第 1 级 · 加权重**
```
(penis:1.2), (penis head:1.5), glans, protruding
```

**第 2 级 · 自然语言强描述**
```
A thick shaft sliding between her pressed-together thighs, its swollen head
emerging clearly in front of her legs, slick and glistening, veins standing out
along the length of it.
```
> `emerging clearly in front` 这个短语把"在前面露出来"讲死了，比 tag 有效。

**第 3 级 · 改构图**
如果模型死活画不出"穿出"的效果，就换 `pov`, `from below`，从她腿下方仰视——**视线从下往上穿过腿缝看到前端**，这个角度物理上必然要露出龟头。

### 6.4 这一张的叙事细节

> **这一张最重要的信息是「什么都没脱」**：`white pantyhose` 完整、`nun dress` 完整，只是 `pantyhose pull`（裤袜被拉紧）和 `thigh gap`（腿缝被挤开）。
> **白裤袜必须保持干净完整** —— 它是下一张落红的底子。**这一张要是把裤袜弄脏了，场景 6 的反差就废了。**
>
> `crucifix on wall` 必须写。她的房间里挂着十字架，而她在十字架下面做这件事。
> `gripping sheet`（攥着床单）是她唯一还剩下的反抗动作——手抓不住别的了。

---

## 七、场景 6 · 第一次·落红（正式性爱）

**分级**：`explicit` ｜ **镜头**：`high angle` + `close-up` ｜ **视觉核心**：白裤袜上的红

> 整条线的分水岭。前面三张都可以说"还没真的"，这一张不行了。
> **构图上把落红和白裤袜放在同一帧里**——白色是被毁掉的纯洁，红色是不可逆的事实。

```
masterpiece, best quality, very aesthetic, absurdres, newest, explicit,
1girl, 1boy,
blonde hair, long hair, hair bun, low bun, blunt bangs, messy hair, hair loose,
green eyes, (emerald green eyes:1.15), tearful, wide-eyed,
adult, mature female, tall female, voluptuous,
large breasts, wide hips, thick thighs, pale skin,
nun, nun habit, veil, black veil, white headpiece, wimple, veil askew,
nun dress, long dress, (ankle-length skirt:1.3), high collar, long sleeves, unbuttoned,
cross necklace, pectoral cross, rosary,
(white pantyhose:1.3), white tights, pantyhose pull, torn pantyhose,
blood on pantyhose, blood on thigh, blood stain, blood,
virgin, first time, defloration,
black shoes, flat shoes, mary janes,
lying on back, on bed, spread legs, sex, missionary, penetration,
fat man, older male, muscular male, dark skin, large penis,
pain, painful, wince, grimace, biting lip, tears, crying, tears of pain,
eyes squeezed shut, clenched teeth,
guilty, ashamed, covering face,
indoor, convent, bedroom, small bed, crucifix on wall, candle, rosary on bed,
high angle, close-up, focus on thighs, dim lighting, dramatic shadow, wet skin
```

### 7.1 落红与白裤袜的三个技术要点

| 要点 | tag | 说明 |
|---|---|---|
| **白裤袜还在** | `(white pantyhose:1.3), pantyhose pull` | 不是全脱，是**拉到大腿**——布还在身上，才有反差 |
| **红色落在白色上** | `blood on pantyhose, blood stain` | 两个词一起给，`blood` 单独写会飘在空气里 |
| **位置精准** | `blood on thigh` | 血要在大腿内侧、裤袜边缘，不是随便洒 |

> **`blood on pantyhose` 这个组合是关键。** 只写 `blood` 模型会画成嘴角或床单上有血；写明"在裤袜上"，白布的底色才能承托红色。
> 构图用 `focus on thighs`（对焦在大腿），让裤袜占据画面重心——**这张的脸可以少露，但那截白布必须清清楚楚**。

### 7.2 表情：痛苦 > 快感

```
pain, painful, wince, grimace, biting lip, tears of pain,
eyes squeezed shut, clenched teeth
```

> 这一张**不能有 `ahegao`**。第一次是疼的，她的表情必须是「咬牙忍住」而不是「爽到失神」。
> `ahegao` 留给场景 9 的终局——**从"疼得闭眼"到"爽到翻白眼"，中间隔着整条崩塌线**。

### 7.3 宗教符号的位置

`pectoral cross` 还在胸前，`veil askew`（头巾歪了但没掉）。**这一张她还没有失去任何符号**，只是身体被破了。
符号的失去要留到后面——先破身，再破信仰，这个顺序不能反。

---

## 八、场景 7 · 祭坛前（正式性爱之后的亵渎）

**分级**：`explicit` ｜ **镜头**：`low angle` ｜ **场景**：教堂祭坛

> 第一次在房间里，是私密的犯罪；这一张搬到祭坛上，是**把罪带到神面前去**。
> 顺序上它必须在场景 6 之后——身体已经破了，才有胆量在圣所里做。

```
masterpiece, best quality, very aesthetic, absurdres, newest, explicit,
1girl, 1boy,
blonde hair, long hair, hair bun, low bun, blunt bangs, messy hair,
green eyes, (emerald green eyes:1.15), tearful,
adult, mature female, tall female, voluptuous,
large breasts, wide hips, thick thighs, pale skin,
nun, nun habit, veil, black veil, white headpiece, wimple, veil askew,
nun dress, long dress, (ankle-length skirt:1.3), high collar, long sleeves,
cross necklace, pectoral cross, rosary, rosary on floor,
(white pantyhose:1.3), white tights, pantyhose pull, torn pantyhose,
black shoes, flat shoes, mary janes,
dress lift, long dress lifted,
bent over, on altar, from behind, sex from behind, standing sex,
fat man, older male, large penis, behind,
troubled, blush, tears, crying, eyes closed, praying, hands clasped, praying on altar,
guilty, ashamed, half-closed eyes, drooling,
altar, candles, candlesticks, crucifix, stained glass, statues, holy water,
indoor, church, altar, marble, candlelight,
low angle, wide shot, dramatic lighting, god rays, sacrilegious atmosphere
```

> `low angle` 是这套里唯一一次主动用仰拍的正戏——**要让背景里的十字架和彩窗都进画**，仰拍才能把它们抬起来，形成一个「被神俯视着犯罪」的构图。
> `praying on altar`（趴在祭坛上还在祈祷）+ `rosary on floor`（念珠掉在地上）——一个还举着，一个已经掉了。

---

## 九、场景 8 · 分发救济粮时（最黑）

**分级**：`explicit` ｜ **镜头**：`medium shot` ｜ **场景**：修道院门口

```
masterpiece, best quality, very aesthetic, absurdres, newest, explicit,
1girl, 2boys,
blonde hair, long hair, hair bun, low bun, blunt bangs, messy hair,
green eyes, (emerald green eyes:1.15), tearful,
adult, mature female, tall female, voluptuous,
large breasts, wide hips, thick thighs, pale skin,
nun, nun habit, veil, black veil, white headpiece, wimple, veil askew,
nun dress, long dress, (ankle-length skirt:1.3), high collar, long sleeves,
cross necklace, pectoral cross,
(white pantyhose:1.3), white tights, torn pantyhose,
black shoes, flat shoes, mary janes,
dress lift, long dress lifted,
standing, from behind, standing sex, sex from behind, bent over,
holding bread, basket, distribution, reaching out, giving,
poor, children, crowd, orphans, ragged clothes,
fat man, older male, behind, large penis,
smiling, forced smile, gentle smile, tears, crying, troubled, blush,
guilty, ashamed, averting eyes,
outdoor, convent gate, courtyard, daylight, wooden gate, baskets of bread,
medium shot, from behind, satirical atmosphere
```

> 这是整份里最黑的一张：**她一手递面包给孩子，同时被人从后面侵犯，脸上还得维持微笑**。
> `forced smile` + `tears` + `giving` 三个同时存在——这就是她的「宽恕退让的道德死结」的完整画面。
> 构图用 `medium shot` 而不是特写，因为**必须同时拍到孩子的手和她脸上的笑**。

---

## 十、场景 9 · 终局·圣徽落地

**分级**：`explicit` ｜ **镜头**：`high angle` ｜ **标志**：圣徽被摘下

```
masterpiece, best quality, very aesthetic, absurdres, newest, explicit,
1girl, 2boys,
blonde hair, long hair, hair bun undone, hair loose, messy hair,
green eyes, (emerald green eyes:1.15), empty eyes,
adult, mature female, tall female, voluptuous,
large breasts, wide hips, thick thighs, pale skin,
nun, nun habit, veil, black veil, white headpiece, wimple, veil askew, veil fallen,
nun dress, long dress, (ankle-length skirt:1.3), high collar, long sleeves, unbuttoned, torn clothes, dirty,
rosary on floor, rosary scattered, beads scattered,
pectoral cross on floor, broken cross,
(white pantyhose:1.3), white tights, torn pantyhose,
black shoes, flat shoes, mary janes,
lying on back, spread legs, sex, missionary, gangbang, multiple males,
fat man, older male, muscular male, dark skin,
ahegao, empty eyes, mind break, broken smile, drooling, tears, crying,
guilty, ashamed, half-closed eyes,
cum, cum in pussy, cum on body, excessive cum,
indoor, church, altar floor, marble, candles, crucifix,
high angle, wide shot, dim lighting, cold color, desolate atmosphere
```

> 终局的核心是**圣徽落地**：`pectoral cross on floor, broken cross` + `rosary scattered, beads scattered`。
> 从场景 1 到场景 7，那枚十字架一直在她胸前；到这一张，它碎了，躺在地上。**宗教符号的破碎，就是她精神支柱的破碎**——比任何表情都直接。

---

## 十、负面提示词

```
(low quality, worst quality:1.4), (bad anatomy), (inaccurate limb:1.2),
bad composition, inaccurate eyes, extra digit, fewer digits, (extra arms:1.2),
extra fingers, fused fingers, missing fingers, deformed, disfigured, mutated,
text, error, signature, watermark, username, logo, blurry, lowres, jpeg artifacts,
multiple views, comic, 2koma, speech bubble,
child, loli, shota, toddler, aged down, flat chest,
flat chest, small breasts, short, short stature,
pink hair, silver hair, blue hair, red hair, black hair, brown hair,
blue eyes, red eyes, heterochromia, eyepatch,
witch, sorceress, maid, nurse, school uniform, casual clothes,
bare legs, black pantyhose, thighhighs, boots, 
short skirt, miniskirt, bare thighs, thigh gap,
high heels, low heels, pumps, stiletto heels, platform shoes,
censored, mosaic censoring, bar censor, pixelated
```

四组重点：

| 分组 | tag | 作用 |
|---|---|---|
| **身形** | `flat chest, small breasts, short, short stature` | 塞西莉亚是**丰腴成熟**，和妮丝的娇小完全相反，必须压死 |
| **发色** | `pink hair, silver hair, blue hair, red hair, black hair, brown hair` | 保住金发（四个角色里唯一的纯金） |
| **服装** | `witch, sorceress, maid, nurse, school uniform, casual clothes` | 防止串成其他职业装 |
| **腿** | `bare legs, black pantyhose, thighhighs, boots` | **必须保 `white pantyhose`**，黑丝是奥萝拉的，过膝袜是妮丝的，靴子是高跟是艾琳的——四个角色腿部各不相同，这里的负面就是防串色 |
| **裙长** | `short skirt, miniskirt, bare thighs, thigh gap` | 黑袍必须及踝，压掉一切短款 |
| **鞋** | `high heels, low heels, pumps, stiletto heels, platform shoes` | 锁死平底玛丽珍 |

> 这一组腿的负面是**四个角色的分界线**。塞西莉亚 = 纯白连裤袜 + 黑色低跟皮鞋；这组负面一压，她就不会被画成穿黑丝或过膝袜的修女。

---

## 十一、采样参数

| 参数 | Animagine 4.0 | Animagine 3.1 |
|---|---|---|
| CLIP Set Last Layer | **-2** | **-2** |
| Steps | 25 ~ 28 | 28 ~ 30 |
| CFG | 5.0 ~ 7.0 | 4.0 ~ 7.0 |
| Sampler | euler_ancestral | euler_ancestral |
| Scheduler | normal | normal |
| 分辨率 | **896×1152** | **896×1152** |

用 4:5 而不是 2:3——她的长袍到脚踝，2:3 长画幅会把脚截掉，`black shoes` 和 `pectoral cross` 这两个细节都保不住。

---

## 十二、4.0 自然语言补句

**铺垫版（场景 1）**
```
A twenty-six-year-old mother superior standing before a nobleman's desk, her
shoulders slightly bowed, both hands clasped humbly at her chest, her dark ankle-length
habit and black veil immaculate, a white wimple framing her face, the golden
pectoral cross resting against her chest, her emerald eyes lowered, a sad, apologetic
smile on her lips, asking for alms she knows she has no right to refuse.
```

**正戏版（场景 6）**
```
The same mother superior bent over the church altar, her long dark habit lifted
and bunched at her waist, white pantyhose torn, her black veil askew but still
on her head, the golden pectoral cross swinging against her chest with each
thrust, her hands still clasped in prayer on the marble, a silver rosary fallen
and scattered at her feet, emerald eyes half-closed and unfocused, tears running
down her cheeks, the stained glass window casting colored light across her back.
```

关键对照：**第一句 `immaculate`（整洁）→ 第二句 `lifted and bunched`（被撩起）**，**`hands clasping a bible` → `hands still clasped in prayer`**，**`cross resting against her chest` → `cross swinging with each thrust`**。

同一个动作，两种处境。`clasping` 和 `still clasped` 这个词的呼应，是全套里最锋利的一处。

---

## 十三、文件清单

| 文件 | 内容 |
|---|---|
| `comfyui/cecilia_workflow.json` | 完整工作流，CLIP Set Last Layer -2，896×1152 |
| `comfyui/wildcards/cecilia_anchor.txt` | 锚点 |
| `comfyui/wildcards/cecilia_negative.txt` | 负面（含四角色腿部防串） |
| `comfyui/wildcards/cecilia_charity.txt` | 场景 1-2（铺垫） |
| `comfyui/wildcards/cecilia_ritual.txt` | 场景 3-5（口交 / 乳交 / 素股） |
| `comfyui/wildcards/cecilia_deflower.txt` | **场景 6（第一次·落红）**，单独成文件，便于反复出图 |
| `comfyui/wildcards/cecilia_finale.txt` | 场景 7-9（祭坛 / 分发救济粮 / 终局） |

---

## 十四、排错速查

| 症状 | 原因 | 修法 |
|---|---|---|
| 头巾画成普通头巾 | 缺 `wimple` | `nun habit, veil, wimple` 三个一起 |
| 十字架变成小项链 | 缺 `pectoral cross` | 加 `pectoral cross`，权重 1.15 |
| 腿被画成光腿 | 缺 `covered legs` | `(white pantyhose:1.3), white tights, covered legs`，负面压 `bare legs` |
| 腿变黑丝/过膝袜 | 四角色串色 | 负面必留 `black pantyhose, thighhighs` |
| 长袍被整件脱掉 | `torn clothes` 过头 | 只写 `dress lift, long dress lifted`，服装保持完整 |
| **裙长不到脚踝** | `long dress` 被画成及膝 | `(ankle-length skirt:1.3)`，负面压 `short skirt, miniskirt, bare thighs` |
| **鞋被画成高跟** | 正面临留 `low heels` | 正面只用 `flat shoes, mary janes`，负面压 `high heels, low heels, pumps` |
| **跪姿看起来怪** | 非必要场合用了 `kneeling` | 改站姿 `standing, bowing` 或坐姿 `sitting, on pew` |
| 表情直接变阿黑颜 | 跳过 `guilty, ashamed` | 中期必须用 `guilty, ashamed, averting eyes` |
| 头巾被摘 | 用了 `veil fallen` 但场景不对 | 只有场景 8 才允许 `veil fallen` |
| 祭坛不够高 | 缺 `altar` | `altar, marble, candlesticks` 一起给，配 `low angle` |
| 场景 7 缺孩子 | 缺 `children, orphans` | `poor, children, crowd, orphans` 四个一起 |
| **落红画不出来** | 只写了 `blood` | `blood, blood on pantyhose, blood on thigh, blood stain` 四个一起 |
| **血流得太多像重伤** | `blood` 权重过高 | 降到 `(blood:0.9)`，只用 `blood stain` 表达"渗出来" |
| **白裤袜被画成全脱** | 缺 `pantyhose pull` | 只写 `pantyhose pull`，**不写** `pantyhose removed`、`bottomless` |
| **表情画成爽** | 混入 `ahegao` | 场景 6 必须删 `ahegao`，只留 `pain, wince, clenched teeth` |
| **构图看不出白袜** | 缺对焦 | `focus on thighs, close-up`，让裤袜占画面重心 |
| **素股看不出龟头** | 只写了 `intercrural sex` | `penis, (penis head:1.3), glans, penis between thighs, protruding, emerging` 六个一起 |
| **素股只画成两条腿叠着** | 视角不对 | 改 `from side` + `close-up` + `low angle`，`focus on penis` |
| **器官画成一条线没体积** | 缺质感词 | `glistening, precum, veins` 三个一起 |
| **场景 5 裤袜被弄脏** | 混入了 `blood` 或 `cum` | 场景 5 正面**不许出现** `blood` / `cum on pantyhose`，保持雪白 |

---

*肥鱼备注：修女这套的独门素材是**宗教符号**——`wimple`、`pectoral cross`、`rosary`、`crucifix`。
> 这四个东西在每一张里都要有，而且要有「位移」：十字架从胸前，到晃动，到落地碎裂；念珠从手中，到掉在祭坛上，到散成一地珠子。
> **道具的位移，就是她精神的位移。** 这套图不需要靠露多少来吓人，靠的是那枚十字架什么时候掉下来。*
