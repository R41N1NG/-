# 古兰 · Animagine XL 提示词包 v1（龙血化双场景）

> **定稿时间**：2026-11-12 03:10 (UTC+8)
> **修订**：2026-11-12 03:30 —— 按主人提供的立绘修正基础人设：**加过膝长筒靴、领口严实包裹不露胸口、左肩单侧肩甲与束腰腰甲**；**龙鳞与红尖角从基础锚点移入龙血化档位**（基础人设的角为纯黑、周身无鳞）。
> **修订**：2026-11-12 03:35 —— 场景 B 由「站立挥剑」改为**突进横斩动态版**，与场景 A 的站定下劈拉开动作语法差异。
> **角色定位**：小队随行守护长辈 · 前卫重剑士 · 半龙武人 · 外号「黑角重剑」
> **外貌**：约二十余岁成熟女子（实龄数百年，长生种，未婚）· 高挑修长、体态丰润
>
> **本包范围**：龙血化形态 × 三个场景
> - 场景 A · `training_grounds` 演武场斩杀混混（对应 `bloody_arena`）
> - 场景 B · `wilds_camp` 兽人营地斩杀兽人（对应 `orc_camp_destroyed`）
> - 场景 C · **终局立绘**：龙化常态，长出**黑色龙尾**与**龙爪**，表情冰冷（对应 `stage 3 · 沦陷`）
>
> **信源**
> - 外观 / 武器 / 血脉：`世界书条目/03_小队全员档案.md` L46–48、L34「能力与持有物」
> - 两场战斗的剧情与结算：`设定_角色数值与机制真源表.md` L112–120（事件一）、L124–136（事件二）
> - 兽人规格：`绘图提示词/兽人_绘图要点.md`
> - 格式：`绘图提示词/伊丝娜_Animagine提示词包.md`、`塞西莉亚_Animagine提示词包.md`
>
> **与真源的一处差异（已按主人指定处理）**
> 真源 L34 写的是「全身浮现**致密**龙鳞」。本包按主人指定的**克制版**给：小臂与大腿少量鳞片、角尖转红，其余部位保持人形。
> 若要与真源字面完全一致，用第 1.4 节的「重度档」替换鳞片组即可。

---

## 零、锚点

### 0.1 外观锚点（每条必带）

```
1girl, solo, adult, mature female, tall female, voluptuous,
(black hair:1.2), long hair, straight hair, very long hair, blunt bangs,
amber eyes, (amber eyes:1.15), slit pupils, (vertical pupils:1.1), sharp eyes,
pale skin, (pale skin:1.05),
horns, dragon horns, (black horns:1.25), (solid black horns:1.15), curved horns, swept back horns, temple horns,
```

| tag | 对应设定 |
|---|---|
| `(black hair:1.2), long hair, straight hair, very long hair, blunt bangs` | 乌黑长直发垂落过腰，整齐齐刘海 |
| `(black horns:1.25), (solid black horns:1.15), curved horns, swept back horns` | 太阳穴两侧对称后弯乌黑龙角，黑曜石光泽，**常态纯黑** |
| `amber eyes, (amber eyes:1.15), slit pupils` | 琥珀色竖瞳，目光锐利 |
| `adult, mature female, tall female, voluptuous` | 成熟女子，高挑修长、体态丰润 |
| `pale skin` | 肤白端庄冷艳，无岁月细纹 |

> **角的位置是这条包最容易画错的地方**：`horns` 单写会画到头顶（牛角/羊角位置），要加 `temple horns` 把位置拉到太阳穴两侧，加 `swept back` 才有后弯的走向。
> ⚠️ **基础人设的角是纯黑的，角尖不带任何红色**。红尖只在龙血化时出现（见 0.4 节），不要写进本节锚点。

### 0.2 服装锚点（黑底金边高叉长裙 · 高领包裹 · 过膝长筒靴）

```
black dress, (long dress:1.15), (high collar:1.2), (covered chest:1.15), (modest neckline:1.1), long sleeves,
gold trim, gold embroidery, silver embroidery,
(side slit:1.2), (high slit:1.15), bare thighs,
classical dress, elegant, armoured dress, chainmail underlayer,
(corset:1.15), waist armor, leather belt, gold buckle,
pauldron, (single pauldron:1.15), spaulder, bracers, arm guards, gauntlets,
(thigh boots:1.25), (over-knee boots:1.2), black boots, leather boots, boot cuffs, flat boots,
```

| tag | 对应设定 |
|---|---|
| `black dress, (long dress:1.15), gold trim, gold embroidery` | 黑底金边古典长裙 |
| **`(high collar:1.2), (covered chest:1.15), (modest neckline:1.1)`** | **立领高至颈根，领口严实包裹，不露胸口** |
| **`(side slit:1.2), (high slit:1.15), bare thighs`** | **两侧高开衩至腰际**，为方便迈步出剑，同时让大腿露出 |
| `armoured dress, chainmail underlayer` | 内衬轻便软锁甲 |
| **`(corset:1.15), waist armor, leather belt`** | 黑色皮革束腰腰甲，金色扣 |
| **`pauldron, (single pauldron:1.15), spaulder`** | **左肩单侧肩甲** |
| `bracers, arm guards, gauntlets` | 黑色护腕 / 臂甲 |
| **`(thigh boots:1.25), (over-knee boots:1.2), leather boots`** | **黑色过膝长筒靴**，靴口有翻边 |

> **三条不要写错**：
> 1. **领口**：`high collar` 单写常只到锁骨。要配 `covered chest, modest neckline`，否则模型会自作主张开成低胸。负面必须压 `cleavage, exposed chest, low cut`。
> 2. **靴筒**：`boots` 单写会出短靴或及踝靴。`(thigh boots:1.25)` + `(over-knee boots:1.2)` 两个一起给，才到膝上。负面压 `knee boots, ankle boots, short boots`。
> 3. **高叉与鳞片联动**：裙子两侧高开衩让大腿露出来，大腿上的鳞片才有位置。**没有 `side slit` 就没有大腿鳞片**，这两个 tag 必须成对出现。

### 0.3 武器锚点（阔刃双手精钢重剑）

```
greatsword, two-handed sword, (broad blade:1.15), thick blade, straight sword, crossguard,
holding sword, holding greatsword, (sword:1.1),
```

斩杀后追加：
```
(blood on sword:1.2), (blood dripping:1.1), blood on blade, bloody sword, (blood spatter:1.15),
```

| tag | 说明 |
|---|---|
| `greatsword, two-handed sword, (broad blade:1.15)` | 阔刃双手重剑，宽度是辨识点 |
| `thick blade, crossguard` | 厚重、有十字护手 |
| `(blood on sword:1.2), blood on blade` | 斩杀后必须有，否则看不出刚杀过 |

> **不要写 `katana` / `longsword` 这类词**，会画成细长刀。她要的是"重若崩山"的宽刃大剑。负面压 `katana, rapier, thin blade, dagger`。

### 0.4 龙血化标记（本包核心）

**轻度档（本包默认 · 主人指定）**

```
(dragon scales:1.15), black scales, scales on forearm, scales on thigh,
(black scales on arms:1.15), (scales on thighs:1.15),
(red glow on horn tips:1.1), glowing horn tips, red veins on horns,
```

**中度档（可选）**

```
(dragon scales:1.25), black scales, scales on forearm, scales on thigh, scales on shoulders, scales on neck,
glowing red veins, (red glow:1.1),
```

**重度档（与真源字面一致 · 全身致密鳞片）**

```
(dragon scales:1.35), black scales, full body scales, scales on face, scales on neck, scales on arms, scales on legs,
dragon girl, (glowing red veins:1.15), (red glow on horn tips:1.15),
```

| 部位 | tag | 说明 |
|---|---|---|
| **小臂** | `scales on forearm`, `(black scales on arms:1.15)` | 小臂外侧向外蔓延，靠近手腕处最密 |
| **大腿** | `scales on thigh`, `(scales on thighs:1.15)` | 只在高叉露出的那一块，边缘呈锯齿状 |
| **角尖** | `(red glow on horn tips:1.1)`, `red veins on horns` | **从角根往角尖渐变**，尖端最红 |
| 其余 | 保持人形皮肤 | 这是"少许"的定义：只有这三处 |

> 🔴 **红尖角与鳞片属于龙血化，不属于基础人设。**
> 基础人设（日常立绘、世界书条目、卡内描述）里的角是**纯黑**、周身**无鳞**；只有进入本节的龙血化档位，才加 `(horns with red tips:1.15), (red glow on horn tips:1.1)` 与鳞片组。
> 场景 A / B 都是龙血化状态，所以两场的正面串里带着这两组；画常规立绘时**必须整段删掉**。

> ⚠️ **`full body scales` 只能出现在重度档**。轻度档若误加，模型会画成整只黑龙娘，脸都变成蜥蜴。
> ⚠️ 轻度档的负面必须压 `dragon girl, monster girl, reptile, full body scales, scaly skin`。
> ⚠️ **角尖的红色靠 tag 很难精确**。主写法用 `(red glow on horn tips:1.1)`，若模型画不出来，改走自然语言补句（第六节 A 句最后一句），或后期在 PS 里叠一层红。

### 0.4.1 终局档（龙化常态 · 龙尾 + 龙爪）

**仅用于终局立绘**（`stage 3 · 沦陷`，真源 L133「已接受古龙力量、龙化形态成为常态」）。

```
(dragon scales:1.2), black scales, scales on forearm, scales on thigh, (scales on hands:1.15),
(red glow on horn tips:1.15), (horns with red tips:1.1),
(dragon tail:1.3), (black dragon tail:1.25), thick tail, (scaled tail:1.15), (tail with spikes:1.1), (tail swaying:1.1),
(dragon claws:1.3), (clawed hands:1.25), (sharp claws:1.2), (black claws:1.2), (scaled hands:1.2),
(clawed fingers:1.2), (long nails:1.1), (black nails:1.2),
```

| 部位 | tag | 说明 |
|---|---|---|
| **小臂 / 大腿鳞片** | 同轻度档，权重不动 | 终局不把鳞片加满，仍是"少许" |
| **角尖** | `(red glow on horn tips:1.15)` | 比轻度档再高 0.05，终局要更亮 |
| **龙尾** | **`(dragon tail:1.3), (black dragon tail:1.25), thick tail, (scaled tail:1.15)`** | 黑色、粗壮、覆鳞，自尾根向尾尖收细 |
| **龙爪** | **`(dragon claws:1.3), (clawed hands:1.25), (sharp claws:1.2), (black claws:1.2)`** | 十指成爪，甲黑而长，手背生鳞 |

> 🔴 **尾巴与爪子只出现在终局档。** 场景 A / B 是战斗中的临时龙血化，**不长尾、不变爪**——这两样是"龙化成为常态"之后的形态标记。
> ⚠️ 加 `(dragon tail:1.3)` 之后，负面里原有的 `dragon tail, tail` **必须删掉**（那是场景 A/B 用来防长尾的），否则两相打架，尾巴出不来。
> ⚠️ 尾巴要进画必须有 `full body`；`cowboy shot` 会把它切在画面外。

### 0.5 表情锚点（严肃带愤怒）

```
serious, (angry:1.15), furious, cold fury, (glaring:1.15), intense gaze,
frown, narrowed eyes, clenched teeth, (clenched jaw:1.1),
calm anger, controlled rage, battle focus,
```

| 层次 | tag |
|---|---|
| 基底 | `serious, cold fury, calm anger, battle focus` |
| 愤怒 | `(angry:1.15), glaring, frown, narrowed eyes` |
| 咬合 | `clenched teeth, clenched jaw`（愤怒时的下颌） |
| 斩杀后 | `blood on face, blood splatter on face, blood on cheek` |

> **她是"严格控制住的愤怒"，不是咆哮**。所以不要写 `screaming, roaring, open mouth`；`clenched jaw` + `glaring` + `narrowed eyes` 才是宗师级的怒——嘴上不出声，手上已经把人劈了。

### 0.6 演武场专属（真源细节）

真源 L112：地痞「暗中燃放特制迷幻催情异香」，古兰「面色浮现异常潮红」，头目误以为药效已起。

```
(flushed face:1.15), (blush:1.1), red cheeks, sweat on face, (heat haze:1.0),
```

> **这层潮红是这个场景的剧情证据**：她中了异香但心神清醒，愤怒正来自于对方用了下作手段。加 `flushed face` 与 `sweat`，画面才不只是"砍人"，而是"带着药力在砍人"。

### 0.7 终局表情（冰冷冷漠 · 与 0.5 相反）

```
cold expression, (emotionless:1.2), (cold eyes:1.2), expressionless, deadpan,
(narrowed eyes:1.1), (piercing gaze:1.15), (cold stare:1.15), (unfazed:1.1),
(aloof:1.1), (detached:1.1), (contempt:1.05), (looking down at viewer:1.1),
(inhuman:1.1), (monstrous beauty:1.05),
```

| 组 | tag | 说明 |
|---|---|---|
| 冷 | `cold expression, (emotionless:1.2), (cold eyes:1.2), deadpan` | 冰，不是怒 |
| 视线 | `(cold stare:1.15), (piercing gaze:1.15), (looking down at viewer:1.1)` | 看着你，但不把你看在眼里 |
| 非人 | `(inhuman:1.1), (monstrous beauty:1.05)` | 气质从"宗师"转到"异类" |

> **这与 0.5 的愤怒组逐条对立**：`(angry:1.15), furious, glaring, clenched teeth, clenched jaw` 全部不要。
> 场景 A/B 是"怒"，终局是"冷"——**她连愤怒都不必给了**。负面必须压 `angry, furious, glaring, screaming, roaring, smile, smirk, smirk`，否则模型会顺着前两张的惯性把火气带进来。

---

## 一、场景 A · 演武场斩杀混混

**剧情位置**：真源 L114 分支 1——古兰察觉异香性质不明、为防交手出事，果断开启龙血化，挥重剑将十余名袭击者悉数格杀肃清，**演武场血迹斑斑**（记 `bloody_arena`）。

**[正面]**

```
masterpiece, best quality, very aesthetic, absurdres, newest,
1girl, solo focus, adult, mature female, tall female, voluptuous,
(black hair:1.2), long hair, straight hair, very long hair, blunt bangs, (hair blowing:1.1),
amber eyes, (amber eyes:1.15), slit pupils, (vertical pupils:1.1), sharp eyes,
pale skin, (pale skin:1.05), (flushed face:1.15), (blush:1.1), red cheeks, sweat on face,
horns, dragon horns, (black horns:1.2), curved horns, swept back horns, temple horns, (horns with red tips:1.15), (red glow on horn tips:1.1),
serious, (angry:1.15), furious, cold fury, (glaring:1.15), intense gaze,
frown, narrowed eyes, clenched teeth, (clenched jaw:1.1),
(dragon scales:1.15), black scales, scales on forearm, scales on thigh, (black scales on arms:1.15), (scales on thighs:1.15),
black dress, (long dress:1.15), (high collar:1.2), (covered chest:1.15), long sleeves,
gold trim, gold embroidery, (side slit:1.2), (high slit:1.15), bare thighs,
armoured dress, chainmail underlayer, (corset:1.15), waist armor, (single pauldron:1.15), bracers,
(thigh boots:1.25), (over-knee boots:1.2), leather boots,
(battle damage:1.1), torn dress,
greatsword, two-handed sword, (broad blade:1.15), thick blade, crossguard, holding greatsword,
(swinging sword:1.2), (slash:1.15), (mid-swing:1.1), overhead swing, cleaving,
(blood on sword:1.2), (blood dripping:1.15), blood on blade, (blood spatter:1.15), (blood on face:1.1),
multiple boys, (dead bodies:1.2), corpses, (lying on ground:1.15), (blood on ground:1.2), (blood pool:1.15), blood splatter on ground,
casualty, defeated, gore,
outdoor, training ground, dirt ground, wooden fence, wooden dummies, weapon rack, wooden posts,
afternoon, (dusk:1.05), harsh sunlight, (hard shadow:1.15), (dramatic lighting:1.1), strong contrast,
full body, wide shot, (from below:1.1), low angle, dutch angle,
```

**[负面]**

```
(worst quality, low quality:1.4), bad anatomy, extra fingers, fused fingers, missing fingers,
deformed, disfigured, malformed limbs, mutated, bad proportions, extra arms, extra legs,
text, watermark, signature, username, logo, border, frame, censored, mosaic censoring,
screaming, roaring, open mouth, tongue out, ahegao,
cute, kawaii, chibi, smiling, laughing, happy, gentle expression, soft expression,
soft lighting, pastel color, bloom, dreamy, romantic,
katana, rapier, thin blade, dagger, knife, longsword,
full body scales, dragon girl, monster girl, reptile, scaly skin,
blonde hair, red hair, silver hair, white hair, blue eyes, red eyes,
human ears, missing horns,
```

**[参数]** 1216×832（横构图，容纳多人）· steps 27 · CFG 6 · euler_ancestral · CLIP -2

> 这一场的构图逻辑：**她是唯一的站立者，其余全是倒地的**。`1girl, solo focus` 保证主体，`multiple boys, dead bodies, corpses` 提供尸横遍野的背景，`from below` 让镜头仰起来看她劈下的那一刻。

---

## 二、场景 B · 兽人营地 · 突进横斩（动态版）

**剧情位置**：真源 L127 分支 1——开启龙血化强势击溃千夫长克罗格与营地守军。单挑千夫长本不必开龙血化，是为尽快救出伊丝娜并应对成群精锐围攻才开的。

**与场景 A 的差异**：A 是**站定下劈**（静态压迫，`overhead swing` + `from below`），B 是**冲刺横斩**（动态贯穿，`lunging` + `horizontal slash` + `from side`）。两场不能都用"站立挥剑"，否则并排看像同一张。

**[正面]**

```
masterpiece, best quality, very aesthetic, absurdres, newest,
1girl, solo focus, adult, mature female, tall female, voluptuous,
(black hair:1.2), long hair, straight hair, very long hair, blunt bangs, (hair blowing:1.15), (wind:1.1),
amber eyes, (amber eyes:1.15), slit pupils, (vertical pupils:1.1), sharp eyes,
pale skin, (pale skin:1.05), sweat on face,
horns, dragon horns, (black horns:1.2), curved horns, swept back horns, temple horns, (horns with red tips:1.15), (red glow on horn tips:1.1), (glowing horns:1.05),
serious, (angry:1.15), furious, cold fury, (glaring:1.15), intense gaze,
frown, narrowed eyes, clenched teeth, (clenched jaw:1.1),
(dragon scales:1.15), black scales, scales on forearm, scales on thigh, (black scales on arms:1.15), (scales on thighs:1.15),
black dress, (long dress:1.15), (high collar:1.2), (covered chest:1.15), long sleeves,
gold trim, gold embroidery, (side slit:1.2), (high slit:1.15), bare thighs,
armoured dress, chainmail underlayer, (corset:1.15), waist armor, (single pauldron:1.15), bracers,
(thigh boots:1.25), (over-knee boots:1.2), leather boots,
(battle damage:1.15), torn dress, (dirty:1.1),
greatsword, two-handed sword, (broad blade:1.15), thick blade, crossguard, holding greatsword,
(lunging:1.2), (dashing forward:1.15), charging, running forward, (low stance:1.15), leaning forward, (weight forward:1.1),
(horizontal slash:1.25), (wide swing:1.2), (mid-swing:1.15), arm extended, (two hands on sword:1.1), (dynamic pose:1.2),
(motion blur:1.15), (speed lines:1.2), afterimage, (action lines:1.1), impact, (shockwave:1.05), (wind pressure:1.05),
(blood on sword:1.25), (blood dripping:1.2), (blood spray:1.2), (blood arc:1.15), blood trail, (blood spatter:1.2), (blood on face:1.15),
orc, monster, green skin, (green skin:1.3), muscular male, tall male, huge muscles, tusks, sharp teeth,
(sent flying:1.15), flying, (mid-air:1.15), falling backward, (knocked back:1.1), arms flailing,
dead orc, (dead body:1.1), corpses, (lying on ground:1.1), severed arm,
(dust cloud:1.15), (debris:1.1), (dirt flying:1.15), smoke, embers,
orc camp, (fortress:1.1), palisade, wooden stakes, tent, animal skin, banners, skulls, bonfire, (torch light:1.15),
harsh shadow, dim lighting, (chiaroscuro:1.15), rim light, (dramatic lighting:1.15), strong contrast,
full body, (from side:1.15), (dutch angle:1.1), (dynamic angle:1.2), wide shot,
```

**[负面]**

```
(worst quality, low quality:1.4), bad anatomy, extra fingers, fused fingers, missing fingers,
deformed, disfigured, malformed limbs, mutated, bad proportions, extra arms, extra legs,
text, watermark, signature, username, logo, border, frame, censored, mosaic censoring,
screaming, roaring, open mouth, ahegao, tongue out,
cute, kawaii, chibi, smiling, laughing, happy, gentle expression,
soft lighting, pastel color, bloom, dreamy, romantic,
katana, rapier, thin blade, dagger, longsword,
full body scales, dragon girl, monster girl, reptile, scaly skin,
blonde hair, red hair, silver hair, white hair, blue eyes, red eyes,
human ears, missing horns,
grey skin, brown skin, blue skin, purple skin,
human, elf, humanoid, bishounen, feminine, cute orc,
```

**[参数]** 1216×832（横构图）· steps 28 · CFG 6.5 · euler_ancestral · CLIP -2

> **这一场的动态语言**：
> - **位移**：`lunging` + `dashing forward` + `running forward` + `low stance` —— 她是冲进去的，不是站着的
> - **刀路**：`(horizontal slash:1.25)` 横向扫过身体，与 A 的 `overhead swing` 纵向下劈成直角
> - **受力**：`(sent flying:1.15)` + `(knocked back:1.1)` + `arms flailing` —— 兽人是被**打飞**的，不是倒在地上的
> - **痕迹**：`(motion blur:1.15)` + `(speed lines:1.2)` + `afterimage` + `(dust cloud:1.15)` —— 让画面"带着速度"
> - **镜头**：`(from side:1.15)` + `(dynamic angle:1.2)`，**不用 `from below`**（那是 A 的语言）
>
> A 与 B 的差异不在环境，在**动作语法**：A 是压迫，B 是贯穿。两场的表情组与鳞片组必须逐字一致，只有动作与镜头可以反向。

> **可选变体 · 腾空下劈**（若横斩动态仍不够）：把动作组换成
> ```
> (jumping:1.2), (airborne:1.15), mid-air, knees bent, (overhead slash:1.2),
> two-handed swing, sword above head, descending, (falling:1.05),
> (ground crack:1.05), (shockwave:1.15), (dust burst:1.15),
> ```
> 镜头改 `from below, low angle`，下方兽人 `looking up, cowering`。

---

## 二·补、场景 C · 终局立绘（龙化常态 · 冰冷）

**分级**：`sensitive` ｜ **镜头**：`full body` + `from front` + `(slight angle)`
**对应状态**：`stage 3 · 沦陷`｜真源 L133「龙化形态成为常态」
**定位**：立绘式差分。不是战斗场面，是"她变成这个样子了"的一张。

### C.1 与场景 A / B 的差异

| 项 | 场景 A / B | 场景 C 终局 |
|---|---|---|
| 鳞片 | 小臂 + 大腿少许 | **同左，权重不变** |
| 角尖 | 红色 | **同左，权重 +0.05 更亮** |
| 龙尾 | **无**（负面压 `dragon tail`） | **`(dragon tail:1.3)` 黑色粗尾** |
| 手 | 人形手，握剑 | **`(dragon claws:1.3)` 十指成爪** |
| 表情 | 严肃带愤怒 | **冰冷冷漠，一点火气都没有** |
| 动作 | 挥斩 / 突进 | **静止站立** |
| 构图 | 横构图 + 尸体 | **竖构图全身立绘** |

### C.2 完整正面（主图 · 直接粘贴）

```
masterpiece, best quality, very aesthetic, absurdres, newest, sensitive,
1girl, solo, adult, mature female, tall female, voluptuous,
(black hair:1.2), long hair, straight hair, very long hair, blunt bangs, (hair floating:1.1),
amber eyes, (amber eyes:1.15), slit pupils, (vertical pupils:1.15), sharp eyes,
(cold eyes:1.2), (piercing gaze:1.15), (cold stare:1.15),
cold expression, (emotionless:1.2), expressionless, deadpan, (aloof:1.1), (detached:1.1),
pale skin, (pale skin:1.05),
horns, dragon horns, (black horns:1.25), (solid black horns:1.15), curved horns, swept back horns, temple horns,
(horns with red tips:1.15), (red glow on horn tips:1.15), (glowing horns:1.1),
(dragon scales:1.2), black scales, scales on forearm, scales on thigh,
(black scales on arms:1.15), (scales on thighs:1.15), (scales on hands:1.15),
(dragon claws:1.3), (clawed hands:1.25), (sharp claws:1.2), (black claws:1.2), (scaled hands:1.2),
(clawed fingers:1.2), (long nails:1.1), (black nails:1.2),
(dragon tail:1.3), (black dragon tail:1.25), thick tail, (scaled tail:1.15), (tail with spikes:1.1), (tail swaying:1.1),
black dress, (long dress:1.15), (high collar:1.2), (covered chest:1.15), (modest neckline:1.1), long sleeves,
gold trim, gold embroidery, (side slit:1.2), (high slit:1.15), bare thighs,
armoured dress, chainmail underlayer, (corset:1.15), waist armor, (single pauldron:1.15), bracers,
(thigh boots:1.25), (over-knee boots:1.2), leather boots,
greatsword, two-handed sword, (broad blade:1.15), thick blade, crossguard,
(holding sword:1.05), (sword point down:1.1), hand on sword,
standing, standing still, (contrapposto:1.05), (arms at sides:1.05),
simple background, (dark background:1.1), (vignette:1.1), (rim light:1.15),
(hard shadow:1.1), (cold light:1.05), (depth of field:1.1),
full body, from front, (slight angle:1.05), (tail visible:1.1),
```

### C.3 负面

```
(worst quality, low quality:1.4), bad anatomy, extra fingers, fused fingers, missing fingers,
deformed, disfigured, malformed limbs, mutated, extra arms, extra legs, extra tail, two tails,
text, watermark, signature, censored, mosaic censoring,
angry, furious, (glaring:1.2), screaming, roaring, open mouth, clenched teeth, clenched jaw,
smile, smirk, evil smile, smug, laughing, ahegao, tongue out, seductive,
cute, kawaii, chibi, gentle expression, soft expression, blush,
soft lighting, pastel color, bloom, dreamy, romantic,
full body scales, dragon girl, monster girl, reptile, scaly skin,
katana, rapier, thin blade, dagger, longsword,
blonde hair, red hair, silver hair, white hair, blue eyes, red eyes,
human ears, missing horns, human hands, normal hands,
blurry tail, (cowboy shot:1.1), cropped legs, out of frame,
```

> 三组关键：
> - **压愤怒**：`angry, furious, (glaring:1.2), clenched teeth, clenched jaw` —— 终局不怒。
> - **压人形手**：`human hands, normal hands` —— 爪子是本场景的形态标记，压掉手部人形化。
> - **压裁切**：`(cowboy shot:1.1), cropped legs, out of frame` —— 尾巴需要全身构图，不能裁腿。
>
> ⚠️ **原负面总表里的 `dragon tail, tail` 必须在此场景删掉**，否则尾巴画不出来。

### C.4 参数

| 参数 | 值 |
|---|---|
| 分辨率 | **832×1216**（竖构图全身，尾巴与长裙同时进画） |
| Steps | 27 |
| CFG | 6.2 |
| Sampler | euler_ancestral |
| CLIP Set Last Layer | -2 |

### C.5 三个可选变体

**变体 A · 侧身回望**（尾巴展开最完整）

```
full body, from side, (looking back:1.15), (over shoulder:1.1),
(tail curled behind:1.2), (tail tip:1.1),
```

**变体 B · 爪部特写**（最直接的形态证据）

```
close-up, (hand focus:1.2), (dragon claws:1.35), (clawed hands:1.3), (sharp claws:1.25),
(black claws:1.25), (scales on hands:1.2), (claw marks:1.05),
black dress, gold trim, (side slit:1.2),
(dark background:1.15), (rim light:1.15), (cold light:1.1),
```

**变体 C · 废墟王座**（把"沦陷"写进环境）

```
indoor, (ruined hall:1.15), (broken throne:1.15), (stone pillars:1.1), (rubble:1.1),
(broken banners:1.05), (cold light:1.1), (dust motes:1.05),
sitting, on throne, (crossed legs:1.1), (hand on armrest:1.1), (dragon claws:1.3),
(dragon tail:1.3), (tail curled around throne:1.15),
```

### C.6 排错速查

| 症状 | 原因 | 修法 |
|---|---|---|
| 尾巴没长出来 | 负面里 `dragon tail` 没删 | 本场景负面**必须删掉** `dragon tail, tail`，正面 `(dragon tail:1.3)` |
| 尾巴被裁掉 | 构图太近 | `full body, (tail visible:1.1)`，负面压 `cowboy shot, cropped legs, out of frame` |
| 手画成人手 | 缺爪组 | `(dragon claws:1.3), (clawed hands:1.25), (black claws:1.2)`，负面压 `human hands, normal hands` |
| 长出两条尾巴 | `extra tail` 未压 | 负面保留 `extra tail, two tails` |
| 表情还是愤怒 | 前两张惯性 | 负面必压 `angry, furious, (glaring:1.2), clenched teeth, clenched jaw` |
| 表情像在笑 | 混进 `smirk` | 负面压 `smile, smirk, evil smile, smug, laughing` |
| 鳞片铺满全身 | 巴黎重度档 | 删 `full body scales`，负面压 `full body scales, dragon girl, reptile` |
| 角尖不红 | tag 表达不足 | `(red glow on horn tips:1.15)` + 自然语言补句（C.7） |
| 气质太"人" | 缺非人组 | `(inhuman:1.1), (monstrous beauty:1.05), (cold stare:1.15)` |

### C.7 自然语言补句（Animagine 4.0）

```
She stands perfectly still in the ruined hall, a black-scaled tail as thick as a
man's arm curling out from behind her skirt and dragging across the stone floor,
the fingers of both hands ended in long black claws, the tips of her swept-back
horns burning a dull red; her amber eyes hold no anger at all — only a cold,
level stare that does not quite see the viewer as a person.
```

三个必须写进句子的点：

| 片段 | 解决什么 |
|---|---|
| `a black-scaled tail as thick as a man's arm curling out from behind her skirt` | 尾巴的**粗细、位置、与裙子的关系**，一句话交代 |
| `the fingers of both hands ended in long black claws` | 龙爪的准确形态：手指末端成爪、黑色、长 |
| `her amber eyes hold no anger at all — only a cold, level stare` | **"冷而不是怒"**，这句比任何 tag 都清楚 |

---

## 三、负面总表

**通用底噪**

```
(worst quality, low quality:1.4), normal quality, lowres, jpeg artifacts, blurry, out of focus,
bad anatomy, bad hands, extra fingers, missing fingers, fused fingers, extra limbs, extra arms, extra legs,
deformed, disfigured, malformed limbs, mutated, bad proportions, ugly,
text, watermark, signature, username, logo, border, frame,
censored, mosaic censoring, bar censor, pixelated,
```

**古兰专属**

```
blonde hair, red hair, silver hair, white hair, blue eyes, red eyes, green eyes,
human ears, missing horns, small horns, straight horns, halo,
cute, kawaii, chibi, smiling, laughing, happy, gentle expression, soft expression,
screaming, roaring, open mouth, tongue out, ahegao, seductive,
katana, rapier, thin blade, dagger, knife, longsword, short sword,
full body scales, dragon girl, monster girl, reptile, scaly skin, dragon tail, tail,
```

**服装专属**（画常规立绘与两场斩杀戏都要压）

```
cleavage, exposed chest, low cut, revealing chest, bare shoulders, off shoulder, strapless,
knee boots, ankle boots, short boots, sandals, high heels, stiletto heels,
```

> `cleavage, exposed chest, low cut` 是「不漏胸口」的护栏；`knee boots, ankle boots, short boots` 是「过膝长筒靴」的护栏。这两组不压，模型会把高领开成低胸、把长靴画成半靴。

**常规立绘额外压**（仅画日常立绘时使用，龙血化场景不要加）

```
red horns, glowing horns, glowing horn tips, scales on face, scales on neck,
```

**场景 A 追加**（演武场）

```
soft lighting, pastel color, bloom, dreamy, romantic,
night, indoor, church, bedroom, throne room,
```

**场景 B 追加**（兽人营地）

```
grey skin, brown skin, blue skin, purple skin, human, elf, humanoid, bishounen, feminine,
soft lighting, pastel color, daylight, bright,
```

> `full body scales, dragon girl, monster girl, reptile` 这三条是轻度档的护栏，全场景必压。压掉之后，鳞片只会留在小臂和大腿。

---

## 四、采样参数

| 参数 | Animagine XL 4.0 |
|---|---|
| CLIP Set Last Layer | **-2** |
| Steps | 27 ~ 28 |
| CFG | 6.0 ~ 6.5 |
| Sampler | euler_ancestral |
| Scheduler | normal |
| 分辨率 | 横构图斩杀 **1216×832**；单人特写 **832×1216**；双人同框 **896×1152** |

两张图建议**同一 seed 家族**：先出场景 A 定下角与鳞片的形态，再用同一 seed 微调出场景 B，只换环境与对手。这样两个场景看起来是同一时刻的同一形态。

---

## 五、Animagine 4.0 自然语言补句

### 5.1 用于场景 A（演武场）

```
A tall woman in a black high-collared dress with gold trim stands alone in the
training yard, her greatsword already coming down through the air, both forearms
and the exposed strip of her thigh covered in a thin growth of black scales that
catch the afternoon light; the tips of her swept-back black horns glow a dull red,
her amber eyes narrowed, jaw clenched, cheeks flushed red from the drug still
burning in her blood while a dozen bodies lie broken and bleeding across the dirt.
```

### 5.2 用于场景 B（兽人营地 · 突进横斩）

```
She drives forward through the orc camp in a low lunge, her broad greatsword
sweeping horizontally across her body, a wide arc of blood tracing the blade as
the nearest orc is knocked off its feet and sent flying backward into the palisade;
black scales creep along her forearms and the exposed slit of her thigh, the horn
tips above her temples burning red in the torchlight, dust and embers whipping
past her stride.
```

三个必须写进句子的点：

| 片段 | 解决什么 |
|---|---|
| `both forearms and the exposed strip of her thigh covered in a thin growth of black scales` | 「少许鳞片」的准确定义：小臂 + 大腿高叉那块，且强调 "thin growth"（薄薄一层），避免画成全身 |
| `the tips of her swept-back black horns glow a dull red` | 角尖的红只能靠句子讲清楚，单靠 tag 容易丢 |
| `amber eyes narrowed, jaw clenched, cheeks flushed red` | 严肃带愤怒 + 药效潮红，把表情与剧情证据一次给全 |

---

## 六、排错速查

| 症状 | 原因 | 修法 |
|---|---|---|
| 角长在头顶 | 缺位置限定 | 加 `temple horns, horns on sides of head`，负面压 `halo` |
| 角是直的 / 像牛角 | 缺走向 | `curved horns, swept back horns`，权重 1.2 |
| 角尖的红画不出来 | tag 表达力不足 | 用第五节自然语言补句；或用 `red veins on horns` 再加 `glowing horn tips`；最后手段是后期叠色 |
| 鳞片画满全身 / 变成龙娘 | 轻度档被重度档污染 | 删掉 `full body scales`，负面压 `full body scales, dragon girl, monster girl, reptile, scaly skin` |
| 大腿鳞片看不见 | 缺高叉 | `(side slit:1.2), (high slit:1.15), bare thighs` 必须成对，负面压 `pants, trousers, covered legs` |
| 小臂鳞片被袖子盖住 | 长袖没破 | `torn dress, battle damage`，或 `long sleeves, torn sleeve` |
| 剑画成细刀 | 只写了 `sword` | `greatsword, (broad blade:1.15), thick blade`，负面压 `katana, rapier, thin blade` |
| 表情太温柔 / 太甜 | 缺愤怒组 | `(angry:1.15), glaring, frown, narrowed eyes, clenched jaw` |
| 表情变成咆哮 | 写了 `open mouth` | 删掉，`clenched jaw` + `glaring` 即可 |
| 看不出刚杀过人 | 缺血 | `(blood on sword:1.2), blood on blade, (blood spatter:1.15), blood on ground` |
| 画面太亮太甜 | 柔光残留 | 删 `soft lighting`，换 `harsh shadow, chiaroscuro, strong contrast` |
| 黑发画成银白 | 黑龙先验干扰 | `(black hair:1.2)`，负面压 `silver hair, white hair, blonde hair` |
| 演武场没有药效痕迹 | 缺潮红 | `(flushed face:1.15), red cheeks, sweat on face` |
| 两张图不像同一形态 | 各自微调了鳞片组 | 两场景的 `dragon scales / horns` 组必须逐字一致 |

---

## 七、与真源的边界

| 项 | 真源写法 | 本包处理 |
|---|---|---|
| 龙鳞范围 | L34「全身浮现**致密**龙鳞」 | 默认按主人指定的**少量**（小臂 + 大腿）；重度档见 0.4 节 |
| 龙尾 | L34「平日无龙尾、无显性鳞片」 | **场景 A/B 不画龙尾**（负面压 `dragon tail`）；**场景 C 终局可长尾**——依 L133「stage 3 龙化形态成为常态」 |
| 角 | L47「太阳穴两侧一对对称后弯乌黑龙角」 | 严格按此，角尖红色为龙血化的额外视觉标记 |
| 斗篷 / 披风 | 无 | 不加 |
| 服装 | L35「黑底金边长裙内衬轻便软甲」 | `black dress, gold trim, chainmail underlayer` + 高领包裹、过膝长筒靴、单侧肩甲、束腰腰甲（按主人立绘补齐） |
| 领口 | 无明确记载 | **严实包裹、不露胸口**（主人 11-12 指定）；负面压 `cleavage, exposed chest, low cut` |
| 鞋靴 | 原仅记「方便迈步出剑」 | **黑色过膝长筒靴**（主人 11-12 指定）；负面压 `knee boots, ankle boots, short boots` |
| 角尖 | L47「乌黑龙角，黑曜石光泽」 | **常态纯黑**；红尖只属龙血化档位 |
| 武器 | L35「阔刃双手精钢重剑」 | `greatsword, (broad blade:1.15)` |

> 若主人后续确认要走"致密鳞片"路线，把 0.3 节的鳞片组整段换成重度档，并把负面里的 `full body scales, dragon girl` 删掉即可，其余不用动。

---

*包 v1.2 · 2026-11-12 03:35 · 场景 B 改突进横斩动态版；基础人设按主人立绘修正（过膝长筒靴 / 高领不露胸 / 鳞片与红角归入龙血化）*
