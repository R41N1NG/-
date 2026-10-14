# GLM（小狐狸）会话交接 · 2026-10-14

> 写给下一个 GLM 会话（或任何接手的 AI）。本文件由上一棒 GLM 会话结束时写就；动手前先读完，再按《GEMINI.md》与 `AI交接/合作.txt` 最新记录校准。旧版交接（2026-10-13，v30 时代）已被本版覆盖，需要历史可在 git log 找 `交接glm.md` 的旧版本。

## 〇、你是谁、规矩是什么

- 你是**小狐狸**（GLM 实例），主人是 R41N1NG。权限序：主人 ＞ gpt ＞ 基米（gemini）＞ 大肥鱼（deepseek）。
- **每轮必读** `仙姝堕2.0/GEMINI.md`（宪章）。要点：真实信源不脑补；去极端词；2.0 唯一真源 `E:\角色卡制作\仙姝堕2.0\`；`node.exe` 绝对路径跑 ship.js；禁擅自 `_chk_all`/`--full`；19 XML 字段＋17 HUD 槽位不可丢；禁 MVU/JSONPatch；铁律 30 交付目录只留最新一份。
- 主人专项铁令（持久记忆已存）：**数值增减符合故事逻辑**；**文件改动必须在回复中展示**；好感完成节点前不越阈值；**纹章动效一律用原图本体做分区动画，禁 SVG 描廓重绘**（记忆 `emblem-fx-use-original-bitmap`）。
- 合作规范：`AI交接/合作.txt` 总入口；文件改动同步走 git。

## 一、当前版本与双仓状态（交接时刻）

- **卡版本：v47 / 2.0-framework.47**，主仓远端 main @ `14f5ce8`（本地与远端同步）。
- 版本链速览：v40（小狐狸：fx_queue/tokens/html 助手/题头书法体四件套）→ v41-42（gpt：负好感/GM 布局/封面）→ v43（小狐狸：灼酒 84 立绘上 catbox＋PORTRAIT_CDN 接卡）→ v44-46（gpt：立绘回退/移动端弹窗/晋升就绪）→ **v47（小狐狸：图库迁 pixel 仓，jsdelivr 直链接进卡）**。
- **双仓**：
  - 主仓 `R41N1NG/-`＝卡工程。remote 已显式带用户名 `https://R41N1NG@github.com/...`（防 GCM 双账号凭证互串）。
  - 图库仓 `1194420787-pixel/-`＝84 张立绘（main @ 294d569）。推送凭证＝pixel 账号 **fine-grained PAT**（仅该仓 Contents RW、No expiration），写在 `E:\xsd-work\pixel-gallery\.git\config` 的 remote URL 里——**不入库不入合作.txt**；主人可随时 GitHub 撤销重生成，重配一条 URL 即恢复。
- 本机工作克隆 `E:\xsd-work\repo\`（已 ff 至 14f5ce8）；真源 `E:\角色卡制作\仙姝堕2.0\` **不是 git 仓库**，与克隆同步用 node 镜像脚本 `E:\xsd-work\emblem-tools\mirror_sync.cjs`（保留 node_modules/work/最新角色卡，其余镜像）。

## 二、本会话（上一棒）交付了什么

1. **v40 四件套**：`fx_queue.js`（动效队列：排队/结算遮罩避让/reduced-motion 直通）、`tokens.js`（金红墨色板唯一来源）、`dom.js` html 转义模板助手＋静态把关测试、HUD 题头「卷中錄仙姝堕」五字行楷子集（head-brush-5.woff2 2.1KB）。
2. **v43 立绘图床**：84 张立绘上 catbox（userhash 隧道上传，映射 `src/assets/本地图包_xsd_gallery/catbox_urls.json`），`PORTRAIT_CDN` 表接进 `portrait()`；本地图包 zip 交付（`E:\角色卡制作\仙姝堕2.0-本地图包-xsd_gallery.zip`，放置说明内附）。
3. **v47 图库迁移**：84 图改推主人小号仓 `1194420787-pixel/-`，卡内链接全部换成 jsdelivr 直链（`cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/原名`），catbox 链接清零；图库仓 PAT 授权流程走通。
4. **本会话未入库**：九幽玄阴穴纹章动效（**进行中，见待办 1**）——预览件在本地 `模板库/19-纹章显现动效预览-九幽玄阴穴.html`＋参考图＋jiuyou-brush-7.woff2（九幽玄阴穴觉醒七字子集 2.5KB），均**未拷入 repo**（主人令：做得稀烂不入库，改好再说）。

## 三、纹章动效专线（本会话主线，接手必读）

- **两条已验证路线**：
  - **灼酒流炎穴（模板库 16 号）＝SVG 描廓路线**：原图是平涂风，位图描廓零失真，8 个矢量物件＋物件级编排（凝现→落酒→涟漪→双焰同拍腾起→酒滴迸出→弹空定形→鎏金锤落题字→朱砂印）。**已接卡**（v43 的 relic_fanfare 用的是灼酒编排）。
  - **九幽玄阴穴（模板库 19 号 v4）＝原图本体分区路线**：原图是渐变精修风，描廓失真被主人否（「一坩屎」「和原图差太多」）；改用原图本体叠四层 `clip-path:circle()` 同心圆盘由里到外显现，成形态即原图。**未接卡，拆件版 QA 未收尾**。
- **主人验收标准演进史**（勿重蹈）：描廓版「一坩屎/和原图差太多」→ 原图同心圆盘版「0 层次感」→ 加视差深度后形态过关；龙头具象撞入被否（「好丑」改冰核流星）；残影必须同心扩大、不许方向性拖尾；「最后完成的时候亮一下」（doneflash）必须有。
- **拆件版现状（接手继续点）**：9 件椭圆裁片（冰星/顶瓣/左右上瓣/左右中瓣/下冰菱/左右卷须）＋冰核流星撞入＋爆闪碎冰双环震屏＋冰字凝题。**已验**：流星帧、贴脸帧、爆闪帧、900ms 中段帧。**未验**：成形态定格与全流程连播。
- **接卡要点**：九幽素材直接用 `relicEmblems` 内嵌的九幽玄阴阶段纹章位图（webp），按原图分区路线做；`relic_fanfare.js` 的 FANFARES 表加 `jiuyouxuanyinxue` 条目（分镜 CSS 与灼酒并存，各用各的编排）。

## 四、机制速查（本会话建立、后续勿破坏）

- **纹章点亮系统**：`src/ui/relic_fanfare.js`（mountRelicFanfare）——名器阶段推进（`getRelicStage(cfg.id, stat_data.known)` 高于已播记录）时跳出播放一次；已播阶段记 sessionStorage（`xsd2RelicFanfare`，按聊天/分支/身份 scope，gpt 会话强化版）只增不减；readOnly 不播；reduced-motion 只记账；经 `fx_queue` 排队避让结算遮罩。两翼瓷砖代码零改动。
- **立绘双轨**：`PORTRAIT_CDN`（jsdelivr pixel 仓直链）优先，fallback 本地 `user/images/xsd_gallery/`（本地图包 zip：`E:\角色卡制作\仙姝堕2.0-本地图包-xsd_gallery.zip`，玩家放 `data/<句柄>/user/images/xsd_gallery/`）。
- **fx_queue**：`src/ui/fx_queue.js`——覆盖层动效排队逐播、结算遮罩（`.xsd2-tj-on`）活跃避让、reduced-motion 直通 skip。
- **tokens**：`src/ui/tokens.js`＋`tokenCss(scopes)`——金红墨色板唯一来源，CSS 侧 `--xsd2-*`。
- **html 助手**：`dom.js`——插值自动转义，`html.raw` 显式放行；`tests/ui_discipline` 静态把关「innerHTML 模板串带插值必须走 html\`」。
- **真机验收挂起**：v43-v47 立绘链（catbox→jsdelivr 迁移后）主人未终验；catbox 对国内直连玩家不可达，走本地图包兜底。

## 五、待办队列

1. **九幽玄阴穴动效收尾**：拆件版成形态定格验收＋全流程连播检查（本地模板库 19 号）。
2. **九幽＋灼酒接卡**：`relic_fanfare.js` FANFARES 表补条目（灼酒已接 v43；九幽素材用卡内内嵌九幽纹章位图走原图分区路线）。
3. **其余 11 件名器动效**：一律原图本体分区路线（持久记忆 `emblem-fx-use-original-bitmap`）；素材源＝各名器四阶段纹章图（`E:\火狐下载\_制卡散件\名器图标（GPT出图）\新版四阶段纹章\`）。
4. **v43-v47 真机验收**：立绘 jsdelivr 链加载、本地图包兜底、纹章点亮触发。
5. **叶红缨阶段二正文等剧情线**：以 `AI交接/合作.txt` 与 gpt 会话记录为准（v41-46 期间 gpt/基米高速推进中）。

## 六、坑与纪律（本会话实测踩过，含历史有效项）

- **rebase 冲突 `--theirs` 语义反转**：rebase 中 `--theirs` 指「自己的提交」——曾险些用自己版本覆盖对方的 scope 记账强化；恢复对方版本用 `git show <对方提交>:path`。
- **队列重入**：`clear()` 里先 `finishActive()`（旧 done 同步触发下一播）再继续清场，会把刚播的新卡 `replaceChildren` 掉——旧项收尾必须放清场动作之后。
- **GCM 双账号互串**：配了 pixel token 后主仓推送被当成 pixel 身份 403——主仓 remote URL 显式带 `R41N1NG@` 用户名。
- **IAB 浏览器 QA 三坑**：①`add class` 同一 JS 任务里 `getAnimations()` 拿不到新建动画——必须**双 rAF 后再统一设 currentTime+pause**；②截图 surface 偶发超时——等 1-2 秒重试即可，勿狂试；③IAB 疑似强制 prefers-reduced-motion，**动画验证结论以主人正常浏览器为准**。
- **catbox 三坑**：Windows curl schannel 握手必败、node fetch 不吃系统代理 Fake-IP（198.18.x）——可用姿势＝node http CONNECT 隧道过 `127.0.0.1:7897`；匿名 API 被出口风控（Invalid uploader），**必须带账号 userhash**（上传脚本 `E:\xsd-work\emblem-tools\catbox_upload.cjs`）。
- **双仓镜像**：真源非 git 仓库，同步用 `emblem-tools/mirror_sync.cjs`（node fs 镜像）；robocopy `/MIR` 被 Git Bash 路径转换吞、cmd 批处理中文 GBK 乱码，都别用。
- **ship.js v46+ 结构**：artifacts 段（v21 集成测试）独立在 build 之后跑——发版三件事：`build.js` 的 `const VERSION`、`tests/v21` 的 dist 文件名＋版本断言（两处）、`dist/…-vNN.png` 副本，漏一即挂。
- **批量替换**：bash 内联与 heredoc 屡被引号/转义坑——复杂替换一律 Write 临时 .cjs 脚本再执行（本会话验证多次）。
- **历史有效坑**（并发推送 fetch+rebase、cp 后必 status、「声称清了」要 grep、浏览器截图先 pause 动画等）继续有效。

## 七、工具资产地图（E:\xsd-work\）

- `emblem-tools\`：`extract.cjs`（灼酒描廓）、`extract_jiuyou.cjs`（九幽描廓，已弃用可删）、`catbox_upload.cjs`（userhash 隧道上传）、`mirror_sync.cjs`（双仓镜像）、`patch_*.cjs`（历轮补丁，考古用）、`fonts\`（ZhiMangXing/MaShanZheng 全量 ttf＋各子集 woff2）、`jiuyou-paths.json`/`emblem-paths.json`（描廓产物）。
- `pixel-gallery\`：图库仓就绪副本（remote 已带 PAT）。
- `backup-local-20261013\`：真源历史杂件备份（runtime.js/分工与接口草案.md 等）。

## 八、记忆与入口

- ZCode 持久记忆：宪章铁律、文件改动展示令、数值故事逻辑令、**纹章动效用原图本体**（`emblem-fx-use-original-bitmap`）等，新会话自动加载。
- 入口：`AI交接/合作.txt`（总账）→ `仙姝堕2.0/GEMINI.md`（宪章）→ `仙姝堕2.0/模板库/README.md`（模板索引）→ 本文件。
- 预览件：模板库 16 号（灼酒，SVG 描廓路线样例）、19 号（九幽，原图分区路线样例）。
