/**
 * P43_cast_vertical_scroll.mjs —— 把「在场要角」的样式从**横排**改回**原竖排版式 ＋ 框内上下滑动**。
 * （主人 2026-10-09 更正：他要的是"在原来在场人物框一圈内上下滑动显示更多人物和立绘"，不是横排翻页。）
 * 两处同步：tools/previews/_card_panel_v4.css 与 …_v4.replace.html
 */
import fs from 'node:fs';

const OLD_RE = /\n?\/\* ═══ 在场要角：一行横排[\s\S]*?@media \(max-width:640px\)\{[^\n]*\}\n?/;
const NEW = `
/* ═══ 在场要角：**保留原竖排版式**，在同一个框内**上下滑动**看更多人（主人 2026-10-09 更正）═══
   框的可视高度由脚本内联给出（CAST_VIEW_H，≈原来 3 张卡高）⇒ 不额外占位置；超出的人上下滑。 */
.xh-cast{position:relative}
.xds-cast-box[data-xds="cast"]{display:block;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;
  scrollbar-width:thin;scrollbar-color:rgba(190,160,90,.55) rgba(255,255,255,.05)}
.xds-cast-box[data-xds="cast"]::-webkit-scrollbar{width:6px}
.xds-cast-box[data-xds="cast"]::-webkit-scrollbar-track{background:rgba(255,255,255,.05);border-radius:3px}
.xds-cast-box[data-xds="cast"]::-webkit-scrollbar-thumb{background:rgba(190,160,90,.55);border-radius:3px}
.xds-cast-box[data-xds="cast"]>.xds-cc{margin-top:6px}
.xds-cast-box[data-xds="cast"]>.xds-cc:first-child{margin-top:0}
`;
const MARK_NEW = '/* ═══ 在场要角：**保留原竖排版式**';

for (const [p, isHtml] of [['tools/previews/_card_panel_v4.css', false], ['tools/previews/_card_panel_v4.replace.html', true]]) {
  let t = fs.readFileSync(p, 'utf8');
  if (t.includes(MARK_NEW)) { console.log('  已有竖排块，跳过：' + p); continue; }
  if (!OLD_RE.test(t)) { console.error('✘ 找不到旧横排块，未改：' + p); process.exitCode = 2; continue; }
  t = t.replace(OLD_RE, NEW);
  fs.writeFileSync(p, t, 'utf8');
  console.log('  ✔ 横排块已替换为竖排＋上下滑动：' + p);
}
