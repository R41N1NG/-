/** 菜单依赖接线。仅创建无监听实例，boot 继续调用原入口启动。 */
const xsdIdentityMenuController = createXsdIdentityMenu({
  window, API, EVENTS, IDENTITY_NAMES, toast, msgOf, latestMessageId,
  pickIdentity, readLayer, L_CHAT, L_MSG, TAG,
  timepointModule: typeof xdsTimepointModule === 'function' ? xdsTimepointModule : null,
  console, setTimeout, setInterval, clearInterval,
});

function xdsMenuHost() { return xsdIdentityMenuController.xdsMenuHost(...arguments); }
function xdsMenuContext() { return xsdIdentityMenuController.xdsMenuContext(...arguments); }
function xdsMenuChatKey() { return xsdIdentityMenuController.xdsMenuChatKey(...arguments); }
function xdsMenuSetValue(input, value) { return xsdIdentityMenuController.xdsMenuSetValue(...arguments); }
function xdsMenuVisible(el) { return xsdIdentityMenuController.xdsMenuVisible(...arguments); }
function xdsMenuComposer() { return xsdIdentityMenuController.xdsMenuComposer(...arguments); }
function xdsMenuCanSend(composer, allowEmpty = false) { return xsdIdentityMenuController.xdsMenuCanSend(...arguments); }
function xdsMenuIntro(form) { return xsdIdentityMenuController.xdsMenuIntro(...arguments); }
function xdsMenuStatus(box, message, error) { return xsdIdentityMenuController.xdsMenuStatus(...arguments); }
function xdsMenuAssets() { return xsdIdentityMenuController.xdsMenuAssets(...arguments); }
function xdsMenuImageUrl(img, maps) { return xsdIdentityMenuController.xdsMenuImageUrl(...arguments); }
function xdsMenuHydrate(root, runtime) { return xsdIdentityMenuController.xdsMenuHydrate(...arguments); }
function xdsMenuSent(message, baseline) { return xsdIdentityMenuController.xdsMenuSent(...arguments); }
function xdsMenuSubmit(form, button, runtime) { return xsdIdentityMenuController.xdsMenuSubmit(...arguments); }
function bindIdentityMenu() { return xsdIdentityMenuController.bindIdentityMenu(...arguments); }
function ensureMenuBound() { return xsdIdentityMenuController.ensureMenuBound(...arguments); }

/**
 * 把第 0 楼的开场白按**当前角色卡**重刷一遍。
 * 用途：酒馆在开聊天那一刻就把 first_mes 与 alternate_greetings 烧成了第 0 楼的 swipes，
 * 之后换卡不会追改 ⇒ 旧聊天里看到的是旧文案。这条命令用来补这一步。
 */
async function refreshGreetings() {
  if (!API.getCharacter || !API.setChatMessages) {
    console.warn(TAG, '[身份] 没有 getCharacter／setChatMessages，无法刷新开场白');
    return { ok: false };
  }
  let swipes = [];
  try {
    const ch = await API.getCharacter('current');
    swipes = (ch && ch.first_messages ? ch.first_messages : []).filter((s) => typeof s === 'string' && s.trim());
  } catch (e) { console.warn(TAG, '[身份] 读角色卡失败：', msgOf(e)); return { ok: false }; }
  if (swipes.length < 2) { console.warn(TAG, `[身份] 角色卡里只有 ${swipes.length} 条开场白，不刷新`); return { ok: false }; }
  const idn = readIdentity() ?? IDENTITY_DEFAULT;
  const re = new RegExp('<IdentityPick\\s+name\\s*=\\s*"' + idn + '"');
  let idx = swipes.findIndex((s) => re.test(s) && !s.includes('<IdentityMenu/>'));
  if (idx < 0) idx = 0;
  try {
    await API.setChatMessages([{ message_id: 0, swipes, swipe_id: idx, message: swipes[idx] }], { refresh: 'affected' });
    console.log(TAG, `[身份] 第 0 楼已按当前卡刷新：${swipes.length} 条开场白，停在 #${idx}（${idn}）`);
    return { ok: true, count: swipes.length, idx };
  } catch (e) { console.warn(TAG, '[身份] 刷新第 0 楼失败：', msgOf(e)); return { ok: false }; }
}

