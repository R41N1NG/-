'use strict';

const fs = require('node:fs');
const path = require('node:path');

function loadBubbleAvatars(root) {
  const dir = path.join(root, '对白头像');
  const catalog = JSON.parse(fs.readFileSync(path.join(dir, '目录.json'), 'utf8'));
  const images = Object.create(null);
  const promptLines = [];
  for (const [speaker, faces] of Object.entries(catalog)) {
    if (!/^[\u4e00-\u9fa5A-Za-z0-9_]{1,10}$/.test(speaker) || !Object.hasOwn(faces, 'neutral')) {
      throw new Error('对白头像配置需要有效的角色名与 neutral 头像：' + speaker);
    }
    images[speaker] = {};
    const choices = [];
    for (const [face, { file, cue }] of Object.entries(faces)) {
      if (!/^[a-z][a-z0-9_-]{0,31}$/.test(face) || !cue?.trim()) {
        throw new Error('对白头像配置需要有效的表情 ID 与说明：' + speaker + '/' + face);
      }
      const bytes = fs.readFileSync(path.join(dir, file));
      if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') {
        throw new Error('对白头像须为 WebP：' + file);
      }
      images[speaker][face] = 'data:image/webp;base64,' + bytes.toString('base64');
      choices.push(face + '（' + cue + '）');
    }
    promptLines.push(speaker + '可用：' + choices.join('、') + '。');
  }
  return { images, promptLines };
}

module.exports = { loadBubbleAvatars };
