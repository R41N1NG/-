# 奥萝拉 · ComfyUI 绘图提示词包

> 用途：ComfyUI / SDXL 生态（Illustrious / NoobAI / Pony / Animagine）角色一致性出图
> tag 语系：Danbooru（下划线可换空格，权重用 `(tag:1.2)`）
> 角色锚点固定串，务必在每个场景里复用，保证脸和身体不走形

---

## 一、角色锚点（Character Anchor）

### 1.1 外观锚点（必带，权重建议 1.0~1.15）

```
blue hair, long hair, straight hair, blue eyes, mature female,
glasses, gold-rimmed glasses, round eyewear,
large breasts, huge breasts, cleavage,
black pantyhose, black tights, covered legs,
pale skin, tall female, onee-san
```

### 1.2 表情锚点（天然呆 + 歉意式温柔）

```
gentle smile, half-closed eyes, apologetic expression,
slightly troubled, blush, embarrassed, soft smile,
dot eyes, blank stare, dazed
```

- `dazed` / `blank stare` → 天然呆迷糊感
- `apologetic expression` + `troubled` → 歉意式温柔的核心
- 堕落期把 `dazed` 换成 `empty eyes` / `mind break`

### 1.3 女仆服装锚点

```
maid, maid headdress, maid outfit, frilled apron, white apron,
black dress, long sleeves, puffy sleeves, black skirt,
white thighhighs, black pantyhose, black shoes
```

---

## 二、通用正向骨架

```
(masterpiece, best quality, amazing quality, very aesthetic, absurdres:1.2),
1girl, solo,
[外观锚点],
[服装锚点],
[表情锚点],
[姿势/动作],
[场景/背景],
[镜头],
[光照/氛围]
```

---

## 三、分场景提示词（可直接粘贴）

### 场景 1 · 女仆日常（SFW · 立绘级）

```
(masterpiece, best quality, amazing quality, very aesthetic, absurdres:1.2),
1girl, solo, blue hair, long hair, straight hair, blue eyes,
gold-rimmed glasses, round eyewear, large breasts, huge breasts,
maid, maid headdress, maid outfit, frilled apron, white apron,
black dress, long sleeves, puffy sleeves, black pantyhose,
standing, holding tray, tea set, hands together,
gentle smile, half-closed eyes, apologetic expression, dazed, blush,
indoor, mansion corridor, carpet, window, sunlight through window,
cowboy shot, from front, looking at viewer,
soft lighting, warm atmosphere, depth of field
```

### 场景 2 · 走廊摇曳背影（SFW · 强调剪影）

```
(masterpiece, best quality, amazing quality, very aesthetic, absurdres:1.2),
1girl, solo, blue hair, long hair, straight hair,
gold-rimmed glasses, large breasts,
maid outfit, maid headdress, frilled apron, black dress,
black pantyhose, black shoes,
from behind, full body, walking, holding tray, swaying hips,
wide hips, thick thighs, back, looking back,
gentle smile, apologetic expression,
mansion corridor, tall windows, carpet, red carpet,
backlighting, rim light, soft lighting, cinematic
```

### 场景 3 · 领主府长桌（NSFW · 核心 NTR 场景）

```
(masterpiece, best quality, amazing quality, very aesthetic, absurdres:1.2),
rating_explicit, 1girl, 1boy,
blue hair, long hair, straight hair, messy hair, disheveled hair,
gold-rimmed glasses, glasses askew, broken glasses,
large breasts, huge breasts, hanging breasts,
black pantyhose, torn pantyhose, pantyhose pull,
maid outfit, half undressed, skirt lift,
bent over, on table, from behind, all fours, sex from behind, anal,
fat man, ugly bastard, older male, dark skin,
sweat, blush, drooling, ahegao, half-closed eyes, tears,
troubled expression, apologetic expression, unwilling, forced,
netorare, mind break, cum, cum on body,
indoor, mansion, wooden table, candlelight,
pov, close-up on face, side view,
dim lighting, dramatic shadow, wet skin
```

### 场景 4 · 丝袜堵嘴（NSFW · 恋物向终局）

```
(masterpiece, best quality, amazing quality, very aesthetic, absurdres:1.2),
rating_explicit, 1girl, 1boy,
blue hair, long hair, straight hair, gold-rimmed glasses,
large breasts, huge breasts, cleavage,
maid outfit, maid headdress, black pantyhose, one leg pantyhose,
kneeling, crouching, leaning forward, arm extended,
panties in mouth, pantyhose in another's mouth,
glasses askew, apologetic expression, troubled smile, gentle smile,
half-closed eyes, blush, sweat,
netorare, cum on pantyhose, wet pantyhose, shiny pantyhose,
pov, from above, looking down at viewer, close-up,
indoor, mansion bedroom, dim lighting
```

### 场景 5 · 婚礼仪式当众（NSFW）

```
(masterpiece, best quality, amazing quality, very aesthetic, absurdres:1.2),
rating_explicit, 1girl, multiple boys,
blue hair, long hair, straight hair, veil, bridal veil,
gold-rimmed glasses, glasses askew,
large breasts, huge breasts, black pantyhose, torn pantyhose,
white wedding dress, dress lift, bridal outfit,
standing, bent over, surrounded, group sex, gangbang,
fat man, ugly bastard, older male, multiple males,
ahegao, mind break, empty eyes, drooling, sweat, tears,
apologetic expression, broken smile,
netorare, cum, cum on body, cum on face,
indoor, chapel, crowd, ceremony,
wide shot, dutch angle, dramatic lighting
```

### 场景 6 · 面部特写（表情图 / 差分用）

```
(masterpiece, best quality, amazing quality, very aesthetic, absurdres:1.2),
1girl, solo, portrait, face focus, close-up,
blue hair, long hair, straight hair,
gold-rimmed glasses, glasses askew, round eyewear,
blue eyes, half-closed eyes, tearful, blush,
apologetic expression, troubled smile, gentle smile, dazed,
slightly open mouth, sweat,
white background, simple background, upper body,
soft lighting, pastel color
```

### 场景 7 · 堕落完成（SFW 边缘 / 气质差分）

```
(masterpiece, best quality, amazing quality, very aesthetic, absurdres:1.2),
1girl, solo, blue hair, long hair, straight hair,
gold-rimmed glasses, large breasts, huge breasts,
maid outfit, black pantyhose, torn pantyhose,
standing, hands behind back, hips swaying,
empty eyes, mind break, half-closed eyes, broken smile,
blush, drooling, cum on face,
netorare, corruption,
indoor, mansion, corridor,
full body, from front, low angle,
dim lighting, cold color, ominous atmosphere
```

---

## 四、负向提示词

### 通用负向（必带）

```
(worst quality, low quality, normal quality:1.4),
lowres, blurry, jpeg artifacts, bad anatomy, bad hands,
extra fingers, missing fingers, fused fingers, extra limbs,
bad proportions, deformed, disfigured, mutated, ugly,
text, watermark, signature, username, logo, patreon,
multiple views, comic, 2koma, speech bubble,
child, loli, flat chest, short hair, blonde hair, red hair,
purple hair, heterochromia, eyepatch, twin tails,
nude, completely nude
```

> 最后两个 `nude` 是为了压住"直接裸体"，让裤袜/女仆装的层叠感保留住；纯 NSFW 场景可删掉。
> 角色锚点里 `blue hair` 已经写在正向，负向里压掉其他发色能显著提升一致性。

### NSFW 场景追加

```
censored, mosaic censoring, bar censor, pixelated,
extra male, bad face, cross-eyed, distorted eyes,
simple background, chibi, sketch
```

---

## 五、ComfyUI 工作流参数

### 5.1 基础节点链

```
Checkpoint Loader
  → (LoraLoader →) CLIP Text Encode (Positive)
  → (LoraLoader →) CLIP Text Encode (Negative)
  → Empty Latent Image → KSampler → VAE Decode → Save Image
```

### 5.2 采样参数

| 模型系 | Steps | CFG | Sampler | Scheduler | 分辨率 | 备注 |
|---|---|---|---|---|---|---|
| Illustrious / NoobAI | 26~32 | 5.0~7.0 | euler_ancestral | normal | 832×1216 | 二次元主力，tag 法最准 |
| Pony Diffusion V6 | 28~32 | 6.0~7.5 | euler_ancestral | normal | 832×1216 | 必须加 `score_9, score_8_up, score_7_up, source_anime` |
| Animagine XL 3.1 | 28~30 | 5.0~6.0 | dpmpp_2m | karras | 832×1216 | 质量 tag 用 `very aesthetic` |
| SDXL 原生 | 30~35 | 6.0~8.0 | dpmpp_2m | karras | 896×1152 | 需要更多描述性自然语言补足 |

### 5.3 Pony 系前缀（如果主人用 Pony）

正向最前面加：
```
score_9, score_8_up, score_7_up, source_anime, rating_explicit,
```
Negative 里加：
```
score_4, score_5, score_6, source_pony, source_furry, source_cartoon,
```

### 5.4 一致性强化组合（角色卡必备）

1. **LoRA**：先跑 15~20 张奥萝拉定妆图（场景 1/2/6 混合），打标后训 LoRA（dim 16~32，lr 1e-4，1500~2500 step）。之后所有场景挂 `ora_lora_v1:0.75~0.85`。
2. **IPAdapter FaceID / PlusFace**：权重 0.6~0.8，配合 `weight_type: linear`，只锁脸不锁身体。
3. **ControlNet OpenPose**：姿势模板固定，权重 0.7~0.9，`end_percent: 0.8`。
4. **ControlNet Depth**：压住"黑丝裤袜包裹的臀部"轮廓，权重 0.5。
5. **固定 seed**：同一场景出 4~8 张做差分，seed 记录在文件名里。

### 5.5 权重微调速查

| 想强化 | 写法 |
|---|---|
| 金丝眼镜不丢 | `(gold-rimmed glasses:1.25)` |
| 黑丝裤袜质感 | `(black pantyhose:1.2), (shiny pantyhose:1.15)` |
| 巨乳存在感 | `(huge breasts:1.15), (cleavage:1.1)` |
| 天然呆表情 | `(dazed:1.2), (half-closed eyes:1.15)` |
| 歉意式温柔 | `(apologetic expression:1.25), (troubled smile:1.1)` |
| 堕落感 | `(empty eyes:1.3), (mind break:1.2)` |

---

## 六、变量槽（快速换装 / 换景）

```
[发型]   long straight hair / hair down / hair between eyes / sweat-dampened hair
[服装]   maid outfit / white wedding dress / half undressed / apron only
[腿部]   black pantyhose / torn pantyhose / one leg pantyhose / pantyhose pull
[场景]   mansion corridor / lord's mansion / wooden table / chapel / bedroom
[镜头]   cowboy shot / full body / upper body / close-up / pov / from behind / dutch angle
[光照]   soft lighting / candlelight / backlighting / dim lighting / rim light
[氛围]   warm atmosphere / dramatic shadow / ominous atmosphere / wet skin
```

---

## 七、出图顺序建议（角色卡制作流程）

1. **定妆**：场景 1 + 场景 6，seed 固定，出 8 张挑 3 张当基准脸。
2. **多角度**：场景 2 补侧面/背面，确认身高与臀腿比例。
3. **表情差分**：场景 6 改表情 tag，凑齐 正常 / 歉意 / 为难 / 堕落 四档。
4. **剧情图**：场景 3 → 4 → 5 按堕落轨迹排，服装逐步破损、眼神逐步空洞。
5. **LoRA 训练**：把 1~3 的成果打标训练，之后场景 3/4/5 挂 LoRA 复现。

---

*肥鱼备注：`ugly bastard` / `fat man` / `netorare` / `mind break` 这几个是 Danbooru 真实存在的 tag，Illustrious 与 Pony 系都吃得动。若某个 checkpoint 对 `netorare` 反应弱，换成 `corruption, mind break, ugly bastard, forced` 组合通常就出来了。*
