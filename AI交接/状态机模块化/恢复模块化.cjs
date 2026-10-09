/* 身份：gpt。只恢复源码；已构建/部署的卡仍须重新构建/部署。默认只读。 */
'use strict';
const fs = require('node:fs'), path = require('node:path');
const { canonical, digest, safePath, replaceFiles } = require('./候选源码/src/state-machine/build.cjs');
function restore(target, backup, { apply = false, io = fs } = {}) {
  target = path.resolve(target); backup = path.resolve(backup);
  const backupRoot = path.resolve(target, 'AI交接/状态机模块化备份');
  if (!backup.startsWith(backupRoot + path.sep)) throw Error('必须使用该项目的模块化备份目录');
  const delivery = JSON.parse(fs.readFileSync(path.join(__dirname, '交付清单.json'), 'utf8'));
  const records = JSON.parse(fs.readFileSync(safePath(backup, '恢复清单.json'), 'utf8')).files;
  if (!Array.isArray(records) || records.length !== delivery.files.length) throw Error('恢复清单不完整');
  const byPath = new Map(delivery.files.map(f => [f.path, f])), seen = new Set(), prepared = [];
  for (const r of records) {
    const f = byPath.get(r.path);
    if (!f || seen.has(r.path) || typeof r.existed !== 'boolean') throw Error('恢复清单路径重复或不符');
    seen.add(r.path);
    const dest = safePath(target, r.path);
    const current = fs.existsSync(dest) ? fs.readFileSync(dest) : null;
    let bytes;
    if (r.existed) {
      bytes = fs.readFileSync(safePath(backup, r.path));
      if (digest(bytes) !== r.previousSHA256 || !f.acceptedSHA256.includes(digest(canonical(bytes)))) throw Error('备份SHA不符：' + r.path);
    } else if (r.previousSHA256 !== null) throw Error('缺失文件的恢复记录不符');
    // 中途失败可能留下“候选/已恢复原文/原来及现在均缺失”的混合状态。
    const alreadyRestored = r.existed ? current && current.equals(bytes) : current === null;
    if (alreadyRestored) continue;
    if (!current || digest(canonical(current)) !== f.sha256) throw Error('目标安装后又有修改，拒绝恢复覆盖：' + r.path);
    prepared.push({ path: dest, bytes, remove: !r.existed, expectedPrevious: current });
  }
  if (apply) replaceFiles(prepared, io);
  return { restored: apply, files: prepared.length, notice: apply ? '源码已恢复；不代表已部署卡自动回退。' : '恢复预检通过，未修改文件。' };
}
module.exports = { restore };
if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.length < 2 || args.slice(2).some(x => x !== '--apply')) throw Error('用法：node 恢复模块化.cjs 项目根目录 备份目录 [--apply]');
    console.log(JSON.stringify(restore(args[0], args[1], { apply: args.includes('--apply') }), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
