'use strict';
/** ★ P2（gpt 接入说明 B）：把共享模块的运行时函数从同一文件注入卡内脚本，不手抄日期表。 */
const fs = require('fs');
const path = require('path');

function extractModuleFn() {
  const p = path.join(__dirname, 'timepoint-slider.cjs');
  const s = fs.readFileSync(p, 'utf8');
  const i = s.indexOf('function xdsTimepointModule');
  if (i < 0) throw new Error('timepoint-slider.cjs 里找不到 function xdsTimepointModule');
  let d = 0, j = s.indexOf('{', i), end = j;
  for (; j < s.length; j += 1) {
    if (s[j] === '{') d += 1;
    else if (s[j] === '}') { d -= 1; if (d === 0) { end = j + 1; break; } }
  }
  return s.slice(i, end);
}

/** 把模块函数插到脚本开头（只插一次；已有则原样返回） */
function injectTimepointModule(src) {
  if (!src || src.includes('function xdsTimepointModule')) return src;
  return extractModuleFn() + '\n\n' + src;
}

module.exports = { injectTimepointModule };
