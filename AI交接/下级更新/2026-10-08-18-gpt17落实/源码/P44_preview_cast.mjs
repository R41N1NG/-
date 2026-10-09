/**
 * P44_preview_cast.mjs —— 出**两张真预览图**（同款 CSS、同款 DOM、同款测量逻辑，Chrome headless 截图）。
 *   ① 3 张：证明「原来的任何都不变」（不设高度、无滚动条、自动撑开）
 *   ② 5 张：上限 3 ⇒ 5 后的样子（框高＝**实测原来 3 张的高度**，装不下 ⇒ 框内上下滑动，右侧细金滑块）
 * 只读生产件与模板，不改任何源码。
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = 'E:/角色卡制作/仙姝堕';
const OUT_DIR = 'E:/角色卡制作/导出/预览图';
fs.mkdirSync(OUT_DIR, { recursive: true });

const panel = fs.readFileSync(path.join(ROOT, '卡片脚本/状态栏面板.js'), 'utf8');
const mCss = /const XSD_CSS = '([^']+)'/.exec(panel);
const CSS = mCss ? Buffer.from(mCss[1], 'base64').toString('utf8') : '';
const tpl = fs.readFileSync(path.join(ROOT, '卡片脚本/_src/状态栏面板.模板.js'), 'utf8');
const CAST_MAX = Number((/const CAST_MAX = (\d+);/.exec(tpl) || [])[1] || 5);
const CAST_BASE = Number((/const CAST_BASE = (\d+);/.exec(tpl) || [])[1] || 3);
console.log('  CSS ' + CSS.length + ' 字符｜上限 ' + CAST_MAX + '｜基准（原来可见数）' + CAST_BASE);

const GAL = 'E:/tavern/SillyTavern/data/default-user/user/images/xsd_gallery';
const 人 = [
  { 名: '苏瑶', py: 'suyao', 关系: '委身顺从', 情况: '元阴尽失，忧思前路只能依附他', 心境: '破身痴缠后心绪难平', 神态: '青丝披散，掩衣苦叹' },
  { 名: '苏玲', py: 'suling', 关系: '破身痴缠', 情况: '赤体酸软，全副身心赖在郎中怀里', 心境: '羞愤与依赖交战', 神态: '挂颈抽泣，下身泛潮' },
  { 名: '孤月', py: 'guyue', 关系: '剑峰大师姐', 情况: '冰心剑意未散，护道而立', 心境: '冷冽自持', 神态: '按剑不语' },
  { 名: '叶红缨', py: 'yehongying', 关系: '赤羽仙子', 情况: '蛊火未消，气机紊乱', 心境: '强撑体面', 神态: '扶墙喘息' },
  { 名: '云织梦', py: 'yunzhimeng', 关系: '师尊之徒', 情况: '乳窍初通，按脉问药', 心境: '医者自持', 神态: '垂眸诊脉' },
];
const 立绘 = (py) => {
  for (const ext of ['png', 'jpg', 'webp']) {
    const p = path.join(GAL, py + '.' + ext);
    if (fs.existsSync(p)) return 'file:///' + p.replace(/\\/g, '/');
  }
  return '';
};
const 卡 = (c) => {
  const img = 立绘(c.py);
  const 图 = img ? '<img src="' + img + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block">' : '';
  const rows = [['关系', c.关系], ['情况', c.情况], ['心境', c.心境], ['神态', c.神态]]
    .map(([k, v]) => '<div class="xds-cc-r"><span class="xds-ck">' + k + '</span><span class="xds-cv">' + v + '</span></div>').join('');
  return '<div class="xds-cc"><div class="xds-pw" style="flex:0 0 44px;width:44px;height:56px;position:relative;overflow:hidden;border-radius:2px">' + 图 + '</div>'
    + '<div class="xds-cc-body"><div class="xds-cc-h">' + c.名 + '</div>' + rows + '</div></div>';
};
/* 与卡内 renderCast 同一套测量逻辑：只有超过 CAST_BASE 张才设高度 */
const 设高脚本 = '<script>(function(){var box=document.querySelector(\'[data-xds="cast"]\');var kids=box.children,BASE=' + CAST_BASE + ';'
  + 'function f(){if(kids.length>BASE&&kids[BASE-1]){var b=kids[BASE-1].offsetTop+kids[BASE-1].offsetHeight;if(b>0){box.style.maxHeight=b+\'px\';return;}}box.style.maxHeight=\'none\';}'
  + 'f();requestAnimationFrame(f);})();<\/script>';

const 出图 = (n, cap) => {
  const HTML = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>' + cap + '</title>'
    + '<style>' + CSS + '</style>'
    + '<style>body{margin:0;background:#0d0b10;padding:14px;font:14px/1.6 system-ui,"Microsoft YaHei",sans-serif}'
    + '.wrap{width:520px;background:#141118;border:1px solid rgba(170,140,74,.35);border-radius:6px;padding:12px}'
    + '.cap{color:#8f886f;font-size:12px;margin:0 0 8px}</style></head><body>'
    + '<div class="wrap"><p class="cap">' + cap + '</p>'
    + '<div class="xh-cast"><div class="xds-cast-box" data-xds="cast"></div></div></div>'
    + 设高脚本.replace('</div>', '') + '</body></html>';
  const htmlPath = path.join(OUT_DIR, '在场要角_' + n + '张.html');
  // 先写骨架卡，再补脚本
  const 内容 = HTML.replace('<div class="xh-cast"><div class="xds-cast-box" data-xds="cast"></div></div>',
    '<div class="xh-cast"><div class="xds-cast-box" data-xds="cast">' + 人.slice(0, n).map(卡).join('') + '</div></div>');
  fs.writeFileSync(htmlPath, 内容, 'utf8');
  const pngPath = path.join(OUT_DIR, '在场要角_' + n + '张.png');
  execFileSync('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new', '--disable-gpu', '--allow-file-access-from-files', '--force-device-scale-factor=1',
    '--virtual-time-budget=2000', '--window-size=580,560',
    '--screenshot=' + pngPath, 'file:///' + htmlPath.replace(/\\/g, '/'),
  ], { stdio: 'inherit' });
  console.log('  ✔ ' + pngPath + '（' + fs.statSync(pngPath).size + ' B）');
};
出图(CAST_BASE, '预览①：' + CAST_BASE + ' 个（＝原来；框自动撑开、无滚动条，一切照旧）');
出图(CAST_MAX, '预览②：' + CAST_MAX + ' 个（上限 3→5；框高＝原来 ' + CAST_BASE + ' 张卡的高度，其余上下滑动）');
