#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
okh_batch.py — 奥克赫斯出图批处理：直接接管本机 ComfyUI（HTTP API）

用途
  - 把「正面 / 负面 / 尺寸 / 步数 / CFG / 种子」写成任务清单，一次排队跑完
  - 同一条提示词可以扫多个种子（挑角最正的那张），这是治"四角/额头角"最省时间的办法
  - 可选 HiResFix 二段放大
  - 结果自动落到 tasks 目录，并生成 manifest.json 记录每条的参数与出图路径

依赖：只用标准库（urllib / json / argparse），无需 pip install

常用命令
  1) 探活 + 列出可用底模
     py comfyui\\okh_batch.py ping

  2) 单条试跑（扫 6 个种子）
     py comfyui\\okh_batch.py run -j comfyui\\jobs\\gulan_test.json -n 6

  3) 只打印将要提交的 API 工作流，不真跑
     py comfyui\\okh_batch.py run -j comfyui\\jobs\\gulan_test.json -n 1 --dry-run

  4) 指定底模 / 覆盖尺寸
     py comfyui\\okh_batch.py run -j XXX.json --ckpt waiIllustriousSDXL_v170.safetensors --width 832 --height 1216
"""

import argparse
import csv
import json
import os
import random
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

HOST = "http://127.0.0.1:8188"

# Windows 控制台默认 GBK，中文提示会花屏，这里强制 UTF-8
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

DEFAULTS = {
    "ckpt": "waiIllustriousSDXL_v170.safetensors",
    "clip_skip": -2,
    "width": 832,
    "height": 1216,
    "steps": 28,
    "cfg": 6.0,
    "sampler": "euler_ancestral",
    "scheduler": "normal",
    "batch": 1,
    "seed": -1,
    "hires": 0.0,          # 0 = 关闭；1.35 = 放大 1.35 倍再二次采样
    "hires_denoise": 0.45,
    "hires_steps": 16,
    "prefix": "okh/echo",
}


# ---------------------------------------------------------------- HTTP 基础
def http_json(path, payload=None, timeout=30):
    url = HOST + path
    data = None
    headers = {}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read().decode("utf-8", "replace")
    return json.loads(body) if body.strip() else {}


def http_bytes(url, timeout=120):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def ping():
    try:
        stats = http_json("/system_stats", timeout=10)
    except Exception as exc:
        print("[X] 连不上 %s ：%s" % (HOST, exc))
        print("    先确认 ComfyUI 已启动，或改用 --host 指定端口。")
        return 1
    sysinfo = stats.get("system", {})
    print("[OK] ComfyUI %s / python %s" % (sysinfo.get("comfyui_version"), sysinfo.get("python_version")))
    for dev in stats.get("devices", []):
        free = dev.get("vram_free", 0) / 1024 ** 3
        total = dev.get("vram_total", 0) / 1024 ** 3
        print("     GPU %s  VRAM %.1f/%.1f GB" % (dev.get("name"), free, total))
    try:
        ckpts = http_json("/object_info/CheckpointLoaderSimple", timeout=15)
        names = ckpts["CheckpointLoaderSimple"]["input"]["required"]["ckpt_name"][0]
        print("     可用底模：")
        for n in names:
            print("       - %s" % n)
    except Exception as exc:
        print("     [!] 取底模列表失败：%s" % exc)
    return 0


# ---------------------------------------------------------------- 工作流构造
def build_workflow(job, ckpt, seed):
    """构造 ComfyUI API 格式（非 UI 格式）的工作流。"""
    pos = job["positive"]
    neg = job["negative"]
    width = int(job.get("width", DEFAULTS["width"]))
    height = int(job.get("height", DEFAULTS["height"]))
    steps = int(job.get("steps", DEFAULTS["steps"]))
    cfg = float(job.get("cfg", DEFAULTS["cfg"]))
    sampler = job.get("sampler", DEFAULTS["sampler"])
    scheduler = job.get("scheduler", DEFAULTS["scheduler"])
    batch = int(job.get("batch", DEFAULTS["batch"]))
    clip_skip = int(job.get("clip_skip", DEFAULTS["clip_skip"]))
    hires = float(job.get("hires", DEFAULTS["hires"]))
    hires_denoise = float(job.get("hires_denoise", DEFAULTS["hires_denoise"]))
    hires_steps = int(job.get("hires_steps", DEFAULTS["hires_steps"]))
    prefix = job.get("prefix", DEFAULTS["prefix"])

    wf = {
        "1": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": ckpt}},
        "2": {"class_type": "CLIPSetLastLayer", "inputs": {"clip": ["1", 1], "stop_at_clip_layer": clip_skip}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": pos}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["2", 0], "text": neg}},
        "5": {"class_type": "EmptyLatentImage",
              "inputs": {"width": width, "height": height, "batch_size": batch}},
        "6": {"class_type": "KSampler",
              "inputs": {"model": ["1", 0], "seed": seed, "steps": steps, "cfg": cfg,
                         "sampler_name": sampler, "scheduler": scheduler,
                         "positive": ["3", 0], "negative": ["4", 0],
                         "latent_image": ["5", 0], "denoise": 1.0}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["6", 0], "vae": ["1", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"images": ["8", 0], "filename_prefix": prefix}},
    }

    if hires > 1.0:
        wf["10"] = {"class_type": "LatentUpscaleBy",
                    "inputs": {"samples": ["6", 0], "upscale_method": "nearest-exact", "scale_by": hires}}
        wf["11"] = {"class_type": "KSampler",
                    "inputs": {"model": ["1", 0], "seed": seed + 1, "steps": hires_steps,
                               "cfg": max(3.0, cfg - 1.0), "sampler_name": sampler,
                               "scheduler": scheduler, "positive": ["3", 0], "negative": ["4", 0],
                               "latent_image": ["10", 0], "denoise": hires_denoise}}
        wf["12"] = {"class_type": "VAEDecode", "inputs": {"samples": ["11", 0], "vae": ["1", 2]}}
        wf["9"]["inputs"]["images"] = ["12", 0]
    return wf


# ---------------------------------------------------------------- 排队与等待
def submit(workflow):
    client_id = str(uuid.uuid4())
    resp = http_json("/prompt", {"prompt": workflow, "client_id": client_id}, timeout=60)
    if "prompt_id" not in resp:
        raise RuntimeError("提交失败：%s" % json.dumps(resp, ensure_ascii=False)[:800])
    return resp["prompt_id"]


def wait_done(prompt_id, timeout=1800, interval=1.5):
    started = time.time()
    while time.time() - started < timeout:
        hist = http_json("/history/%s" % prompt_id, timeout=30)
        entry = hist.get(prompt_id)
        if entry:
            status = entry.get("status", {})
            if status.get("status_str") == "error" or status.get("completed") is False and status.get("messages"):
                msgs = status.get("messages") or []
                for kind, payload in msgs:
                    if kind == "execution_error":
                        raise RuntimeError("执行报错：%s" % json.dumps(payload, ensure_ascii=False)[:800])
            if entry.get("outputs"):
                return entry
        time.sleep(interval)
    raise TimeoutError("等待超时 %s" % prompt_id)


def fetch_outputs(entry, out_dir):
    saved = []
    for node_out in entry.get("outputs", {}).values():
        for img in node_out.get("images", []):
            params = urllib.parse.urlencode({
                "filename": img["filename"],
                "subfolder": img.get("subfolder", ""),
                "type": img.get("type", "output"),
            })
            blob = http_bytes(HOST + "/view?" + params)
            os.makedirs(out_dir, exist_ok=True)
            dest = os.path.join(out_dir, img["filename"].replace("\\", "_").replace("/", "_"))
            with open(dest, "wb") as fh:
                fh.write(blob)
            saved.append(dest)
    return saved


# ---------------------------------------------------------------- 任务清单
def load_jobs(path):
    with open(path, "r", encoding="utf-8-sig") as fh:
        raw = json.load(fh)
    jobs = raw["jobs"] if isinstance(raw, dict) and "jobs" in raw else raw
    if not isinstance(jobs, list) or not jobs:
        raise SystemExit("任务清单里没有 jobs")
    for i, job in enumerate(jobs):
        if not job.get("positive") or not job.get("negative"):
            raise SystemExit("第 %d 条缺少 positive / negative" % (i + 1))
        job.setdefault("name", "job%02d" % (i + 1))
    return jobs


def main():
    global HOST
    ap = argparse.ArgumentParser(description="奥克赫斯 · ComfyUI 批处理接管")
    ap.add_argument("cmd", choices=["ping", "run"], nargs="?", default="ping")
    ap.add_argument("-j", "--jobs", help="任务清单 json")
    ap.add_argument("--host", default=HOST, help="ComfyUI 地址，默认 http://127.0.0.1:8188")
    ap.add_argument("--ckpt", default=None, help="覆盖底模文件名")
    ap.add_argument("-n", "--count", type=int, default=1, help="每条任务扫几个种子")
    ap.add_argument("--seed", type=int, default=None, help="固定起始种子（默认随机）")
    ap.add_argument("--width", type=int, default=None)
    ap.add_argument("--height", type=int, default=None)
    ap.add_argument("--steps", type=int, default=None)
    ap.add_argument("--cfg", type=float, default=None)
    ap.add_argument("--hires", type=float, default=None, help="如 1.35，0 表示关闭")
    ap.add_argument("--out", default=None, help="出图目录，默认 comfyui/tasks/<时间戳>")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    HOST = args.host.rstrip("/")

    if args.cmd == "ping":
        return ping()

    if not args.jobs:
        raise SystemExit("run 需要 -j 任务清单")

    jobs = load_jobs(args.jobs)
    stamp = time.strftime("%Y%m%d_%H%M%S")
    here = os.path.dirname(os.path.abspath(__file__))
    out_dir = args.out or os.path.join(here, "tasks", stamp)
    os.makedirs(out_dir, exist_ok=True)

    base_seed = args.seed if args.seed is not None else random.randint(1, 2 ** 31 - 1)
    manifest = []
    total = 0

    for job in jobs:
        ckpt = args.ckpt or job.get("ckpt") or DEFAULTS["ckpt"]
        for key in ("width", "height", "steps", "cfg", "hires"):
            if getattr(args, key) is not None:
                job[key] = getattr(args, key)

        for k in range(args.count):
            seed = base_seed + k if args.seed is not None else random.randint(1, 2 ** 31 - 1)
            wf = build_workflow(job, ckpt, seed)
            label = "%s_s%d" % (job["name"], seed % 100000)

            if args.dry_run:
                print("[dry-run] %s  ckpt=%s  %dx%d steps=%s cfg=%s seed=%s"
                      % (label, ckpt, job.get("width", DEFAULTS["width"]),
                         job.get("height", DEFAULTS["height"]),
                         job.get("steps", DEFAULTS["steps"]), job.get("cfg", DEFAULTS["cfg"]), seed))
                total += 1
                continue

            wf["9"]["inputs"]["filename_prefix"] = "%s/%s" % (job.get("prefix", DEFAULTS["prefix"]), label)
            t0 = time.time()
            try:
                pid = submit(wf)
                entry = wait_done(pid)
                files = fetch_outputs(entry, out_dir)
                cost = time.time() - t0
                print("[OK] %-28s %5.1fs  -> %s" % (label, cost, ", ".join(os.path.basename(f) for f in files)))
                manifest.append({"job": job["name"], "label": label, "seed": seed, "ckpt": ckpt,
                                 "width": job.get("width", DEFAULTS["width"]),
                                 "height": job.get("height", DEFAULTS["height"]),
                                 "steps": job.get("steps", DEFAULTS["steps"]),
                                 "cfg": job.get("cfg", DEFAULTS["cfg"]),
                                 "hires": job.get("hires", DEFAULTS["hires"]),
                                 "seconds": round(cost, 1), "files": files,
                                 "prompt_id": pid})
            except Exception as exc:
                print("[X ] %-28s %s" % (label, exc))
                manifest.append({"job": job["name"], "label": label, "seed": seed,
                                 "error": str(exc)[:500]})
            total += 1

    if args.dry_run:
        print("\n干跑完成，共 %d 张，未提交。" % total)
        return 0

    with open(os.path.join(out_dir, "manifest.json"), "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=2)
    with open(os.path.join(out_dir, "manifest.csv"), "w", encoding="utf-8-sig", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(["job", "label", "seed", "size", "steps", "cfg", "hires", "seconds", "files", "error"])
        for m in manifest:
            w.writerow([m.get("job"), m.get("label"), m.get("seed"),
                        "%sx%s" % (m.get("width", ""), m.get("height", "")),
                        m.get("steps", ""), m.get("cfg", ""), m.get("hires", ""),
                        m.get("seconds", ""), ";".join(m.get("files", []) or []), m.get("error", "")])

    ok = sum(1 for m in manifest if not m.get("error"))
    print("\n完成 %d/%d，目录：%s" % (ok, len(manifest), out_dir))
    return 0 if ok else 2


if __name__ == "__main__":
    sys.exit(main())
