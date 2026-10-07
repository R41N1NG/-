#!/usr/bin/env node
/**
 * _sync_gallery_from_src.mjs —— 「立绘-原图」是唯一真源（2026-10-01 主人令）
 *
 * 主人原话：「所有立绘文件都放到这个路径的文件夹，然后**只有这个文件里的图片才被加入卡内**」
 *   ⇒ 真源 ＝ `E:\火狐下载\立绘-原图\`（**中文名**）
 *     图库 ＝ `…\user\images\xsd_gallery\`（**拼音 id**，`<id>.png`）—— 由本脚本单向同步
 *     清单 ＝ `_gallery_ids.json`（本脚本产出；两个内嵌生成脚本**按它过滤**，不在清单里的图绝不进卡）
 *
 * 用法：node _sync_gallery_from_src.mjs [--apply]
 *   不带 --apply ＝ 只报告（dry-run）；带 --apply 才复制文件、写清单。
 */
import { readFileSync, writeFileSync, readdirSync, copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'E:\\火狐下载\\立绘-原图';
const GAL = 'E:\\tavern\\SillyTavern\\data\\default-user\\user\\images\\xsd_gallery';
const LIST = 'E:\\角色卡制作\\仙姝堕\\_gallery_ids.json';
const APPLY = process.argv.includes('--apply');

/* 中文名（不含扩展名） ⇒ 图库拼音 id。**这是唯一的映射表**：加新图＝往「立绘-原图」丢文件 ＋ 在这里加一行。 */
const MAP = {
  病相思: 'bingxiangsi',
  残阳老怪: 'canyanglaoguai',
  楚灵夜: 'chulingye', 楚灵夜2: 'chulingye_2', 楚灵夜3: 'chulingye_3',
  孤月: 'guyue', 孤月2: 'guyue_2', 孤月3: 'guyue_3', 孤月送冰心泪: 'guyue_bingxinlei',
  花间二鬼: 'huajianergui',
  花芷宁: 'huazhining',                       /* ⚠️ 主人原文件名「宁」是笔误，id 用 huazhining */
  魂欢殿黑袍: 'npc_hunhuan_disciple',
  极乐太子: 'jiletaizi',
  九皇子: 'jiuhuangzi',
  九皇子女奴: 'npc_dragon_slave',
  九皇子死士: 'npc_prince_deathknight',
  厉锋: 'lifeng',
  炼欲魔君: 'lianyumojun',
  柳含烟: 'liuhanyan',
  柳玉: 'liuyu',
  陆烬颜: 'lujinyan',
  陆十三: 'lushisan',
  女尼: 'npc_jilei_nun',
  肉山佛: 'roushanfo',
  石岩: 'shiyan',
  苏玲: 'suling', 苏玲2: 'suling_2',
  苏瑶: 'suyao',
  闻观语: 'wenguanyu', 闻观语2: 'wenguanyu_2',
  玄机子: 'xuanjizi',
  炎雷子: 'yanleizi',
  叶红缨: 'yehongying', 叶红缨2: 'yehongying_2',
  叶红缨沐浴正面: 'yehongying_bath_front', 叶红缨沐浴侧面: 'yehongying_bath_side',
  雨霏柔: 'yufeirou',
  云逸尘: 'yunyichen',
  云织梦: 'yunzhimeng',
};

const files = readdirSync(SRC).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));
const pairs = [];
const unmapped = [];
for (const f of files) {
  const base = f.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  const id = MAP[base];
  if (!id) { unmapped.push(f); continue; }
  pairs.push({ from: join(SRC, f), id, file: f });
}

const galPngs = existsSync(GAL) ? readdirSync(GAL).filter((f) => /\.png$/i.test(f)) : [];
const ids = pairs.map((p) => p.id);
const noSource = galPngs.filter((f) => ids.indexOf(f.replace(/\.png$/i, '')) === -1);

console.log('【立绘真源同步】' + (APPLY ? '（--apply 写盘）' : '（dry-run，只报告）'));
console.log('  「立绘-原图」文件：' + files.length + ' 个｜已映射：' + pairs.length + ' 个');
if (unmapped.length) console.log('  ⚠️ 没有映射（不会进卡）：' + unmapped.join('、'));
if (noSource.length) console.log('  ⚠️ 图库里有、真源里没有（按主人令**不进卡**）：' + noSource.join('、'));

if (APPLY) {
  let copied = 0;
  for (const p of pairs) {
    const dst = join(GAL, p.id + '.png');
    try { copyFileSync(p.from, dst); copied++; } catch (e) { console.log('  ✘ 复制失败：' + p.file + ' → ' + p.id + '.png（' + e.message + '）'); }
  }
  writeFileSync(LIST, JSON.stringify(ids.slice().sort(), null, 0), 'utf8');
  let kb = 0;
  for (const p of pairs) { try { kb += readFileSync(p.from).length; } catch (e) { /* 忽略 */ } }
  console.log('  ✅ 已同步 ' + copied + ' 张到图库｜清单写盘 ' + LIST + '（' + ids.length + ' 个 id）');
  console.log('  源图合计 ' + Math.round(kb / 1024 / 1024 * 10) / 10 + ' MB');
} else {
  console.log('  （加 --apply 才会真复制与写清单）');
}
