# 爱丽丝 · Animagine XL 立绘提示词包 v2

> **角色定位**：银月珠宝铺首席柜员 · 原店主长女 · 席德名义上的未婚继室与远房外甥女
> **年龄 / 身形**：**19 岁** · 165cm · 纤细、腰肢纤巧、少女骨架
> **外观**：**棕发**（与弟弟爱德同色）· 半挽长发 · 琥珀色眼眸 · 墨绿细呢立领蕾丝长裙
> **堕落曲线**：**受胁隐忍型**——不是被欲望拖下去，是被一张伪造的借据和一个人质谎言钉在原地
>
> **目标模型**：Animagine XL 4.0（主）/ 3.1（兼容）
> **配套**：`comfyui/wildcards/alice_*.txt`（7 个，已按 v2 重写）
>
> **v1 → v2 三处修正（按主人指示）**
>
> | 项 | v1（错） | v2（改） |
> |---|---|---|
> | 发色 | 乌黑 | **棕色**，与爱德同色；锚点改 `brown hair`，负面压 `black hair`（防串到古兰） |
> | 年龄感 | 20 岁 + `mature female` + 妇人挽髻 → 出图 28+ | **19 岁**，删 `mature female` 改 `young adult, youthful`；发型改**半挽**，`updo` 只在嫁衣场景用 |
> | 词法 | 通篇堆权重、自造 tag（`fine wool` / `matte fabric` / `heart-shaped face` / `tailored dress`） | **回归全工程同一套词法**：干净 tag 列表、只给 3~4 个关键权重，与妮丝／艾琳／塞西莉亚／奥萝拉／古兰完全同风格 |
>
> **信源**：`设定_NPC_爱丽丝与席德角色全案.md` L102–104、`世界书条目/07_城镇支线与特殊角色.md` L53–54、`奥森德/src/app/okh_app_data.js` L2714 / L2728–2737 / L2761
> ⚠️ 真源文本仍写「20 岁／乌黑油润」，与主人本次口径（19 岁／棕发）不一致——**本包按主人口径出图**，真源文本是否同步待主人示下。

---

## 零、词法基准（为什么 v1 画风会跑偏）

全工程五个包（妮丝／艾琳／塞西莉亚／奥萝拉／古兰）共用一套词法，v1 违反了它，所以出图风格和她们对不上：

| 规则 | 老包的做法 | v1 的错误 | v2 修正 |
|---|---|---|---|
| 权重密度 | 整串只 2~4 个 `()`，且集中在锚点与招牌服饰 | 几乎每个词都带 1.05~1.3 | 只保留 `(half updo:1.25)`、`(amber eyes:1.2)`、`(dark green dress:1.3)`、`(lace collar:1.3)` 四个 |
| tag 来源 | 全部是 Danbooru 实词 | 自造 `fine wool`、`matte fabric`、`tailored dress`、`heart-shaped face`、`afternoon` | 全部删掉，改 `wool dress`、`lace trim`、`oval face` 等实词或不写 |
| 分段 | 质量头 / 锚点 / 服装 / 动作表情 / 场景镜头，一段一行 | 揉成一大团带权重 | 恢复五段式，一段一行 |
| 表情 | `smile, closed mouth, blush` 这类单词 | `(professional smile:1.25)` 权重堆叠 | 回到单词，权重只给需要压的 |
| 场景 | `indoor, jewelry shop, counter, warm lighting` | 每条都带 1.05~1.15 | 全部去权重 |

> 一句话：**老包是"用词说话"，v1 是"用权重说话"**。同一台模型，权重一密，画风就往"过度渲染的厚涂"跑，和其他五张立绘放一起自然不是一套。v2 已经把这条改回来了。

---

## 一、锚点

### 1.1 外观锚点（每条必带）

```
1girl, solo,
brown hair, long hair, wavy hair, (half updo:1.25), loose strands, side bangs,
amber eyes, (amber eyes:1.2), long eyelashes,
adult, young adult, youthful, pale skin,
slim, narrow waist, medium breasts, slender,
```

| tag | 对应真源 / 主人口径 |
|---|---|
| `brown hair, long hair, wavy hair` | **棕色长发**，与弟弟爱德同色系；`wavy` 出微卷的柔顺感，不是直板 |
| **`(half updo:1.25), loose strands, side bangs`** | **19 岁的梳法**：上半挽起、两侧留碎发、侧分刘海。既"梳好了头"又不显老 |
| `amber eyes, (amber eyes:1.2)` | 深琥珀色眼眸；双写防漂成 `brown eyes` |
| `adult, young adult, youthful` | **19 岁**。不要写 `mature female`——那个词老包用来标 26 岁的塞西莉亚，套她身上直接加八岁 |
| `pale skin, slim, narrow waist` | 肤白、纤细、腰肢纤巧 |
| `medium breasts, slender` | 少女骨架，别给 `voluptuous`（那是塞西莉亚） |

> 🔴 **`updo` 从锚点里彻底移除**。v1 用 `hair up + hair bun + updo + slicked back` 四条把她的头发死死盘成妇人髻，这正是"显老"的第一元凶。
> 现在只在**场景 7 嫁衣**那一张单独给 `updo`——头发被盘起来＝被安排，正好当剧情差分用。

### 1.2 服装锚点（墨绿细呢立领蕾丝长裙 · 一字不改）

```
dark green dress, (dark green dress:1.3), long dress, wool dress,
long sleeves, (high collar:1.15), (lace collar:1.3), white lace, lace trim, lace cuffs,
waist ribbon, thin belt,
(silver earrings:1.15), (silver necklace:1.15), thin chain,
```

| 分组 | tag | 说明 |
|---|---|---|
| 主裙 | `dark green dress, (dark green dress:1.3), long dress, wool dress` | 墨绿是她的第一辨识色；`wool dress` 出细呢的哑光垂坠 |
| 领袖 | `(high collar:1.15), (lace collar:1.3), white lace, lace trim, lace cuffs` | **白色蕾丝立领＋袖口是她整身唯一的高光块**，小图认人全靠它 |
| 腰 | `waist ribbon, thin belt` | 腰系细带 |
| 银饰 | `(silver earrings:1.15), (silver necklace:1.15), thin chain` | 水沫银耳坠、颈间细银链（首饰样品） |

> 与另外几位女角色的服装分界：奥萝拉女仆长裙＋围裙、塞西莉亚黑袍＋wimple、艾琳白军礼服＋肩章、古兰黑金高叉裙。**只有爱丽丝是"墨绿 + 白蕾丝"**，这套配色不许改。

### 1.3 三件身份符号

```
slender hands, detailed hands,
small leather pouch, jewelry tray, velvet tray,
silver carving knife, engraving tool,
```

| 符号 | 用在哪 | 含义 |
|---|---|---|
| `small leather pouch` | 腰侧，常驻 | 小羊皮饰品包，是"她在上班"的物证 |
| `jewelry tray, velvet tray` | 柜台场景 | 绒布托盘，鉴赏师的专业感 |
| **`silver carving knife, engraving tool`** | 场景 5 / 9 | 亡母的纯银刻刀。**不要写成 `dagger`**，那是武人的东西 |

> **手别写"茧"**：`calloused hands` 会画成中年工的手，整张废掉。正面只给 `slender hands, detailed hands`，"薄茧"交给握刀、扣柜沿、翻账页这些动作去说。

### 1.4 表情四档

| 档 | 用途 | tag |
|---|---|---|
| ① 门面 | 迎客、日常 | `professional smile, gentle smile, closed mouth, looking at viewer` |
| ② 疲态 | 独处、清点、深夜 | `tired eyes, half-closed eyes, small smile, looking down` |
| ③ 破防 | 提到爱德、被逼 | `teary eyes, holding back tears, eyebrows down, biting lip, trembling` |
| ④ 决断 | 递账单、终局 | `serious, narrowed eyes, lips pressed, determined` |

> 四档的分界在**眉**：①平 ②垂 ③塌 ④压。只改眼不改眉，四张会变同一张脸。
> 全程不给 `ahegao / mind break / empty eyes`——她的底色是敢拼死清算席德，那种人不会碎，只会硬。

---

## 二、定妆立绘（三张 · 固定脸用）

### 2.1 主立绘 · 柜台端庄

**`general` ｜ `full body` + `from front`**

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
1girl, solo, brown hair, long hair, wavy hair, (half updo:1.25), loose strands, side bangs,
amber eyes, (amber eyes:1.2), long eyelashes, adult, young adult, youthful, pale skin,
slim, narrow waist, medium breasts, slender,
dark green dress, (dark green dress:1.3), long dress, wool dress, long sleeves,
(high collar:1.15), (lace collar:1.3), white lace, lace trim, lace cuffs, waist ribbon, thin belt,
(silver earrings:1.15), (silver necklace:1.15), thin chain, small leather pouch,
slender hands, detailed hands,
standing, hands clasped in front, back straight,
professional smile, gentle smile, closed mouth, looking at viewer,
indoor, jewelry shop, counter, glass display case, velvet tray, silver jewelry, brass signboard,
warm lighting, soft light,
full body, from front, slightly from above, depth of field
```

**变体 · 隔柜台半身**：`cowboy shot` 替换 `full body`，加 `one hand on counter, leaning slightly forward`。

### 2.2 定妆 · 橱窗侧影

**`general` ｜ `from behind` + `full body`**

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
1girl, solo, brown hair, long hair, wavy hair, (half updo:1.25), loose strands, side bangs,
amber eyes, (amber eyes:1.2), long eyelashes, adult, young adult, youthful, pale skin,
slim, narrow waist, slender,
dark green dress, (dark green dress:1.3), long dress, wool dress, long sleeves,
(high collar:1.15), (lace collar:1.3), white lace, lace cuffs, waist ribbon,
(silver earrings:1.15), (silver necklace:1.15),
turning head, looking back, over shoulder, hands clasped in front,
tired eyes, small smile, looking at viewer,
indoor, jewelry shop, large window, glass display case, brass signboard, dust motes, sunbeam,
backlighting, warm lighting,
full body, from behind, slightly from below, depth of field
```

> 背身回头 + 逆光。人在店里，脸转过来应付客人，那半秒就是她全部的处境。

### 2.3 定妆 · 二楼向阳主室

**`general` ｜ `full body` + `medium shot`**

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
1girl, solo, brown hair, long hair, wavy hair, (half updo:1.25), loose strands, side bangs,
amber eyes, (amber eyes:1.2), long eyelashes, adult, young adult, youthful, pale skin,
slim, narrow waist, slender,
dark green dress, (dark green dress:1.3), long dress, wool dress, long sleeves,
(lace collar:1.3), white lace, lace cuffs, waist ribbon, (silver earrings:1.15),
sitting, on chair, hands on lap, hands clasped, looking down,
tired eyes, half-closed eyes, small smile,
indoor, bedroom, wooden floor, lace curtains, window, morning,
sunlight through window, light rays, dust motes,
simple furniture, small bed, mirror, sewing box,
full body, from front, medium shot, depth of field, soft lighting
```

> 「向阳主室」是席德的"善待"——光最好的房间，也是最贵的笼子。这张必须亮，但不能暖。

---

## 三、剧情场景（9 张）

### 场景 1 · 柜台迎客（门面期）

**`general` ｜ `cowboy shot` + `from front`**

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
1girl, solo, brown hair, long hair, wavy hair, (half updo:1.25), loose strands, side bangs,
amber eyes, (amber eyes:1.2), long eyelashes, adult, young adult, youthful, pale skin,
slim, narrow waist, slender,
dark green dress, (dark green dress:1.3), long dress, wool dress, long sleeves,
(high collar:1.15), (lace collar:1.3), white lace, lace cuffs, waist ribbon,
(silver earrings:1.15), (silver necklace:1.15), thin chain,
professional smile, gentle smile, closed mouth, looking at viewer, head tilted slightly,
holding jewelry, presenting jewelry, one hand on counter, slender hands,
indoor, jewelry shop, counter, glass display case, velvet tray, rings, gems, brass signboard,
warm lighting, soft light,
cowboy shot, from front, slightly from above, depth of field
```

> `professional smile` 常驻、`closed mouth` 不放——嘴角在笑，眼睛没笑，这就是"职业微笑"。

**变体 · 客人是打手**：`professional smile` 换 `nervous smile, sweatdrop, mouth slightly open, shoulders tense`，镜头换 `from below`。

### 场景 2 · 清点托盘（门面期）

**`general` ｜ `upper body` + `from side` + `close-up`**

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
1girl, solo, brown hair, long hair, wavy hair, (half updo:1.25), loose strands, side bangs,
amber eyes, (amber eyes:1.2), long eyelashes, adult, young adult, youthful, pale skin,
slim, slender,
dark green dress, (dark green dress:1.3), long dress, wool dress,
(lace collar:1.3), white lace, lace cuffs, (silver earrings:1.15),
looking down, focused, closed mouth, tired eyes,
holding tray, velvet tray, sorting jewelry, counting jewelry, slender hands, delicate fingers,
indoor, jewelry shop, large window, glass display case, silver jewelry, rings, gems, sunbeam, dust motes,
warm lighting, light rays,
upper body, from side, close-up, depth of field
```

> 这张她一句台词都没有，情绪全在"手很稳、眼神很沉"——跟矿石打交道比跟人打交道容易。

### 场景 3 · 深夜空铺（门面期→破防期）

**`sensitive` ｜ `full body` + `from behind` + `low angle`**

```
masterpiece, best quality, very aesthetic, absurdres, newest, sensitive,
1girl, solo, brown hair, long hair, wavy hair, (half updo:1.25), loose strands, messy hair,
amber eyes, (amber eyes:1.2), adult, young adult, youthful, pale skin,
slim, narrow waist,
dark green dress, (dark green dress:1.3), long dress, wool dress, long sleeves,
(lace collar:1.3), white lace, lace cuffs, waist ribbon, (silver earrings:1.15),
standing, from behind, looking at door, hands clasped in front,
shoulders slumped, head slightly down, tired, alone,
indoor, empty shop, dark shop, closed door, iron shutter, counter, glass display case,
night, dim lighting, moonlight, single candle, cold color, deep shadow, vignette,
full body, from behind, low angle, depth of field
```

> 白天那张她站着迎客，这张同一个人同一套衣服，只是门关了。`shoulders slumped` 是她一天里唯一敢塌下来的十分钟。

### 场景 4 · 与爱德重逢 · 手扣柜沿（破防期 · 情绪最强）

**`sensitive` ｜ `upper body` + `from front` + `close-up`**

```
masterpiece, best quality, very aesthetic, absurdres, newest, sensitive,
1girl, solo, brown hair, long hair, wavy hair, (half updo:1.25), loose strands, side bangs,
amber eyes, (amber eyes:1.2), long eyelashes, adult, young adult, youthful, pale skin,
slim, slender,
dark green dress, (dark green dress:1.3), long dress, wool dress,
(lace collar:1.3), white lace, lace cuffs, (silver earrings:1.15),
leaning forward, hand on counter, gripping counter, white knuckles, trembling hands,
teary eyes, holding back tears, wide eyes, eyebrows down, trembling lips, mouth slightly open,
sweatdrop, blush,
indoor, jewelry shop, counter, glass display case, velvet tray, window light, blurry background,
warm lighting, depth of field,
upper body, from front, close-up, depth of field
```

> 全部重量在手上：`gripping counter` + `white knuckles` + `trembling hands`——"端庄"的壳从手指开始裂。
> 只给 `teary eyes + trembling lips`，不给 `crying`：她不能在店里哭出声。

**变体 · 隔橱窗望见弟弟**：加 `through window, glass reflection, both hands on glass`，背景改 `street, fountain`，镜头 `medium shot`。

### 场景 5 · 递账单 · 低语传证（破防期→决断期）

**`sensitive` ｜ `upper body` + `from front` + `close-up`**

```
masterpiece, best quality, very aesthetic, absurdres, newest, sensitive,
1girl, solo, brown hair, long hair, wavy hair, (half updo:1.25), loose strands, side bangs,
amber eyes, (amber eyes:1.2), adult, young adult, youthful, pale skin,
slim, slender,
dark green dress, (dark green dress:1.3), long dress, wool dress,
(lace collar:1.3), white lace, lace cuffs, (silver earrings:1.15),
leaning over counter, whispering, mouth slightly open,
hand on paper, sliding paper, ledger, parchment, one hand on tray, hiding paper,
looking away, glancing aside, serious, narrowed eyes, lips pressed, determined,
indoor, jewelry shop, counter, velvet tray, small leather pouch, envelope, side lighting, shadow on face,
upper body, from front, close-up, slightly from below, depth of field
```

> "递"要写成"藏"：`hiding paper` + `glancing aside` + `one hand on tray`——借着理货把账单推过去。一个柜员的胆量全在这种"顺便"里。

### 场景 6 · 席德逼压 · 兼祧婚约（胁迫期 · 最压的一张）

**`sensitive` ｜ `cowboy shot` + `from front` + `from above`**

```
masterpiece, best quality, very aesthetic, absurdres, newest, sensitive,
1girl, 1boy, brown hair, long hair, wavy hair, (half updo:1.25), loose strands, side bangs,
amber eyes, (amber eyes:1.2), adult, young adult, youthful, pale skin,
slim, narrow waist,
dark green dress, (dark green dress:1.3), long dress, wool dress, long sleeves,
(high collar:1.15), (lace collar:1.3), white lace, lace cuffs, (silver earrings:1.15),
standing, stepping back, leaning away, shrinking back, hands clasped in front, hands on own arm,
shoulders tense, looking down, averting eyes, teary eyes, holding back tears, biting lip, sweatdrop,
tall male, older male, chubby, mustache, dark blue robe, narrow eyes, smiling, leaning in, looming,
papers in hand, contract, seal,
indoor, back room, curtain, account desk, candle light, hard shadow, dim corner,
cowboy shot, from front, from above, depth of field
```

> 她是被"文件"逼的，不是被身体逼的：`papers in hand, contract, seal` 三件套必须有——这叫合法的暴力。
> 席德的 `smiling` 与她的 `holding back tears` 同框，一冷一热两张脸并置，就是整个 NTR 结构的缩影。

### 场景 7 · 嫁衣试装（胁迫期 · 唯一盘发的一张）

**`sensitive` ｜ `full body` + `from front` + `medium shot`**

```
masterpiece, best quality, very aesthetic, absurdres, newest, sensitive,
1girl, solo, brown hair, long hair, updo, hair bun, loose strands,
amber eyes, (amber eyes:1.2), long eyelashes, adult, young adult, youthful, pale skin,
slim, narrow waist, slender,
wedding dress, white wedding dress, long dress, floor-length skirt, lace dress, white lace, veil, long veil,
(high collar:1.1), long sleeves, lace cuffs, (silver earrings:1.15), (silver necklace:1.15), silver brooch,
standing, in front of mirror, looking at own reflection, hands clasped in front, trembling hands,
teary eyes, holding back tears, eyebrows down, biting lip, empty smile,
indoor, bedroom, tall mirror, lace curtains, wooden floor, night, moonlight, cold light, blue tint,
full body, from front, medium shot, depth of field, vignette
```

> **头发盘起来了**——这一张是全包唯一用 `updo` 的。19 岁的姑娘被摆成"太太"的发型，这就是整张图的意思。
> 嫁衣是白的，光是冷的；别给 `happy`，别给 `smile`，只给 `empty smile`。

### 场景 8 · 驱逐席德之后（终局期 · 唯一真笑）

**`general` ｜ `full body` + `from front` + `medium shot`**

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
1girl, 1boy, brown hair, long hair, wavy hair, (half updo:1.25), loose strands, side bangs,
amber eyes, (amber eyes:1.2), long eyelashes, adult, young adult, youthful, pale skin,
slim, slender,
dark green dress, (dark green dress:1.3), long dress, wool dress, long sleeves,
(lace collar:1.3), white lace, lace cuffs, (silver earrings:1.15), (silver necklace:1.15),
standing, bending down, hugging, embracing, holding hands,
relieved, happy, teary eyes, crying, open mouth smile, blush,
child, short stature, male child, brown hair, messy hair, ragged clothes, brown tunic, bare feet,
indoor, jewelry shop, counter, brass signboard, morning,
sunlight through window, warm light, golden light, light rays,
full body, from front, medium shot, depth of field, soft lighting
```

> 全套唯一一次 `happy + crying + open mouth smile` 三连：终于哭出来，但是高兴的哭。
> 前面九张全是 `candle light / moonlight / cold color`，只有这张换成晨光——同一间屋子，光从冷变暖，结局就说完了。

**变体 · 递钱袋的瞬间**：加 `holding coin pouch, outstretched hand, bowing`，删 `hugging`。

### 场景 9 · 刻刀特写（散场后 · 她的底牌）

**`sensitive` ｜ `close-up` + `from above`**

```
masterpiece, best quality, very aesthetic, absurdres, newest, sensitive,
1girl, solo,
dark green dress, long sleeves, lace cuffs, white lace,
slender hands, detailed hands, delicate fingers,
holding knife, silver carving knife, engraving tool, gripping, white knuckles, trembling hands,
candle light, metal reflection, glint, sharp focus,
indoor, bedroom, wooden floor, small leather pouch, letters, dim lighting, hard shadow,
close-up, from above, depth of field
```

> 只给手、刀、光，脸不入画——"她一直有刀"比让她真捅人更有力气。

---

## 四、差分总表（一套衣服走完的故事）

| 阶段 | 场景 | 表情档 | 光 | 头发 |
|---|---|---|---|---|
| ① 门面期 | 1 迎客 / 2 清点 | ① 门面 | 暖、柔、白天 | 半挽 |
| ①→② 深夜 | 3 空铺 | ② 疲态 | 冷、暗、单烛 | 半挽、几缕散落 |
| ② 破防期 | 4 重逢 / 5 递账单 | ③ 破防 | 侧光、浅景深 | 半挽 |
| ③ 胁迫期 | 6 逼压 / 7 嫁衣 | ③ 破防 | 冷、硬、月光 | 6 半挽 → **7 盘起** |
| ④ 终局期 | 8 驱逐之后 | ④ → 真笑 | **暖、金、晨光** | 半挽 |
| ④ 散场 | 9 刻刀 | — | 烛光、硬阴影 | — |

> 一套衣服不换、一块色不改，只改光、表情、手上东西。九个瞬间连起来，才有"她被按在那张柜台后面整整一年"的重量。

---

## 五、负面（本包专用）

```
worst quality, low quality, lowres, bad anatomy, bad hands, extra fingers, fused fingers,
missing fingers, deformed, disfigured, malformed limbs, mutated, extra arms, extra legs,
bad proportions, inaccurate eyes, asymmetric eyes, blurry, jpeg artifacts,
text, watermark, signature, username, logo, border, frame, censored, mosaic censoring,
black hair, blonde hair, silver hair, pink hair, red hair, blue hair, white hair,
blue eyes, red eyes, green eyes, purple eyes, heterochromia, eyepatch,
twintails, ponytail, blunt bangs, hime cut, braid, hair down,
old, mature female, milf, wrinkles, aged up, aged down, child, loli, shota, toddler,
flat chest, huge breasts, large breasts, cleavage, breasts out, nipples, areolae,
mature dress, long skirt, short skirt, miniskirt, knee-length skirt, ankle-length skirt,
pants, trousers, jeans, shorts, armor, breastplate, chainmail, sword, rapier,
white dress, wedding dress, nun, wimple, veil, maid, apron, headdress, military uniform, epaulettes,
high heels, boots, sneakers, sandals, barefoot,
old hands, veiny hands, rough hands, wrinkled hands,
plain background, white background, simple background,
modern, office, computer, electric light, neon, cyberpunk,
ahegao, mind break, empty eyes, drooling, tongue out, nsfw,
```

### 5.1 五条必须理解的护栏

| 负面组 | 为什么 |
|---|---|
| **`black hair`** | 她是棕发。不压的话古兰（黑发）会污染过来——这一条是 v2 新增的必压项 |
| `blonde hair, silver hair, red hair, blue hair, pink hair` | 同队塞西莉亚／艾琳金发、伊丝娜红发、奥萝拉蓝发，互相污染是常态 |
| `twintails, ponytail, blunt bangs, hime cut, braid, hair down` | 她的命是"半挽 + 侧分刘海"。压 `hair down` 是为了别出成披头散发的睡前状态 |
| `old, mature female, milf, wrinkles, aged up` | **19 岁的脸**。这一组是 v1 显老的根源，v2 必须压 |
| `nun, wimple, veil, maid, apron, headdress, military uniform, epaulettes` | 四位同队的制服锚点，全部按住 |

> ⚠️ **场景 7 要出嫁衣时，必须把 `wedding dress, white dress` 从负面删掉**（用 `alice_negative_wedding.txt`）。

---

## 六、参数

| 参数 | 值 |
|---|---|
| 分辨率 · 全身 | **832×1216** |
| 分辨率 · 半身/特写 | **896×1152** |
| Steps | 27 |
| CFG | **6.0**（主）/ 6.2（场景 7 嫁衣、场景 8 晨光） |
| Sampler | `euler_ancestral` |
| CLIP Set Last Layer | -2 |
| Hires fix | 1.5× / denoise 0.35（蕾丝与银链必开） |
| ADetailer | face_yolov8n 0.4（建议开） |

---

## 七、排错速查

| 症状 | 原因 | 修法 |
|---|---|---|
| 头发披散 | 半挽没出来 | `(half updo:1.25)` 加权，负面压 `hair down, twintails, ponytail` |
| 显老 / 像 28 岁 | `mature female` 残留或盘发 | 删 `mature female`，改 `adult, young adult, youthful`；确认锚点没 `updo` |
| 发色变黑 | 古兰污染 | 正面 `brown hair`，负面第一条压 `black hair` |
| 发色变金 | 塞西莉亚／艾琳污染 | 负面压 `blonde hair, silver hair, platinum blonde hair` |
| 琥珀眼变棕 | `amber eyes` 漂移 | 双写 `amber eyes, (amber eyes:1.2)`，负面压 `brown eyes, orange eyes` |
| 裙子变墨蓝 | 权重不足 | `dark green dress, (dark green dress:1.3)`，负面压 `blue dress, teal dress, navy dress` |
| 裙子变绸缎 | 缺面料词 | `wool dress`，负面压 `silk, satin, shiny, latex, leather` |
| 出成修女 / 女仆 | 锚点撞车 | 负面压 `nun, wimple, veil, maid, apron, headdress` |
| 出成贵族小姐 | 银饰太重 | `(silver necklace:1.15)` 降 1.0，加 `counter` 把场景钉在店里 |
| 手变老男主的手 | 糙手词泄漏 | 正面只用 `slender hands, detailed hands`，负面压 `old hands, veiny hands, wrinkled hands` |
| 破防图哭太大 | `crying` 权重高 | 换 `holding back tears`，删 `crying`；只在场景 8 给 |
| 嫁衣出成墨绿裙 | 负面压了 `wedding dress` | 换 `alice_negative_wedding.txt` |
| **和别的立绘不像一套** | 权重堆太密 / 自造 tag | 整串只留 4 个权重；删掉所有非 Danbooru 实词（见第零节） |

---

## 八、wildcard 对应

| 文件 | 内容 | 用法 |
|---|---|---|
| `alice_anchor.txt` | 1.1 + 1.2 锚点单行串 | 每条都叠 |
| `alice_negative.txt` | 第五节通用负面 | 除场景 7 外全用 |
| `alice_negative_wedding.txt` | 嫁衣专用（已删 `wedding dress, white dress`） | 只在场景 7 |
| `alice_counter.txt` | 场景 1 / 2 / 3 | 随机抽 |
| `alice_truth.txt` | 场景 4 / 5 | 随机抽 |
| `alice_coercion.txt` | 场景 6 / 7 / 9 | 随机抽 |
| `alice_finale.txt` | 场景 8 主图与变体 | 随机抽 |

拼装：

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
__alice_anchor__,
__alice_counter__,
warm lighting, depth of field,
```

负面：`__alice_negative__`

> wildcard 里的锚点已完整，**不要再叠一次 `alice_anchor`**，否则权重翻倍、蕾丝糊成一片白。

---

## 九、出图顺序

1. **定妆**（2.1）固定 seed，出 8 张挑 1 张基准脸；
2. **验头发**：重点看 2.2 橱窗侧影——半挽对不对、像不像 19 岁，一眼就知道；
3. **验色**：场景 3 深夜空铺（冷光下墨绿会不会变墨蓝），过了全部冷光场景都稳；
4. **表情差分**：4 / 6 / 7 连着出，验"眉"这条分界线；
5. **终局**：场景 8 单独跑，CFG 6.2，光全换暖；
6. **收尾**：场景 9 手部特写。

---

*肥鱼备注：v2 只改了三样——发色改棕、年龄拉回 19、词法退回全工程那套"用词说话"。锚点一个不多给，权重只留四个；她要的不是漂亮，是那种"站得笔直、眼睛里全是疲惫"的少女体面。* 🐋
