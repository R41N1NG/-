# 奥森德 源码上传说明

- 上传时间：2026-11-19（Asia/Shanghai）
- 来源：本地工作区 `E:\角色卡制作\ntr妹妹\奥森德`
- 参考快照：https://github.com/R41N1NG/-/tree/cf39dd49214001a11fd4f1e2ba3ce3af1e42f893/奥森德
- 目标目录：仓库 `奥森德/`（与既有构建产物 `okh_complete.js`、`okh_complete_R4_card_autostart.js`、`奥克赫斯_R4配套.json`、`奥克赫斯_角色卡与脚本_R4.zip`、`README.md` 并存，未改动旧文件）

## 目录结构

```
奥森德/
├── src/
│   ├── app/     # 应用层：entry/adapter/hud/parse/rules/time/world/migrate/hook/debug/config/data
│   └── core/    # 核心层：adapter/api/turn/events/effects/nodes/rules/activity/utils
├── scripts/
│   ├── autostart.js
│   ├── build.cjs
│   ├── review-regressions.cjs
│   ├── test_card.cjs
│   └── test_foundation.cjs
└── MANIFEST_上传说明.md
```

## 文件数

- src/app：12 个
- src/core：9 个
- scripts：5 个
- 合计 26 个源码/脚本文件

## 构建

```
node scripts/build.cjs      # 由 src/ 生成 okh_complete.js
node scripts/test_card.cjs  # 卡本体回归
node scripts/test_foundation.cjs
node scripts/review-regressions.cjs
```
