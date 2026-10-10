/** 原共享作用域名称的兼容适配；函数依赖延迟解析，避免后置模块初始化时序变化。 */
const XSD_INITIALIZER_DEPS = {
  canReadState: () => Boolean(readLayer(L_CHAT) && readLayer(L_MSG)),
  readStatData: (...args) => readStatData(...args),
  ALL_FIELDS,
  IDENTITY_DEFAULT,
  FACTION_DEFAULT,
  defaultInventoryFor: (...args) => defaultInventoryFor(...args),
  normalizeInventory: (...args) => normalizeInventory(...args),
  console,
  TAG,
  openFieldsFor: (...args) => openFieldsFor(...args),
  writeStat: (...args) => writeStat(...args),
};
const XSD_INITIALIZER = createXsdInitializer(XSD_INITIALIZER_DEPS);
async function ensureInit(where) { return XSD_INITIALIZER.ensureInit(where); }
