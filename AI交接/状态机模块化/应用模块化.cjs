/* 身份：gpt。仅安装源码，不构建角色卡、不部署酒馆。默认只读预检。 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { assemble, canonical, digest, safePath, replaceFiles } = require('./候选源码/src/state-machine/build.cjs');

function preflight(target, pack = __dirname) {
  target = path.resolve(target);
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) throw Error('目标项目根目录不存在');
  const manifest = JSON.parse(fs.readFileSync(safePath(pack, '交付清单.json'), 'utf8'));
  if (manifest.version !== 1 || !Array.isArray(manifest.files) || !manifest.files.length) throw Error('交付清单格式无效');
  const sourceRoot = safePath(pack, '候选源码');
  const assembled = assemble(safePath(sourceRoot, 'src/state-machine'), { verifyBaseline: true });
  const prepared = [], seen = new Set();
  for (const r of manifest.requirements || []) {
    const existing = safePath(target, r.path);
    if (!fs.existsSync(existing) || digest(canonical(fs.readFileSync(existing))) !== r.sha256) {
      throw Error('共享依赖与上传基线不同：' + r.path + '；停止接入，保留本机源');
    }
  }
  for (const f of manifest.files) {
    if (!f || seen.has(f.path)) throw Error('交付清单存在重复或缺失路径');
    seen.add(f.path);
    const source = safePath(sourceRoot, f.path), dest = safePath(target, f.path);
    const bytes = canonical(fs.readFileSync(source));
    if (digest(bytes) !== f.sha256) throw Error('交付文件SHA变化：' + f.path);
    if (f.path.endsWith('.js') || f.path.endsWith('.cjs')) new vm.Script(bytes.toString('utf8'), { filename: f.path });
    const previous = fs.existsSync(dest) ? fs.readFileSync(dest) : null;
    if (previous) {
      if (!Array.isArray(f.acceptedSHA256) || !f.acceptedSHA256.includes(digest(canonical(previous)))) {
        throw Error('目标已更新，拒绝覆盖：' + f.path + '；请上传最新完整源及SHA');
      }
    } else if (f.requiredExisting) throw Error('目标缺少必需原文件：' + f.path);
    prepared.push({ path: dest, relative: f.path, bytes, previous });
  }
  const generated = prepared.find(f => f.relative === '卡片脚本/状态机.js');
  if (!generated || !generated.bytes.equals(assembled.bytes)) throw Error('候选生成文件与模块源不一致');
  const build = prepared.find(f => f.relative === '_build_card.js');
  if (!build || !build.bytes.toString('utf8').includes("require('./src/state-machine/build.cjs').buildStateMachine();")) {
    throw Error('缺少构建器模块接入');
  }
  return { target, manifest, prepared, outputSHA256: assembled.sha256 };
}

function install(target, { apply = false, pack = __dirname, io = fs } = {}) {
  const p = preflight(target, pack);
  if (!apply) return { applied: false, files: p.prepared.length, outputSHA256: p.outputSHA256, notice: '只读预检通过，未修改文件。' };
  // 整包预检结束后，写入前再检查全部目标，不能覆盖预检后出现的改动。
  for (const f of p.prepared) {
    const current = fs.existsSync(f.path) ? fs.readFileSync(f.path) : null;
    if ((current === null) !== (f.previous === null) || (current && !current.equals(f.previous))) throw Error('预检后目标改变：' + f.relative);
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomBytes(4).toString('hex');
  const backup = safePath(p.target, 'AI交接/状态机模块化备份/' + stamp);
  fs.mkdirSync(backup, { recursive: true });
  for (const f of p.prepared) if (f.previous !== null) {
    const saved = safePath(backup, f.relative);
    fs.mkdirSync(path.dirname(saved), { recursive: true });
    fs.writeFileSync(saved, f.previous);
  }
  fs.writeFileSync(safePath(backup, '恢复清单.json'), JSON.stringify({ identity: 'gpt', files: p.prepared.map(f => ({ path: f.relative, existed: f.previous !== null, previousSHA256: f.previous === null ? null : digest(f.previous) })) }, null, 2) + '\n');
  try { replaceFiles(p.prepared.map(f => ({ path: f.path, bytes: f.bytes, expectedPrevious: f.previous })), io); }
  catch (error) { throw Error(error.message + '；备份目录：' + backup); }
  return { applied: true, files: p.prepared.length, outputSHA256: p.outputSHA256, backup, notice: '仅源码安装完成，尚未构建角色卡或部署。' };
}

module.exports = { preflight, install };
if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (!args[0] || args[0].startsWith('--') || args.slice(1).some(x => x !== '--apply')) throw Error('用法：node 应用模块化.cjs 项目根目录 [--apply]');
    console.log(JSON.stringify(install(args[0], { apply: args.includes('--apply') }), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
