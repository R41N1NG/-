/* 身份：gpt。第一阶段仅拆开发源；同作用域、同顺序拼接，不增加运行包装。 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const canonical = bytes => Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function safePath(root, relative) {
  if (typeof relative !== 'string' || !relative || relative.includes('\\') ||
      path.isAbsolute(relative) || relative.split('/').some(p => !p || p === '.' || p === '..')) {
    throw Error('非法相对路径：' + String(relative));
  }
  const dest = path.resolve(root, relative);
  const base = path.resolve(root);
  if (!dest.startsWith(base + path.sep)) throw Error('路径越界：' + relative);
  // 不穿越目录链接；拒绝目标文件链接，避免把候选写到项目以外。
  let current = path.parse(dest).root;
  for (const part of path.relative(current, dest).split(path.sep)) {
    current = path.join(current, part);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw Error('拒绝链接：' + relative);
  }
  return dest;
}

function assemble(sourceRoot = __dirname, { verifyBaseline = false } = {}) {
  const manifest = JSON.parse(fs.readFileSync(safePath(sourceRoot, 'modules.json'), 'utf8'));
  if (manifest.version !== 1 || manifest.mode !== 'ordered-shared-scope' ||
      !Array.isArray(manifest.modules) || !manifest.modules.length ||
      !/^[a-f0-9]{64}$/.test(manifest.baseline?.sha256 || '')) throw Error('模块清单格式不正确');
  const seen = new Set(), chunks = [], mapping = [];
  let line = 1;
  for (const item of manifest.modules) {
    if (!item || typeof item.path !== 'string' || !item.path.endsWith('.js') || seen.has(item.path)) {
      throw Error('模块路径缺失、重复或不是JS');
    }
    seen.add(item.path);
    const file = safePath(sourceRoot, item.path);
    const bytes = canonical(fs.readFileSync(file));
    if (verifyBaseline && digest(bytes) !== item.baselineSHA256) throw Error('模块已偏离初始基线：' + item.path);
    // 不补分号/换行/包装；原始片段已有完整分隔，第一版必须保持字节等价。
    chunks.push(bytes);
    const count = (bytes.toString('utf8').match(/\n/g) || []).length;
    mapping.push({ path: item.path, startLine: line, endLine: line + count - 1, sha256: digest(bytes) });
    line += count;
  }
  const bytes = Buffer.concat(chunks);
  new vm.Script(bytes.toString('utf8'), { filename: '卡片脚本/状态机.js' });
  if (verifyBaseline && digest(bytes) !== manifest.baseline.sha256) throw Error('拼接顺序或输出偏离基线');
  return { bytes, sha256: digest(bytes), manifest, mapping };
}

// 文件替换失败时恢复已经替换的文件。没有跨文件系统原子性的承诺。
function replaceFiles(files, io = fs) {
  const staged = [], committed = [];
  try {
    for (const f of files) {
      const existed = io.existsSync(f.path);
      const previous = existed ? io.readFileSync(f.path) : null;
      if (Object.prototype.hasOwnProperty.call(f, 'expectedPrevious') &&
          ((previous === null) !== (f.expectedPrevious === null) ||
           (previous && !previous.equals(f.expectedPrevious)))) throw Error('预检后目标改变：' + f.path);
      const mode = existed ? io.statSync(f.path).mode : undefined;
      io.mkdirSync(path.dirname(f.path), { recursive: true });
      const temp = f.path + '.xsd-' + crypto.randomBytes(8).toString('hex') + '.tmp';
      staged.push({ ...f, existed, previous, mode, temp });
      if (!f.remove) io.writeFileSync(temp, f.bytes, { flag: 'wx', ...(mode === undefined ? {} : { mode }) });
    }
    // 全部暂存后和每次替换前都重验。文件系统没有原子compare-and-swap；
    // 安装期间仍须暂停其它写入者，不能承诺拦截检查与rename之间的任意外部写入。
    for (const f of staged) {
      if (io.existsSync(f.path) !== f.existed ||
          (f.existed && !io.readFileSync(f.path).equals(f.previous))) throw Error('目标在安装期间改变：' + f.path);
    }
    for (const f of staged) {
      if (io.existsSync(f.path) !== f.existed ||
          (f.existed && !io.readFileSync(f.path).equals(f.previous))) throw Error('目标在替换前改变：' + f.path);
      if (f.remove) {
        if (f.existed) io.renameSync(f.path, f.temp);
      } else io.renameSync(f.temp, f.path);
      committed.push(f);
      if (f.remove ? io.existsSync(f.path) : !io.readFileSync(f.path).equals(f.bytes)) throw Error('文件回读不一致：' + f.path);
    }
  } catch (error) {
    const failed = [];
    for (const f of committed.reverse()) {
      try {
        const current = io.existsSync(f.path) ? io.readFileSync(f.path) : null;
        if ((f.remove && current !== null) || (!f.remove && (!current || !current.equals(f.bytes)))) {
          failed.push(f.path + '（后续外部改动已保留）');
          continue;
        }
        if (f.existed) { io.writeFileSync(f.path, f.previous); if (f.mode !== undefined) io.chmodSync(f.path, f.mode); }
        else io.unlinkSync(f.path);
      } catch { failed.push(f.path); }
    }
    if (failed.length) throw Error(error.message + '；恢复失败，请从备份恢复：' + failed.join(', '));
    throw error;
  } finally {
    for (const f of staged) { try { if (io.existsSync(f.temp)) io.unlinkSync(f.temp); } catch {} }
  }
}

function buildStateMachine(options = {}) {
  const sourceRoot = options.sourceRoot || __dirname;
  const projectRoot = options.projectRoot || path.resolve(sourceRoot, '../..');
  const output = safePath(projectRoot, '卡片脚本/状态机.js');
  const recordFile = safePath(sourceRoot, 'build-state.json');
  const result = assemble(sourceRoot, { verifyBaseline: !!options.verifyBaseline });
  let expected = result.manifest.baseline.sha256;
  if (fs.existsSync(recordFile)) {
    const record = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
    if (record.version !== 1 || !/^[a-f0-9]{64}$/.test(record.outputSHA256 || '')) throw Error('生成记录无效');
    expected = record.outputSHA256;
  }
  const existing = fs.existsSync(output) ? fs.readFileSync(output) : null;
  if (existing && digest(canonical(existing)) !== expected) throw Error('生成文件被另行修改，拒绝覆盖：卡片脚本/状态机.js');
  if (options.checkOnly) {
    if (!existing || !canonical(existing).equals(result.bytes)) throw Error('生成文件与模块源不同，请先构建');
    return { checked: true, sha256: result.sha256, modules: result.mapping, bytes: result.bytes.length };
  }
  const record = Buffer.from(JSON.stringify({ version: 1, outputSHA256: result.sha256 }, null, 2) + '\n');
  const files = [], previousRecord = fs.existsSync(recordFile) ? fs.readFileSync(recordFile) : null;
  if (!existing || !existing.equals(result.bytes)) files.push({ path: output, bytes: result.bytes, expectedPrevious: existing });
  if (!previousRecord || !previousRecord.equals(record)) files.push({ path: recordFile, bytes: record, expectedPrevious: previousRecord });
  if (files.length) replaceFiles(files);
  return { checked: false, changed: files.length > 0, sha256: result.sha256, bytes: result.bytes.length, modules: result.mapping };
}

module.exports = { assemble, buildStateMachine, canonical, digest, safePath, replaceFiles };
if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.some(x => !['--check', '--baseline'].includes(x))) throw Error('用法：node build.cjs [--check] [--baseline]');
    console.log(JSON.stringify(buildStateMachine({ checkOnly: args.includes('--check'), verifyBaseline: args.includes('--baseline') }), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
