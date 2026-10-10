const XSD_LEDGER_READER = createXsdLedgerReader({ getPrerequisites: () => MINGQI_PREREQ });
/* ─────────── 存储层：消息层 ＋ 聊天层（双写；读时消息层优先）─────────── */
const L_MSG = { type: 'message', message_id: -1 };   // -1 ＝ 最新一楼
const L_CHAT = { type: 'chat' };
const LAYERS = [L_MSG, L_CHAT];
const LAYER_LABEL = { message: '消息层(#-1)', chat: '聊天层' };

/** 读一整层变量表；失败／形状不对返回 null */
function readLayer(opt) {
  if (!API.getVariables) return null;
  try {
    const v = API.getVariables(opt);
    return (v && typeof v === 'object' && !Array.isArray(v)) ? v : null;
  } catch (e) {
    console.warn(TAG, `读 ${LAYER_LABEL[opt.type]} 失败：`, msgOf(e));
    return null;
  }
}

/** 读 stat_data（两层的**合并视图**，消息层优先）。两层都没有 ⇒ null（调用方去初始化） */
function readStatData() {
  const chatV = readLayer(L_CHAT);
  const msgV = readLayer(L_MSG);
  const stat = XSD_LEDGER_READER.mergeStatLayers(chatV, msgV, { chatId: currentChatId() });
  if (!stat) return null;
  const cs = chatV && chatV.stat_data;
  const service = window.__xsdCorrection;
  if (service) {
    stat.人工纠错 = cs && cs.人工纠错 && cs.人工纠错.chatId === currentChatId() ? cs.人工纠错 : null;
    return service.effective(stat);
  }
  return stat;
}

function readKnown() {
  const s = readStatData();
  return (s && s.known && typeof s.known === 'object') ? s.known : null;
}
function readIdentity() {
  const s = readStatData();
  return (s && typeof s.身份 === 'string' && s.身份) ? s.身份 : null;
}
function readFaction() {
  const s = readStatData();
  return (s && typeof s.阵营 === 'string' && s.阵营) ? s.阵营 : null;
}

/** 某层里 stat_data 的概况（诊断用，不打印正文） */
function layerProbe(opt) {
  const v = readLayer(opt);
  const sd = (v && v.stat_data && typeof v.stat_data === 'object') ? v.stat_data : null;
  const known = (sd && sd.known && typeof sd.known === 'object') ? sd.known : null;
  return {
    可用: !!v,
    顶层键: v ? Object.keys(v) : null,
    有stat_data: !!sd,
    stat_data键: sd ? Object.keys(sd) : null,
    known字段数: known ? Object.keys(known).length : null,
    身份: sd ? (sd.身份 ?? null) : null,
    阵营: sd ? (sd.阵营 ?? null) : null,
  };
}

