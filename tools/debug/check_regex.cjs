const fs = require('fs');
const card = JSON.parse(fs.readFileSync('仙姝墮-角色卡（全书群像）.json', 'utf8'));
const regexes = card.data.extensions.regex_scripts || [];
regexes.forEach((r, idx) => {
  console.log('[Regex ' + idx + '] ' + r.scriptName + ' disabled=' + r.disabled);
  console.log('   find: ' + r.findRegex);
  console.log('   replace len: ' + (r.replaceString?.length || 0));
});
