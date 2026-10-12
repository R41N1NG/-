"use strict";
const QUICK_ACTIONS = Object.freeze({
  "观察四周": {mode:"send"},
  "与在场之人交谈": {mode:"fill", draft:"与在场之人交谈："},
  "自行行动": {mode:"fill", draft:"自行行动："},
});
function itemAction(item) { return item.useMode || "send"; }
module.exports = {QUICK_ACTIONS, itemAction};
