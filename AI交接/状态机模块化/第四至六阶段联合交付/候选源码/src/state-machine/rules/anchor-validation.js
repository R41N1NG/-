const XSD_ANCHOR_RULES = createXsdAnchorRules({ ALL_FIELDS, TAG, console,
 normalizeAnchorName: (...args) => normalizeAnchorName(...args),
 anchorEvidenceIn: (...args) => anchorEvidenceIn(...args),
 deflowerEvidenceIn: (...args) => deflowerEvidenceIn(...args),
 autoEventGate: (...args) => autoEventGate(...args),
});
const { MINGQI_PREREQ } = XSD_ANCHOR_RULES;
if (typeof window !== 'undefined' && window.__xsdCorrection) Object.assign(window.__xsdCorrection.prerequisites, MINGQI_PREREQ);
function hashText(str) { return XSD_ANCHOR_RULES.hashText(str); }
function validateAnchors(listRaw, prose, messageId, knownNow, deflowerNow, sourceState) {
 return XSD_ANCHOR_RULES.validateAnchors(listRaw, prose, messageId, knownNow, deflowerNow, sourceState || readStatData() || {});
}
