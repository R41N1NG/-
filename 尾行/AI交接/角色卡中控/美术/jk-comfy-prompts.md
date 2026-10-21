# JK 服装特写 · ComfyUI 文生图提示词（Animagine XL 系 / 动漫模型通用）

> 用途：终端与手机「相册」里的调查收益图。
> 说明：提示词按 danbooru tag 写，Animagine XL 3.x / Anything / 其他动漫 SDXL 都能吃；不露脸靠 `faceless, head out of frame` 与构图。
> 每件先给一条**基础款**，再给角度替换词；同一件连着生成，别换种子之外的东西。

---

## 一、通用参数

| 项 | 建议 |
| :--- | :--- |
| Checkpoint | Animagine XL 3.1 / 4.0（SDXL）；Anything V5 则把分辨率降到 512×768 |
| 采样器 | Euler a，调度 Normal（或 DPM++ 2M Karras） |
| 步数 / CFG | 28 / 6.0（SD1.5 用 20~25 / 7） |
| 尺寸 | 竖幅 768×1024（再缩到 512×768）；头饰与鞋用 768×768 |
| 高清修复 | 可选，1.5×，denoise 0.4 |
| 批量 | 一张一发；同件三角度用同一 seed + 只改角度词 |

### 共享正面前缀

```text
masterpiece, best quality, very aesthetic, absurdres, 1girl, solo, faceless, head out of frame, close-up, {frame}, {angle}, {garment}, simple background, grey background, studio lighting, soft light
```

### 共享负面

```text
lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name, face, eyes, nose, mouth, full body, multiple girls, nsfw
```

> `face, eyes, nose, mouth` 是防它自己补脸；如果整张被裁得太狠，先去掉 `head out of frame` 再试。

---

## 二、按维度附加 tag（v2 起）

衣服不再全量按体型重出：**头饰按发型**、**上装默认 + 长发额外一套**、**下半身按体型**、袜鞋共用。

### 发型（加在正面 tag 里）

| 发型 | tag |
| :--- | :--- |
| 长发 | `long hair, black hair, straight hair, bangs` |
| 马尾 | `ponytail, black hair, straight bangs` |
| 双马尾 | `twintails, black hair, straight bangs` |
| 短发（及颈） | `bob cut, short hair, black hair, bangs` |

> 头饰图必须带发型 tag；上装图除“长发版”外，其余加 `hair out of frame`。

### 体型（只加在下半身图）

| 体型 | tag |
| :--- | :--- |
| 清瘦 | `slim, narrow waist, slender` |
| 匀称 | `curvy, wide hips, defined waist` |

---

## 三、按件提示词

### 头饰（frame 用 `head, hair`）

| 件 | garment tag | 角度 |
| :--- | :--- | :--- |
| 藏青发带 | `navy ribbon, hair ribbon, hairband, bow` | `from side` / `from behind` |
| 格纹发夹 | `hair clip, plaid, hair ornament` | `from side` / `from behind` |
| 白色有线耳机 | `earphones, wired earphones, white earphones` | `from side` / `from behind` |

例（发带·侧）：

```text
masterpiece, best quality, very aesthetic, absurdres, 1girl, solo, faceless, head out of frame, close-up, head, hair, from side, navy ribbon, hair ribbon, hairband, bow, simple background, grey background, studio lighting, soft light
```

### 上半身（frame 用 `upper body, torso`）

| 件 | garment tag | 角度 |
| :--- | :--- | :--- |
| 藏青西装外套 | `navy blazer, school uniform, white shirt, open clothes` | `from front` / `from side` / `from behind` |
| 白底水手服上衣 | `serafuku, sailor collar, white shirt, short sleeves` | 同上 |
| 白衬衫 | `white shirt, collared shirt, buttoned` | 同上 |
| 米色针织开衫 | `beige cardigan, long cardigan, knit` | 同上 |
| 浅米灰连帽卫衣 | `hoodie, oversized, grey hoodie` | 同上 |
| 奶白蓬松针织衫 | `cream sweater, knit sweater, round neck` | 同上 |
| 拼色棒球服 | `baseball jacket, cropped jacket, two-tone` | 同上 |

例（西装外套·正）：

```text
masterpiece, best quality, very aesthetic, absurdres, 1girl, solo, faceless, head out of frame, close-up, upper body, torso, from front, navy blazer, school uniform, white shirt, open clothes, simple background, grey background, studio lighting, soft light
```

### 下半身（frame 用 `lower body, thighs`）

| 件 | garment tag | 角度 |
| :--- | :--- | :--- |
| 藏青百褶短裙 | `navy skirt, pleated skirt, miniskirt, high waist` | `from front` / `from side` / `from behind` |
| 格纹百褶短裙 | `plaid skirt, pleated skirt, miniskirt` | 同上 |
| 水洗牛仔短裙 | `denim skirt, miniskirt, frayed hem` | 同上 |
| 运动短裤 | `sports shorts, shorts, navy shorts` | 同上 |

例（百褶裙·侧）：

```text
masterpiece, best quality, very aesthetic, absurdres, 1girl, solo, faceless, head out of frame, close-up, lower body, thighs, from side, navy skirt, pleated skirt, miniskirt, high waist, simple background, grey background, studio lighting, soft light
```

### 袜子（frame 用 `legs`）

| 件 | garment tag | 角度 |
| :--- | :--- | :--- |
| 黑色及膝袜 | `black kneehighs, kneehighs, socks` | `from front` / `from side` / `from behind` |
| 白色过膝袜 | `white thighhighs, thighhighs, sheer` | 同上 |
| 米白堆堆袜 | `loose socks, slouch socks, ankle socks` | 同上 |
| 条纹运动长袜 | `sports socks, striped socks` | 同上 |
| 纯白短棉袜 | `white socks, short socks` | 同上 |

例（及膝袜·正）：

```text
masterpiece, best quality, very aesthetic, absurdres, 1girl, solo, faceless, head out of frame, close-up, legs, from front, black kneehighs, kneehighs, socks, simple background, grey background, studio lighting, soft light
```

### 鞋子（frame 用 `feet`，尺寸 768×768）

| 件 | garment tag | 角度 |
| :--- | :--- | :--- |
| 制服小皮鞋 | `loafers, black shoes, buckle` | `from side` / `from front` |
| 运动鞋 | `sneakers, white sneakers` | 同上 |
| 松糕鞋 | `platform shoes, mary janes, brown shoes` | 同上 |
| 平底鞋 | `flats, beige shoes` | 同上 |

例（小皮鞋·侧）：

```text
masterpiece, best quality, very aesthetic, absurdres, 1girl, solo, faceless, head out of frame, close-up, feet, from side, loafers, black shoes, buckle, simple background, grey background, studio lighting, soft light
```

---

## 三、ComfyUI 连线

```
Load Checkpoint ──► CLIP Text Encode (正面) ──┐
                └─► CLIP Text Encode (负面) ──┤
Empty Latent Image (768×1024) ────────────────┼─► KSampler ─► VAE Decode ─► Save Image
```

- **同件三角度**：固定 seed，只改 `from front / from side / from behind`；
- **换件**：seed 换一个，但正面/负面模板不动；
- 想批量：把本条清单按行灌进一个文本批次节点，一次跑完一件的三个角度。

---

## 四、常见问题

| 现象 | 调整 |
| :--- | :--- |
| 还是露脸 | 负面加 `face, eyes`；正面加 `head out of frame`；或直接改成 `from behind` |
| 头被裁得只剩脖子 | 去掉 `head out of frame`，改 `close-up, upper body, from behind` |
| 百褶被画成软褶 | 加 `pleated skirt, sharp pleats`，必要时 `stiff fabric` |
| 过膝袜勒痕没有 | 加 `thighhighs, tight fit, indentation` |
| 鞋型跑偏 | 鞋类只保留 2 个 tag，别叠太多形容词 |
| 画面太色 | 去掉 `nsfw` 负面之外的露骨词，保持 `fashion catalog` 语境 |
