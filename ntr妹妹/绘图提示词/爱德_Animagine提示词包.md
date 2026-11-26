# 爱德 · Animagine XL 立绘提示词包 v1

> **角色定位**：银月珠宝铺原东家遗孤幼子 · 伯里小队的随行后勤伙伴与市井耳目
> **年龄 / 身形**：**8 岁** · 约 120cm · 瘦小孱弱、营养欠佳
> **外观**：**棕色蓬乱短发**（与姐姐爱丽丝同色）· 清亮大眼 · 洗得发白的粗麻旧衫 · 腰间木雕小剑
> **叙事基调**：劫后余生的小心讨好 × 想救姐姐的执拗。他不是"惨"，是**在努力不让自己成为负担**。
>
> **目标模型**：Animagine XL 4.0（主）/ 3.1（兼容）
> **配套**：`comfyui/wildcards/ed_*.txt`（6 个）
> **信源**：`世界书条目/05_潜伏幕后角色.md` L17–45、`世界书条目/全案汇总…` L837、`奥森德/src/app/okh_app_data.js` L2643 / L2679 / L2714 / L2728 / L2761
>
> ⚠️ **表里两层**：世界书里他是纯表层孤童（防剧透），暗线的"法器短木"只在最后一节，标了**后台留档、不上卡**。出图默认全用表层。

---

## 零、词法基准（与全工程一致）

干净 tag 列表、一段一行、整串只 3~4 个权重——和妮丝／艾琳／塞西莉亚／奥萝拉／古兰／爱丽丝同一套写法。**不要堆权重、不要自造 tag**，否则画风会和另外六张立绘不是一套。

---

## 一、锚点

### 1.1 外观锚点（每条必带）

```
1boy, solo, child, (short stature:1.2), short, slim, thin,
brown hair, messy hair, short hair, large eyes, brown eyes, pale skin,
```

| tag | 对应真源 |
|---|---|
| `child, (short stature:1.2), short, slim, thin` | 8 岁、约 120cm、瘦小孱弱。**`short stature` 给 1.2**，不加权重容易被画成少年 |
| **`brown hair, messy hair, short hair`** | 棕发（与姐姐爱丽丝同色）、蓬乱、短发——姐弟同色是"一家人"的唯一视觉凭据 |
| `large eyes, brown eyes` | 清亮但带怯意的大眼睛，棕色瞳 |
| `pale skin` | 营养欠佳的苍白 |

> **不要写 `chibi`**：Q 版会毁掉"市井落难少年"的写实感。要幼态就靠 `child` + `short stature` + `large eyes` 三件，不是靠头身比压缩。

### 1.2 服装锚点（粗麻旧衫 · 一字不改）

```
ragged clothes, brown shirt, oversized clothes, patched clothes, long sleeves, rope belt,
small leather pouch, worn sandals,
small wooden sword, (tiny sword:1.2), toy sword, unfinished, short blade,
```

| 分组 | tag | 说明 |
|---|---|---|
| 衣 | `ragged clothes, brown shirt, oversized clothes, patched clothes` | 「磨损宽大的粗麻旧布衣」——**`oversized clothes` 是关键**，衣服大一号才显他瘦小 |
| 腰 | `rope belt, small leather pouch` | 草绳腰带 + 小羊皮储钱囊（攒的跑腿铜板） |
| 鞋 | `worn sandals` | 磨损的旧皮凉鞋（真源写"旧皮凉鞋"，别画成皮靴） |
| 剑 | **`small wooden sword, (tiny sword:1.2), toy sword, unfinished, short blade`** | 亡父未完工的**木雕小剑**——他抱在怀里不撒手的那一件 |

> `wooden sword` 单写会出成"拿木剑玩耍的男孩"，加 `toy sword, unfinished` 才有"没做完的半成品"的味道——那是遗物，不是玩具。
>
> 🔴 **尺寸必须单独管**：`wooden sword` 在库里对应的样本多是**打刀／大剑长度**，落在 120cm 的孩子手里就是一把半人高的家伙。所以剑这一组固定成
> `small wooden sword, (tiny sword:1.2), toy sword, unfinished, short blade` ——
> **`small` 定基准、`(tiny sword:1.2)` 压尺寸、`short blade` 管比例**，三条一起才不会反弹；负面同步压 `large sword, long sword, greatsword, oversized weapon, sheath, scabbard`。
> 参照物写进动作里更稳：抱在怀里就写 `hugging small sword`，特写就写 `palm-sized`——**能说出"巴掌大"，模型就不会给一米长**。

### 1.3 表情四档

| 档 | 用途 | tag |
|---|---|---|
| ① 怯生 | 日常、见人 | `timid, shy, looking up, wide eyes, closed mouth` |
| ② 感激 | 被收留、被夸奖 | `grateful, happy, blush, teary eyes, open mouth smile` |
| ③ 含泪 | 提到姐姐、被逼 | `teary eyes, holding back tears, eyebrows down, biting lip, trembling` |
| ④ 坚定 | 立誓、放哨 | `determined, serious, narrowed eyes, lips pressed` |

> 分界同样在**眉**：①平抬 ②上扬 ③下垂 ④下压。他是小孩，情绪比大人外露，`teary eyes` 可以常驻，但**不要给 `crying` 之外的大哭**——他哭都是忍着的。

---

## 二、定妆立绘

### 2.1 主立绘 · 旅店角落（抱着木雕小剑）

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
1boy, solo, child, (short stature:1.2), short, slim, thin,
brown hair, messy hair, short hair, large eyes, brown eyes, pale skin,
ragged clothes, brown shirt, oversized clothes, patched clothes, long sleeves, rope belt,
small leather pouch, worn sandals, small wooden sword, (tiny sword:1.2), toy sword, unfinished, short blade,
hugging small sword, holding small sword, both hands,
standing, looking up, timid, shy, closed mouth, wide eyes, blush,
indoor, tavern, inn, wooden floor, wooden table, barrel, corner of room,
dim lighting, warm light, candle light,
full body, from front, slightly from above, depth of field
```

### 2.2 定妆 · 街角放哨（他唯一"有用"的姿态）

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
1boy, solo, child, (short stature:1.2), short, slim, thin,
brown hair, messy hair, short hair, large eyes, brown eyes, pale skin,
ragged clothes, brown shirt, oversized clothes, patched clothes, long sleeves, rope belt,
small leather pouch, worn sandals, wooden sword,
standing, leaning forward, peeking, looking around, alert, serious, closed mouth,
street, alley, market street, stone pavement, wooden stall, hanging cloth, crates,
daylight, backlighting, dust motes,
full body, from side, slightly from below, depth of field
```

> 放哨是他唯一能"派上用场"的事，所以这张不能给怯——给 `alert, serious`，眼睛是亮的。

### 2.3 定妆 · 木雕小剑特写（遗物）

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
1boy, solo, child,
ragged clothes, brown shirt, long sleeves, patched clothes, rope belt,
small hands, detailed hands, holding sword, small wooden sword, (tiny sword:1.2), toy sword, unfinished, short blade, wood carving,
small leather pouch, letters,
indoor, tavern, wooden table, candle light, warm light, dust motes,
close-up, from above, depth of field
```

> 只给手、木剑、烛光。这是"遗物"这张牌最省力的打法：**不写父亲、不写回忆，只给一块没雕完的木头**。

---

## 三、剧情场景（6 张）

### 场景 1 · 马车残骸 · 被救出（前传）

**`sensitive` ｜ `medium shot` + `from above`**

```
masterpiece, best quality, very aesthetic, absurdres, newest, sensitive,
1boy, solo, child, (short stature:1.2), short, slim, thin,
brown hair, messy hair, short hair, dirt on face, dirt on clothes, large eyes, brown eyes, pale skin,
ragged clothes, brown shirt, oversized clothes, patched clothes, torn clothes,
small leather pouch, worn sandals, wooden sword,
kneeling, on ground, crawling out, trembling, looking up, scared, teary eyes, crying,
bruised, scratches, rain, wet clothes, wet hair,
broken wagon, wooden splinters, overturned cart, broken wheel, forest road, night, moonlight, fog,
medium shot, from above, depth of field, dim lighting
```

> 这张是整条线的起点：`crawling out` + `rain` + `broken wagon` 三件套，交代"他从哪来的"。**脸要脏**：`dirt on face` 不能省，干净的小孩不像劫后余生。

### 场景 2 · 营地火堆旁苏醒

**`general` ｜ `medium shot` + `from front`**

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
1boy, solo, child, (short stature:1.2), short, slim, thin,
brown hair, messy hair, short hair, large eyes, brown eyes, pale skin,
bandage, bandaged arm, ragged clothes, brown shirt, oversized clothes, patched clothes,
wooden sword, small leather pouch,
sitting, on blanket, wrapped in blanket, looking up, confused, teary eyes, closed mouth,
campfire, bonfire, tent, night, warm light, ember, smoke, outdoor,
medium shot, from front, depth of field, soft lighting
```

> 毯子裹在身上 + 手臂绷带 = "被人捡回来了"。火光是他全片唯一一次被暖光照到。

### 场景 3 · 旅店跑腿端水

**`general` ｜ `cowboy shot` + `from side`**

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
1boy, solo, child, (short stature:1.2), short, slim, thin,
brown hair, messy hair, short hair, large eyes, brown eyes, pale skin,
ragged clothes, brown shirt, oversized clothes, patched clothes, long sleeves, rope belt,
small leather pouch, worn sandals,
walking, carrying tray, holding cup, wooden tray, water jug, careful, focused, closed mouth,
indoor, tavern, inn, wooden floor, wooden table, counter, customers, blurry background,
warm light, candle light, daylight through window,
cowboy shot, from side, depth of field
```

> 他干活时是**专注**的，不是可怜兮兮的。这张要给"勤快"，人才立得住。

### 场景 4 · 街角茶棚 · 求小队帮忙

**`sensitive` ｜ `upper body` + `from front` + `close-up`**

```
masterpiece, best quality, very aesthetic, absurdres, newest, sensitive,
1boy, solo, child, (short stature:1.2), short, slim, thin,
brown hair, messy hair, short hair, large eyes, brown eyes, pale skin,
ragged clothes, brown shirt, oversized clothes, patched clothes, long sleeves, rope belt,
clutching own clothes, trembling hands, white knuckles,
teary eyes, holding back tears, eyebrows down, biting lip, looking up, pleading, blush,
outdoor, tea stall, wooden bench, street, market, carts, crowd, blurry background,
daylight, side lighting, depth of field,
upper body, from front, close-up
```

> 全包情绪最重的一张：`clutching own clothes` + `trembling hands` 是"绞衣角"，配上 `looking up` 的仰视——**小孩求人的时候，眼睛是往上看的**。

### 场景 5 · 对街望着珠宝铺橱窗

**`general` ｜ `full body` + `from behind`**

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
1boy, solo, child, (short stature:1.2), short, slim, thin,
brown hair, messy hair, short hair,
ragged clothes, brown shirt, oversized clothes, patched clothes, rope belt, worn sandals,
standing, from behind, looking at building, head slightly down, hands at sides, fists clenched,
street, carriage road, cobblestone, fountain, three-story building, jewelry shop, large window,
brass signboard, wooden awning, daylight, backlighting, long shadow,
full body, from behind, depth of field
```

> 背身、攥拳、不动。**不给脸**——他这时候脸上是什么，主人心里有数，留白更狠。

### 场景 6 · 姐弟重逢

**`general` ｜ `full body` + `from front` + `medium shot`**

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
1boy, 1girl, child, (short stature:1.2), short, slim, thin,
brown hair, messy hair, short hair, large eyes, brown eyes, pale skin,
ragged clothes, brown shirt, oversized clothes, patched clothes, rope belt, worn sandals,
hugging, embracing, arms around neck, crying, happy, open mouth smile, teary eyes, blush,
brown hair, long hair, wavy hair, half updo, amber eyes, young adult, pale skin,
dark green dress, lace collar, white lace, long sleeves, lace cuffs, silver earrings,
bending down, hugging, relieved, teary eyes, crying, happy,
indoor, jewelry shop, counter, brass signboard, morning,
sunlight through window, warm light, golden light, light rays,
full body, from front, medium shot, depth of field, soft lighting
```

> 与 `爱丽丝_Animagine提示词包.md` 场景 8 是**同一张图的两个机位**：那边从姐姐的视角，这张从他撞进她怀里的视角。两串的姐姐锚点必须逐字一致，否则拼不到一起。

---

## 四、终局 · 立誓留队

**`general` ｜ `full body` + `from below`**

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
1boy, solo, child, (short stature:1.2), short, slim, thin,
brown hair, messy hair, short hair, large eyes, brown eyes, pale skin,
ragged clothes, brown shirt, oversized clothes, patched clothes, long sleeves, rope belt,
worn sandals, small wooden sword, (tiny sword:1.2), toy sword, unfinished, short blade,
holding small sword, gripping, holding up small wooden sword, standing, looking up, determined, serious, narrowed eyes,
lips pressed, (light blush:1.05),
indoor, jewelry shop, wooden floor, morning, sunlight through window, light rays, dust motes,
full body, from below, depth of field, rim lighting
```

> `from below` 是这张的全部技术要点：仰拍把 120cm 的孩子拍出"抬头立誓"的分量。他要的不是被同情，是"我也能保护别人"。

---

## 五、暗面差分（**后台留档 · 不上卡**）

> 世界书已把恶龙真身心智剥离到后台动态管辖，卡内**零剧透**。这一张只作作者资料留存，**不要放进卡、不要放进任何对外发布图包**。

```
masterpiece, best quality, very aesthetic, absurdres, newest, sensitive,
1boy, solo, child, (short stature:1.2), short, slim, thin,
brown hair, messy hair, short hair, large eyes, brown eyes, pale skin,
ragged clothes, brown shirt, oversized clothes, patched clothes,
holding stick, wooden stick, rough wooden stick, gripping,
empty eyes, expressionless, closed mouth, head slightly down,
indoor, dim room, night, single candle, hard shadow, deep shadow,
medium shot, from below, depth of field, dark atmosphere
```

> 区别只有三处：**手里换成粗糙短木棒、眼睛空了、光从烛光改成硬阴影**。其余锚点一字不改——"同一个孩子"才可怕。

---

## 六、负面

```
worst quality, low quality, lowres, bad anatomy, bad hands, extra fingers, fused fingers,
missing fingers, deformed, disfigured, malformed limbs, bad proportions,
inaccurate eyes, asymmetric eyes, blurry, jpeg artifacts,
text, watermark, signature, username, logo, border, frame, censored, mosaic censoring,
adult, mature male, old, muscular, abs, tall male, long legs, long hair, female, 1girl,
blonde hair, black hair, silver hair, red hair, blue hair, pink hair,
blue eyes, green eyes, red eyes, purple eyes, heterochromia, eyepatch,
modern clothes, t-shirt, jeans, hoodie, sneakers, school uniform,
armor, breastplate, steel sword, daggers, knife, blood, weapon, large sword, long sword, greatsword, oversized weapon, sheath, scabbard,
chibi, super deformed, big head,
nsfw, nude, shirtless, suggestive, muscular body,
plain background, white background, simple background,
```

> 关键三组：`adult, muscular, tall male`（防画成少年／青年）、`black hair, blonde hair…`（防串色，尤其防画回黑发）、`armor, steel sword, knife`（他是拿木剑的孩子，不是小战士）。

---

## 七、参数

| 参数 | 值 |
|---|---|
| 分辨率 · 全身 | **832×1216** |
| 分辨率 · 半身/特写 | **896×1152** |
| Steps | 27 |
| CFG | 6.0（场景 1 雨夜 6.2） |
| Sampler | `euler_ancestral` |
| CLIP Set Last Layer | -2 |
| Hires fix | 1.5× / denoise 0.35 |
| ADetailer | face_yolov8n 0.4（儿童脸容易崩，建议开） |

---

## 八、排错速查

| 症状 | 原因 | 修法 |
|---|---|---|
| 画成十四五岁少年 | 缺幼态词 | `child, (short stature:1.2), large eyes` 三条一起；负面压 `adult, mature male, tall male` |
| 画成 Q 版 | 混进 `chibi` | 删 `chibi`，负面压 `chibi, super deformed, big head` |
| 头发变黑 | 旧文本遗留／串色 | 正面 `brown hair`，负面压 `black hair` |
| 头发变金／红 | 同队角色污染 | 负面压 `blonde hair, red hair, blue hair, silver hair` |
| 衣服太合身 | 缺"大一号" | `oversized clothes, patched clothes, ragged clothes` 三条齐给 |
| 木剑变成真剑 | `wooden sword` 权重不足 | `small wooden sword, (tiny sword:1.2), toy sword, unfinished, short blade`；负面必压 `steel sword, dagger, knife` |
| **木剑太长／半人高** | `wooden sword` 默认取长刀样本 | ①剑组换 `small wooden sword, (tiny sword:1.2), short blade`；②负面压 `large sword, long sword, greatsword, oversized weapon, sheath, scabbard`；③动作里加参照物：抱剑写 `hugging small sword`、特写写 `palm-sized`；④**别写** `katana, long sword, sheathed` |
| 穿上盔甲 | 模型把"冒险者"理解成战士 | 负面压 `armor, breastplate`，正面保留 `ragged clothes` |
| 表情太甜／太可怜 | 只有 `teary eyes` | 按四档补眉与嘴；`crying` 只在场景 1／6 给 |
| 和爱丽丝对不上 | 姐姐锚点写差 | 场景 6 的姐姐串必须与爱丽丝包逐字一致 |

---

## 九、wildcard 对应

| 文件 | 内容 |
|---|---|
| `ed_anchor.txt` | 1.1 + 1.2 锚点单行串 |
| `ed_negative.txt` | 第六节负面 |
| `ed_life.txt` | 场景 2 / 3 / 2.2 定妆放哨 |
| `ed_street.txt` | 场景 4 / 5 |
| `ed_finale.txt` | 场景 6 / 立誓 |
| `ed_shadow.txt` | 暗面差分（后台留档，不上卡） |

拼装：

```
masterpiece, best quality, very aesthetic, absurdres, newest, general,
__ed_anchor__,
__ed_street__,
daylight, side lighting, depth of field,
```

> wildcard 里的锚点已完整，别再叠 `ed_anchor`。

---

## 十、出图顺序

1. **定妆 2.1**（旅店角落抱剑）固定 seed，出 8 张挑 1 张基准脸；
2. **验年龄**：这张要是像 14 岁，后面全废——先压回 8 岁再往下；
3. **验衣服**：2.2 放哨，看 `oversized` 有没有出来；
4. **验道具**：2.3 木剑特写；
5. **剧情**：1（雨夜）→ 2（苏醒）→ 3（跑腿）→ 4（求援）→ 5（望橱窗）；
6. **收官**：6 姐弟重逢（与爱丽丝包场景 8 配对出）+ 立誓。

---

*肥鱼备注：这孩子全包只有一件事要守住——**他必须是个孩子，而且是个在硬撑的孩子**。所以衣服永远大一号、剑永远是没雕完的木头、眼泪永远含着不落。九张图里他唯一一次真正笑，是场景 2 的火堆旁和场景 6 的姐姐怀里；其余每一张，眼睛都在找"我能帮上什么"。* 🐋
