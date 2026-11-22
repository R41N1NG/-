# 伊丝娜 · Animagine XL 提示词包 v1（兽人俘获 · 拷问线专版）

> **定稿时间**：2026-11-12 01:50 (UTC+8)
> **角色定位**：猫族游侠斥候 · 小队侦查与开锁手 · 嘴硬贪酒的野猫
> **年龄 / 身形**：成年女性 · 165cm · 腰腹紧实修长、曲线饱满、白皙微醺
> **本包场景线**：被兽人俘获 → 押解入营 → 扣颈圈 → 剥衣逼问 → 掐脖逼供 → 轮番 → 崩溃招供 → 铁链事后
> **场景配比**：2 铺垫（sensitive）+ 4 正戏（explicit）+ 2 事后/特写
>
> **信源**
> - 外貌：`世界书条目/03_小队全员档案.md` L94–99「外貌细节」
> - 兽人：`绘图提示词/兽人_绘图要点.md`（绿皮固定、掐脖配方、硬光）
> - 格式：`绘图提示词/塞西莉亚_Animagine提示词包.md`
> - 外观 tag 基线：`绘图提示词/伊丝娜_ComfyUI提示词.txt`（旧包，发色权重与负面沿用）
>
> **设定锚（这条线的情感内核）**：她的隐秘是「幼年在荒原见过边境捕奴队，对颈圈与铁链存在生理层面畏惧」。
> 所以拷问戏的道具必须是 **`iron collar` + `chain`**，不是普通的绳索——绳子只是绑，颈圈才是揭她旧伤的那一下。

---

## 零、锚点

### 0.1 外观锚点（每条必带）

```
1girl, (cat girl:1.2), (cat ears:1.2), (cat tail:1.15), animal ears,
(red hair:1.25), crimson hair, long hair, wavy hair, messy hair,
golden eyes, slit pupils, (vertical pupils:1.1), sharp canine tooth, cat mouth,
pale skin, blush, (sweat:1.1),
huge breasts, large areolae, pink nipples, cleavage,
soft body, (wide hips:1.1), (thick thighs:1.1), (huge ass:1.15),
adult, mature female, tall female,
```

| tag | 对应设定 |
|---|---|
| `(cat girl:1.2), (cat ears:1.2), (cat tail:1.15)` | 猫族，三件套缺一就变成普通人类 |
| `(red hair:1.25), crimson hair` | 绯红波浪长发，**权重锁死 1.25** |
| `golden eyes, slit pupils, (vertical pupils:1.1)` | 金色竖瞳，竖瞳是猫的辨识点 |
| `sharp canine tooth, cat mouth` | 笑时唇边的小虎牙 |
| `pale skin, blush` | 白皙微醺泛红 |
| `tall female` | 165cm，比妮丝（150）高一截 |

> ⚠️ **发色是这套包最容易翻车的地方**。Animagine 遇到 `cat girl` 会默认往金发/橙发走，负面必须压 `blonde hair, yellow hair, gold hair, orange hair`。

### 0.2 服装破损四档（拷问线的进度条）

拷问戏的服装是叙事进度，不能乱穿。按场景递进：

| 档 | 用于 | tag |
|---|---|---|
| **① 完整** | S1 押解 | `shoulder cutout, red crop top, midriff, navel, black shorts, short shorts, thigh strap, fingerless gloves, boots, leather sheath` |
| **② 松动** | S2 扣颈圈 | 同上 + `disheveled, clothes askew, one shoulder strap down` |
| **③ 撕破** | S3–S5 | `torn clothes, torn shirt, clothes ripped, (breasts out:1.15), exposed breasts, torn shorts, shorts partially pulled down` |
| **④ 只剩碎片** | S6–S7 | `clothes in tatters, (completely nude:1.1), nude, only boots left, torn fabric on wrist` |

> 她的常服是「露肩露脐红短上衣 + 深色贴身短裤 + 大腿皮鞘 + 软底皮靴」。**皮鞘和靴子即使到 ④ 档也不必全脱**——留一件残件，画面比全裸更有"被剥光到一半"的感觉。

### 0.3 兽人锚点（引用手册，删改勿动）

```
orc, monster, male focus, green skin, (green skin:1.3),
muscular male, tall male, huge muscles, abs, pectorals, veins, body hair,
tusks, fangs, sharp teeth, pointed ears, bald, red eyes,
topless male, loincloth, fur trim, leather armor, bracers,
```

施暴表情（主力）：
```
sadistic, evil smile, toothy grin, sharp teeth, tusks, bloodlust, dominant,
```

> **`orc` 与 `green skin` 必须紧挨写，`green skin` 给 1.3**。单独 `orc` 会出灰皮/褐皮，单独 `green skin` 会出地精。细则见 `兽人_绘图要点.md` 第一节。
> **`bishounen` 必须进负面**，否则出绿皮美青年，獠牙和肌肉全丢。

### 0.4 拷问道具（本线专用）

```
indoor, orc camp, tent, animal skin, wooden stakes, wooden beam, dirt ground, bonfire, torch light,
(iron collar:1.25), (chain:1.2), shackles, metal collar, padlock,
chain from above, bound wrists, arms above head, suspension, stretched arms,
leather strap, rope, whip, riding crop, hot iron, brazier,
```

| 道具 | 为什么必须有 |
|---|---|
| **`(iron collar:1.25)` + `(chain:1.2)`** | 直击她幼年对捕奴队的恐惧，这是整条线唯一不可替换的道具 |
| `bound wrists, arms above head, suspension` | 吊起双手，把她 165cm 的身高优势抹掉 |
| `whip, riding crop` | 逼供的常规手段 |
| `hot iron, brazier` | 只在 S4/S5 用，火光同时兼作画面光源 |
| `wooden stakes, animal skin` | 军营质感，别写成石牢 |

光照（硬光，禁柔光）：
```
harsh shadow, dim lighting, torch light, rim light, chiaroscuro, backlight,
```

### 0.5 情绪泄漏四档（本角色的专属技术点）

伊丝娜的设定是「嘴硬善掩饰，却管不住猫耳与尾巴的自然反应」。**这条在画面上必须做出来**——脸和耳朵尾巴要给出互相矛盾的信息，否则她就只是个普通受害少女，不是伊丝娜。

| 档 | 阶段 | 脸 | 耳朵 / 尾巴 |
|---|---|---|---|
| **① 逞强** | S1–S3 | `defiant, glare, gritted teeth, angry, frowning, smirk, tsundere` | `(ears down:1.2), (tail bristling:1.15), puffed tail, hissing, bared teeth` |
| **② 破防** | S4–S5 | `pain, grimace, clenched teeth, tears, crying, screaming, open mouth` | `(flattened ears:1.3), (tail between legs:1.2), trembling` |
| **③ 崩溃** | S6 | `ahegao, rolled eyes, tongue out, drooling, tears, mind break, broken` | `(ears drooping:1.2), limp tail` |
| **④ 空洞** | S7 | `empty eyes, expressionless, blank stare, dried tears` | `tail curled around leg, ears low` |

> **`(ears down:1.2)` 这组词是本包的灵魂。** 只写 `defiant` 会画出硬气的女战士；加上 `ears down` + `tail bristling`，才是「嘴上还在骂，身子已经在怕」的那只猫。
> 反面：别在 ① 档写 `scared` 或 `fear`，那会直接把逞强档画成求饶档，进度条就错位了。

---

## 一、场景

---

### S1 · 押解入营（sensitive）

兽人拎着她后领把人推进帐篷，双手已反绑，颈上还空着——**这一场的目的就是让颈圈还没出现**。

**[正面]**

```
1girl, (cat girl:1.2), (cat ears:1.2), (cat tail:1.15),
(red hair:1.25), crimson hair, long hair, wavy hair, messy hair,
golden eyes, slit pupils, sharp canine tooth,
pale skin, blush, sweat, dirt on face,
shoulder cutout, red crop top, midriff, black shorts, short shorts, thigh strap, fingerless gloves, boots,
bound wrists, arms behind back, rope,
walking, pushed, stumbling, (stumbling forward:1.1), leaning forward,
defiant, glare, gritted teeth, (ears down:1.2), (tail bristling:1.15), hissing,
orc, monster, male focus, green skin, (green skin:1.3), muscular male, tall male, huge muscles, tusks, sharp teeth,
topless male, loincloth, fur trim,
height difference, huge height difference, size difference,
indoor, orc camp, tent, animal skin, wooden stakes, dirt ground, torch light,
harsh shadow, dim lighting, rim light,
full body, from side, dutch angle, wide shot,
```

**[负面追加]**

```
soft lighting, pastel color, smiling, happy, willing, consensual, romance,
blonde hair, yellow hair, gold hair, orange hair,
grey skin, brown skin, blue skin,
```

**[参数]** 896×1152 · steps 26 · CFG 6 · euler_ancestral · CLIP -2

---

### S2 · 扣上颈圈（sensitive · 心理核心）

全场唯一一个**还没被碰，但已经崩了一半**的场景。兽人蹲下来给她扣颈圈，她的反应不是挣扎，是僵住。

**[正面]**

```
1girl, (cat girl:1.2), (cat ears:1.2), (cat tail:1.15),
(red hair:1.25), crimson hair, long hair, wavy hair, messy hair,
golden eyes, slit pupils, (vertical pupils:1.15), sharp canine tooth,
pale skin, (pale skin:1.1), (trembling:1.15), sweat,
(wide-eyed:1.1), (pupils shrink:1.1), staring, blank stare,
disheveled, one shoulder strap down, shoulder cutout, red crop top, black shorts,
(iron collar:1.3), metal collar, padlock, chain, (chain:1.2),
kneeling, sitting on ground, head tilted back, looking up,
orc, monster, male focus, green skin, (green skin:1.3), muscular male, huge muscles, tusks,
(huge hand:1.15), hand on another's neck, adjusting collar,
height difference, size difference,
indoor, orc camp, tent, animal skin, torch light, harsh shadow, dim lighting,
close-up, face focus, from front, upper body,
```

**[负面追加]**

```
ahegao, smile, happy, aroused, blush of pleasure,
soft lighting, pastel color,
blonde hair, yellow hair, gold hair,
grey skin, brown skin,
```

**[参数]** 832×1216 · steps 28 · CFG 5.5 · euler_ancestral · CLIP -2

> 这一场**不要写 `ahegao`，也不要写 `tears`**。她要的是「瞳孔缩了一下、整个人僵住」，眼泪留到 S4。这一幕的说服力全在 `(pupils shrink)` 和 `trembling` 上。

---

### S3 · 剥衣逼问（explicit）

吊起双手，上衣被扯到胸下，兽人拿鞭子问话。她还在嘴硬。

**[正面]**

```
1girl, (cat girl:1.2), (cat ears:1.2), (cat tail:1.15),
(red hair:1.25), crimson hair, long hair, wavy hair, messy hair,
golden eyes, slit pupils, sharp canine tooth, (gritted teeth:1.1),
pale skin, sweat, (sweat:1.15), dirt on body,
torn clothes, torn shirt, clothes ripped, (breasts out:1.15), exposed breasts, huge breasts, pink nipples,
torn shorts, shorts partially pulled down,
(iron collar:1.25), chain, (chain from above:1.2), bound wrists, arms above head, suspension, stretched arms,
shackles, leather strap,
whip, riding crop, (whip marks:1.1), red marks, welts on skin, bruised,
defiant, glare, angry, frowning, (ears down:1.2), (tail bristling:1.15),
orc, monster, male focus, green skin, (green skin:1.3), muscular male, tall male, huge muscles, veins,
tusks, sharp teeth, evil smile, sadistic, dominant, topless male, loincloth,
standing, towering, height difference, huge height difference, size difference,
indoor, orc camp, tent, wooden stakes, animal skin, torch light,
harsh shadow, dim lighting, rim light, chiaroscuro,
full body, from below, low angle,
```

**[负面追加]**

```
soft lighting, pastel color, censored, mosaic censoring,
willing, consensual, smiling, happy,
blonde hair, yellow hair, gold hair,
grey skin, brown skin, blue skin, bishounen, human, elf,
```

**[参数]** 896×1152 · steps 27 · CFG 6 · euler_ancestral · CLIP -2

> `low angle` + `from below` 是手册里的「体现体型压迫」组合。她已被吊起，镜头再低一点，画面就是"从她脚下往上看一个绿皮巨人"。

---

### S4 · 掐脖逼供（explicit · 主力场景）

本线最重的一场。手册 5.2 的配方全量上，`strangling` 与 `ahegao` **必须同时给**。

**[正面]**

```
1girl, (cat girl:1.2), (cat ears:1.2), (cat tail:1.15),
(red hair:1.25), crimson hair, long hair, wavy hair, messy hair, (messy hair:1.1),
golden eyes, slit pupils, (rolled eyes:1.1), (tears:1.15), crying, streaming tears,
(ahegao:1.15), tongue out, drooling, open mouth,
pale skin, (pale skin:1.1), (sweat:1.2), (bruised neck:1.15), red marks on neck,
clothes in tatters, torn clothes, (breasts out:1.15), huge breasts, exposed breasts, pink nipples,
nude, (completely nude:1.05), torn fabric on wrist,
(iron collar:1.25), chain, bound wrists, arms above head, suspension,
(strangling:1.3), (hand on another's neck:1.2), choked, (huge hand:1.2), pressed down, pinned,
(flattened ears:1.3), (tail between legs:1.2), trembling, (trembling:1.15),
orc, monster, male focus, green skin, (green skin:1.3), muscular male, tall male, huge muscles, veins, abs, pectorals,
tusks, sharp teeth, toothy grin, sadistic, bloodlust, dominant, red eyes,
topless male, loincloth, fur trim,
height difference, huge height difference, size difference, giant,
indoor, orc camp, tent, animal skin, torch light, bonfire,
harsh shadow, dim lighting, chiaroscuro, rim light, backlight,
close-up, face focus, upper body, from front,
```

**[负面追加]**

```
soft lighting, pastel color, gentle, tender, romantic, smiling, happy, willing, consensual,
closed eyes, blank expression, calm,
blonde hair, yellow hair, gold hair,
grey skin, brown skin, blue skin, purple skin,
bishounen, human, elf, humanoid, feminine, cute, kawaii, chibi,
censored, mosaic censoring, bar censor,
```

**[参数]** 896×1152 · steps 26 · CFG 6.5 · euler_ancestral · CLIP -2

> **两对绑定不能断**：`orc` + `green skin`（种族与肤色）、`strangling` + `ahegao`（暴力与快感表现）。
> 只写 `strangling` 出来是痛苦脸，只写 `ahegao` 出来是爽脸，两个一起才是窒息式侵犯的那张脸。

---

### S5 · 双兽人同时（explicit）

尺寸差在这一场最该被放大：一前一后，她的身体悬空。

**[正面]**

```
1girl, (cat girl:1.2), (cat ears:1.2), (cat tail:1.15),
(red hair:1.25), crimson hair, long hair, wavy hair, messy hair,
golden eyes, slit pupils, half-closed eyes, (ahegao:1.1), tongue out, drooling, tears,
pale skin, (sweat:1.25), (bruised:1.1), red marks, bite marks on shoulder,
nude, clothes in tatters, exposed breasts, huge breasts, pink nipples, bouncing breasts,
(iron collar:1.25), chain, bound wrists, arms above head, suspension, held up,
2boys, multiple boys, group sex, (double penetration:1.1), rough sex, brutal,
manhandling, pressed down, (huge hand:1.15), hand on another's waist,
(flattened ears:1.3), limp tail, trembling, (arched back:1.1),
orc, monster, male focus, green skin, (green skin:1.3), muscular male, tall male, huge muscles, veins,
tusks, sharp teeth, sadistic, dominant, topless male, loincloth,
height difference, huge height difference, size difference, giant,
indoor, orc camp, tent, animal skin, torch light, bonfire, harsh shadow, dim lighting, chiaroscuro,
full body, wide shot, from side, dutch angle,
```

**[负面追加]**

```
soft lighting, pastel color, censored, mosaic censoring, bar censor,
willing, consensual, smiling, happy, romance, gentle,
blonde hair, yellow hair, gold hair,
grey skin, brown skin, blue skin, bishounen, human, elf, feminine,
```

**[参数]** 1216×832（横构图，双人同框）· steps 28 · CFG 6 · euler_ancestral · CLIP -2

> 双人以上一定要用 `male focus` 并把 `(green skin:1.3)` 控制在 1.1–1.3 之间。两个兽人同时出，绿色容易把女主也染上去——女主侧固定写 `pale skin, (pale skin:1.1)` 做对立，必要时改用区域条件（见第五节）。

---

### S6 · 崩溃招供（explicit · 剧情高点）

拷问成功的那一刻：情报说出口，人也塌下去。表情从 ③ 档滑向 ④ 档。

**[正面]**

```
1girl, (cat girl:1.2), (cat ears:1.2), (cat tail:1.15),
(red hair:1.25), crimson hair, long hair, wavy hair, (messy hair:1.2),
golden eyes, slit pupils, (rolled eyes:1.1), (tears:1.2), crying, streaming tears, (dried tears:1.05),
(ahegao:1.15), tongue out, drooling, open mouth, (mind break:1.15), broken,
pale skin, (sweat:1.25), (excessive cum:1.1), cum on body, cum on breasts, cum on face,
nude, (completely nude:1.1), exposed breasts, huge breasts, pink nipples, spread legs,
(iron collar:1.25), chain, (chain from above:1.15), bound wrists, arms above head, slack arms,
shackles, knee on ground, (knees together:0.9), kneeling,
(ears drooping:1.2), limp tail, (tail down:1.1), trembling,
orc, monster, male focus, green skin, (green skin:1.3), muscular male, tall male, huge muscles,
tusks, sharp teeth, toothy grin, sadistic, dominant, topless male, loincloth,
height difference, size difference,
indoor, orc camp, tent, animal skin, torch light, bonfire, harsh shadow, dim lighting,
upper body, from front, close-up, face focus,
```

**[负面追加]**

```
defiant, glare, angry, smug, smiling, happy, willing, consensual,
soft lighting, pastel color, censored, mosaic censoring,
blonde hair, yellow hair, gold hair,
grey skin, brown skin, blue skin, bishounen, human, elf,
```

**[参数]** 832×1216 · steps 28 · CFG 6 · euler_ancestral · CLIP -2

> 这一场负面里**必须压掉 `defiant` 和 `glare`**。她的逞强外壳是这场戏的对照物，如果六张图里她一直在瞪人，崩溃就没有落点。

---

### S7 · 铁链事后（explicit 边缘）

吊绳解开，换成一条短链拴在木桩上。她瘫着，颈圈还在。

**[正面]**

```
1girl, (cat girl:1.2), (cat ears:1.2), (cat tail:1.15),
(red hair:1.25), crimson hair, long hair, wavy hair, (messy hair:1.25),
golden eyes, slit pupils, (empty eyes:1.15), expressionless, blank stare, dried tears,
(sweat:1.2), (dirty:1.15), dirt on body, bruises, scratches, bite marks, (whip marks:1.1), red marks,
clothes in tatters, torn fabric on wrist, only boots left, nude, (completely nude:1.1),
(iron collar:1.3), (chain:1.25), chain to wooden stake, padlock, leash,
sitting on ground, slumped, (collapsed:1.1), leaning against wooden stake, legs folded, knees up,
tail curled around leg, ears low, (ears drooping:1.15),
orc, monster, male focus, green skin, (green skin:1.3), muscular male, huge muscles, tusks,
standing, (from behind:0.9), back turned, topless male, loincloth,
indoor, orc camp, tent, animal skin, wooden stakes, dirt ground,
torch light, harsh shadow, dim lighting, chiaroscuro,
full body, from above, high angle,
```

**[负面追加]**

```
defiant, glare, angry, energetic, standing, running,
soft lighting, pastel color, clean, pristine,
blonde hair, yellow hair, gold hair,
grey skin, brown skin, blue skin, bishounen, human, elf,
```

**[参数]** 896×1152 · steps 27 · CFG 5.5 · euler_ancestral · CLIP -2

> 事后场用 `high angle` + `from above`（手册 4.3 的「体现女主被压制」镜头）。俯拍 + 蜷缩，把 165cm 的人拍成一个点。

---

### S8 · 猫耳尾巴特写（detail shot）

不画脸，只画耳朵和尾巴。作为整组的收尾图或插入页。

**[正面]**

```
1girl, solo focus, (cat ears:1.3), (cat tail:1.25), animal ears,
(red hair:1.25), crimson hair, wavy hair, (messy hair:1.2),
(flattened ears:1.3), (ears down:1.25), (tail between legs:1.25), trembling,
(iron collar:1.3), (chain:1.2), chain from above, bruise on neck, red marks on neck,
pale skin, (sweat:1.15), close-up, detail shot, from behind, from side,
indoor, orc camp, tent, torch light, harsh shadow, dim lighting, rim light,
```

**[负面追加]**

```
full face, face focus, soft lighting, pastel color, smiling,
blonde hair, yellow hair, gold hair,
```

**[参数]** 832×1216 · steps 26 · CFG 6 · euler_ancestral · CLIP -2

---

## 二、负面总表（全场景通用底噪）

```
(worst quality, low quality:1.4), normal quality, lowres, jpeg artifacts, blurry, out of focus,
bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra limbs, extra arms, extra legs,
deformed, disfigured, malformed limbs, mutated, bad proportions, ugly,
text, watermark, signature, username, logo, border, frame,
censored, mosaic censoring, bar censor, pixelated,
child, loli, flat chest, muscular female, bodybuilder, cross-eyed, extra eyes, extra ears, extra tail, two tails,
```

**伊丝娜专属追加**：
```
blonde hair, yellow hair, gold hair, orange hair, brown hair,
human ears, round ears,
```

**兽人专属追加**：
```
grey skin, blue skin, red skin, brown skin, purple skin,
human, elf, humanoid, cute, kawaii, chibi, bishounen, feminine,
soft lighting, pastel color,
```

**拷问线专属追加**（按场景取用）：
```
soft lighting, pastel color, gentle, tender, romantic, smiling, happy, willing, consensual, aroused smile,
```

> 最后那条 `willing, consensual` 是拷问线的护栏。不压的话，模型会把 `ahegao` 理解成"她自己很享受"，整组图的性质就变了。

---

## 三、采样参数（Animagine XL 4.0）

| 参数 | 值 |
|---|---|
| CLIP Set Last Layer | **-2** |
| Steps | 25 ~ 28 |
| CFG | 5.0 ~ 7.0 |
| Sampler | euler_ancestral |
| Scheduler | normal |
| 分辨率 | 双人 / 竖构图 **896×1152**；横构图双人以上 **1216×832**；特写 **832×1216** |

**建议顺序**：S1 → S2 → S3 → S4 → S5 → S6 → S7，S8 作为穿插或收尾。
每张换一次 seed，但**同一场景内固定 seed 只改动作 tag**，方便对比微调。

---

## 四、Animagine 4.0 自然语言补句

### 4.1 用于 S2（扣颈圈）

```
The massive green-skinned orc crouches down in front of her, his enormous fingers
fumbling with the cold iron collar at her throat, and she does not struggle —
her whole body has gone rigid, pupils shrunk to thin slits, her red cat ears
pinned flat against her skull, the tip of her crimson tail trembling against the dirt floor.
```

### 4.2 用于 S4（掐脖）

```
His hand closes completely around her slender neck, one green thumb pressed into
the side of her throat, lifting her until her toes barely touch the ground; her
collar chain pulls taut above her head while her ahegao face twists under the
flickering torchlight, tears cutting tracks through the sweat and dirt on her cheeks.
```

### 4.3 用于 S7（事后）

```
She sits slumped against a wooden stake in the corner of the tent, the chain from
her iron collar running down to a rusted padlock at its base, her red cat ears low
and her tail curled tight around one bruised thigh, eyes empty, torch shadows
crawling slowly across the dirt.
```

三个必须写进句子的点：

| 片段 | 解决什么 |
|---|---|
| `pupils shrunk to thin slits` / `red cat ears pinned flat` | 猫族特征 + 恐惧反应，一句话同时交代种族与情绪 |
| `one green thumb pressed into the side of her throat` | 掐脖 + 绿皮 + 尺寸差三件事压缩在一起 |
| `tail curled tight around one bruised thigh` | 事后感，尾巴的收束动作比任何表情都更像"被打败了" |

---

## 五、绿皮不串色（本角色特化）

`green skin` 会把画面所有可见皮肤染绿，伊丝娜是 `pale skin`，串色后整张图废掉。三个办法按成功率排：

| # | 办法 | 做法 |
|---|---|---|
| 1 | **权重与对立**（提示词层，约七成） | 兽人侧 `(green skin:1.3)` + `male focus`；女主侧固定 `pale skin, (pale skin:1.1)` |
| 2 | **降权重**（最简单） | 全员发绿时把 `(green skin:1.3)` 降到 1.0~1.1，`orc` 自带的绿色先验够用 |
| 3 | **区域条件**（最可靠，ComfyUI） | `Conditioning (Set Area)` 把兽人条件限制在左半（`width:0.5 height:1.0 x:0 y:0`），女主走默认或右半 |

装了 **ComfyUI-Impact-Pack** 时用 `Regional Sampler` 更省事，可直接按区域分配两组 conditioning。

---

## 六、排错速查（伊丝娜 × 兽人）

| 症状 | 原因 | 修法 |
|---|---|---|
| 头发变金色 / 橙色 | `cat girl` 的金发先验压过 `red hair` | `(red hair:1.25)` 重复写一次，负面加 `blonde hair, yellow hair, gold hair, orange hair` |
| 猫耳画成人类耳朵 | `cat ears` 权重不足或被 `1girl` 稀释 | `(cat ears:1.2)` + `animal ears`，负面加 `human ears, round ears` |
| 尾巴没画出来 | `cat tail` 被构图挤掉 | `(cat tail:1.15)`，改 `full body`；特写场用 S8 单独画 |
| 耳朵尾巴没有反应 | 只写了表情 tag | 每场必带 0.5 的耳朵尾巴组，① `ears down` ② `flattened ears + tail between legs` ③ `ears drooping` ④ `tail curled around leg` |
| 表情不够崩 | 缺 `ahegao` 或 `tears` | S4/S6 必给 `(ahegao:1.1~1.15)` + `(tears:1.15~1.2)` + `rolled eyes` |
| 她看起来在享受 | 负面缺 `willing, consensual` | 拷问线负面必压这两条 |
| 兽人太帅 | 缺 `bishounen` 负面 | 负面加 `bishounen, human, elf, feminine`，正面加 `tusks, sharp teeth` |
| 兽人是灰皮 / 褐皮 | `green skin` 权重不足 | `(green skin:1.3)` 写两次，负面加 `grey skin, brown skin` |
| 全员发绿 | `green skin` 溢出 | 权重降到 1.0~1.1，或上区域条件 |
| 钢圈画成项圈饰品 | 缺 `metal collar, padlock` | 写 `(iron collar:1.25), metal collar, padlock, thick collar`，负面加 `choker, necklace` |
| 场景太亮太甜 | `soft lighting` 残留 | 删掉，换 `harsh shadow, dim lighting, chiaroscuro` |
| 衣服太整齐 | 破损档位没写 | 按 0.2 的 ①~④ 档明确给 `torn clothes` / `breasts out` / `clothes in tatters` |

---

## 七、和其余四包的区别（为什么这条线要单开）

| 项 | 其余四包（奥萝拉/妮丝/艾琳/塞西莉亚） | 伊丝娜本包 |
|---|---|---|
| 加害方 | 人类男性为主（领主、债主、赌客） | **兽人**，绿皮 + 獠牙 + 体型差 |
| 场景 | 卧室、教堂、赌场、领主山庄 | **兽人军营帐篷**，木桩、兽皮、火把 |
| 核心道具 | 契约、圣物、赌桌 | **铁颈圈 + 铁链**（对应她幼年被捕奴队吓到的旧伤） |
| 表情主轴 | 自欺、麻木、坠落 | **嘴硬 → 破防 → 崩溃 → 空洞**，四档靠耳朵尾巴泄漏 |
| 光照 | 室内暖光或烛光 | **硬光、火把、强反差**，禁柔光 |
| 唯一技术锚 | 服装层次 | **`orc`+`green skin` 与 `strangling`+`ahegao` 两对绑定** |

---

---

## 九、终局差分 · 堕落·兽人（`isna_fallen_orc`）

> **条目名**：伊丝娜 · 堕落·兽人
> **对应状态**：`stage 3 · 沦陷`，被俘第三日写入 `isna_fallen_orc = true`
> **触发场次**：`伊丝娜 nsfw 兽人·堕落`
> **真源**：`设定_角色数值与机制真源表.md` L261–281「黑兽人营地遇险、求救与三日堕落链」
> **剧情位置**：堕落落地后**紧接启动假求救陷阱**——她再次向古兰发出求救，等的是把旧同伴引进来

### 9.1 差分原则（这条最重要）

终局立绘不是"换一张图"，是**同一张立绘的堕落版**。判据：把两张图并排放，能不能一眼认出是同一个人。

| 必须保留（辨识度） | 允许变化（堕落标记） |
|---|---|
| `(red hair:1.25)` 绯红波浪长发 | 更乱、更脏：`messy hair, dirty` |
| `(cat ears:1.2)` + `(cat tail:1.15)` | 耳朵姿态改变，尾巴不再炸毛 |
| `golden eyes, slit pupils` 金色竖瞳 | 眼神内容改变（见 9.4 / 9.5 两版） |
| 165cm 身形、`(wide hips:1.1)`、`(thick thighs:1.1)` | 增加痕迹：`bruises, bite marks` |
| `pale skin` 白皙 | **不变**。刺青是加在皮肤上，不是改肤色 |
| 小虎牙 `sharp canine tooth` | 笑容性质改变 |

**不能动的两条**：发色、猫族三件套。这两条断了就不是伊丝娜，是"某个被纹身的猫娘"。

### 9.2 三处图腾刺青（本条目核心）

```
(tribal tattoo:1.25), (womb tattoo:1.18), thigh tattoo, shoulder tattoo,
black ink, crude tattoo, ritual tattoo, scarification,
(tattoo on stomach:1.12), (tattoo on thigh:1.12), (tattoo on shoulder:1.12),
```

| 位置 | tag | 权重要点 |
|---|---|---|
| **小腹** | `(womb tattoo:1.18)`, `tattoo on stomach` | 权重最高。`womb tattoo` 是"子宫位置纹身"的专用 tag，落在肚脐下方到耻骨之间 |
| **大腿** | `thigh tattoo`, `tattoo on thigh` | 需要 `bare thighs` 才看得见；单侧（外侧）比双侧更像纹上去的 |
| **肩** | `shoulder tattoo`, `tattoo on shoulder` | 配 `bare shoulders`；落在三角肌到肩胛一带 |

> ⚠️ **`tribal tattoo` 必须给 1.25，三个位置词都要写**。只写 `tattoo` 会画出小臂花纹或满背花臂，位置全错。
> ⚠️ **不要写 `tattoo` 以外的 `sticker, decal, body paint`**，模型会往"贴纸感"走。要的是进皮肤的墨。

### 9.3 图腾语汇（兽人部落风，可替换的形容层）

```
tribal tattoo, crude tattoo, jagged lines, geometric pattern, spiral pattern,
fang motif, claw mark pattern, ring pattern, (black ink:1.15), (ink:1.1),
```

| 想要的质感 | 写法 |
|---|---|
| 粗野手刺感（推荐） | `crude tattoo, uneven lines, jagged lines` |
| 几何图腾环 | `geometric pattern, ring pattern, circular tattoo` |
| 獠牙/爪痕母题 | `fang motif, claw mark pattern` |
| 烙印式（可选，更狠） | 追加 `branding, brand mark, burn scar` |
| 发光（不推荐） | `glowing tattoo` — 会破坏项目的写实向基调 |

> 兽人部落的图腾不用画得太精致。**`crude tattoo` + `uneven lines` 这种"手刺得歪"的感觉，比工整的几何纹样更像战俘身上留下的东西。**

### 9.4 终局立绘 A · 归顺的从容

最标准的差分立绘。叉腰站姿，三处刺青全露。

**[正面]**

```
masterpiece, best quality, very aesthetic, absurdres, newest, explicit,
1girl, solo, standing, full body, looking at viewer, from front,
(cat girl:1.2), (cat ears:1.2), (cat tail:1.15), animal ears,
(red hair:1.25), crimson hair, long hair, wavy hair, (messy hair:1.1),
golden eyes, slit pupils, (vertical pupils:1.1), sharp canine tooth, cat mouth,
half-closed eyes, smug, confident, evil smile, predatory smile, blush,
pale skin, (sweat:1.05), dirt on body, (dirty:1.05),
(tribal tattoo:1.25), (womb tattoo:1.18), thigh tattoo, shoulder tattoo,
black ink, crude tattoo, ritual tattoo, jagged lines, uneven lines, tattoo on stomach, tattoo on thigh, tattoo on shoulder,
tribal outfit, leather harness, fur trim, bare shoulders, midriff, navel, bare thighs,
loincloth, fur boots, bone necklace, tribal jewelry, armlet, thigh strap,
(iron collar:1.3), metal collar, padlock, (broken chain:1.2), chain,
bruises, bite marks, scratches,
hand on own hip, hips cocked, contrapposto, tail swaying,
indoor, orc camp, tent, animal skin, torch light,
harsh shadow, dim lighting, rim light, chiaroscuro,
```

**负面**

```
(worst quality, low quality:1.4), bad anatomy, extra fingers, fused fingers, deformed,
text, watermark, signature, censored, mosaic censoring,
soft lighting, pastel color, cute, kawaii, chibi,
blonde hair, yellow hair, gold hair, orange hair, human ears, round ears,
sticker, decal, body paint, temporary tattoo, tattoo on arm, sleeve tattoo, full body tattoo,
defiant, glare, angry, crying, tears, fear, scared, trembling,
```

**[参数]** 832×1216 · steps 27 · CFG 6 · euler_ancestral · CLIP -2

> 引用里 `hand on own hip` 是叉腰，比 `hands behind back` 更稳：手臂不遮小腹、不遮大腿外侧、也不挡前肩。**立绘的姿势要为"让三处刺青同时可见"服务**，不要用抱臂、抱膝、侧身回头这些会挡纹身的姿势。

### 9.5 终局立绘 B · 诱饵的伪装

对应真源里「堕落落地后紧接启动假求救陷阱」。这一版她**装回原来那副逞强的样子**给旧同伴看——脸在演，身体不演。

**[正面]**

```
masterpiece, best quality, very aesthetic, absurdres, newest, explicit,
1girl, solo, standing, full body, from front, looking at viewer,
(cat girl:1.2), (cat ears:1.2), (cat tail:1.15), animal ears,
(red hair:1.25), crimson hair, long hair, wavy hair, (messy hair:1.15),
golden eyes, slit pupils, (vertical pupils:1.1), sharp canine tooth,
(forced smile:1.15), (fake smile:1.1), insincere smile, (teary eyes:1.05), (tears:1.05),
half-closed eyes, blush, (averting eyes:1.05),
pale skin, (sweat:1.1), dirt on face, (dirty:1.1), scratches on cheek,
(tribal tattoo:1.25), (womb tattoo:1.18), thigh tattoo, shoulder tattoo,
black ink, crude tattoo, ritual tattoo, jagged lines, tattoo on stomach, tattoo on thigh, tattoo on shoulder,
torn clothes, torn shirt, (breasts out:1.05), torn shorts, only boots left,
(iron collar:1.3), metal collar, padlock, (broken chain:1.2),
bruises, bite marks, red marks, (cum on body:1.05),
hands clasped, pleading, reaching out,
indoor, orc camp entrance, wooden stakes, torch light,
harsh shadow, dim lighting, rim light,
```

**负面**

```
(worst quality, low quality:1.4), bad anatomy, extra fingers, deformed,
text, watermark, signature, censored,
soft lighting, pastel color, cute, kawaii,
blonde hair, yellow hair, gold hair, orange hair, human ears,
sticker, decal, body paint, temporary tattoo, sleeve tattoo, full body tattoo,
smug, evil smile, confident, sincere smile, happy,
```

**[参数]** 832×1216 · steps 27 · CFG 6 · euler_ancestral · CLIP -2

> 这一版的张力全在**矛盾**：`forced smile` 配 `tears`，`pleading` 的手势配身上那三处已经洗不掉的图腾。
> 负面里必须压掉 `smug, evil smile`——否则模型会把她画成"懒得演"的样子，陷阱感就没了。

### 9.6 终局场景 · 千夫长克罗格的战利品

真源：`wilds_camp` 由**千夫长克罗格**与黑兽人重兵驻扎。终局场景是他占有的画面。

**[正面]**

```
masterpiece, best quality, very aesthetic, absurdres, newest, explicit,
1girl, 1boy, (cat girl:1.2), (cat ears:1.2), (cat tail:1.15),
(red hair:1.25), crimson hair, long hair, wavy hair, messy hair,
golden eyes, slit pupils, (rolled eyes:1.1), (ahegao:1.1), tongue out, drooling,
pale skin, (sweat:1.2), (tribal tattoo:1.25), (womb tattoo:1.18), thigh tattoo, shoulder tattoo,
black ink, crude tattoo, tattoo on stomach, tattoo on thigh, tattoo on shoulder,
tribal outfit, leather harness, fur trim, bare shoulders, midriff, bare thighs, loincloth,
(iron collar:1.3), (chain:1.25), chain from above, chain to wooden throne,
bound wrists, arms above head,
nude, (completely nude:1.05), huge breasts, exposed breasts, pink nipples,
spread legs, sex, rough sex, brutal, manhandling, pressed down,
orc, monster, male focus, green skin, (green skin:1.3), muscular male, tall male, huge muscles, veins,
tusks, sharp teeth, toothy grin, sadistic, dominant, red eyes,
(fur cape:1.15), shoulder armor, scars, jewelry, tribal chief, large penis,
height difference, huge height difference, size difference, giant,
indoor, orc camp, tent, animal skin, wooden throne, skulls, banners, torch light, bonfire,
harsh shadow, dim lighting, chiaroscuro, rim light,
full body, wide shot, from below, low angle,
```

**负面**

```
(worst quality, low quality:1.4), bad anatomy, extra fingers, deformed,
text, watermark, signature, censored, mosaic censoring,
soft lighting, pastel color, gentle, tender, romantic, smiling, happy, willing, consensual,
blonde hair, yellow hair, gold hair,
grey skin, brown skin, blue skin, purple skin,
bishounen, human, elf, feminine, cute,
sticker, decal, body paint, temporary tattoo,
defiant, glare, angry,
```

**[参数]** 1216×832（横构图）· steps 28 · CFG 6.5 · euler_ancestral · CLIP -2

> 千夫长与其他兽人的区别在**服饰**：`fur cape, shoulder armor, scars, jewelry` 三件套（对应 `兽人_绘图要点.md` 第三节「首领」行）。不加这几件，他和杂兵长得一模一样。

### 9.7 与常规立绘的对照

| 项 | 常规立绘 | 终局·堕落·兽人 |
|---|---|---|
| 发色 | 绯红 `(red hair:1.25)` | **不变** |
| 猫耳 / 尾 | 常态摆动 | 耳朵低垂、尾巴松弛 |
| 眼神 | `smirk, half-closed eyes, drunk blush` 慵懒馋猫 | `smug, evil smile`（A）或 `forced smile` + `tears`（B） |
| 皮肤 | `pale skin` 干净 | **肤色不变**，加 `dirty, sweat, bruises, bite marks` |
| 小腹 | `midriff, navel` 无纹 | **`(womb tattoo:1.18)`** |
| 大腿 | `bare thighs` 干净 | **`thigh tattoo`** |
| 肩 | `bare shoulders` 干净 | **`shoulder tattoo`** |
| 服装 | 红短上衣 + 深色短裤 + 皮鞘 + 皮靴 | 兽皮 / 皮革挽具 / 骨饰 / 毛边靴 |
| 颈圈 | **无** | **`(iron collar:1.3)` + 断链** |
| 姿态 | 慵懒、倚靠、放松 | 叉腰站立（A）/ 伸手乞求（B）/ 被压制（场景版） |

> **断链是这张图的关键叙事**：`broken chain` 表示不再需要拴着她了。颈圈留着、链子断了——这比"还锁着"更能说明她现在的处境。

### 9.8 排错速查（终局差分专属）

| 症状 | 原因 | 修法 |
|---|---|---|
| 刺青画成贴纸 / 临时纹身 | 缺 `black ink`、`crude tattoo` | 正面加 `(black ink:1.15), crude tattoo, uneven lines`，负面压 `sticker, decal, body paint, temporary tattoo` |
| 刺青位置跑到手臂 / 满背 | 只写了 `tribal tattoo` | 三个位置词全写：`(womb tattoo:1.18)` + `thigh tattoo, tattoo on thigh` + `shoulder tattoo, tattoo on shoulder` |
| 小腹刺青被挡 | 姿势挡了 | 改 `hand on own hip` 叉腰，禁用抱臂、抱膝 |
| 大腿刺青看不见 | 缺 `bare thighs` | 服装槽加 `bare thighs`，负面压 `pantyhose, thighhighs, pants` |
| 肩部刺青看不见 | 穿了长袖 / 披肩 | `bare shoulders`，负面压 `long sleeves, shawl, cape`（首领侧不受此限） |
| 认不出是伊丝娜 | 发色或猫族三件套被削弱 | `(red hair:1.25)` 与 `(cat ears:1.2), (cat tail:1.15)` 权重不得低于常规立绘 |
| 脸太狠不像她 | A 版写成了纯反派脸 | A 版保留 `half-closed eyes, blush`，只把 `smirk` 换成 `smug, predatory` |
| B 版陷阱感不足 | 脸也被画成归顺相 | 必写 `(forced smile:1.15), (tears:1.05), pleading`，负面压 `smug, evil smile, sincere smile` |
| 颈圈画成项圈饰品 | 缺金属与锁具 | `(iron collar:1.3), metal collar, padlock, thick collar`，负面压 `choker, necklace` |
| 链子画成完整的 | 缺断链 | `(broken chain:1.2), broken chain links, chain end` |

### 9.9 生成顺序建议

```
先出 A（归顺的从容）→ 定稿刺青形态与位置
   ↓ 同一 seed 家族
再出 B（诱饵的伪装）→ 只改表情、手势、服装破损档
   ↓ 换构图
最后出场景版（千夫长占有）→ 复用 A 的刺青 tag 组
```

**A 版是基准图**。刺青的样子一旦在 A 上定下来，B 与场景版都照抄那一组 tag，不要各自微调——否则同一角色三张图的纹样会对不上。

---

*包 v1.1 · 2026-11-12 02:40 · 追加第九章「终局差分 · 堕落·兽人」，含三处图腾刺青配方与 A/B 双版立绘*

