'use strict'

const fs = require('node:fs')
const path = require('node:path')

// The offline preview also supplies the card's artwork, markup and interactions.
function compileDossiers(root) {
  const preview = fs.readFileSync(path.join(root, '角色档案预览/companions-dossier-preview.html'), 'utf8')
  const sharedStyle = preview.match(/<style>[\s\S]*?<\/style>/)?.[0]
  const crystal = preview.match(/data-module="orb"[^>]*>\s*<img src="(data:image\/webp;base64,[\w+/=]+)"/)?.[1]
  const portraits = new Map([...preview.matchAll(/<button type="button" data-character="(\w+)"><img src="(data:image\/webp;base64,[\w+/=]+)"/g)]
    .map(([, id, src]) => [id, src]))
  const panels = new Map()
  for (const [, markup, id, code] of preview.matchAll(/(<div id="okh-[^"]+-dossier-unified-light"[^>]+data-character-panel="(\w+)" hidden>[\s\S]*?)<script>([\s\S]*?)<\/script>\s*<\/div>/g)) {
    const fields = [...markup.matchAll(/<dt>([^<]+)<\/dt>/g)].slice(0, 4).map(match => match[1])
    if (fields.join('/') !== '所在/近况/羁绊/专长' || /<dt>(年龄|身高)<\/dt>/.test(markup)) {
      throw Error('角色档案字段不一致：' + id)
    }
    if (!portraits.has(id)) throw Error('角色档案缺少名册头像：' + id)
    const liveMarkup = markup.replace(
      /<details class="okh-fold" data-dossier-demo>\s*<summary>同行经历<\/summary>[\s\S]*?<\/details>/,
      '<details class="okh-fold"><summary>同行经历</summary><div data-dossier-journey></div></details>'
    )
    if (liveMarkup === markup) throw Error('角色档案缺少同行经历区：' + id)
    const fieldsByLabel = {
      '是否处女': 'virginity',
      '最近一周性行为次数': 'recent',
      '最后一次性行为的体位': 'position',
      '被内射次数': 'internal',
      '精液总容量': 'volume'
    }
    const recordMarkup = liveMarkup.replace(/<dt>([^<]+)<\/dt><dd(?: data-total-volume)?>未记录<\/dd>/g,
      (match, label) => fieldsByLabel[label]
        ? `<dt>${label}</dt><dd data-dossier-stat="${fieldsByLabel[label]}"${fieldsByLabel[label] === 'volume' ? ' data-total-volume' : ''}>未记录</dd>`
        : match)
    const activityInit = 'const activity = { totalVolumeMl: null, encountersByPart: {} };'
    if (!code.includes(activityInit)) throw Error('角色档案缺少部位记录：' + id)
    const liveCode = code.replace(activityInit, activityInit + `
      root.addEventListener("okh:encounters", ({ detail }) => {
        activity.encountersByPart = detail.encountersByPart;
        root.querySelectorAll("[data-dossier-stat]").forEach(field => {
          field.textContent = detail[field.dataset.dossierStat];
        });
        displayedPart = null;
        showPartPopover();
      });`)
    panels.set(id, `${JSON.stringify(id)}: {
      portrait: ${JSON.stringify(portraits.get(id))},
      markup: ${JSON.stringify(recordMarkup + '</div>')},
      mount(document, window, rosterPortrait) {${liveCode.replace('let chosen = "neutral";', `let chosen = "neutral";
      if (rosterPortrait) {
        images.roster = { label: "默认立绘", src: rosterPortrait };
        chosen = "roster";
        portrait.querySelector("img").src = rosterPortrait;
      }`)}}
    }`)
  }
  if (!sharedStyle || !crystal || [...panels.keys()].join('/') !== 'gulan/isna/nise/aurora') {
    throw Error('四人档案预览缺少样式、水晶球或角色面板')
  }
  return `{ style: ${JSON.stringify(sharedStyle)}, crystal: ${JSON.stringify(crystal)}, panels: {${[...panels.values()].join(',\n')}} }`
}

module.exports = { compileDossiers }
