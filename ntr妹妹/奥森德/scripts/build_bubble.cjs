'use strict';

const fs = require('node:fs');
const path = require('node:path');

const COMMON = {
  neutral: '沉静', smile: '微笑', laugh: '大笑', focus: '认真', worry: '担忧',
  fear: '害怕', surprise: '惊讶', displeasure: '不悦', anger: '愤怒',
  sad: '低落', cry: '哭泣', embarrassed: '窘迫'
};

function loadBubbleAvatars(root) {
  const dir = path.join(root, '对白头像');
  const read = name => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
  const catalog = read('目录.json');
  const assets = read('资源.json');
  const images = Object.create(null);
  const promptLines = ['通用表情：' + Object.entries(COMMON).map(([id, label]) => id + '（' + label + '）').join('、') + '。'];
  for (const [speaker, { npc, forms }] of Object.entries(catalog)) {
    if (!/^[\u4e00-\u9fa5A-Za-z0-9_]{1,10}$/.test(speaker) || !/^[a-z][a-z0-9_]*$/.test(npc) || !Object.hasOwn(forms, 'normal')) {
      throw new Error('对白头像缺少有效角色名、ID 或常态：' + speaker);
    }
    const variants = Object.create(null);
    const choices = new Set();
    for (const [form, { special, cue }] of Object.entries(forms)) {
      if (!['normal', 'maid', 'fallen'].includes(form) || !/^[a-z][a-z0-9_-]{0,31}$/.test(special) ||
          Object.hasOwn(COMMON, special) || !cue?.trim()) {
        throw new Error('对白头像配置无效：' + speaker + '/' + form);
      }
      const faces = assets[speaker]?.[form];
      const ids = [...Object.keys(COMMON), special];
      if (!faces || Object.keys(faces).length !== ids.length) throw new Error('对白头像不齐全：' + speaker + '/' + form);
      variants[form] = Object.fromEntries(ids.map(id => {
        const encoded = faces[id];
        const bytes = typeof encoded === 'string' && /^[A-Za-z0-9+/]+={0,2}$/.test(encoded)
          ? Buffer.from(encoded, 'base64') : Buffer.alloc(0);
        if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') {
          throw new Error('对白头像须为有效 WebP：' + speaker + '/' + form + '/' + id);
        }
        return [id, 'data:image/webp;base64,' + encoded];
      }));
      choices.add(special + '（' + cue + '）');
    }
    const chibiFaces = assets[speaker]?.chibi?.normal;
    let chibi = undefined;
    if (chibiFaces) {
      const normalSpecial = forms.normal?.special;
      const ids = [...Object.keys(COMMON), ...(normalSpecial ? [normalSpecial] : [])];
      if (Object.keys(chibiFaces).length !== ids.length) throw new Error('Q版对白头像不齐全：' + speaker);
      chibi = {
        normal: Object.fromEntries(ids.map(id => {
          const encoded = chibiFaces[id];
          const bytes = typeof encoded === 'string' && /^[A-Za-z0-9+/]+={0,2}$/.test(encoded)
            ? Buffer.from(encoded, 'base64') : Buffer.alloc(0);
          if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') {
            throw new Error('Q版对白头像须为有效 WebP：' + speaker + '/' + id);
          }
          return [id, 'data:image/webp;base64,' + encoded];
        }))
      };
    }
    images[speaker] = chibi ? { npc, forms: variants, chibi } : { npc, forms: variants };
    promptLines.push(speaker + '专属表情：' + [...choices].join('、') + '。');
  }
  return { images, promptLines };
}

module.exports = { loadBubbleAvatars };
