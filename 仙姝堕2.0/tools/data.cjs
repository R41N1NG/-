"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm");
const { buildMenuHtml } = require("./opening/menu-builder.cjs");
const {storyEntries, metricEntries} = require("../src/runtime/story_entries");
const { POINTS } = require("./opening/timepoint-slider.cjs");
function source(root) {
  const read = (f) => fs.readFileSync(path.join(root, f), "utf8");
  const greetings = Object.fromEntries(
    read("src/text_data/_card_greetings.txt")
      .split(/^@@@ /m)
      .slice(1)
      .map((x) => {
        const i = x.indexOf("\n");
        return [x.slice(0, i).trim(), x.slice(i + 1).trim()];
      }),
  );
  const assets = JSON.parse(
    read("src/assets/本地图包_xsd_gallery/_image_manifest.json"),
  );
  const registry = read("src/state-machine/data/registry.js"),
    rules = read("src/state-machine/rules/relic-progress.js");
  // Migrated 2.0 rules execute with explicit state dependencies in their own scope.
  return (
    "module.exports=" +
    JSON.stringify({
      greetings,
      embeddedManagedEntries:storyEntries(JSON.parse(read("src/config/node_stories.json")),JSON.parse(read("src/config/character_stages.json")).characters)
        .concat(metricEntries(JSON.parse(read("src/config/metric_events.json")))),
      metricEventDefinitions:JSON.parse(read("src/config/metric_events.json")),
      promotionDefinitions:JSON.parse(read("src/config/promotions.json")),
      characterProfiles: JSON.parse(read("src/config/character_stages.json")).characters,
      assets,
      openingMenu: buildMenuHtml({
        assets: JSON.parse(read("src/assets_data/opening_assets.json")),
        instanceId: "xsd2-opening",
      }),
      openingTimepoints: POINTS,
      galleryIds: JSON.parse(read("src/assets_data/_gallery_ids.json")),
    }) +
    ";\nmodule.exports.rules=function(stat){const readStatData=()=>{const copy={...stat,名器归属:{...stat.名器归属},破处者:{...stat.破处者}};for(const [id,n]of Object.entries(stat.relic_stage_override||{}))if(n===0){const c=RELIC_PILOT_CONFIG[id];delete copy.名器归属[id];delete copy.名器归属[c.names[0]];for(const name of c.ownerAliases)delete copy.破处者[name];}return copy;},readIdentity=()=>stat.身份;const negatedAround=(text,re)=>String(text).split(/[。！？；\\n]/).some(s=>{re.lastIndex=0;return re.test(s)&&/未|没有|没能|不曾|并不|计划|打算|假如|如果|传闻/.test(s);});\n" +
    registry +
    "\n" +
    rules +
    "\nreturn {IDENTITIES,IDENTITY_FACTION,ALL_FIELDS,FIELD_TABLE,FORM_OF_HOLDERS,HOLDER_TO_RELIC,DEFLOWER_HARD_RES,openFieldsFor,RELIC_PILOT_CONFIG,getRelicStage,parseRelicAction,validateRelicAction,calcRelicProgress,hasRelicPhysiologicalResponse,hasRelicStage3Response,hasRelicStage4Response};};"
  );
}
function load(root) {
  const box = { module: { exports: {} }, console, Date };
  vm.runInNewContext(source(root), box);
  return box.module.exports;
}
module.exports = { source, load };
