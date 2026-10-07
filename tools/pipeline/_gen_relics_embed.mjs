#!/usr/bin/env node
/**
 * _gen_relics_embed.mjs —— 把 **名器纹章**（13 枚）也打包进卡（2026-10-01）
 *
 * 起因：秋风反馈「没图片」⇒ 查明面板里纹章的取图是**写死的本地路径**
 *   `background-image:url("user/images/xsd_relics/<id>.jpg")` ⇒ 别人拿到卡就是空框。
 *   立绘早就内嵌了，纹章漏了。
 *
 * 做法：这 13 张本来就是 192×192 的 JPEG（各 10–19 KB）⇒ **直接 base64**（零依赖、不用 Chrome）。
 *   输出 `_relics_embed.json`：{ <id>: 'data:image/jpeg;base64,…' }，由 `_build_card.js`
 *   注入 `data.extensions.xsd_assets.relics`，面板优先用它、取不到才退回本地路径。
 *
 * 用法：node _gen_relics_embed.mjs [--apply]
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const D = 'E:\\角色卡制作\\仙姝堕\\';
const SRC = 'E:\\tavern\\SillyTavern\\data\\default-user\\user\\images\\xsd_relics';
const OUT = D + '_relics_embed.json';
const APPLY = process.argv.includes('--apply');

const files = readdirSync(SRC).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f));
const out = {};
let raw = 0;
for (const f of files) {
  const id = f.replace(/\.(jpg|jpeg|png|webp)$/i, '');
  const buf = readFileSync(SRC + '\\' + f);
  raw += buf.length;
  const mime = /\.png$/i.test(f) ? 'image/png' : (/\.webp$/i.test(f) ? 'image/webp' : 'image/jpeg');
  out[id] = 'data:' + mime + ';base64,' + buf.toString('base64');
}
const b64 = Object.values(out).reduce((s, v) => s + v.length, 0);
console.log('纹章 ' + Object.keys(out).length + ' 枚｜源 ' + Math.round(raw / 1024) + ' KB ⇒ base64 ' + Math.round(b64 / 1024) + ' KB');
for (const k of Object.keys(out)) console.log('  ' + k.padEnd(24) + Math.round(out[k].length / 1024) + ' KB');
if (APPLY) { writeFileSync(OUT, JSON.stringify(out), 'utf8'); console.log('\n✅ 已写 ' + OUT); }
else console.log('\n（预演，未写盘；加 --apply 才写）');
