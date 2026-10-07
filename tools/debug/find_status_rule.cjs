const fs = require('fs');
const card = JSON.parse(fs.readFileSync('仙姝墮-角色卡（全书群像）.json', 'utf8'));

const fields = {
  description: card.data.description,
  scenario: card.data.scenario,
  first_mes: card.data.first_mes,
  mes_example: card.data.mes_example,
};
for (const [k, v] of Object.entries(fields)) {
  if (v && v.includes('Status_block')) {
    console.log('Found Status_block in card.data.' + k);
  }
}
const bookEntries = card.data.character_book?.entries || [];
bookEntries.forEach((e, idx) => {
  if (e.content && e.content.includes('Status_block')) {
    console.log('Found Status_block in entry [' + idx + ']: ' + e.comment + ', enabled=' + e.enabled);
  }
});
