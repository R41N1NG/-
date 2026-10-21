# 尾行 · JK 服装图清单（GPT 生成用 · 完整版）

共 **185 张**：头饰 24 · 上装 126 · 下装 12 · 袜子 15 · 鞋子 8

---

## 0. 一致性协议（最重要，先读）

之前生成出来「不是一个人」，是因为模型每次都从头编一个人。按下面四条走，能压住九成漂移：

1. **先出锚点，再出图**：先生成第 2 节的锚点（4 张全身 + 6 张上装），挑最顺眼的当参考图；
2. **每张图都把锚点图作为参考图上传**，并附一句：
   > Same character as the reference image. Keep the same height, shoulder width, waistline, skin tone and hair length. Only change the garment and the framing. Do not redesign the person.
3. **同一变体连着做**：一个「发型 × 体型」列做完，再换下一列；不要来回跳；
4. **每张都逐字带上锚点句与负面词**，不要改写、不要精简。

> 提示词里没有写 B/D/E 杯，只写体态（small / fuller / full bust）。杯型是内部口径，写进 prompt 容易被审核打回，也容易画成夸张比例。

---

## 1. 锚点定义

### 发型（影响头饰）

| key | 中文 | 英文锚点 |
| :--- | :--- | :--- |
| long | 长发 | long straight black hair falling past the shoulders, straight bangs |
| ponytail | 马尾 | black high ponytail, straight bangs, tail falling behind the head |
| twintails | 双马尾 | black twintails tied high on both sides, straight bangs |
| bob | 短发及颈 | black chin-length bob, straight bangs, hair ends at the jawline |

### 体型（只影响上装）

| key | 中文 | 英文锚点 |
| :--- | :--- | :--- |
| slim | 清瘦（约 B） | slender frame, small bust, narrow shoulders and hips |
| normal | 匀称（约 D） | balanced figure, fuller bust, defined waist, soft hip curve |
| full | 丰腴（约 E） | full figure, full bust, rounded hips, soft waistline |

---

## 2. 第一步：4 张全身锚点（先把人定下来）

> 背身 3/4，不露脸；背景与光线固定。生成后挑一张当全系列的参考图。

### 锚点 1 · 长发（`anchor_long`）

**file** · `assets/wardrobe/jk/anchors/long.png` · 1024x1536

```text
full body character reference, standing three-quarter back view, face turned away and not visible, East Asian young woman, 160 cm, balanced figure, fuller bust, defined waist, soft hip curve, long straight black hair falling past the shoulders, straight bangs, light warm skin tone, wearing navy school blazer over white shirt, navy pleated miniskirt, black knee-high socks, black leather loafers, plain light-grey seamless backdrop, soft even studio light, anime fashion illustration, clean lineart, soft cel shading, whole figure head to shoes, centered, no props, no text, no logo
```

负面：`face, eyes, nose, mouth, portrait, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

### 锚点 2 · 马尾（`anchor_ponytail`）

**file** · `assets/wardrobe/jk/anchors/ponytail.png` · 1024x1536

```text
full body character reference, standing three-quarter back view, face turned away and not visible, East Asian young woman, 160 cm, balanced figure, fuller bust, defined waist, soft hip curve, black high ponytail, straight bangs, tail falling behind the head, light warm skin tone, wearing navy school blazer over white shirt, navy pleated miniskirt, black knee-high socks, black leather loafers, plain light-grey seamless backdrop, soft even studio light, anime fashion illustration, clean lineart, soft cel shading, whole figure head to shoes, centered, no props, no text, no logo
```

负面：`face, eyes, nose, mouth, portrait, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

### 锚点 3 · 双马尾（`anchor_twintails`）

**file** · `assets/wardrobe/jk/anchors/twintails.png` · 1024x1536

```text
full body character reference, standing three-quarter back view, face turned away and not visible, East Asian young woman, 160 cm, balanced figure, fuller bust, defined waist, soft hip curve, black twintails tied high on both sides, straight bangs, light warm skin tone, wearing navy school blazer over white shirt, navy pleated miniskirt, black knee-high socks, black leather loafers, plain light-grey seamless backdrop, soft even studio light, anime fashion illustration, clean lineart, soft cel shading, whole figure head to shoes, centered, no props, no text, no logo
```

负面：`face, eyes, nose, mouth, portrait, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

### 锚点 4 · 短发及颈（`anchor_bob`）

**file** · `assets/wardrobe/jk/anchors/bob.png` · 1024x1536

```text
full body character reference, standing three-quarter back view, face turned away and not visible, East Asian young woman, 160 cm, balanced figure, fuller bust, defined waist, soft hip curve, black chin-length bob, straight bangs, hair ends at the jawline, light warm skin tone, wearing navy school blazer over white shirt, navy pleated miniskirt, black knee-high socks, black leather loafers, plain light-grey seamless backdrop, soft even studio light, anime fashion illustration, clean lineart, soft cel shading, whole figure head to shoes, centered, no props, no text, no logo
```

负面：`face, eyes, nose, mouth, portrait, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

### 上装锚点（3 张，按体型）

> 通用版上装用它：头发裁出画面，只锁躯干与体型。

#### 上装锚点 1 · 清瘦 B（`top_base_slim`）

**file** · `assets/wardrobe/jk/anchors/top_base_slim.png` · 768x1024

```text
upper body character reference, shoulders to hips, back three-quarter view, hair out of frame, East Asian young woman, 160 cm, slender frame, small bust, narrow shoulders and hips, wearing navy single-breasted school blazer over a white shirt, plain light-grey seamless backdrop, soft even studio light, anime fashion illustration, clean lineart, soft cel shading, centered, no props, no text, no logo
```

负面：`face, eyes, nose, mouth, portrait, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 上装锚点 2 · 匀称 D（`top_base_normal`）

**file** · `assets/wardrobe/jk/anchors/top_base_normal.png` · 768x1024

```text
upper body character reference, shoulders to hips, back three-quarter view, hair out of frame, East Asian young woman, 160 cm, balanced figure, fuller bust, defined waist, soft hip curve, wearing navy single-breasted school blazer over a white shirt, plain light-grey seamless backdrop, soft even studio light, anime fashion illustration, clean lineart, soft cel shading, centered, no props, no text, no logo
```

负面：`face, eyes, nose, mouth, portrait, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 上装锚点 3 · 丰腴 E（`top_base_full`）

**file** · `assets/wardrobe/jk/anchors/top_base_full.png` · 768x1024

```text
upper body character reference, shoulders to hips, back three-quarter view, hair out of frame, East Asian young woman, 160 cm, full figure, full bust, rounded hips, soft waistline, wearing navy single-breasted school blazer over a white shirt, plain light-grey seamless backdrop, soft even studio light, anime fashion illustration, clean lineart, soft cel shading, centered, no props, no text, no logo
```

负面：`face, eyes, nose, mouth, portrait, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

### 长发上装锚点（3 张，按体型）

> 长发版上装用它：头发压在肩领上，同时锁体型。

#### 长发上装锚点 1 · 清瘦 B（`top_long_slim`）

**file** · `assets/wardrobe/jk/anchors/top_long_slim.png` · 768x1024

```text
upper body character reference, shoulders to hips, back three-quarter view, long straight black hair falling over the shoulders and collar, straight bangs, East Asian young woman, 160 cm, slender frame, small bust, narrow shoulders and hips, wearing navy single-breasted school blazer over a white shirt, plain light-grey seamless backdrop, soft even studio light, anime fashion illustration, clean lineart, soft cel shading, centered, no props, no text, no logo
```

负面：`face, eyes, nose, mouth, portrait, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 长发上装锚点 2 · 匀称 D（`top_long_normal`）

**file** · `assets/wardrobe/jk/anchors/top_long_normal.png` · 768x1024

```text
upper body character reference, shoulders to hips, back three-quarter view, long straight black hair falling over the shoulders and collar, straight bangs, East Asian young woman, 160 cm, balanced figure, fuller bust, defined waist, soft hip curve, wearing navy single-breasted school blazer over a white shirt, plain light-grey seamless backdrop, soft even studio light, anime fashion illustration, clean lineart, soft cel shading, centered, no props, no text, no logo
```

负面：`face, eyes, nose, mouth, portrait, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 长发上装锚点 3 · 丰腴 E（`top_long_full`）

**file** · `assets/wardrobe/jk/anchors/top_long_full.png` · 768x1024

```text
upper body character reference, shoulders to hips, back three-quarter view, long straight black hair falling over the shoulders and collar, straight bangs, East Asian young woman, 160 cm, full figure, full bust, rounded hips, soft waistline, wearing navy single-breasted school blazer over a white shirt, plain light-grey seamless backdrop, soft even studio light, anime fashion illustration, clean lineart, soft cel shading, centered, no props, no text, no logo
```

负面：`face, eyes, nose, mouth, portrait, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

---

## 3. 逐张清单

---

## 3. 逐张清单

## 3.1 头饰（按发型）

### 发型：长发（`long`）

> 参考图用锚点「长发」那张。

#### 藏青发带（`head_ribbon_navy`）

**[side]** · 512x512

file · `assets/wardrobe/jk/head/hair/long/head_ribbon_navy/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, wearing navy satin ribbon hairband tied at the back of the head, two tail ends falling into the hair, framed from jawline to crown, face out of frame, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x512

file · `assets/wardrobe/jk/head/hair/long/head_ribbon_navy/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, wearing navy satin ribbon hairband tied at the back of the head, two tail ends falling into the hair, back view of head and shoulders, hair and accessory centered, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 格纹发夹（`head_clip_plaid`）

**[side]** · 512x512

file · `assets/wardrobe/jk/head/hair/long/head_clip_plaid/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, wearing small plaid one-piece hairpin fastening the side hair, navy and cream plaid, framed from jawline to crown, face out of frame, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x512

file · `assets/wardrobe/jk/head/hair/long/head_clip_plaid/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, wearing small plaid one-piece hairpin fastening the side hair, navy and cream plaid, back view of head and shoulders, hair and accessory centered, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 白色有线耳机（`head_earphone_wired`）

**[side]** · 512x512

file · `assets/wardrobe/jk/head/hair/long/head_earphone_wired/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, wearing white wired earphones, one earbud at the ear, thin cable falling toward the chest, framed from jawline to crown, face out of frame, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x512

file · `assets/wardrobe/jk/head/hair/long/head_earphone_wired/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, wearing white wired earphones, one earbud at the ear, thin cable falling toward the chest, back view of head and shoulders, hair and accessory centered, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

### 发型：马尾（`ponytail`）

> 参考图用锚点「马尾」那张。

#### 藏青发带（`head_ribbon_navy`）

**[side]** · 512x512

file · `assets/wardrobe/jk/head/hair/ponytail/head_ribbon_navy/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, black high ponytail, straight bangs, tail falling behind the head, wearing navy satin ribbon hairband tied at the back of the head, two tail ends falling into the hair, framed from jawline to crown, face out of frame, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x512

file · `assets/wardrobe/jk/head/hair/ponytail/head_ribbon_navy/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, black high ponytail, straight bangs, tail falling behind the head, wearing navy satin ribbon hairband tied at the back of the head, two tail ends falling into the hair, back view of head and shoulders, hair and accessory centered, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 格纹发夹（`head_clip_plaid`）

**[side]** · 512x512

file · `assets/wardrobe/jk/head/hair/ponytail/head_clip_plaid/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, black high ponytail, straight bangs, tail falling behind the head, wearing small plaid one-piece hairpin fastening the side hair, navy and cream plaid, framed from jawline to crown, face out of frame, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x512

file · `assets/wardrobe/jk/head/hair/ponytail/head_clip_plaid/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, black high ponytail, straight bangs, tail falling behind the head, wearing small plaid one-piece hairpin fastening the side hair, navy and cream plaid, back view of head and shoulders, hair and accessory centered, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 白色有线耳机（`head_earphone_wired`）

**[side]** · 512x512

file · `assets/wardrobe/jk/head/hair/ponytail/head_earphone_wired/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, black high ponytail, straight bangs, tail falling behind the head, wearing white wired earphones, one earbud at the ear, thin cable falling toward the chest, framed from jawline to crown, face out of frame, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x512

file · `assets/wardrobe/jk/head/hair/ponytail/head_earphone_wired/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, black high ponytail, straight bangs, tail falling behind the head, wearing white wired earphones, one earbud at the ear, thin cable falling toward the chest, back view of head and shoulders, hair and accessory centered, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

### 发型：双马尾（`twintails`）

> 参考图用锚点「双马尾」那张。

#### 藏青发带（`head_ribbon_navy`）

**[side]** · 512x512

file · `assets/wardrobe/jk/head/hair/twintails/head_ribbon_navy/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, black twintails tied high on both sides, straight bangs, wearing navy satin ribbon hairband tied at the back of the head, two tail ends falling into the hair, framed from jawline to crown, face out of frame, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x512

file · `assets/wardrobe/jk/head/hair/twintails/head_ribbon_navy/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, black twintails tied high on both sides, straight bangs, wearing navy satin ribbon hairband tied at the back of the head, two tail ends falling into the hair, back view of head and shoulders, hair and accessory centered, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 格纹发夹（`head_clip_plaid`）

**[side]** · 512x512

file · `assets/wardrobe/jk/head/hair/twintails/head_clip_plaid/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, black twintails tied high on both sides, straight bangs, wearing small plaid one-piece hairpin fastening the side hair, navy and cream plaid, framed from jawline to crown, face out of frame, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x512

file · `assets/wardrobe/jk/head/hair/twintails/head_clip_plaid/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, black twintails tied high on both sides, straight bangs, wearing small plaid one-piece hairpin fastening the side hair, navy and cream plaid, back view of head and shoulders, hair and accessory centered, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 白色有线耳机（`head_earphone_wired`）

**[side]** · 512x512

file · `assets/wardrobe/jk/head/hair/twintails/head_earphone_wired/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, black twintails tied high on both sides, straight bangs, wearing white wired earphones, one earbud at the ear, thin cable falling toward the chest, framed from jawline to crown, face out of frame, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x512

file · `assets/wardrobe/jk/head/hair/twintails/head_earphone_wired/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, black twintails tied high on both sides, straight bangs, wearing white wired earphones, one earbud at the ear, thin cable falling toward the chest, back view of head and shoulders, hair and accessory centered, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

### 发型：短发及颈（`bob`）

> 参考图用锚点「短发及颈」那张。

#### 藏青发带（`head_ribbon_navy`）

**[side]** · 512x512

file · `assets/wardrobe/jk/head/hair/bob/head_ribbon_navy/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, black chin-length bob, straight bangs, hair ends at the jawline, wearing navy satin ribbon hairband tied at the back of the head, two tail ends falling into the hair, framed from jawline to crown, face out of frame, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x512

file · `assets/wardrobe/jk/head/hair/bob/head_ribbon_navy/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, black chin-length bob, straight bangs, hair ends at the jawline, wearing navy satin ribbon hairband tied at the back of the head, two tail ends falling into the hair, back view of head and shoulders, hair and accessory centered, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 格纹发夹（`head_clip_plaid`）

**[side]** · 512x512

file · `assets/wardrobe/jk/head/hair/bob/head_clip_plaid/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, black chin-length bob, straight bangs, hair ends at the jawline, wearing small plaid one-piece hairpin fastening the side hair, navy and cream plaid, framed from jawline to crown, face out of frame, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x512

file · `assets/wardrobe/jk/head/hair/bob/head_clip_plaid/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, black chin-length bob, straight bangs, hair ends at the jawline, wearing small plaid one-piece hairpin fastening the side hair, navy and cream plaid, back view of head and shoulders, hair and accessory centered, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 白色有线耳机（`head_earphone_wired`）

**[side]** · 512x512

file · `assets/wardrobe/jk/head/hair/bob/head_earphone_wired/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, black chin-length bob, straight bangs, hair ends at the jawline, wearing white wired earphones, one earbud at the ear, thin cable falling toward the chest, framed from jawline to crown, face out of frame, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x512

file · `assets/wardrobe/jk/head/hair/bob/head_earphone_wired/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, black chin-length bob, straight bangs, hair ends at the jawline, wearing white wired earphones, one earbud at the ear, thin cable falling toward the chest, back view of head and shoulders, hair and accessory centered, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`


## 3.2 上装 · 通用版（头发裁出画面）

### 通用 × 清瘦 B（`base_slim`）

> 参考图用任意一张锚点，并在提示词里保留这句体型：slender frame, small bust, narrow shoulders and hips。

#### 藏青西装外套（`top_jk_blazer`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_blazer/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing navy single-breasted school blazer with fitted waist and white piping on the cuffs, worn open over a white shirt, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_blazer/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing navy single-breasted school blazer with fitted waist and white piping on the cuffs, worn open over a white shirt, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_blazer/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing navy single-breasted school blazer with fitted waist and white piping on the cuffs, worn open over a white shirt, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 白底水手服上衣（`top_jk_sailor`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_sailor/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing white sailor blouse with navy collar, two white stripes on the collar edge, short cropped length, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_sailor/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing white sailor blouse with navy collar, two white stripes on the collar edge, short cropped length, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_sailor/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing white sailor blouse with navy collar, two white stripes on the collar edge, short cropped length, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 白衬衫（`top_jk_shirt`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_shirt/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing crisp white cotton shirt, small square collar, buttoned to the top, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_shirt/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing crisp white cotton shirt, small square collar, buttoned to the top, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_shirt/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing crisp white cotton shirt, small square collar, buttoned to the top, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 米色针织开衫（`top_jk_cardigan`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_cardigan/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing beige loose-knit long cardigan, hip length, open front, sleeves slightly long, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_cardigan/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing beige loose-knit long cardigan, hip length, open front, sleeves slightly long, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_cardigan/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing beige loose-knit long cardigan, hip length, open front, sleeves slightly long, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 浅米灰连帽卫衣（`top_jk_hoodie`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_hoodie/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing light greige oversized hoodie, drop shoulders, hem below the hips, hood down, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_hoodie/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing light greige oversized hoodie, drop shoulders, hem below the hips, hood down, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_hoodie/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing light greige oversized hoodie, drop shoulders, hem below the hips, hood down, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 奶白蓬松针织衫（`top_jk_knit`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_knit/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing cream fluffy round-neck knit sweater, sleeves bunched at the wrists, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_knit/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing cream fluffy round-neck knit sweater, sleeves bunched at the wrists, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_knit/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing cream fluffy round-neck knit sweater, sleeves bunched at the wrists, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 拼色棒球服（`top_jk_baseball`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_baseball/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing two-tone cropped baseball jacket, ribbed cuffs and hem, front zipper half open, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_baseball/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing two-tone cropped baseball jacket, ribbed cuffs and hem, front zipper half open, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/slim/top_jk_baseball/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, slender frame, small bust, narrow shoulders and hips, hair out of frame, shoulders bare of hair, wearing two-tone cropped baseball jacket, ribbed cuffs and hem, front zipper half open, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

### 通用 × 匀称 D（`base_normal`）

> 参考图用任意一张锚点，并在提示词里保留这句体型：balanced figure, fuller bust, defined waist, soft hip curve。

#### 藏青西装外套（`top_jk_blazer`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_blazer/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing navy single-breasted school blazer with fitted waist and white piping on the cuffs, worn open over a white shirt, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_blazer/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing navy single-breasted school blazer with fitted waist and white piping on the cuffs, worn open over a white shirt, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_blazer/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing navy single-breasted school blazer with fitted waist and white piping on the cuffs, worn open over a white shirt, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 白底水手服上衣（`top_jk_sailor`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_sailor/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing white sailor blouse with navy collar, two white stripes on the collar edge, short cropped length, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_sailor/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing white sailor blouse with navy collar, two white stripes on the collar edge, short cropped length, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_sailor/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing white sailor blouse with navy collar, two white stripes on the collar edge, short cropped length, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 白衬衫（`top_jk_shirt`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_shirt/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing crisp white cotton shirt, small square collar, buttoned to the top, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_shirt/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing crisp white cotton shirt, small square collar, buttoned to the top, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_shirt/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing crisp white cotton shirt, small square collar, buttoned to the top, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 米色针织开衫（`top_jk_cardigan`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_cardigan/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing beige loose-knit long cardigan, hip length, open front, sleeves slightly long, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_cardigan/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing beige loose-knit long cardigan, hip length, open front, sleeves slightly long, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_cardigan/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing beige loose-knit long cardigan, hip length, open front, sleeves slightly long, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 浅米灰连帽卫衣（`top_jk_hoodie`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_hoodie/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing light greige oversized hoodie, drop shoulders, hem below the hips, hood down, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_hoodie/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing light greige oversized hoodie, drop shoulders, hem below the hips, hood down, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_hoodie/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing light greige oversized hoodie, drop shoulders, hem below the hips, hood down, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 奶白蓬松针织衫（`top_jk_knit`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_knit/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing cream fluffy round-neck knit sweater, sleeves bunched at the wrists, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_knit/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing cream fluffy round-neck knit sweater, sleeves bunched at the wrists, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_knit/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing cream fluffy round-neck knit sweater, sleeves bunched at the wrists, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 拼色棒球服（`top_jk_baseball`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_baseball/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing two-tone cropped baseball jacket, ribbed cuffs and hem, front zipper half open, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_baseball/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing two-tone cropped baseball jacket, ribbed cuffs and hem, front zipper half open, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/normal/top_jk_baseball/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, balanced figure, fuller bust, defined waist, soft hip curve, hair out of frame, shoulders bare of hair, wearing two-tone cropped baseball jacket, ribbed cuffs and hem, front zipper half open, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

### 通用 × 丰腴 E（`base_full`）

> 参考图用任意一张锚点，并在提示词里保留这句体型：full figure, full bust, rounded hips, soft waistline。

#### 藏青西装外套（`top_jk_blazer`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_blazer/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing navy single-breasted school blazer with fitted waist and white piping on the cuffs, worn open over a white shirt, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_blazer/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing navy single-breasted school blazer with fitted waist and white piping on the cuffs, worn open over a white shirt, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_blazer/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing navy single-breasted school blazer with fitted waist and white piping on the cuffs, worn open over a white shirt, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 白底水手服上衣（`top_jk_sailor`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_sailor/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing white sailor blouse with navy collar, two white stripes on the collar edge, short cropped length, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_sailor/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing white sailor blouse with navy collar, two white stripes on the collar edge, short cropped length, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_sailor/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing white sailor blouse with navy collar, two white stripes on the collar edge, short cropped length, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 白衬衫（`top_jk_shirt`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_shirt/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing crisp white cotton shirt, small square collar, buttoned to the top, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_shirt/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing crisp white cotton shirt, small square collar, buttoned to the top, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_shirt/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing crisp white cotton shirt, small square collar, buttoned to the top, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 米色针织开衫（`top_jk_cardigan`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_cardigan/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing beige loose-knit long cardigan, hip length, open front, sleeves slightly long, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_cardigan/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing beige loose-knit long cardigan, hip length, open front, sleeves slightly long, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_cardigan/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing beige loose-knit long cardigan, hip length, open front, sleeves slightly long, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 浅米灰连帽卫衣（`top_jk_hoodie`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_hoodie/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing light greige oversized hoodie, drop shoulders, hem below the hips, hood down, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_hoodie/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing light greige oversized hoodie, drop shoulders, hem below the hips, hood down, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_hoodie/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing light greige oversized hoodie, drop shoulders, hem below the hips, hood down, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 奶白蓬松针织衫（`top_jk_knit`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_knit/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing cream fluffy round-neck knit sweater, sleeves bunched at the wrists, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_knit/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing cream fluffy round-neck knit sweater, sleeves bunched at the wrists, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_knit/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing cream fluffy round-neck knit sweater, sleeves bunched at the wrists, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 拼色棒球服（`top_jk_baseball`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_baseball/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing two-tone cropped baseball jacket, ribbed cuffs and hem, front zipper half open, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_baseball/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing two-tone cropped baseball jacket, ribbed cuffs and hem, front zipper half open, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/base/full/top_jk_baseball/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, full figure, full bust, rounded hips, soft waistline, hair out of frame, shoulders bare of hair, wearing two-tone cropped baseball jacket, ribbed cuffs and hem, front zipper half open, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`


## 3.3 上装 · 长发版（头发压在肩领上）

### 长发 × 清瘦 B（`long_slim`）

> 参考图用锚点「长发」那张。

#### 藏青西装外套（`top_jk_blazer`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_blazer/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing navy single-breasted school blazer with fitted waist and white piping on the cuffs, worn open over a white shirt, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_blazer/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing navy single-breasted school blazer with fitted waist and white piping on the cuffs, worn open over a white shirt, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_blazer/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing navy single-breasted school blazer with fitted waist and white piping on the cuffs, worn open over a white shirt, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 白底水手服上衣（`top_jk_sailor`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_sailor/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing white sailor blouse with navy collar, two white stripes on the collar edge, short cropped length, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_sailor/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing white sailor blouse with navy collar, two white stripes on the collar edge, short cropped length, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_sailor/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing white sailor blouse with navy collar, two white stripes on the collar edge, short cropped length, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 白衬衫（`top_jk_shirt`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_shirt/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing crisp white cotton shirt, small square collar, buttoned to the top, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_shirt/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing crisp white cotton shirt, small square collar, buttoned to the top, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_shirt/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing crisp white cotton shirt, small square collar, buttoned to the top, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 米色针织开衫（`top_jk_cardigan`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_cardigan/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing beige loose-knit long cardigan, hip length, open front, sleeves slightly long, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_cardigan/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing beige loose-knit long cardigan, hip length, open front, sleeves slightly long, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_cardigan/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing beige loose-knit long cardigan, hip length, open front, sleeves slightly long, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 浅米灰连帽卫衣（`top_jk_hoodie`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_hoodie/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing light greige oversized hoodie, drop shoulders, hem below the hips, hood down, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_hoodie/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing light greige oversized hoodie, drop shoulders, hem below the hips, hood down, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_hoodie/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing light greige oversized hoodie, drop shoulders, hem below the hips, hood down, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 奶白蓬松针织衫（`top_jk_knit`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_knit/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing cream fluffy round-neck knit sweater, sleeves bunched at the wrists, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_knit/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing cream fluffy round-neck knit sweater, sleeves bunched at the wrists, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_knit/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing cream fluffy round-neck knit sweater, sleeves bunched at the wrists, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 拼色棒球服（`top_jk_baseball`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_baseball/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing two-tone cropped baseball jacket, ribbed cuffs and hem, front zipper half open, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_baseball/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing two-tone cropped baseball jacket, ribbed cuffs and hem, front zipper half open, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/slim/top_jk_baseball/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, slender frame, small bust, narrow shoulders and hips, long hair falling over the shoulders and collar, wearing two-tone cropped baseball jacket, ribbed cuffs and hem, front zipper half open, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

### 长发 × 匀称 D（`long_normal`）

> 参考图用锚点「长发」那张。

#### 藏青西装外套（`top_jk_blazer`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_blazer/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing navy single-breasted school blazer with fitted waist and white piping on the cuffs, worn open over a white shirt, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_blazer/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing navy single-breasted school blazer with fitted waist and white piping on the cuffs, worn open over a white shirt, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_blazer/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing navy single-breasted school blazer with fitted waist and white piping on the cuffs, worn open over a white shirt, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 白底水手服上衣（`top_jk_sailor`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_sailor/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing white sailor blouse with navy collar, two white stripes on the collar edge, short cropped length, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_sailor/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing white sailor blouse with navy collar, two white stripes on the collar edge, short cropped length, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_sailor/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing white sailor blouse with navy collar, two white stripes on the collar edge, short cropped length, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 白衬衫（`top_jk_shirt`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_shirt/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing crisp white cotton shirt, small square collar, buttoned to the top, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_shirt/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing crisp white cotton shirt, small square collar, buttoned to the top, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_shirt/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing crisp white cotton shirt, small square collar, buttoned to the top, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 米色针织开衫（`top_jk_cardigan`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_cardigan/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing beige loose-knit long cardigan, hip length, open front, sleeves slightly long, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_cardigan/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing beige loose-knit long cardigan, hip length, open front, sleeves slightly long, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_cardigan/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing beige loose-knit long cardigan, hip length, open front, sleeves slightly long, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 浅米灰连帽卫衣（`top_jk_hoodie`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_hoodie/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing light greige oversized hoodie, drop shoulders, hem below the hips, hood down, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_hoodie/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing light greige oversized hoodie, drop shoulders, hem below the hips, hood down, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_hoodie/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing light greige oversized hoodie, drop shoulders, hem below the hips, hood down, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 奶白蓬松针织衫（`top_jk_knit`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_knit/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing cream fluffy round-neck knit sweater, sleeves bunched at the wrists, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_knit/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing cream fluffy round-neck knit sweater, sleeves bunched at the wrists, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_knit/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing cream fluffy round-neck knit sweater, sleeves bunched at the wrists, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 拼色棒球服（`top_jk_baseball`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_baseball/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing two-tone cropped baseball jacket, ribbed cuffs and hem, front zipper half open, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_baseball/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing two-tone cropped baseball jacket, ribbed cuffs and hem, front zipper half open, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/normal/top_jk_baseball/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, balanced figure, fuller bust, defined waist, soft hip curve, long hair falling over the shoulders and collar, wearing two-tone cropped baseball jacket, ribbed cuffs and hem, front zipper half open, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

### 长发 × 丰腴 E（`long_full`）

> 参考图用锚点「长发」那张。

#### 藏青西装外套（`top_jk_blazer`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_blazer/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing navy single-breasted school blazer with fitted waist and white piping on the cuffs, worn open over a white shirt, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_blazer/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing navy single-breasted school blazer with fitted waist and white piping on the cuffs, worn open over a white shirt, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_blazer/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing navy single-breasted school blazer with fitted waist and white piping on the cuffs, worn open over a white shirt, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 白底水手服上衣（`top_jk_sailor`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_sailor/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing white sailor blouse with navy collar, two white stripes on the collar edge, short cropped length, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_sailor/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing white sailor blouse with navy collar, two white stripes on the collar edge, short cropped length, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_sailor/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing white sailor blouse with navy collar, two white stripes on the collar edge, short cropped length, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 白衬衫（`top_jk_shirt`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_shirt/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing crisp white cotton shirt, small square collar, buttoned to the top, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_shirt/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing crisp white cotton shirt, small square collar, buttoned to the top, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_shirt/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing crisp white cotton shirt, small square collar, buttoned to the top, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 米色针织开衫（`top_jk_cardigan`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_cardigan/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing beige loose-knit long cardigan, hip length, open front, sleeves slightly long, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_cardigan/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing beige loose-knit long cardigan, hip length, open front, sleeves slightly long, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_cardigan/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing beige loose-knit long cardigan, hip length, open front, sleeves slightly long, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 浅米灰连帽卫衣（`top_jk_hoodie`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_hoodie/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing light greige oversized hoodie, drop shoulders, hem below the hips, hood down, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_hoodie/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing light greige oversized hoodie, drop shoulders, hem below the hips, hood down, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_hoodie/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing light greige oversized hoodie, drop shoulders, hem below the hips, hood down, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 奶白蓬松针织衫（`top_jk_knit`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_knit/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing cream fluffy round-neck knit sweater, sleeves bunched at the wrists, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_knit/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing cream fluffy round-neck knit sweater, sleeves bunched at the wrists, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_knit/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing cream fluffy round-neck knit sweater, sleeves bunched at the wrists, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 拼色棒球服（`top_jk_baseball`）

**[front]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_baseball/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing two-tone cropped baseball jacket, ribbed cuffs and hem, front zipper half open, framed from shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_baseball/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing two-tone cropped baseball jacket, ribbed cuffs and hem, front zipper half open, profile view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/top/long/full/top_jk_baseball/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, long straight black hair falling past the shoulders, straight bangs, full figure, full bust, rounded hips, soft waistline, long hair falling over the shoulders and collar, wearing two-tone cropped baseball jacket, ribbed cuffs and hem, front zipper half open, back view, shoulders to hips, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`


## 3.4 共用：下装 / 袜子 / 鞋子

### 下装

> 不绑定发型与体型。

#### 藏青百褶短裙（`bottom_jk_pleat_navy`）

**[front]** · 512x768

file · `assets/wardrobe/jk/bottom/shared/bottom_jk_pleat_navy/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing navy pleated school skirt with hard pleats, high waist, hem at mid-thigh, framed from waist to just above the knee, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/bottom/shared/bottom_jk_pleat_navy/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing navy pleated school skirt with hard pleats, high waist, hem at mid-thigh, profile view, waist to just above the knee, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/bottom/shared/bottom_jk_pleat_navy/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing navy pleated school skirt with hard pleats, high waist, hem at mid-thigh, back view, waist to just above the knee, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 格纹百褶短裙（`bottom_jk_pleat_plaid`）

**[front]** · 512x768

file · `assets/wardrobe/jk/bottom/shared/bottom_jk_pleat_plaid/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing cream and navy plaid pleated skirt, sharp pleats, high waist, hem above the knee, framed from waist to just above the knee, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/bottom/shared/bottom_jk_pleat_plaid/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing cream and navy plaid pleated skirt, sharp pleats, high waist, hem above the knee, profile view, waist to just above the knee, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/bottom/shared/bottom_jk_pleat_plaid/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing cream and navy plaid pleated skirt, sharp pleats, high waist, hem above the knee, back view, waist to just above the knee, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 水洗牛仔短裙（`bottom_jk_denim`）

**[front]** · 512x768

file · `assets/wardrobe/jk/bottom/shared/bottom_jk_denim/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing light-wash denim mini skirt, high waist, raw frayed hem, framed from waist to just above the knee, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/bottom/shared/bottom_jk_denim/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing light-wash denim mini skirt, high waist, raw frayed hem, profile view, waist to just above the knee, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/bottom/shared/bottom_jk_denim/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing light-wash denim mini skirt, high waist, raw frayed hem, back view, waist to just above the knee, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 运动短裤（`bottom_jk_shorts`）

**[front]** · 512x768

file · `assets/wardrobe/jk/bottom/shared/bottom_jk_shorts/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing navy sports shorts with white side piping, elastic waist, framed from waist to just above the knee, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x768

file · `assets/wardrobe/jk/bottom/shared/bottom_jk_shorts/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing navy sports shorts with white side piping, elastic waist, profile view, waist to just above the knee, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x768

file · `assets/wardrobe/jk/bottom/shared/bottom_jk_shorts/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing navy sports shorts with white side piping, elastic waist, back view, waist to just above the knee, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

### 袜子

> 不绑定发型与体型。

#### 黑色及膝袜（`sock_knee_black`）

**[front]** · 512x640

file · `assets/wardrobe/jk/socks/shared/sock_knee_black/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing black opaque knee-high cotton socks, band resting just below the knee, framed from knee to ankle, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x640

file · `assets/wardrobe/jk/socks/shared/sock_knee_black/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing black opaque knee-high cotton socks, band resting just below the knee, profile view, knee to ankle, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x640

file · `assets/wardrobe/jk/socks/shared/sock_knee_black/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing black opaque knee-high cotton socks, band resting just below the knee, back view, knee to ankle, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 白色过膝袜（`sock_thigh_white`）

**[front]** · 512x640

file · `assets/wardrobe/jk/socks/shared/sock_thigh_white/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing sheer white over-the-knee socks, soft band at mid-thigh, framed from knee to ankle, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x640

file · `assets/wardrobe/jk/socks/shared/sock_thigh_white/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing sheer white over-the-knee socks, soft band at mid-thigh, profile view, knee to ankle, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x640

file · `assets/wardrobe/jk/socks/shared/sock_thigh_white/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing sheer white over-the-knee socks, soft band at mid-thigh, back view, knee to ankle, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 米白堆堆袜（`sock_pile_cream`）

**[front]** · 512x640

file · `assets/wardrobe/jk/socks/shared/sock_pile_cream/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing cream fine-knit slouch socks bunched at the ankle, framed from knee to ankle, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x640

file · `assets/wardrobe/jk/socks/shared/sock_pile_cream/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing cream fine-knit slouch socks bunched at the ankle, profile view, knee to ankle, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x640

file · `assets/wardrobe/jk/socks/shared/sock_pile_cream/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing cream fine-knit slouch socks bunched at the ankle, back view, knee to ankle, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 条纹运动长袜（`sock_sport_stripe`）

**[front]** · 512x640

file · `assets/wardrobe/jk/socks/shared/sock_sport_stripe/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing white calf-length sports socks with two navy stripes, framed from knee to ankle, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x640

file · `assets/wardrobe/jk/socks/shared/sock_sport_stripe/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing white calf-length sports socks with two navy stripes, profile view, knee to ankle, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x640

file · `assets/wardrobe/jk/socks/shared/sock_sport_stripe/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing white calf-length sports socks with two navy stripes, back view, knee to ankle, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 纯白短棉袜（`sock_cotton_short`）

**[front]** · 512x640

file · `assets/wardrobe/jk/socks/shared/sock_cotton_short/front.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing plain white short cotton socks, cuff just above the shoe opening, framed from knee to ankle, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x640

file · `assets/wardrobe/jk/socks/shared/sock_cotton_short/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing plain white short cotton socks, cuff just above the shoe opening, profile view, knee to ankle, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[back]** · 512x640

file · `assets/wardrobe/jk/socks/shared/sock_cotton_short/back.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing plain white short cotton socks, cuff just above the shoe opening, back view, knee to ankle, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

### 鞋子

> 不绑定发型与体型。

#### 制服小皮鞋（`shoe_leather`）

**[three-quarter]** · 512x512

file · `assets/wardrobe/jk/shoes/shared/shoe_leather/three-quarter.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing black round-toe leather loafers with a slim buckle strap, framed from ankle to floor, three-quarter view, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x512

file · `assets/wardrobe/jk/shoes/shared/shoe_leather/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing black round-toe leather loafers with a slim buckle strap, side view, ankle to floor, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 运动鞋（`shoe_sneakers`）

**[three-quarter]** · 512x512

file · `assets/wardrobe/jk/shoes/shared/shoe_sneakers/three-quarter.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing white low-top sneakers with grey accents, framed from ankle to floor, three-quarter view, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x512

file · `assets/wardrobe/jk/shoes/shared/shoe_sneakers/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing white low-top sneakers with grey accents, side view, ankle to floor, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 松糕鞋（`shoe_platform`）

**[three-quarter]** · 512x512

file · `assets/wardrobe/jk/shoes/shared/shoe_platform/three-quarter.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing dark brown platform mary-jane shoes with a thick sole, framed from ankle to floor, three-quarter view, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x512

file · `assets/wardrobe/jk/shoes/shared/shoe_platform/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing dark brown platform mary-jane shoes with a thick sole, side view, ankle to floor, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

#### 平底鞋（`shoe_flats`）

**[three-quarter]** · 512x512

file · `assets/wardrobe/jk/shoes/shared/shoe_flats/three-quarter.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing pale beige leather flat shoes, framed from ankle to floor, three-quarter view, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

**[side]** · 512x512

file · `assets/wardrobe/jk/shoes/shared/shoe_flats/side.png`

```text
fashion catalog photography, vertical composition, anonymous model, face cropped out of the frame, matte dark grey seamless backdrop, soft diffused studio light, 50mm lens, shallow depth of field, tasteful editorial look, no text, no logo, no watermark, East Asian young woman, 160 cm, light warm skin tone, face is never visible, wearing pale beige leather flat shoes, side view, ankle to floor, garment centered.
```

负面：`face, eyes, nose, mouth, portrait, full body, logo, text, watermark, extra limbs, distorted hands, duplicate person, cartoon, 3d render`

---

## 4. 生成后自检（像不像同一个人）

| 检查项 | 合格 |
| :--- | :--- |
| 肩宽、腰线位置一致 | 同一件衣服的不同角度不改身形 |
| 肤色、发长一致 | 与锚点逐张比对 |
| 百褶是硬褶 | 褶线笔直，不软塌 |
| 袜口有勒痕 | 过膝/及膝袜在腿上有浅压痕 |
| 脸完全在画外 | 不能出现眼睛、鼻、嘴 |
| 鞋型不跑 | 每款只保留 2 个服装 tag |

任何一项不过，**别手动改描述**：把锚点图重新上传、原 prompt 再跑一次。
