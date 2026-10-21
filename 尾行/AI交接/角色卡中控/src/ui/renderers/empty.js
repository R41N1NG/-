"use strict";
/** Clear every live region on mount/reset; no previous chat or template sample may survive. */
function clearLiveData(document) {
  const labels = {
    routeDistrict: "—",
    routePlace: "等待开局",
    routeWeather: "—",
    routeStrikeTag: "—",
    routeRemain: "—",
    phase: "未开局",
    distName: "—",
    staminaVal: "—",
    fullStaminaVal: "—",
    heartNum: "—",
    miniHeartNum: "—",
    bpmNum: "—",
    miniBpmNum: "—",
    cash: "—",
    pi: "—",
    proxVal: "—",
    proxStage: "—",
    terminalFloorBadge: "未开局",
    areaFam: "暂无记录",
    famDesc: "—",
    alertText: "未知",
    popoverAlertText: "未知",
    popoverAlertRange: "—",
    ledger: "本轮暂无结算",
    assess: "",
    herGearName: "",
    herAlert: "",
    albumCount: "0 / 0",
  };
  for (const [id, label] of Object.entries(labels)) {
    const node = document.getElementById(id);
    if (node) node.textContent = label;
  }
  for (const id of [
    "routeStepper",
    "wx-attrs",
    "wx-attr-tags",
    "tags",
    "signal",
    "exitChips",
    "spotChips",
    "envTags",
    "alertPips",
    "popoverAlertPips",
    "albumWall",
    "wx-items",
  ]) {
    const node = document.getElementById(id);
    if (node) node.replaceChildren();
  }
  for (const id of ["proxFill", "staminaFill", "fullStaminaFill", "famFill"]) {
    const node = document.getElementById(id);
    if (node) node.style.width = "0%";
  }
  for (const id of ["herGear", "idBadge", "photoToast", "albumDetail"]) {
    const node = document.getElementById(id);
    if (node) node.hidden = true;
  }
  for (const id of ["spotRow", "sanctuaryRow"]) {
    const node = document.getElementById(id);
    if (node) {
      node.hidden = false;
      node.style.display = "none";
    }
  }
  for (const id of [
    "photoToastName",
    "photoToastMeta",
    "albumDetailMeta",
    "item-description",
  ]) {
    const node = document.getElementById(id);
    if (node) node.textContent = "";
  }
  const meta = document.getElementById("itemMeta");
  if (meta) meta.textContent = "尚未选择道具";
  document
    .querySelectorAll("#pips .pip")
    .forEach((node) => node.classList.remove("active"));
  for (const id of [
    "alertRow",
    "popoverHerState",
    "staminaBox",
    "fullStaminaBox",
  ]) {
    const node = document.getElementById(id);
    if (node) {
      delete node.dataset.tier;
      delete node.dataset.band;
    }
  }
  const image = document.getElementById("albumDetailImg");
  if (image) image.removeAttribute("src");
  document.getElementById("photoToastImg")?.removeAttribute("src");
  document.getElementById("sparkLine")?.setAttribute("points", "");
  document.getElementById("herAlert")?.classList.remove("show");
  document
    .querySelectorAll(".pnode")
    .forEach((node) => node.classList.remove("active", "passed"));
  const prox = document.getElementById("prox");
  if (prox) prox.value = 0;
}
module.exports = { clearLiveData };
