# 状态机模块化基线源码清单（2026-10-10）

> **部署状态说明**：本目录下所有源码 **100% 严格对应当前已通过 21 项门禁检验并部署至 SillyTavern 的实际运行版本**。
> 本基线包含刚刚修复并实测验证过的：
> 1. 状态机真值防冲刷保护与多层权威账本自愈机制；
> 2. 动态身份识别（玩家夺舍/自设身份与名器归属动态对齐，拔除赵无忧硬编码）；
> 3. RFC-002 数值变量（relic_progress）浸润度计算与双重容错防御（通过 16 项反例校验）；
> 4. 首楼重构全套组件（菜单、时间滑块、花名册）；
> 5. 全套状态机相关离线检查门禁脚本，用于模块化拆分前后的等价性行为验证。

## 一、源码文件 SHA-256 清单

| 相对路径 | 大小 (Bytes) | SHA-256 |
| :--- | :--- | :--- |
| `卡片脚本/状态机.js` | 304,791 | `7cd5d1cb318d8b7a1f2795b98e20f9f53dad7cb7c9cf085a080f8a6395515830` |
| `_build_card.js` | 157,147 | `313de6672f33e0a982e3bc8b734416e44b88b5d41594dc662e337defb9c492ef` |
| `src/first_floor_rebuild/flower-roster.cjs` | 3,286 | `f5e35df4e73234eb01f00f98f232c226f4301fe0b9494427004fbc46eaffd83f` |
| `src/first_floor_rebuild/guide-roster.example.cjs` | 1,491 | `24c4c607765977db1338281db4c621c78794b3213f6d82fcec0f20c90c7b65d2` |
| `src/first_floor_rebuild/inject-timepoint.cjs` | 977 | `362fa822a8fdb96fb04a4ff296cff8668555a7bdaeedef1e713bb1702df485bf` |
| `src/first_floor_rebuild/layout-preview.html` | 23,744 | `1c8bd456605a33d833c0f47982d9136ffb57c68ef640bb3554af50dfc2126f8d` |
| `src/first_floor_rebuild/menu-builder.cjs` | 9,207 | `af361cdd6a5b6ca634914958a205d29c37be17d14527b51974a53427f80901ae` |
| `src/first_floor_rebuild/menu.css` | 11,868 | `85f7bd55b0b76c7befbd44a09fc47ca491ad95fbfdbe172f855253da35788d03` |
| `src/first_floor_rebuild/MENU_HTML.html` | 25,171 | `f49d8bf9f6ce846a14d44fb0d3a13bf55301bfe4637a32ed3e981a5a3bb29216` |
| `src/first_floor_rebuild/README.md` | 7,473 | `bbb89b19cd14ce5aed44f1e093618848da130f2106ed86f05a91501d6329608f` |
| `src/first_floor_rebuild/state_machine_first_floor.js` | 192,703 | `bf3fd5dea7aaa76b2732148d51601d4e8cead3a27e4da60f2ae50864de752dcf` |
| `src/first_floor_rebuild/test-results.json` | 1,137 | `3de3636d786b45bd4a3f55449809c52502d40d4af256c834a2ad38f03d7810aa` |
| `src/first_floor_rebuild/timepoint-slider.cjs` | 17,622 | `c5b15bc6bf98658e7b382ebb27a2efc57a806ea52e340c3caed00b332a6c139a` |
| `tools/checks/_chk_all.mjs` | 10,684 | `162c4b1f9a622566dce7b01fa96e5164b9093495850d8e66e478ace608679087` |
| `tools/checks/_chk_identity_sync.mjs` | 9,239 | `199d1fcec8a9452fc231727a106bb465cd153cdfc17d4bd6cb2868480940bb13` |
| `tools/checks/_chk_deflower_impersonation.mjs` | 3,476 | `14732f5d6071cda795a6042c2573b46fba9ba91c7542a7e69ab7722d57e0ce4a` |
| `tools/checks/_chk_stage_drive.mjs` | 8,180 | `0ff03991c782479f89025db569cae5021baec58d2b091c8a021c34de1e9d78b0` |
| `tools/checks/_chk_status_missing.mjs` | 10,055 | `0d3112ca622bc3db6f21004c569e1180318f205e156fb643cecdff0df8eb1236` |
| `tools/checks/_chk_relic_progress.mjs` | 10,596 | `0803bbacb7812166d71c7445ea9074651801d55265b505b1c2fd23ed6d8a0448` |
| `tools/checks/_chk_anchor_gate.mjs` | 3,933 | `f6da48eab78c42e7b58f156f61b7c3ba7807f77e55454cb55c8d8d20993ee903` |
| `tools/checks/_chk_relic_stage.mjs` | 6,009 | `d3b139d57d3743e9f405b011c50fabd3a580ba6a4f22eb670abdce18f387c25b` |
| `tools/checks/_chk_derive_ledger.mjs` | 7,909 | `81dd3220b0bb13a7da7df5c174f185a81e51e0b6f2f4281933b6bffd9bc87570` |
| `tools/checks/_chk_plot_gate.mjs` | 19,909 | `20c2838f447fffd9330a4274d7be91fb7a43494ea9bf3eb68dcbf6540779bd79` |
| `tools/checks/_chk_freefield_gate.mjs` | 8,228 | `a1825583f1b64216ec13fd2ce4d75843256676bb9b1b60413399dab88ebbd32c` |
| `tools/checks/_chk_clock_acc.mjs` | 9,589 | `08104734955cd7315e868db5ef3939be0254598851798fd816955e24f53cb710` |
| `tools/checks/_chk_defect_four.mjs` | 7,717 | `6ca8aa1d9cf1d8c7ea84ee9a414734c13c81f1687bab8423509b1981e322abd3` |
| `tools/checks/_chk_tick_preflight.mjs` | 11,127 | `4437bae41c027a860f2c1258360bc5d46feae216a528e5b2b897da037680ece5` |
| `tools/checks/_chk_syntax.mjs` | 2,292 | `6354a9f770ac17ae49d959ddb30cef38ee74d9759c33e7c04ea0ee7ebeacdddd` |
| `tools/checks/_chk_form_gate.mjs` | 36,632 | `54bfe1b623e490fa9bd06c875adb477bfe18cb72f734ae11ee296c8037824ba4` |
| `tools/checks/_chk_ejs_stage.mjs` | 23,853 | `057bf180b8fc5f6a17bc74504423cd2a8a334ce30dc9aa548afcf7bee9dec520` |
| `tools/checks/_chk_ejs_native.mjs` | 7,975 | `44db19e98d453c5ed713b6afba27aa3ef29b403aa7184cb7cb82651a62acbc82` |
| `tools/checks/_chk_mingqi_prereq.mjs` | 6,631 | `4946a0ba55178ba5a313d739a9c753d0f1a41fc431a5fd80ce4e19f76f5e5188` |
| `src/correction-runtime.js` | 32,326 | `1d07f7aab5f5b90b3744adc9b5d4a84cbd2e6d8e4a58231cb1b0a471b525b245` |
| `src/mingqi-db.js` | 42,005 | `06ba925487d9ab270b42512a06cd328c299197c732c23fa222c37f585bf49327` |

## 二、下级验证指引

在执行模块化拆分前后，可运行以下命令验证行为一致性：

```bash
& "C:\Program Files\nodejs\node.exe" tools/checks/_chk_all.mjs
& "C:\Program Files\nodejs\node.exe" tools/checks/_chk_relic_progress.mjs
& "C:\Program Files\nodejs\node.exe" tools/checks/_chk_identity_sync.mjs
& "C:\Program Files\nodejs\node.exe" tools/checks/_chk_deflower_impersonation.mjs
& "C:\Program Files\nodejs\node.exe" tools/checks/_chk_stage_drive.mjs
& "C:\Program Files\nodejs\node.exe" tools/checks/_chk_status_missing.mjs
```

所有门禁均应 100% 绿灯通过。
