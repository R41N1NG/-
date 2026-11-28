# ComfyUI 接管脚本 · 使用说明

脚本：[okh_batch.py](okh_batch.py)　任务清单：[jobs/gulan_virgin.json](jobs/gulan_virgin.json)

已实测：ComfyUI 0.28.0 / RTX 4070 SUPER / 底模 `waiIllustriousSDXL_v170.safetensors`，832×1216、30 步、CFG 6.5 单张约 **63 秒**。

> 注意：本机原来 `*_workflow.json` 里写的 `animagine-xl-4.0.safetensors` 已经不在模型目录里了，现在实际可用的是 `waiIllustriousSDXL_v170.safetensors`（Illustrious 系，与 Animagine 同为 SDXL 动漫底模，tag 体系基本通用）。脚本默认就用它。

---

## 一、三条命令记住就够

```powershell
cd E:\角色卡制作\ntr妹妹

# 1) 体检：确认 ComfyUI 在跑、看 GPU 与可用底模
py comfyui\okh_batch.py ping

# 2) 干跑：只打印将要提交的参数，不占显卡（先验清单没错）
py comfyui\okh_batch.py run -j comfyui\jobs\gulan_virgin.json -n 2 --dry-run

# 3) 真跑：同一条提示词扫 8 个种子，挑角最正的那张
py comfyui\okh_batch.py run -j comfyui\jobs\gulan_virgin.json -n 8
```

出图落在 `comfyui/tasks/<时间戳>/`，同目录会写 `manifest.json` 和 `manifest.csv`，记录每张的 seed、尺寸、步数、CFG、耗时、文件路径。挑出满意的那张后，把它的 seed 抄进清单就能复现。

---

## 二、任务清单怎么写

`jobs/gulan_virgin.json` 结构：

```json
{
  "jobs": [
    {
      "name": "gulan_virgin_36",
      "prefix": "okh/echo",
      "width": 832,
      "height": 1216,
      "steps": 30,
      "cfg": 6.5,
      "sampler": "euler_ancestral",
      "scheduler": "normal",
      "clip_skip": -2,
      "hires": 0.0,
      "positive": "……正面……",
      "negative": "……负面……"
    }
  ]
}
```

一次可以放多条 `jobs`，脚本按顺序跑完；每条也可以各自不同的尺寸/参数。`name` 是出图文件名前缀，建议用 `cgId` 命名（如 `gulan_final_fall`），将来接相册目录时直接对得上。

常用覆盖开关（命令行优先于清单）：

| 开关 | 作用 |
|---|---|
| `--ckpt` | 换底模 |
| `--width / --height` | 改尺寸 |
| `--steps / --cfg` | 改采样参数 |
| `--hires 1.35` | 开 HiResFix（LatentUpscaleBy + 二次采样，denoise 0.45） |
| `--seed 12345` | 固定起始种子 |
| `-n 8` | 每条任务跑几个种子 |
| `--out 目录` | 指定输出目录 |
| `--dry-run` | 只打印不提交 |

---

## 三、挑角专用的工作流

现在这套「一根角都不许乱长」的判据依赖种子，单张靠运气，**扫种子才是正解**：

```powershell
# 8 个种子，约 8~9 分钟
py comfyui\okh_batch.py run -j comfyui\jobs\gulan_virgin.json -n 8 --out comfyui\tasks\angle_scan_a

# 挑中之后，用那个 seed 复现并开 HiResFix
py comfyui\okh_batch.py run -j comfyui\jobs\gulan_virgin.json -n 1 --seed 1561358715 --hires 1.35
```

如果 8 张里一张都不合格，说明提示词侧已经到极限，改走蒙版重绘：

1. 正面删掉所有 horn 词，负面加 `horns, horn, horned`
2. 出无角底图（这张不会有任何角，脸和发型稳）
3. ComfyUI 用 `VAEEncode (for Inpainting)` + 蒙版涂太阳穴两侧，Inpaint 提示词只写 `(black horns:1.35), (horns with red tips:1.1), sharp horns, pointed horns`
4. denoise 0.85~0.95

---

## 四、脚本做了什么

- 只用标准库（`urllib`/`json`/`argparse`/`csv`），不需要 `pip install`
- 用 API 格式提交（`/prompt`），不是 UI 工作流格式，所以不依赖你现有的 `*_workflow.json`
- 轮询 `/history/<prompt_id>` 等结果，出错会打印 `execution_error` 原文
- 出图从 `/view` 拉回本地，按 `任务名_seed_序号.png` 命名
- 全程不碰 ComfyUI 的 `output` 目录，也不删任何已有文件

---

## 五、已知限制

- 需要 ComfyUI 已启动（默认 `http://127.0.0.1:8188`，可用 `--host` 改）
- 显存 12GB，832×1216 单张没问题；开 `--hires 1.35` 时若报 OOM，把 `hires_steps` 降到 12、或先关掉别的占显存程序
- 脚本不做图像内容判断，「角对不对」得人眼看，我没法替你判图
