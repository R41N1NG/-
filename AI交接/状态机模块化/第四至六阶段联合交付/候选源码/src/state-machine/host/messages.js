/* ═══════════════════════════════════════════════════════════
 * 九 · 身份：首楼解析 / 点击菜单 / 切开场白 / 刷新开场白
 * ═══════════════════════════════════════════════════════════ */

const XSD_MESSAGE_READER = createXsdMessageReader({ API, console, TAG, msgOf });
function messageText(messageId, withSwipes) { return XSD_MESSAGE_READER.messageText(messageId, withSwipes); }
function isNewChat() { return XSD_MESSAGE_READER.isNewChat(); }
function latestMessageId() { return XSD_MESSAGE_READER.latestMessageId(); }

/**
 * 首楼开场白里的 `<IdentityPick name="…"/>` → 身份。
 * ⚠️ 只在**新聊天**自动同步（身份缺失，或聊天只有第 0 条）；否则玩家用 /身份 切过之后，
 *    一次刷新就会被首楼覆盖回去。
 * ⚠️ 停在「菜单楼」上时不算身份声明 —— 否则玩家滑回菜单楼看一眼，身份就被重置成赵无忧。
 */
async function syncIdentityFromFirstMes(reason) {
  const first = messageText(0);
  if (first === null) { console.log(TAG, `[身份] 取不到首楼（${reason}），跳过`); return null; }
  if (first.includes('<IdentityMenu/>')) {
    console.log(TAG, `[身份] 当前停在身份菜单楼（${reason}），身份保持 ${readIdentity() ?? '未设'}`);
    return readIdentity();
  }
  const m = first.match(/<IdentityPick\s+name\s*=\s*"([^"]+)"\s*\/?>/);
  if (!m) {
    console.log(TAG, `[身份] 首楼没有 <IdentityPick>（${reason}）—— 身份保持 ${readIdentity() ?? '未设'}`);
    return null;
  }
  const want = m[1].trim();
  const cur = readIdentity();
  const fresh = isNewChat();
  if (!fresh && cur && cur !== want) {
    console.log(TAG, `[身份] 首楼写着「${want}」，当前是「${cur}」且聊天已在推进 ⇒ **不覆盖**（想换发 /身份 ${want}）`);
    return cur;
  }
  if (cur === want) {
    console.log(TAG, `[身份] 与首楼一致：${want}`);
    try { await syncIdentityEntries(want); } catch (e) { /* 忽略 */ }
    return cur;
  }
  const r = await writeIdentity(want);
  console.log(TAG, r.ok ? `[身份] 首楼 → ${want}（via ${r.via}）` : `[身份] ❌ 写入失败：${r.why}`);
  return r.ok ? want : cur;
}

/**
 * 点击身份菜单里的按钮：写身份／阵营 ⇒ 切第 0 楼的 swipe（＝换开场白）。
 * ⚠️ 开场白在酒馆里就是**第 0 楼的 swipes**（first_mes ＝ swipe[0]，alternate_greetings 依次往下）。
 * ⚠️ swipe 序号**不硬编码**：现场按每条 swipe 里的 `<IdentityPick name="…">` 反查，顺序变了也不会错。
 * ⚠️ 必须**排除菜单楼**：菜单楼自己也带 `<IdentityPick name="赵无忧"/>`（默认身份），
 *    不排除的话点「赵无忧」会跳回菜单楼，看起来像没反应。
 */
async function pickIdentity(name, options = {}) {
  if (!IDENTITY_NAMES.includes(name)) { console.warn(TAG, `[身份] 未知身份「${name}」`); return -1; }
  const r = await writeIdentity(name, options.guard);
  if (!r.ok) {
    if (options.strict) throw new Error(r.why || '身份写入失败');
    toast('warning', r.why || '身份写入失败，请检查酒馆助手', 7000);
    return -1;
  }
  console.log(TAG, r.ok ? `[身份] 点击 → ${name}／阵营 ${r.faction}（via ${r.via}）` : `[身份] ❌ 写变量失败：${r.why}`);

  if (options.switchGreeting === false) return -1;
  let idx = -1;
  try {
    if (API.setChatMessages && API.getChatMessages) {
      const first = API.getChatMessages(0, { include_swipes: true })[0];
      const swipes = (first && first.swipes) || [];
      const re = new RegExp('<IdentityPick\\s+name\\s*=\\s*"' + name + '"');
      idx = swipes.findIndex((s) => re.test(String(s)) && !String(s).includes('<IdentityMenu/>'));
      if (idx >= 0) {
        await API.setChatMessages([{ message_id: 0, swipe_id: idx }], { refresh: 'affected' });
        console.log(TAG, `[身份] 第 0 楼已切到 swipe #${idx}（${name}），共 ${swipes.length} 条`);
      } else {
        console.warn(TAG, `[身份] 第 0 楼的 ${swipes.length} 条开场白里没有「${name}」的标记 —— 只写了变量，请手动滑到那一楼`);
      }
    } else {
      console.warn(TAG, '[身份] 没有 setChatMessages／getChatMessages —— 需要酒馆助手（JS-Slash-Runner）');
    }
  } catch (e) { console.warn(TAG, '[身份] 切开场白失败：', msgOf(e)); }

  if (!options.quiet) {
    const detail = r.entries && r.entries.wb ? `（世界书已同步：开启「${name}」与对应剧情）` : '';
    toast('info', `身份：${name}${detail}${idx >= 0 ? '' : '（请手动滑到对应开场白）'}`, 6000);
  }
  return idx;
}

/* 首楼交互扩展：仅放在酒馆助手状态机，不放入消息 HTML。 */
