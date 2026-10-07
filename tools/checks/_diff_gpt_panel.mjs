import fs from 'node:fs';

function stripConsts(s) {
  return s.replace(/const XSD_CSS = '[^']+';/, 'const XSD_CSS = "";')
          .replace(/const XSD_SKELETON = '[^']+';/, 'const XSD_SKELETON = "";')
          .replace(/const XSD_FONT_B64 = '[^']+';/, 'const XSD_FONT_B64 = "";');
}

const f1 = fs.readFileSync('E:/角色卡制作/仙姝堕/卡片脚本/状态栏面板.js', 'utf8');
const f2 = fs.readFileSync('E:/火狐下载/status_panel_download/status_panel_optimized.js', 'utf8');

const s1 = stripConsts(f1).split(/\r?\n/);
const s2 = stripConsts(f2).split(/\r?\n/);

console.log('s1 lines:', s1.length, 's2 lines:', s2.length);

// Let's do a simple line-by-line diff or block diff
let i1 = 0, i2 = 0;
const diffBlocks = [];

while (i1 < s1.length || i2 < s2.length) {
  if (s1[i1] === s2[i2]) {
    i1++;
    i2++;
  } else {
    // Find next match
    let match1 = -1, match2 = -1;
    for (let d = 1; d < 100; d++) {
      if (i1 + d < s1.length && s1[i1 + d] === s2[i2]) {
        match1 = i1 + d; match2 = i2; break;
      }
      if (i2 + d < s2.length && s1[i1] === s2[i2 + d]) {
        match1 = i1; match2 = i2 + d; break;
      }
      if (i1 + d < s1.length && i2 + d < s2.length && s1[i1 + d] === s2[i2 + d]) {
        match1 = i1 + d; match2 = i2 + d; break;
      }
    }
    if (match1 !== -1) {
      diffBlocks.push({
        s1_range: [i1, match1],
        s2_range: [i2, match2],
        s1_lines: s1.slice(i1, match1),
        s2_lines: s2.slice(i2, match2),
      });
      i1 = match1;
      i2 = match2;
    } else {
      diffBlocks.push({
        s1_range: [i1, i1 + 1],
        s2_range: [i2, i2 + 1],
        s1_lines: s1.slice(i1, i1 + 5),
        s2_lines: s2.slice(i2, i2 + 5),
      });
      i1 += 5;
      i2 += 5;
    }
    if (diffBlocks.length > 50) break;
  }
}

console.log('Total diff blocks:', diffBlocks.length);
diffBlocks.forEach((b, idx) => {
  console.log(`\n--- Block ${idx + 1} (s1 lines ${b.s1_range[0]+1}-${b.s1_range[1]}, s2 lines ${b.s2_range[0]+1}-${b.s2_range[1]}) ---`);
  if (b.s1_lines.length) console.log('[- s1]:\n' + b.s1_lines.slice(0, 10).join('\n'));
  if (b.s2_lines.length) console.log('[+ s2]:\n' + b.s2_lines.slice(0, 10).join('\n'));
});
