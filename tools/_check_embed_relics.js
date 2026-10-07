const fs = require('fs');

const embed = JSON.parse(fs.readFileSync('src/assets_data/_relics_embed.json', 'utf8'));
console.log('Total relics in embed:', Object.keys(embed).length);
for (const [k, v] of Object.entries(embed)) {
  console.log(k, '=>', v.name, '| carrier in embed:', v.carrier, '| brief:', (v.brief || '').slice(0, 30));
}
