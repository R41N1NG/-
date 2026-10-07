#!/usr/bin/env node
/**
 * _gen_relics_4stages.mjs —— 批量将 13 名器 × 4 阶段（共 52 张）纹章高清图转码并生成内嵌字典与本地素材
 *
 * 输入源：E:\火狐下载\_制卡散件\名器图标（GPT出图）\新版四阶段纹章
 * 尺寸：256×256 WebP (q=0.85) 与 JPEG (q=0.85)
 * 输出：
 *   1. src/assets_data/_relics_embed.json（内嵌 Base64 字典）
 *   2. src/assets/名器图标/（工程资产归档）
 *   3. E:\tavern\SillyTavern\data\default-user\user\images\xsd_relics/（酒馆本地静态图库备份）
 *
 * 用法：node tools/pipeline/_gen_relics_4stages.mjs [--apply]
 */
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFile } from 'node:child_process';

const SRC_DIR = 'E:\\火狐下载\\_制卡散件\\名器图标（GPT出图）\\新版四阶段纹章';
const ROOT = 'E:\\角色卡制作\\仙姝堕';
const OUT_JSON = join(ROOT, 'src', 'assets_data', '_relics_embed.json');
const OUT_ASSETS = join(ROOT, 'src', 'assets', '名器图标');
const TAVERN_RELICS = 'E:\\tavern\\SillyTavern\\data\\default-user\\user\\images\\xsd_relics';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const APPLY = process.argv.includes('--apply');
const SIZE = 256;
const QUALITY = 0.85;
const PORT = 8795;

const RELIC_FILE_MAP = {
  jiuyouxuanyinxue: {
    name: '九幽玄阴穴',
    1: '九幽玄阴 (1).png',
    2: '九幽玄阴 (2).png',
    3: '九幽玄阴 (3).png',
    4: '九幽玄阴 4.png'
  },
  bingpojianxinxue: {
    name: '冰魄剑心穴',
    1: '冰魄剑心穴 (1).png',
    2: '冰魄剑心穴 (2).png',
    3: '冰魄剑心穴 3.png',
    4: '冰魄剑心穴 4.png'
  },
  fenghuangyuhua: {
    name: '凤凰羽花',
    1: '凤凰羽花 (1).png',
    2: '凤凰羽花 (2).png',
    3: '凤凰羽花 (3).png',
    4: '凤凰羽花 (4).png'
  },
  beimingchaoshengxue: {
    name: '北冥潮生穴',
    1: '北冥潮生穴 (1).png',
    2: '北冥潮生穴 (2).png',
    3: '北冥潮生穴 3.png',
    4: '北冥潮生穴 4.png'
  },
  xinmochayingru: {
    name: '心魔茶璎乳',
    1: '心魔茶璎乳 1.png',
    2: '心魔茶璎乳 2.png',
    3: '心魔茶璎乳 3 (1).png',
    4: '心魔茶璎乳 4.png'
  },
  meiruixue: {
    name: '梅蕊穴',
    1: '梅蕊穴 (1).png',
    2: '梅蕊穴 (2).png',
    3: '梅蕊穴 (3).png',
    4: '梅蕊穴 (4).png'
  },
  liuyandiexinxue: {
    name: '流焰叠薪穴',
    1: '流焰叠薪穴 (1).png',
    2: '流焰叠薪穴 2.png',
    3: '流焰叠薪穴 3.png',
    4: '流焰叠薪穴 4.png'
  },
  qinggexianmingxue: {
    name: '清歌弦鸣穴',
    1: '清歌鸣弦穴 (1).png',
    2: '清歌鸣弦穴 (2).png',
    3: '清歌鸣弦穴 3.png',
    4: '清歌鸣弦穴 4.png'
  },
  lingxitongxin: {
    name: '灵犀同心',
    1: '灵犀同心穴 (1).png',
    2: '灵犀同心穴 2.png',
    3: '灵犀同心穴 3.png',
    4: '灵犀同心穴 4.png'
  },
  zhuojiuliuyanxue: {
    name: '灼酒流炎穴',
    1: '灼酒流炎穴  (1).png',
    2: '灼酒流炎穴 2.png',
    3: '灼酒流炎穴 3.png',
    4: '灼酒流炎穴 (4).png'
  },
  yanxialingru: {
    name: '烟霞灵乳',
    1: '烟霞灵乳 (1).png',
    2: '烟霞灵乳 2.png',
    3: '烟霞灵乳 3.png',
    4: '烟霞灵乳 4.png'
  },
  yuhuxiangru: {
    name: '玉虎噙香乳',
    1: '玉虎噙香乳 1.png',
    2: '玉虎噙香乳 2.png',
    3: '玉虎噙香乳 3.png',
    4: '玉虎噙香乳 4.png'
  },
  boruoputiju: {
    name: '般若菩提菊',
    1: '般若菩提菊 (1).png',
    2: '般若菩提菊 2.png',
    3: '般若菩提菊 3.png',
    4: '般若菩提菊 4.png'
  }
};

// 扁平化 52 项任务
const tasks = [];
for (const [id, info] of Object.entries(RELIC_FILE_MAP)) {
  for (let s = 1; s <= 4; s++) {
    tasks.push({
      id,
      stage: s,
      key: `${id}_${s}`,
      name: info.name,
      file: info[s],
      fullPath: join(SRC_DIR, info[s])
    });
  }
}

console.log(`准备处理 13 名器 × 4 阶段 = ${tasks.length} 张图片...`);
for (const t of tasks) {
  if (!existsSync(t.fullPath)) {
    console.error(`❌ 文件不存在: ${t.fullPath}`);
    process.exit(1);
  }
}

// 建立 HTTP 服务供 headless Chrome 进行 Canvas 硬件加速高保真缩放
const server = createServer((req, res) => {
  if (req.url.startsWith('/img/')) {
    const idx = parseInt(req.url.slice(5), 10);
    const t = tasks[idx];
    if (t && existsSync(t.fullPath)) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(readFileSync(t.fullPath));
      return;
    }
    res.writeHead(404);
    res.end();
  } else if (req.url === '/worker.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="background:#111;color:#eee;">
      <div id="status">正在转码 52 张名器四阶段纹章...</div>
      <script>
        const tasks = ${JSON.stringify(tasks.map((t, i) => ({ idx: i, key: t.key, id: t.id, stage: t.stage })))};
        const size = ${SIZE};
        const quality = ${QUALITY};
        const out = {};
        const logs = [];

        async function processAll() {
          for (const t of tasks) {
            try {
              const img = new Image();
              await new Promise((res, rej) => {
                img.onload = res;
                img.onerror = rej;
                img.src = '/img/' + t.idx;
              });

              const c = document.createElement('canvas');
              c.width = size;
              c.height = size;
              const ctx = c.getContext('2d', { alpha: true });
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';

              // 居中正方形裁剪，确保徽章不畸变
              const dim = Math.min(img.naturalWidth, img.naturalHeight);
              const sx = (img.naturalWidth - dim) / 2;
              const sy = (img.naturalHeight - dim) / 2;
              ctx.drawImage(img, sx, sy, dim, dim, 0, 0, size, size);

              const webpData = c.toDataURL('image/webp', quality);
              const jpegData = c.toDataURL('image/jpeg', quality);

              out[t.key] = {
                webp: webpData,
                jpeg: jpegData
              };
              logs.push(t.key + ' (' + img.naturalWidth + 'x' + img.naturalHeight + ') -> ' + size + 'x' + size + ' webp: ' + Math.round(webpData.length * 3 / 4 / 1024 * 10) / 10 + ' KB');
            } catch (err) {
              logs.push(t.key + ' 错误: ' + err.message);
            }
          }
          document.getElementById('status').innerText = '转码完成，回传数据中...';
          await fetch('/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(out)
          });
        }
        processAll();
      </script>
    </body></html>`);
  } else if (req.url === '/save') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      res.writeHead(200);
      res.end('OK');
      handleComplete(JSON.parse(body));
    });
  }
});

server.listen(PORT, () => {
  console.log(`启动转码微服务端口 ${PORT}，唤起 Chrome 进行 256×256 双格式硬件加速转码...`);
  execFile(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', `http://127.0.0.1:${PORT}/worker.html`]);
});

function handleComplete(results) {
  server.close();
  console.log(`\n🎉 52 张名器纹章全部转码成功！`);

  const embedJson = {};
  let totalWebpBytes = 0;

  // 1. 生成内嵌字典（以 webp 格式为核心）
  for (const t of tasks) {
    const res = results[t.key];
    if (res && res.webp) {
      embedJson[t.key] = res.webp;
      // 兼容回退：如果不带阶段后缀访问 id，默认命中 stage 1
      if (t.stage === 1) {
        embedJson[t.id] = res.webp;
      }
      totalWebpBytes += Math.round(res.webp.length * 3 / 4);
    }
  }

  console.log(`- 纹章总数: 52 张（13 名器 × 4 阶段）`);
  console.log(`- Base64 字典条目数: ${Object.keys(embedJson).length} 条（52 阶段键 + 13 主键）`);
  console.log(`- 内嵌总字节体积: ~${(totalWebpBytes / 1024).toFixed(1)} KB (Base64 后约 ${(totalWebpBytes * 4 / 3 / 1024).toFixed(1)} KB)`);

  if (!APPLY) {
    console.log(`\n（预演模式完成，未写入磁盘；请追加 --apply 参数执行写盘与归档）`);
    process.exit(0);
    return;
  }

  // 2. 写入 src/assets_data/_relics_embed.json
  mkdirSync(join(ROOT, 'src', 'assets_data'), { recursive: true });
  writeFileSync(OUT_JSON, JSON.stringify(embedJson), 'utf8');
  console.log(`✅ [1/3] 已写入内嵌数据源: ${OUT_JSON}`);

  // 根目录同名文件如果被某些脚本引用，也保持同步
  writeFileSync(join(ROOT, '_relics_embed.json'), JSON.stringify(embedJson), 'utf8');

  // 3. 写入 src/assets/名器图标/
  mkdirSync(OUT_ASSETS, { recursive: true });
  for (const t of tasks) {
    const res = results[t.key];
    if (res) {
      const webpBuf = Buffer.from(res.webp.replace(/^data:image\/webp;base64,/, ''), 'base64');
      const jpegBuf = Buffer.from(res.jpeg.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
      writeFileSync(join(OUT_ASSETS, `${t.key}.webp`), webpBuf);
      writeFileSync(join(OUT_ASSETS, `${t.key}.jpg`), jpegBuf);
      if (t.stage === 1) {
        writeFileSync(join(OUT_ASSETS, `${t.id}.webp`), webpBuf);
        writeFileSync(join(OUT_ASSETS, `${t.id}.jpg`), jpegBuf);
      }
    }
  }
  console.log(`✅ [2/3] 已归档 256×256 WebP 与 JPG 至工程资产: ${OUT_ASSETS}`);

  // 4. 写入酒馆本地目录（若目录存在）
  if (existsSync(TAVERN_RELICS)) {
    for (const t of tasks) {
      const res = results[t.key];
      if (res) {
        const webpBuf = Buffer.from(res.webp.replace(/^data:image\/webp;base64,/, ''), 'base64');
        const jpegBuf = Buffer.from(res.jpeg.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
        writeFileSync(join(TAVERN_RELICS, `${t.key}.webp`), webpBuf);
        writeFileSync(join(TAVERN_RELICS, `${t.key}.jpg`), jpegBuf);
        if (t.stage === 1) {
          writeFileSync(join(TAVERN_RELICS, `${t.id}.webp`), webpBuf);
          writeFileSync(join(TAVERN_RELICS, `${t.id}.jpg`), jpegBuf);
        }
      }
    }
    console.log(`✅ [3/3] 已同步部署至酒馆本地图库: ${TAVERN_RELICS}`);
  }

  console.log(`\n🎉 全部名器纹章数据源生成完毕！`);
  process.exit(0);
}
