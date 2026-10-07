/* 一次性补丁：名器归属判定加**诊断输出**（判成"别人占据"时，把两个输入原样打出来）
 *  运行：node tools/_patch_relic_diag.mjs
 *  目的：反色＝st.state === 'other'。玩家报「自设也反色」时，光看颜色分不清是
 *        (1) 这件名器本来归 NPC（设计如此）、(2) 破处簿/归属表记成了别人、(3) 身份文本没被认成自设。
 *        所以在判定点打一行日志，把 identity / owner / 命中分支 全部摊开。
 */
import fs from 'node:fs';

const files = ['卡片脚本/状态栏面板.js', '卡片脚本/_src/状态栏面板.模板.js'];
const log = [];

const anchor = '    // 3. 校验：当前身份是否等于归属者';
const injected = [
  '    // 3. 校验：当前身份是否等于归属者',
].join('\n');

for (const f of files) {
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes('[名器归属·诊断]')) { log.push('– ' + f + '：已有诊断，跳过'); continue; }
  const i = s.indexOf(anchor);
  if (i < 0) { log.push('✘ ' + f + '：找不到校验段锚点'); continue; }
  /* 在 isMe 计算之后插一行诊断：只有判成"别人"时才打，避免刷屏 */
  const tailAnchor = '    })();';
  const j = s.indexOf(tailAnchor, i);
  if (j < 0) { log.push('✘ ' + f + '：找不到 isMe 结尾'); continue; }
  const ins = [
    '    })();',
    '    if (!isMe) {',
    '      try {',
    '        console.log(TAG, \'[名器归属·诊断] \' + rel.n + \'：身份=「\' + idText + \'」｜归属=「\' + owner + \'」\'',
    '          + \'｜身份判定：自设=\' + isCustom + \'／赵无忧=\' + isZhao + \'／任一殿主=\' + isLordAny',
    '          + \'｜名器表 lord=「\' + String(rel.lord || \'\') + \'」hall=「\' + String(rel.hall || \'\') + \'」\'',
    '          + \'（判为他人 ⇒ 纹章会反色）\');',
    '      } catch (e) { /* 诊断失败不影响功能 */ }',
    '    }',
  ].join('\n');
  s = s.slice(0, j) + ins + s.slice(j + tailAnchor.length);
  fs.writeFileSync(f, s, 'utf8');
  log.push('✔ ' + f + '：已加归属诊断');
}
console.log(log.join('\n'));
