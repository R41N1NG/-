/* 身份：gpt 下级实现。Node 离线工厂入口，直接加载卡内纯核真源。 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../rules/subject-evidence-core.js'), 'utf8') + '\n' + fs.readFileSync(path.join(__dirname, 'status-core.js'), 'utf8');
module.exports = new vm.Script(source + '\ncreateXsdStatusParser;', { filename: 'status-core.js' })
  .runInNewContext(Object.create(null), { timeout: 1000 });
