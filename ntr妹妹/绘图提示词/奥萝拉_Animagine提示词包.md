# 奥萝拉 · Animagine XL 提示词包 v3

> **本版改动**：女仆装改为长裙、胸口遮蔽、表情改为柔弱化
> 目标模型：**Animagine XL 4.0**（主）/ **Animagine XL 3.1**（兼容）
> 配套：`comfyui/aurora_workflow.json`、`comfyui/wildcards/*.txt`

---

## 零、v2 → v3 改动对照

### 0.1 服装：短裙 → 长裙

| 项目 | v2 | v3 |
|---|---|---|
| 裙长 | 未指定（模型默认画短裙） | **`(long skirt:1.25)`** + `pinafore` |
| 领口 | 普通 | **`peter pan collar`** + `white shirt` + `collared shirt` |
| 袖 | `long sleeves, puffy sleeves` | 保留，权重不降 |
| 围裙 | `white apron, frilled apron` | 保留，加 `pinafore`（围裙式连衣裙，最出长裙感） |
| 负面 | 无裙长压制 | **新增 `short skirt, miniskirt, pleated skirt`** |

> `long skirt` 单用经常压不住 Animagine 的"女仆=短裙"先验，必须配 `pinafore` 一起用，再加负面压 `short skirt`，三重保险。

### 0.2 胸口：暴露 → 遮蔽

| 项目 | v2 | v3 |
|---|---|---|
| `cleavage` | 正面锚点里有 | **正面全部删除**，移入负面 |
| 胸部描述 | `huge breasts` | 降为 **`large breasts` + `breasts covered`** |
| 遮挡词 | 无 | `breasts covered, white shirt, collared shirt, peter pan collar` |
| 负面新增 | — | `cleavage, revealing clothes, bare shoulders, bare arms, midriff` |

> `breasts covered` 是 Danbooru 真实 tag，专指"胸部被衣物完全覆盖"，是压暴露度最直接的词。尺寸降一档到 `large` 是为了避免模型为了塞下 `huge` 而把衣服画崩、自动开领口。

### 0.3 表情：温柔 → 柔弱

| 项目 | v2 | v3 |
|---|---|---|
| 主锚点 | `gentle smile, apologetic expression, dazed` | **`timid, shy, worried, teary eyes, flustered`** |
| 眼神 | `half-closed eyes` | **`upturned eyes, looking up`**（上目遣い，柔弱感最强） |
| 辅助 | — | `small frown, sweatdrop, trembling, cowering` |
| 保留 | `blush, half-closed eyes, apologetic expression` | 保留但降为辅助 |

> `upturned eyes`（上目遣い）是这次改动里最值钱的一个 tag——低头上看 + 眼含水光，柔弱感立刻出来。搭配 `small frown` 就比 `gentle smile` 弱得多。

### 0.4 NSFW 场景逻辑同步调整

原来的 `half undressed`（半脱）全部删除。改成：

```
上身衣冠完整（maid outfit, long sleeves, white apron 全保留）
+ 只破下半身（skirt lift, long skirt lifted, pantyhose pull, torn pantyhose）
```

这样出来的画面是「整整齐齐的女仆装，裙子被掀到腰上」——比全身脱光更符合"被动、不反抗、被推着走"的人设，视觉冲击也更强。

---

## 一、新锚点（v3 标准件）

### 1.1 外观锚点（锁定层，所有场景都带）

```
blue hair, long hair, straight hair, blue eyes, mature female,
glasses, gold-rimmed glasses, round eyewear,
large breasts, breasts covered,
pale skin, tall female, onee-san,
black pantyhose, covered legs
```

关键三处：
- `large breasts` 后面**紧跟** `breasts covered`，两者连着写模型才不会自己开胸
- `covered legs` 帮模型理解裤袜包住整条腿
- `gold-rimmed glasses` 是角色第一辨识点，绝不能丢

### 1.2 服装锚点（长裙遮胸版）

```
maid, maid headdress, maid outfit, black dress,
(long skirt:1.25), long sleeves, puffy sleeves,
white apron, frilled apron, pinafore,
peter pan collar, white shirt, collared shirt,
black shoes
```

| tag | 作用 |
|---|---|
| `pinafore` | 围裙式连衣裙，出长裙最有效的结构词 |
| `long skirt` | 裙长，必须给 1.2~1.3 权重 |
| `white shirt` + `collared shirt` | 内搭，给胸口一层物理遮挡 |
| `peter pan collar` | 娃娃领，把领口收高，兼带一点幼态柔弱感 |
| `puffy sleeves` | 泡泡袖，遮手臂，且是女仆装标志 |

### 1.3 表情锚点（柔弱四档）

| 阶段 | tag 组合 |
|---|---|
| 天然呆（柔弱） | `dazed, blank stare, timid, shy, half-closed eyes, small frown` |
| 歉意式（主用） | `timid, worried, teary eyes, upturned eyes, looking up, flustered, blush, apologetic expression` |
| 被迫 / 内疚 | `worried, teary eyes, crying, trembling, cowering, small frown, sweatdrop` |
| 堕落臣服 | `empty eyes, mind break, broken smile, ahegao, drooling, blush` |

> 差别在哪：v2 是"温柔但笑着"，v3 是"快要哭出来但还在忍着"。`small frown` 替代 `gentle smile`，`teary eyes` 替代 `half-closed eyes`，气质整个换了一层。

---

## 二、7 场景完整提示词（v3 · 可直接粘）

### 场景 1 · 女仆日常

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
1girl, solo, blue hair, long hair, straight hair, blue eyes, mature female,
glasses, gold-rimmed glasses, round eyewear, large breasts, breasts covered,
pale skin, tall female, onee-san, black pantyhose, covered legs,
maid, maid headdress, maid outfit, black dress, (long skirt:1.25),
long sleeves, puffy sleeves, white apron, frilled apron, pinafore,
peter pan collar, white shirt, collared shirt,
standing, holding tray, tea set, hands together,
timid, shy, worried, teary eyes, upturned eyes, looking up,
flustered, small frown, blush, half-closed eyes,
indoor, mansion corridor, carpet, window, sunlight through window,
cowboy shot, from front,
soft lighting, warm atmosphere, depth of field
```

### 场景 2 · 长裙摇曳背影

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
1girl, solo, blue hair, long hair, straight hair, blue eyes,
glasses, gold-rimmed glasses, large breasts, breasts covered, onee-san,
black pantyhose, covered legs,
maid, maid headdress, black dress, (long skirt:1.3),
long sleeves, puffy sleeves, white apron, frilled apron, pinafore, peter pan collar,
from behind, full body, walking, holding tray,
long skirt swaying, wide hips, looking back,
timid, worried, teary eyes, blush, apologetic expression,
mansion corridor, tall windows, red carpet,
backlighting, rim light, cinematic
```

> `long skirt swaying`（裙摆摇曳）是这次新加的，长裙最大的视觉优势就是走动时的布料流动感，比短裙的臀部曲线更含蓄、也更符合人设。

### 场景 3 · 领主府长桌（NSFW · 上身完整）

```
masterpiece, best quality, very aesthetic, absurdres, newest, explicit,
1girl, 1boy, blue hair, long hair, straight hair, messy hair, disheveled hair,
glasses, gold-rimmed glasses, glasses askew, broken glasses,
large breasts, breasts covered,
maid, maid outfit, black dress, long sleeves, puffy sleeves,
white apron, frilled apron, (long skirt:1.2),
skirt lift, long skirt lifted, black pantyhose, torn pantyhose, pantyhose pull, covered legs,
bent over, on table, from behind, all fours, sex from behind, anal,
fat man, ugly bastard, older male, dark skin,
sweat, blush, drooling, ahegao, half-closed eyes, tears,
timid, worried, teary eyes, cowering, forced,
netorare, mind break, cum, cum on body,
indoor, mansion, wooden table, candlelight,
pov, close-up on face, side view,
dim lighting, dramatic shadow, wet skin
```

### 场景 4 · 丝袜堵嘴（NSFW · 终局）

```
masterpiece, best quality, very aesthetic, absurdres, newest, explicit,
1girl, 1boy, blue hair, long hair, straight hair,
glasses, gold-rimmed glasses, large breasts, breasts covered,
maid, maid headdress, maid outfit, black dress, long sleeves, puffy sleeves,
white apron, frilled apron, (long skirt:1.2),
black pantyhose, one leg pantyhose,
kneeling, crouching, leaning forward, arm extended,
panties in mouth, pantyhose in another's mouth,
glasses askew, timid, worried, teary eyes,
apologetic expression, troubled smile, blush, sweat,
netorare, cum on pantyhose, wet pantyhose, shiny pantyhose,
pov, from above, looking down at viewer, close-up,
indoor, mansion bedroom, dim lighting
```

### 场景 5 · 婚礼当众（NSFW · 长裙婚纱）

```
masterpiece, best quality, very aesthetic, absurdres, newest, explicit,
1girl, multiple boys, blue hair, long hair, straight hair,
veil, bridal veil, glasses, gold-rimmed glasses, glasses askew,
large breasts, breasts covered,
white wedding dress, (long skirt:1.25), long sleeves,
dress lift, bridal outfit, black pantyhose, torn pantyhose,
standing, bent over, surrounded, group sex, gangbang,
fat man, ugly bastard, multiple males,
ahegao, mind break, empty eyes, drooling, sweat, tears, teary eyes, trembling,
broken smile, apologetic expression,
netorare, cum, cum on body, cum on face,
indoor, chapel, crowd, ceremony,
wide shot, dutch angle, dramatic lighting
```

### 场景 6 · 面部特写（表情差分）

```
masterpiece, best quality, very aesthetic, absurdres, newest, sensitive,
1girl, solo, portrait, face focus, close-up,
blue hair, long hair, straight hair, hair between eyes,
glasses, gold-rimmed glasses, glasses askew, round eyewear,
blue eyes, teary eyes, upturned eyes, looking up, blush,
timid, worried, flustered, small frown, apologetic expression,
slightly open mouth, sweat,
white background, simple background, upper body,
soft lighting, pastel color
```

### 场景 7 · 堕落完成

```
masterpiece, best quality, very aesthetic, absurdres, newest, sensitive,
1girl, solo, blue hair, long hair, straight hair,
glasses, gold-rimmed glasses, large breasts, breasts covered,
maid, maid outfit, black dress, (long skirt:1.25),
long sleeves, puffy sleeves, white apron, frilled apron,
black pantyhose, torn pantyhose,
standing, hands behind back, long skirt swaying,
empty eyes, mind break, half-closed eyes, broken smile,
blush, drooling,
netorare, corruption,
indoor, mansion, corridor,
full body, from front, low angle,
dim lighting, cold color, ominous atmosphere
```

---

## 二·补、场景 8 · 领主情妇（贵妇装 · 终局）

**分级**：`sensitive` ｜ **镜头**：`full body` + `from front`（立绘式，展示服装）
**对应状态**：终局 · 成为领主情妇
**真源**：`03_小队全员档案.md` L178「私心极盼能瞒着众人接下高薪报酬的私活把债填上」、L182–184「软弱畏权 / 牺牲补偿心理 / 从不责怨加害者」；`反派设定.txt` L4、L13「用金币购买女性的服务，以领主权力合法化」

### 8.1 这张图的设计核心

她原来那身是**领口系紧、无露肤设计**的黑白女仆牧师服（真源 L192）。到了这张，衣服换成贵妇装，但**她那张脸一点没变**——

| 换掉的 | 留下的 |
|---|---|
| 荷叶边围裙、白色女仆发带 | **金丝圆框眼镜**（`glasses, round frame, gold frame`） |
| 黑白长裙 | 深蓝丝绒长袍、金线刺绣、毛皮滚边 |
| 黑平底圆头皮鞋 | 黑色高跟 |
| 无任何首饰 | 珍珠项链、耳坠、长手套 |

**眼镜必须留。** 她身上唯一没被换掉的，就是那副旧眼镜和那副温顺表情。**华服 + 旧眼镜**，这一对矛盾就是整张图的说明。

### 8.2 贵妇装服装槽

```
(navy dress:1.2), (dark blue dress:1.15), (gown:1.2), (long dress:1.2), (floor-length:1.1),
velvet, silk, (brocade:1.1), (embroidery:1.2), (gold embroidery:1.15), gold trim,
wide skirt, (crinoline:1.1), (layered skirt:1.05), (padded dress:1.0),
(high collar:1.15), (covered chest:1.15), (modest neckline:1.05),
(off shoulder:1.1), (bare shoulders:1.1), (backless:1.05), (open back:1.05),
(fur trim:1.15), (fur stole:1.1), (shoulder cape:1.05),
(long gloves:1.2), (elbow gloves:1.15), white gloves, (lace gloves:1.05),
(pearl necklace:1.2), (jewelry:1.15), earrings, (ring:1.05), (gold jewelry:1.1), (headdress:1.05),
(corset:1.15), (sash:1.05), ribbon,
(black stockings:1.15), (black pantyhose:1.05),
(high heels:1.2), black heels, (silk heels:1.05),
```

| 部件 | 为什么这么给 |
|---|---|
| `(navy dress:1.2), (dark blue dress:1.15)` | **深蓝**——呼应她的深蓝直发与深蓝眼眸，不是随便给的色 |
| `velvet, silk, (brocade:1.1), (gold embroidery:1.15)` | 材质本身就是价码：丝绒、织锦、金线 |
| `(high collar:1.15), (covered chest:1.15)` | **胸口仍遮着**——她不是靠露肉当情妇的，这点必须守住 |
| **`(off shoulder:1.1), (bare shoulders:1.1), (backless:1.05)`** | **唯一被允许露的地方：肩与背**，领口以下一律严实 |
| `(fur trim:1.15), (fur stole:1.1)` | 毛皮滚边，贵妇的通用符号 |
| `(long gloves:1.2), white gloves` | 及肘长手套，遮手也显贵 |
| `(pearl necklace:1.2), (jewelry:1.15), earrings` | 珍珠是领主给的，她一件旧首饰都没有 |
| `(high heels:1.2)` | 平底圆头鞋换成高跟——**这是身份变化最直观的一笔** |
| `(glasses:1.2), (round frame:1.15), (gold frame:1.1)` | **旧眼镜，必须留** |

### 8.3 表情（温顺的认命，不是嚣张的堕落）

```
(gentle smile:1.1), (sad smile:1.15), (resigned:1.15), (tired eyes:1.2),
(looking down:1.05), (soft gaze:1.1), (melancholy:1.1),
(light blush:1.0), (slightly drooping eyes:1.05),
(glasses:1.2), (round frame:1.15), (gold frame:1.1),
```

| 组 | tag | 说明 |
|---|---|---|
| 笑 | `(gentle smile:1.1), (sad smile:1.15)` | 还是温顺的笑，只是底下压着疲 |
| 认 | **`(resigned:1.15)`** | 这是"我认了"，不是"我要了" |
| 疲 | `(tired eyes:1.2), (melancholy:1.1), (slightly drooping eyes:1.05)` | 眼底的倦 |
| 避 | `(looking down:1.05)` | 低头，依旧那副"如果可以的话……"的姿态 |

> **她的堕落是自责式的**（真源 L184：委屈吃亏时从不责怨加害者，只怪自己没用）。所以**不能给任何嚣张的表情**：`smug, evil smile, arrogant, seductive` 全部进负面。
> 与妮丝的终局（雌小鬼邪恶笑）正好相反——一个开始享用，一个始终在忍。

### 8.4 场景与镜头

```
indoor, (manor:1.15), (luxurious room:1.15), (marble floor:1.1), (chandelier:1.15),
(velvet curtains:1.1), (gold ornaments:1.1), (portrait painting:1.05), (heavy furniture:1.05),
(candle light:1.1), (warm light:1.1), (soft shadow:1.0),
full body, from front, standing, (contrapposto:1.05), (hands clasped in front:1.15),
(depth of field:1.1), wide shot,
```

**姿态**：`(hands clasped in front:1.15)` —— 她原来的"外在面具"就是**双手交叠腹前、温顺微笑连连致歉**（真源 L180）。这个动作不变，站在大理石地板上，才对比得出来。

### 8.5 完整正面（主图 · 直接粘贴）

```
masterpiece, best quality, very aesthetic, absurdres, newest, sensitive,
1girl, solo, adult, mature female, tall female, voluptuous,
dark blue hair, (navy hair:1.15), long hair, straight hair, very long hair, blunt bangs,
blue eyes, (deep blue eyes:1.15), (glasses:1.2), (round frame:1.15), (gold frame:1.1),
pale skin, (pale skin:1.05), (soft body:1.1), (wide hips:1.1),
(navy dress:1.2), (dark blue dress:1.15), (gown:1.2), (long dress:1.2), (floor-length:1.1),
velvet, silk, (brocade:1.1), (embroidery:1.2), (gold embroidery:1.15), gold trim,
wide skirt, (crinoline:1.1), (high collar:1.15), (covered chest:1.15), (modest neckline:1.05),
(off shoulder:1.1), (bare shoulders:1.1), (backless:1.05),
(fur trim:1.15), (fur stole:1.1),
(long gloves:1.2), (elbow gloves:1.15), white gloves,
(pearl necklace:1.2), (jewelry:1.15), earrings, (gold jewelry:1.1), (headdress:1.05),
(corset:1.15), (sash:1.05),
(black stockings:1.15), (high heels:1.2), black heels,
(gentle smile:1.1), (sad smile:1.15), (resigned:1.15), (tired eyes:1.2),
(looking down:1.05), (soft gaze:1.1), (melancholy:1.1), (slightly drooping eyes:1.05),
standing, (contrapposto:1.05), (hands clasped in front:1.15),
indoor, (manor:1.15), (luxurious room:1.15), (marble floor:1.1), (chandelier:1.15),
(velvet curtains:1.1), (gold ornaments:1.1), (portrait painting:1.05),
(candle light:1.1), (warm light:1.1),
full body, from front, wide shot, (depth of field:1.1),
```

### 8.6 负面

```
(worst quality, low quality:1.4), bad anatomy, extra fingers, fused fingers, missing fingers,
deformed, disfigured, malformed limbs, mutated, extra arms, extra legs,
text, watermark, signature, censored, mosaic censoring,
apron, maid, maid headdress, (white apron:1.2), waitress, nun, holy symbol, cross necklace, rosary,
white shirt, black long skirt, (flat shoes:1.1), round toe shoes, (plain clothes:1.1),
smug, evil smile, arrogant, seductive, (happy:1.1), laughing, playful, teasing,
ahegao, tongue out, half-closed eyes, (blush of pleasure:1.1),
1boy, 2boys, male, older male, fat man, multiple boys, (male focus:1.1),
cleavage, nipples, areolae, exposed chest, breasts out, (deep neckline:1.15),
short skirt, miniskirt, microskirt, thighhighs, zettai ryouiki,
modern, office, business suit, suit, necktie, jeans, t-shirt,
```

> 三组关键：
> - **压常服**：`apron, maid, maid headdress, white apron, white shirt, flat shoes` —— 不压的话模型会把女仆装加回来，贵妇装就废了。
> - **压露肉**：`cleavage, nipples, exposed chest, breasts out, (deep neckline:1.15)` —— 她是情妇不是妓女，**胸口必须严实**，暴露感交给肩背与丝袜。
> - **压嚣张**：`smug, evil smile, arrogant, seductive, happy, laughing` —— 她的终局是自责式的认命。

### 8.7 参数

| 参数 | 值 |
|---|---|
| 分辨率 | **832×1216**（立绘竖构图，蓬裙与高跟都要进画） |
| Steps | 27 |
| CFG | 6.0 |
| Sampler | euler_ancestral |
| CLIP Set Last Layer | -2 |

### 8.8 三个可选变体

**变体 A · 领主在侧**（把"情妇"讲明白，接 `反派设定.txt` 的胖领主）

```
1girl, 1boy, (fat man:1.2), (older male:1.15), (ugly:1.05), (rich clothes:1.1),
(short stature of man:0.9), standing beside her, (hand on her waist:1.15), (possessive:1.1),
height difference, (her hands clasped in front:1.15),
(forced smile:1.15), (sad smile:1.1), (looking down:1.1),
```

**变体 B · 首饰盒与账单**（她的动机还摆在桌上）

```
(open jewelry box:1.15), (pearl necklace on velvet:1.15), (gold coins:1.1), (ledger:1.1),
(debt paper:1.1), desk, (writing desk:1.1), (quill:1.05),
(looking at jewelry box:1.1), (troubled:1.1), (hands clasped in front:1.15),
```

**变体 C · 镜前**（她自己看自己）

```
(standing in front of mirror:1.2), (mirror:1.15), (reflection:1.2),
(touching own cheek:1.1), (tired eyes:1.25), (resigned:1.2), (sad smile:1.15),
(fancy dress:1.15), (pearl necklace:1.2),
```

### 8.9 排错速查

| 症状 | 原因 | 修法 |
|---|---|---|
| 女仆装又回来了 | 常服词没压 | 负面必加 `apron, maid, maid headdress, white apron, white shirt, flat shoes` |
| 胸口开太深 | 缺遮蔽组 | `(covered chest:1.15), (modest neckline:1.05)`，负面压 `cleavage, nipples, (deep neckline:1.15)` |
| 认不出是奥萝拉 | 眼镜丢了 | `(glasses:1.2), (round frame:1.15), (gold frame:1.1)` —— 这是她唯一必须保留的识别件 |
| 发色画成金色 | 模型惯性 | `(navy hair:1.15), (dark blue hair:1.1)`，负面压 `blonde hair, yellow hair` |
| 表情像名媛 | 缺疲态 | `(resigned:1.15), (tired eyes:1.2), (melancholy:1.1)`，负面压 `happy, laughing, seductive` |
| 裙子不够贵 | 缺材质组 | `velvet, silk, (brocade:1.1), (gold embroidery:1.15), (fur trim:1.15)` |
| 鞋子还是平底 | 缺高跟 | `(high heels:1.2), black heels`，负面压 `flat shoes, round toe shoes` |
| 裙摆画成短裙 | 缺长度组 | `wide skirt, (crinoline:1.1), (floor-length:1.1), (long dress:1.2)`，负面压 `short skirt, miniskirt, thighhighs` |

---

## 三、负面提示词（v3 · 已加长裙遮胸压制）

```
(low quality, worst quality:1.4), (bad anatomy), (inaccurate limb:1.2),
bad composition, inaccurate eyes, extra digit, fewer digits, (extra arms:1.2),
extra fingers, fused fingers, missing fingers, deformed, disfigured, mutated,
text, error, signature, watermark, username, logo, blurry, lowres, jpeg artifacts,
multiple views, comic, 2koma, speech bubble,
child, loli, flat chest, short hair, blonde hair, red hair, purple hair, silver hair,
heterochromia, eyepatch, twin tails, no glasses,
censored, mosaic censoring, bar censor, pixelated,
cleavage, short skirt, miniskirt, revealing clothes, bare shoulders, bare arms, midriff
```

新增的 7 个词分工：

| tag | 针对 |
|---|---|
| `cleavage` | 胸口露沟 |
| `short skirt` / `miniskirt` | 裙长压不住 |
| `revealing clothes` | 整体暴露 |
| `bare shoulders` / `bare arms` | 泡泡袖被画成短袖/吊带 |
| `midriff` | 露腰 |

> `cleavage` 出现在负面里，等于给模型一个"反向方向盘"，比单纯正面不写更有效。这是 v3 最关键的技巧之一。

---

## 四、采样参数（不变）

| 参数 | Animagine 4.0 | Animagine 3.1 |
|---|---|---|
| CLIP Set Last Layer | **-2** | **-2** |
| Steps | 25 ~ 28 | 28 ~ 30 |
| CFG | 5.0 ~ 7.0 | 4.0 ~ 7.0 |
| Sampler | euler_ancestral | euler_ancestral |
| Scheduler | normal | normal |
| 分辨率 | 832×1216 | 832×1216 |

白名单：`1024×1024 / 1152×896 / 896×1152 / 1216×832 / 832×1216 / 1536×640 / 640×1536`

---

## 五、4.0 自然语言补句（v3 柔弱版）

长裙和柔弱表情都是"质感类"特征，纯 tag 容易被压，4.0 里用句子补最有效：

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
1girl, solo, blue hair, long hair, straight hair, blue eyes,
gold-rimmed glasses, large breasts, breasts covered, black pantyhose,
maid outfit, long skirt, puffy sleeves, white frilled apron, pinafore, peter pan collar,
timid, teary eyes, upturned eyes, small frown, blush,
A timid, fragile older sister in a modest black maid uniform with a high peter pan collar
and a floor-length skirt that hides her legs completely, glossy black pantyhose visible
only at her ankles, holding a tea tray with trembling hands, her eyes welling up as she
glances upward, as if she is about to apologize for something she has not done yet.
```

句子要点（v3 专用）：
1. **`modest`** 打头，先给模型"保守"的总基调
2. **`high peter pan collar`** — 明说领口高
3. **`floor-length skirt that hides her legs completely`** — 用从句把"裙长盖住腿"讲透，这是 tag 做不到的
4. **`visible only at her ankles`** — 脚踝露一点裤袜，比直接露腿更有味道
5. **`trembling hands` / `eyes welling up` / `glances upward`** — 三个动作把柔弱写实

---

## 六、文件更新清单

| 文件 | 状态 |
|---|---|
| `comfyui/aurora_workflow.json` | ✅ 已更新锚点节点、场景节点、负面节点，分组标题同步 |
| `comfyui/wildcards/aurora_anchor.txt` | ✅ 长裙遮胸锚点 |
| `comfyui/wildcards/aurora_negative.txt` | ✅ 加 cleavage / short skirt 等 7 词 |
| `comfyui/wildcards/aurora_maid.txt` | ✅ 3 行长裙日常变体 |
| `comfyui/wildcards/aurora_ntr.txt` | ✅ 3 行上身完整变体 |
| `comfyui/wildcards/aurora_finale.txt` | ✅ 3 行终局长裙变体 |

---

## 七、排错速查（v3 专项）

| 症状 | 原因 | 修法 |
|---|---|---|
| 还是画成短裙 | `long skirt` 权重不够，或没配 `pinafore` | `(long skirt:1.4)`，正面必带 `pinafore`，负面保留 `short skirt, miniskirt` |
| 胸口还是露 | 正面 `breasts covered` 离 `large breasts` 太远 | 两个词**紧挨着**写，负面加 `(cleavage:1.3)` |
| 领口被画成 V 领 | 缺领型 tag | 加 `peter pan collar, collared shirt, white shirt`，负面加 `cleavage` |
| 袖子变短袖/吊带 | `puffy sleeves` 权重低 | `(puffy sleeves:1.2)`，负面加 `bare shoulders, bare arms` |
| 表情还是"温柔笑" | `gentle smile` 残留 | 全部删掉 `gentle smile`，换 `small frown`；`upturned eyes` 给 1.2 |
| 柔弱变"惊恐"过头 | `cowering` / `crying` 太多 | 只留 `teary eyes + worried + small frown`，删 `cowering` |
| 长裙把腿完全盖死，看不到裤袜 | 缺少脚踝露出 | 加 `ankles, black pantyhose visible at ankles`，或改 `mid-calf skirt` |
| 上身衣服在 NSFW 场景被脱掉 | `half undressed` 残留 | 确认正面没有 `half undressed / topless / undressed`，负面加 `topless, undressed` |

---

*肥鱼备注：长裙 + 遮胸 + 柔弱这套组合，在 Animagine 上最容易翻车的点是「裙长」和「领口」——模型对女仆装有个很强的短裙 V 领先验。所以 v3 的核心思路是：**正面用 `pinafore` + `long skirt` 立结构，负面用 `short skirt` + `cleavage` 反推**，两头夹住才稳。*
