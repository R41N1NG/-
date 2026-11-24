'use strict'

const fs = require('node:fs')
const path = require('node:path')

// The offline preview also supplies the card's artwork, markup and interactions.
function compileDossiers(root) {
  const preview = fs.readFileSync(path.join(root, '角色档案预览/companions-dossier-preview.html'), 'utf8')
  const sharedStyle = preview.match(/<style>[\s\S]*?<\/style>/)?.[0]
  const portraits = new Map([...preview.matchAll(/<button type="button" data-character="(\w+)"><img src="(data:image\/webp;base64,[\w+/=]+)"/g)]
    .map(([, id, src]) => [id, src]))
  const panels = new Map()
  for (const [, markup, id, code] of preview.matchAll(/(<div id="okh-[^"]+-dossier-unified-light"[^>]+data-character-panel="(\w+)" hidden>[\s\S]*?)<script>([\s\S]*?)<\/script>\s*<\/div>/g)) {
    const fields = [...markup.matchAll(/<dt>([^<]+)<\/dt>/g)].slice(0, 4).map(match => match[1])
    if (fields.join('/') !== '所在/近况/羁绊/专长' || /<dt>(年龄|身高)<\/dt>/.test(markup)) {
      throw Error('角色档案字段不一致：' + id)
    }
    if (!portraits.has(id)) throw Error('角色档案缺少名册头像：' + id)
    panels.set(id, `${JSON.stringify(id)}: {
      portrait: ${JSON.stringify(portraits.get(id))},
      markup: ${JSON.stringify(markup + '</div>')},
      mount(document, window) {${code.replace('返回名册　×', '关闭档案　×')}}
    }`)
  }
  if (!sharedStyle || [...panels.keys()].join('/') !== 'gulan/isna/nise/aurora') {
    throw Error('四人档案预览缺少样式或角色面板')
  }
  return `{ style: ${JSON.stringify(sharedStyle)}, panels: {${[...panels.values()].join(',\n')}} }`
}

module.exports = { compileDossiers }
