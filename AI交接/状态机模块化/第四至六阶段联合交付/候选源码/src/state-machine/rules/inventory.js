/** 原共享作用域名称的兼容适配；函数依赖延迟解析，避免后置模块初始化时序变化。 */
const XSD_INVENTORY_DEPS = {
  readStatData: (...args) => readStatData(...args),
  messageText: (...args) => messageText(...args),
  writeStat: (...args) => writeStat(...args),
  console,
  TAG,
};
const XSD_INVENTORY_RULES = createXsdInventoryRules(XSD_INVENTORY_DEPS);
function normItemName(s) { return XSD_INVENTORY_RULES.normItemName(s); }
function itemIdOf(name) { return XSD_INVENTORY_RULES.itemIdOf(name); }
function normalizeInventory(inv) { return XSD_INVENTORY_RULES.normalizeInventory(inv); }
const ANCHOR_EVIDENCE = XSD_INVENTORY_RULES.ANCHOR_EVIDENCE;
const NEG_RE = XSD_INVENTORY_RULES.NEG_RE;
function negatedAround(text, re) { return XSD_INVENTORY_RULES.negatedAround(text, re); }
function anchorEvidenceIn(prose, field) { return XSD_INVENTORY_RULES.anchorEvidenceIn(prose, field); }
function stripStatusBlock(text) { return XSD_INVENTORY_RULES.stripStatusBlock(text); }
function itemEvidenceIn(prose, name) { return XSD_INVENTORY_RULES.itemEvidenceIn(prose, name); }
function findItemIndex(inv, key) { return XSD_INVENTORY_RULES.findItemIndex(inv, key); }
function applyItemChange(inv, chg) { return XSD_INVENTORY_RULES.applyItemChange(inv, chg); }
async function reconcileNadeLedger(where) { return XSD_INVENTORY_RULES.reconcileNadeLedger(where); }
function defaultInventoryRaw(identity) { return XSD_INVENTORY_RULES.defaultInventoryRaw(identity); }
function defaultInventoryFor(identity) { return XSD_INVENTORY_RULES.defaultInventoryFor(identity); }
