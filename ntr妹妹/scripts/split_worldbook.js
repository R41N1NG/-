const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const srcPath = path.join(projectRoot, '设定_世界书正式条目与角色切片全案.md');
const outDir = path.join(projectRoot, '世界书条目');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const content = fs.readFileSync(srcPath, 'utf8');
const lines = content.split(/\r?\n/);

// Copy full file into 世界书条目/全案汇总_世界书正式条目与角色切片全案.md
const fullDst = path.join(outDir, '全案汇总_世界书正式条目与角色切片全案.md');
fs.writeFileSync(fullDst, content, 'utf8');

// Section slices:
// Part 0: lines 0..47
// Part 1: lines 48..106
// Part 2: lines 107..193
// Part 3: lines 194..611
// Part 4: lines 612..780
// Part 5: lines 781..949
// Part 6: lines 950..1222
// Part 7: lines 1223..1262

function cleanBlock(arr) {
  let s = arr.join('\n').trim();
  if (s.endsWith('---')) {
    s = s.slice(0, -3).trim();
  }
  return s + '\n';
}

const fileSpecs = [
  {
    name: '00_目录与架构总览.md',
    header: '# 世界书条目 · 目录与架构总览\n\n',
    content: cleanBlock(lines.slice(0, 48))
  },
  {
    name: '01_静态总纲与法则层.md',
    header: '# 世界书条目 · 静态总纲与法则层\n\n> 属性：常驻条目 (constant: true · at_depth)\n\n---\n\n',
    content: cleanBlock(lines.slice(48, 107))
  },
  {
    name: '02_场景空间层.md',
    header: '# 世界书条目 · 场景空间层\n\n> 属性：关键词触发场景 (constant: false · at_depth)\n\n---\n\n',
    content: cleanBlock(lines.slice(107, 194))
  },
  {
    name: '03_小队全员档案.md',
    header: '# 世界书条目 · 小队全员档案与双轨条目\n\n> 属性：5人小队全员标准三层解耦档案 (census / d1 / d3)\n\n---\n\n',
    content: cleanBlock(lines.slice(194, 612))
  },
  {
    name: '04_外部特派与修会角色.md',
    header: '# 世界书条目 · 外部特派与修会角色\n\n> 属性：王国特派与晨曦修会标准三层解耦档案 (census / d1 / d3)\n\n---\n\n',
    content: cleanBlock(lines.slice(612, 781))
  },
  {
    name: '05_潜伏幕后角色.md',
    header: '# 世界书条目 · 潜伏幕后角色 (双轨独立档案)\n\n> 属性：爱德表面伪装版与古龙真身版双轨隔离档案\n\n---\n\n',
    content: cleanBlock(lines.slice(781, 950))
  },
  {
    name: '06_反派与地方势力角色.md',
    header: '# 世界书条目 · 反派与地方势力角色\n\n> 属性：地方世俗霸凌势力标准三层解耦档案 (census / d1 / d3)\n\n---\n\n',
    content: cleanBlock(lines.slice(950, 1223))
  },
  {
    name: '07_世界书检索清册.md',
    header: '# 世界书条目 · 检索关键词 (Keys) 与插入深度 (Depth) 汇总清册\n\n> 属性：世界书 26 项标准条目检索清册与挂载规则\n\n---\n\n',
    content: cleanBlock(lines.slice(1223))
  }
];

for (const spec of fileSpecs) {
  const filePath = path.join(outDir, spec.name);
  fs.writeFileSync(filePath, spec.header + spec.content, 'utf8');
  console.log(`Created: ${spec.name} (${spec.content.split('\n').length} lines)`);
}

console.log('Done splitting worldbook entries.');
