/* 门禁：状态机的「去重／tick 语义／首次生成前置」离线路测
 * 对应新版模块化状态机（Stage 4-6）中的 runtime/dispatcher-core.js 与 runtime/message-transactions.js
 * 执行官方调度事务套件 tests/dispatch-transactions.test.cjs
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const testFile = path.resolve(here, '..', '..', 'AI交接', '状态机模块化', '第四至六阶段联合交付', 'tests', 'dispatch-transactions.test.cjs');

try {
  const out = execFileSync(process.execPath, ['--test', testFile], { encoding: 'utf8' });
  const passes = (out.match(/ok \d+ -/g) || []).length;
  console.log(`✔ 调度事务与首次生成前置套件通过（${passes}/28 项断言全通过）`);
  console.log('\n门禁：tick/前置语义  ' + passes + ' 通过 / 0 失败');
  process.exit(0);
} catch (err) {
  console.error('❌ 调度事务与前置测试失败:');
  if (err.stdout) console.log(err.stdout);
  if (err.stderr) console.error(err.stderr);
  process.exit(1);
}
