'use strict';
// 身份：gpt。只核对本次上传材料的内部一致性；不认证生产卡、宿主或下级测试。
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../下级更新/2026-10-08-剧情事故/材料');
const inputHashes = {};
function read(name) {
  const text = fs.readFileSync(path.join(root, name), 'utf8');
  inputHashes[name] = crypto.createHash('sha256').update(text).digest('hex');
  return text;
}
const current = JSON.parse(read('13b_编号基准.json'));
const previous = JSON.parse(read('11b_本批SHA与id映射链.json'));
const classification = read('9_15行时点分类表与最小转场时钟方案.md');
const latestReport = read('14_最近改动汇总·疑虑·上报.md');
const rows = current.表;
assert.equal(rows.length, 241);
assert.equal(new Set(rows.map(r => r.卡内id)).size, 241);
assert.equal(new Set(rows.map(r => r.酒馆uid)).size, 241);
for (const row of rows) {
  assert.ok(Number.isInteger(row.卡内id));
  assert.equal(row.卡内id, row.酒馆uid);
  assert.equal(row.同号, true);
}
const mapped = rows.filter(r => r.源uid_过时 !== null);
assert.equal(mapped.length, 165);
assert.equal(new Set(mapped.map(r => r.源uid_过时)).size, 165);
assert.equal(rows.length - mapped.length, 76);
assert.equal(previous.id映射链.length, 15);
for (const row of previous.id映射链) {
  const matches = rows.filter(r => r.comment === row.comment);
  assert.equal(matches.length, 1, row.comment);
  assert.equal(matches[0].卡内id, row.卡内id);
  assert.equal(matches[0].酒馆uid, row.酒馆uid);
}
const staleUnmatchedRows = classification.split('\n')
  .filter(line => /^\| \d+ \|/.test(line) && line.includes('（未匹配）')).length;
assert.equal(staleUnmatchedRows, 15);
const latestSize = Number(latestReport.match(/\*\*(\d+) 字节\*\*/)[1]);
const latestPrefix = latestReport.match(/SHA-256 前 24 位 `([a-f0-9]{24})`/)[1];
assert.notEqual(latestSize, previous.成品.字节);
assert.equal(previous.成品.sha256.startsWith(latestPrefix), false);
const result = {
  identity: 'gpt', date: '2026-10-08', baseline: '56a534c', input_sha256: inputHashes,
  table_rows: rows.length, unique_card_ids: 241, unique_host_uids: 241,
  table_equal_id_uid_rows: 241, old_source_uids_in_table: 165, generated_or_unmapped_rows: 76,
  mainline_mapping_agrees_between_11b_and_13b: 15,
  stale_unmatched_card_ids_in_material_9: staleUnmatchedRows,
  prior_artifact_report: previous.成品,
  latest_artifact_report: { bytes: latestSize, sha256_prefix_24: latestPrefix },
  prior_artifact_hash_must_not_certify_latest: true,
  limits: '只证明上传JSON表和版本报告彼此一致/差异；未取得实际新卡、安装世界书、PNG载荷、新版生产源码或原始门禁日志。165/241本身不证明源内容过时。',
};
fs.writeFileSync(path.join(__dirname, '材料一致性复核结果.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
