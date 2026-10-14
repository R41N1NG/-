# 小狐狸（GLM）本地交接 · 2026-10-14

> 写给下一个 GLM 会话（或任何接手的 AI）。只记录**小狐狸本会话自己的工作与本地状态**；并行会话（gpt/基米）的改动一律不在此文，远端与版本以 `AI交接/合作.txt`、远端 main 本身和《GEMINI.md》为准。动手前先读《GEMINI.md》。

## 〇、身份与规矩

- 你是**小狐狸**（GLM 实例），主人是 R41N1NG。权限序：主人 ＞ gpt ＞ 基米（gemini）＞ 大肥鱼（deepseek）。
- **每轮必读** `仙姝堕2.0/GEMINI.md`（宪章）：真实信源不脑补；去极端词；真源 `E:\角色卡制作\仙姝堕2.0\`；`node.exe` 绝对路径跑 ship.js；禁擅自 `--full`；铁律 30 交付目录只留最新一份。
- 主人专项铁令（持久记忆已存）：数值增减符合故事逻辑；文件改动必须在回复中展示；好感完成节点前不越阈值；**纹章动效一律用原图本体做分区动画，禁 SVG 描廓重绘**（本会话用血泪换来，记忆 `emblem-fx-use-original-bitmap`）。
- 并行会话高频推远端：动手前必 `git fetch`，被拒就 rebase；他们的版本号与改动**不要接管、不要复旧**，冲突取并集。

## 一、本会话小狐狸做了什么（按时间序）

1. **灼酒流炎穴纹章显现动效**（`模板库/16-纹章显现动效预览-灼酒流炎穴.html`）：SVG 描廓 8 物件＋物件级编排（金爵凝现→酒滴坠落→涟漪→双火舌同拍腾起→酒滴迸出→酒液弹空定形→鎏金行楷锤落题字→朱砂「觉醒」印→完成亮一下→待机）。多轮迭代（分镜重排/左右同拍/锤落题字/朱砂印），主人认可形态。**已接卡**：`relic_fanfare.js` FANFARES 表 `zhuojiuliuyanxue` 条目（v43）。
2. **本地图包**：`E:\角色卡制作\仙姝堕2.0-本地图包-xsd_gallery.zip`（84 张立绘＋命名说明＋玩家放置说明）。玩家放置路径：`<酒馆>/data/<句柄>/user/images/xsd_gallery/`（默认 `default-user`）。
3. **catbox 图床**：84 张立绘经 userhash 隧道上传成功（脚本 `E:\xsd-work\emblem-tools\catbox_upload.cjs`，userhash 在脚本内）；链接映射存 `src/assets/本地图包_xsd_gallery/catbox_urls.json`。**注意**：catbox 匿名 API 对本机可用出口风控（Invalid uploader），必须带 userhash；国内直连玩家不可达。
4. **v43**：`PORTRAIT_CDN`（catbox 链接 84 条）接进 `portrait()`。
5. **v47**：图库迁主人小号仓 `1194420787-pixel/-`（84 图，`294d569`），卡内链接全部换成 jsdelivr 直链（`cdn.jsdelivr.net/gh/1194420787-pixel/-@main/xsd_gallery/原名`），catbox 链接清零；**本地图包 zip 保留作双轨兜底**。
6. **v40 四件套**：`fx_queue.js`（动效队列＋结算遮罩避让＋reduced-motion 直通）、`tokens.js`（色板）、`dom.js` html 转义助手＋`tests/ui_discipline` 静态把关、HUD 题头「卷中錄仙姝堕」五字行楷子集。
7. **九幽玄阴穴纹章动效**（`模板库/19-…九幽玄阴穴.html`）：**进行中未收尾**。路线演进：SVG 描廓（被否，渐变图失真）→ 原图本体四层同心圆盘＋视差深度（层次感解决）→ 拆件版（9 件椭圆裁片＋物件级编排，QA 进行到 900ms 中段帧）。**主人最后验收点未完成：成形态定格未复验、题字显示未复验。**
8. **行楷字体子集**：`模板库/` 下 mashanzheng-7（马善政楷）、zhimangxing-7（志莽行书，卡内现用）、head-brush-5（卷中錄仙姝堕题头）、jiuyou-brush-7（九幽玄阴穴觉醒，**未入库**——九幽动效未完成不入库）。

## 二、本地状态（交接时刻）

- 小狐狸本地真源 `E:\角色卡制作\仙姝堕2.0\`：含 19 号九幽预览件、四份字体子集、九幽参考图——**九幽三件按主人令未入 git**。
- 工作克隆 `E:\xsd-work\repo\`：已 rebase 至本轮推送的最新远端（83bc089 之后的远端变动未拉——接手先 fetch）。
- 主仓推送凭证：remote URL 显式带 `R41N1NG@` 用户名（GCM 双账号防互串）。
- 图库仓推送凭证：pixel 账号 fine-grained PAT 在 `E:\xsd-work\pixel-gallery\.git\config` 的 remote URL 里（不入库）。

## 三、纹章动效专线（接手必读）

- **两条已验证路线**：
  - **灼酒＝SVG 描廓路线**（模板库 16 号）：适合平涂风原图，物件级编排质感最好，**已接卡**。
  - **九幽＝原图本体分区路线**（模板库 19 号 v2+）：适合渐变精修风原图，同一原图叠多层 `clip-path:circle()` 同心圆盘由里到外显现，成形态即原图。**拆件版（9 件椭圆裁片＋物件级编排）QA 未收尾**。
- **接卡要点**：九幽接卡素材用 `relicEmblems` 内嵌的九幽玄阴阶段纹章位图，`relic_fanfare.js` FANFARES 表加 `jiuyouxuanyinxue` 条目；分镜 CSS 与灼酒并存（各名器各编排）。
- **主人验收标准备忘**：形必须与原图一致；要有层次感（视差深度/冰星浮层）；残影只做同心扩大；完成时必须亮一下；题字用行楷子集。

## 四、待办队列（小狐狸线）

1. **九幽拆件版收尾**：成形态定格验收、题字显示复验（IAB 环境字体渲染待确认，以主人浏览器为准）、全流程连播检查。
2. **九幽接卡**：主人确认分镜后，`relic_fanfare.js` FANFARES 表加 `jiuyouxuanyinxue`（素材=卡内内嵌九幽纹章位图，原图分区路线）。
3. **其余 11 件名器动效**：一律原图本体分区路线；素材源＝`E:\火狐下载\_制卡散件\名器图标（GPT出图）\新版四阶段纹章\`。
4. **立绘链真机验收**：jsdelivr 直链加载、本地图包兜底、九幽/灼酒纹章点亮触发。

## 五、坑与纪律（本会话实测踩过；历史有效坑见文末）

- **rebase 冲突 `--theirs` 语义反转**：rebase 中 `--theirs` 指「自己的提交」——曾险些用自己版本覆盖对方强化；恢复对方版本用 `git show <对方提交>:path`。
- **队列重入**：`clear()` 先 `finishActive()` 再清场，顺序反了会把刚播的新卡 `replaceChildren` 掉。
- **GCM 双账号互串**：配小号 token 后主仓推送被当成小号身份 403——主仓 remote URL 显式带 `R41N1NG@` 用户名解决。
- **IAB QA 三坑**：①`add class` 同任务 `getAnimations()` 拿不到新动画——**双 rAF 后再统一设 currentTime+pause**；②截图 surface 偶发超时——等 1-2 秒重试；③IAB 疑似强制 prefers-reduced-motion——**动效结论以主人正常浏览器为准**。
- **catbox 三坑**：Windows curl schannel 握手必败；node fetch 不吃系统代理 Fake-IP（198.18.x）；匿名 API 被出口风控（Invalid uploader）——唯一可用姿势＝node http CONNECT 隧道过 `127.0.0.1:7897`＋账号 userhash。
- **ship.js 结构（v46+ 由并行会话重构）**：artifacts 段（v21 集成测试）独立在 build 之后跑；发版三件事＝`build.js` 版本串、`tests/v21` 的 dist 文件名＋版本断言（两处硬编码）、`dist/…-vNN.png` 副本，漏一即挂。
- **批量替换老坑**：bash 内联与 heredoc 屡被引号/转义坑——复杂替换一律 Write 临时 .cjs 脚本执行（本会话再次验证）。
- **双仓镜像**：真源非 git 仓库，同步用 `E:\xsd-work\emblem-tools\mirror_sync.cjs`（node fs 镜像）；robocopy `/MIR` 被 Git Bash 吞、cmd 批处理中文 GBK 乱码，都别用。
- **历史有效坑**：并发推送 fetch+rebase、cp 后必 status、「声称清了」要 grep 验证、旧工程 1.0 GBK 特批才进、合作.txt 冲突取并集提交前 grep 自查。

## 六、工具资产地图（E:\xsd-work\）

- `emblem-tools\`：`extract.cjs`（灼酒描廓）、`extract_jiuyou.cjs`（九幽描廓，已弃用留档）、`catbox_upload.cjs`（userhash 隧道上传）、`mirror_sync.cjs`（双仓镜像）、`patch_*.cjs`（历轮补丁，考古用）、`fonts\`（ZhiMangXing/MaShanZheng 全量 ttf＋各子集 woff2）、`jiuyou-paths.json`/`emblem-paths.json`（描廓产物，考古用）。
- `pixel-gallery\`：图库仓就绪副本（remote 已带 PAT，可直接推后续图）。
- `pkg\xsd_gallery\`：本地图包源文件（84 图＋README）。
- `backup-local-20261013\`：真源历史杂件备份。

## 七、记忆与入口

- ZCode 持久记忆（新会话自动加载）：宪章铁律、文件改动展示令、数值故事逻辑令、**纹章动效用原图本体**（`emblem-fx-use-original-bitmap`）等。
- 入口：`AI交接/合作.txt`（总账）→ `仙姝堕2.0/GEMINI.md`（宪章）→ `仙姝堕2.0/模板库/README.md`（模板索引）→ 本文件。
- 预览件：模板库 16 号（灼酒，描廓路线样例）、19 号（九幽，原图分区路线样例）。
