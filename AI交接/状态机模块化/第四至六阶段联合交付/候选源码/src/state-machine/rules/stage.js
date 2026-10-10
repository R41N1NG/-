const XSD_STAGE_RULES = createXsdStageRules();
const { STAGE_STEPS, STAGE_BASE, SEG_TIME, FLOOR_PIN, STAGE_FAST_FORWARD } = XSD_STAGE_RULES;
function isSceneLocked(text, stat) { return XSD_STAGE_RULES.isSceneLocked(text, stat); }
function stageOfFloor(floor, shift) { return XSD_STAGE_RULES.stageOfFloor(floor, shift); }
function checkFastForwardStage(known, curStage) { return XSD_STAGE_RULES.checkFastForwardStage(known, curStage); }
