"use strict";
// Starting balances reported for migration in cooperation.txt (2026-10-11
// 22:30). The four granted techniques are checked against the 2.0 greetings.
// Applied once on a new opening; never backfill an existing saved inventory.
const STARTING = {
  赵无忧: [["醉春风", 2], ["墨山道佩剑", 1]],
  自设: [["醉春风", 2], ["随身青锋剑", 1], ["《极乐引》残篇", 1]],
  焚欲殿主: [["天姝令", 1], ["《燎原蛊火诀》", 1]],
  欢喜殿主: [["天姝令", 1], ["《旖旎梵音心经》", 1]],
  浊龙殿主: [["天姝令", 1], ["《极乐龙体诀》", 1]],
  魂欢殿主: [["天姝令", 1], ["《情丝化灵录》", 1]],
};
function startingInventoryFor(identity) {
  return (STARTING[identity] || []).map(([name, count]) => ({
    id: name, name, count, source: "opening",
  }));
}
module.exports = { startingInventoryFor };
