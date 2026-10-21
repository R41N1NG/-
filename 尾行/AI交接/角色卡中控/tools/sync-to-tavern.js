// tools/sync-to-tavern.js
// 自动将最新构建的角色卡与世界书同步注入到 TT 酒馆 (E:/tavern) 中
// 主人只需在 TT 酒馆中按 F5 刷新即可生效，无需重新导入。

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const CARD_JSON_PATH = path.join(ROOT, '最新角色卡', '尾行.json');
const WORLDBOOK_PATH = path.join(ROOT, 'dist', '尾行-世界书.json');

const TAVERN_DIRS = [
  'E:/tavern/data/default-user',
  'E:/tavern/SillyTavern/data/default-user'
];

function makeTextChunk(keyword, text) {
  const keywordBuf = Buffer.from(keyword, 'utf8');
  const nullBuf = Buffer.from([0]);
  const textBuf = Buffer.from(text, 'utf8');
  const data = Buffer.concat([keywordBuf, nullBuf, textBuf]);

  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from('tEXt', 'ascii');
  const crc = zlib.crc32(Buffer.concat([typeBuf, data]));
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function updatePngCard(pngPath, cardV2) {
  if (!fs.existsSync(pngPath)) return false;

  const buf = fs.readFileSync(pngPath);
  // Backup once
  try {
    fs.copyFileSync(pngPath, pngPath + '.bak');
  } catch (e) {}

  // Parse chunks
  const chunks = [];
  let pos = 8; // skip PNG signature
  const sig = buf.subarray(0, 8);

  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const chunkFull = buf.subarray(pos, pos + 12 + len);

    if (type === 'tEXt') {
      const data = buf.toString('utf8', pos + 8, pos + 8 + len);
      const nullIdx = data.indexOf('\0');
      const keyword = data.slice(0, nullIdx);

      if (keyword === 'chara') {
        const newB64 = Buffer.from(JSON.stringify(cardV2), 'utf8').toString('base64');
        chunks.push(makeTextChunk('chara', newB64));
      } else if (keyword === 'ccv3') {
        let v3Obj;
        try {
          const oldB64 = data.slice(nullIdx + 1);
          v3Obj = JSON.parse(Buffer.from(oldB64, 'base64').toString('utf8'));
          v3Obj.data = cardV2.data;
        } catch (e) {
          v3Obj = {
            spec: 'chara_card_v3',
            spec_version: '3.0',
            data: cardV2.data
          };
        }
        const newV3B64 = Buffer.from(JSON.stringify(v3Obj), 'utf8').toString('base64');
        chunks.push(makeTextChunk('ccv3', newV3B64));
      } else {
        chunks.push(chunkFull);
      }
    } else {
      chunks.push(chunkFull);
    }
    pos += 12 + len;
  }

  const outBuf = Buffer.concat([sig, ...chunks]);
  fs.writeFileSync(pngPath, outBuf);
  return true;
}

function syncToTavern() {
  if (!fs.existsSync(CARD_JSON_PATH)) {
    console.error('未找到最新角色卡文件:', CARD_JSON_PATH);
    return;
  }
  const cardV2 = JSON.parse(fs.readFileSync(CARD_JSON_PATH, 'utf8'));

  let bookJson = null;
  if (fs.existsSync(WORLDBOOK_PATH)) {
    bookJson = fs.readFileSync(WORLDBOOK_PATH, 'utf8');
  }

  let syncedCount = 0;
  for (const baseDir of TAVERN_DIRS) {
    if (!fs.existsSync(baseDir)) continue;

    // 1. 同步角色卡 PNG
    const charPng = path.join(baseDir, 'characters', '尾行.png');
    if (fs.existsSync(charPng)) {
      const ok = updatePngCard(charPng, cardV2);
      if (ok) {
        console.log(`[TT酒馆同步] 已刷新角色卡: ${charPng}`);
        syncedCount++;
      }
    }

    // 2. 同步独立世界书（若酒馆中已有同名世界书）
    const candidateWorldNames = ['尾行·中控世界书.json', '尾行.json'];
    for (const worldName of candidateWorldNames) {
      const worldFile = path.join(baseDir, 'worlds', worldName);
      if (bookJson && fs.existsSync(worldFile)) {
        try {
          const existingData = JSON.parse(fs.readFileSync(worldFile, 'utf8'));
          const newBook = JSON.parse(bookJson);
          if (existingData && existingData.entries && !Array.isArray(existingData.entries)) {
            const newEntriesArray = newBook.entries || [];
            const cleanEntries = {};
            newEntriesArray.forEach((newE, idx) => {
              const uid = idx + 1;
              cleanEntries[String(uid)] = {
                uid,
                comment: newE.name,
                content: newE.content,
                constant: newE.constant,
                disable: !newE.enabled,
                key: newE.keys,
                keysecondary: newE.secondary_keys || [],
                order: newE.insertion_order || 100,
                position: newE.position === "before_char" ? 0 : 1,
                selective: !!newE.selective,
                depth: 4,
                scanDepth: 2,
                probability: 100,
                useProbability: true
              };
            });
            existingData.entries = cleanEntries;
            fs.writeFileSync(worldFile, JSON.stringify(existingData, null, 2), 'utf8');
            console.log(`[TT酒馆同步] 已刷新酒馆原生世界书（共${newEntriesArray.length}条）: ${worldFile}`);
          } else {
            fs.writeFileSync(worldFile, bookJson, 'utf8');
            console.log(`[TT酒馆同步] 已刷新世界书: ${worldFile}`);
          }
        } catch (err) {
          fs.writeFileSync(worldFile, bookJson, 'utf8');
          console.log(`[TT酒馆同步] 已回退刷新世界书: ${worldFile}`);
        }
      }
    }
  }

  if (syncedCount === 0) {
    console.log('[TT酒馆同步] 未探测到活跃酒馆角色卡 PNG，跳过外部热同步。');
  } else {
    console.log(`[TT酒馆同步完成] 成功热更新 ${syncedCount} 处 TT 酒馆卡数据！`);
  }
}

if (require.main === module) {
  syncToTavern();
}

module.exports = { syncToTavern };
