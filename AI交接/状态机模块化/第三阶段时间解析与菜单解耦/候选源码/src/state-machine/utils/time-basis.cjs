/* 身份：gpt。Node离线入口，共用实际卡内纯核。 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const calendar = require('./calendar.cjs');
module.exports = new vm.Script(fs.readFileSync(path.join(__dirname, 'time-basis-core.js'), 'utf8') +
  '\ncreateXsdTimeBasis(calendar);', { filename: 'time-basis-core.js' })
  .runInNewContext({ calendar }, { timeout: 1000 });
