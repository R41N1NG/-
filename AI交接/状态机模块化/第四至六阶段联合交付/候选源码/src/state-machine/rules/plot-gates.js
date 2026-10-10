const XSD_PLOT_POLICY = createXsdPlotPolicy();
const { FREE_FIELD_WHITELIST, FREE_WORLD_EVENTS, FREE_NEGATED_OR_PLAN, FREE_VAGUE_WAR,
  FREE_SUSPECT_EXEMPT, FREE_SUSPECT_FLOOR, EVENT_ANCHOR_START } = XSD_PLOT_POLICY;
function freeFieldGate(field, val, sd) { return XSD_PLOT_POLICY.freeFieldGate(field, val, sd); }
function freeFieldSuspect(field, val, sd) { return XSD_PLOT_POLICY.freeFieldSuspect(field, val, sd); }
function autoEventGate(field, sd) { return XSD_PLOT_POLICY.autoEventGate(field, sd); }

function eligibleKnown(known, sd) { return XSD_PLOT_POLICY.eligibleKnown(known, sd); }
