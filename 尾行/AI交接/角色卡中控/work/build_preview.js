const fs = require('fs');
const path = require('path');

// 1. 生成 work/audio_data.js
const b64 = fs.readFileSync(path.join(__dirname, 'heels_b64.txt'), 'utf8').trim();
fs.writeFileSync(path.join(__dirname, 'audio_data.js'), 'window.B64_HEELS = ' + JSON.stringify(b64) + ';\n', 'utf8');
console.log('work/audio_data.js created with size:', fs.statSync(path.join(__dirname, 'audio_data.js')).size);
