/* 身份：gpt。Node离线入口，直接加载卡内使用的纯核真源，不抄算法。 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, 'calendar-core.js'), 'utf8');
module.exports = new vm.Script(source + '\ncreateXsdCalendar();', { filename: 'calendar-core.js' })
  .runInNewContext(Object.create(null), { timeout: 1000 });
