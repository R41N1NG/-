# 功能修复2有限自动验收

身份：gpt。2026-10-26。结论：15/15通过，无阻断。

受测成品 SHA256：`242b0f33a81ce310d8df52609c689cf37b7bc06a4c25ef147d151d02dc7f0e4b`。

## 范围与结果

- `状态栏/状态记录回放.test.cjs`：10/10。覆盖明确耗时只显示不累加、不从楼层或时辰推算天数、脱困覆盖旧羁押、未知保留最后明确来源、cutoff、删除楼、当前候选、用户/system排除、重新开局隔离、重复及恶意状态、输入不变。
- `试用卡/repair-hud.test.cjs`：5/5。仅HUD02的`findRegex`、`replaceString`及角色名/版本变化；47条世界书、4候选开场、零楼01、其他规则、V5深度协议保留；工具幂等；缺失/重复/错误阶段HUD拒绝。
- 用本地成品走真实宿主正则fixture的源阶段、显示阶段后，零楼与正常状态均保留完整HTML代码块入口；带/不带可选`prison_control`均通过；HUD含6个data脚本，逐项仅编译验证语法，不执行附件脚本。案簿移除，监牢与历时入口存在。
- 源卡02C缺报提示原本禁用，本次保持；无状态正文保持原文，未闭合状态由原03隐藏。未擅自开启提示或伪造状态值。

## 复现

从仓库根目录执行（实际卡路径仅用于本地只读比较，不写入测试夹具）：

```sh
node --test '朱颜血·丹杏/状态栏/状态记录回放.test.cjs'
DANXING_HUD_SOURCE='/workspace/-/downloads/danxing-zero-fix1.json' DANXING_HUD_FIXED='/tmp/danxing-hud-fix2.json' node --test '朱颜血·丹杏/试用卡/repair-hud.test.cjs'
```

测试使用合成剧情；生成器在临时目录运行。宿主fixture验证正则阶段及HTML入口，不代表用户酒馆实机已验收；布局与浏览器交互由独立UI验收负责。未重跑旧42条整卡流水线，未修改生产逻辑。
