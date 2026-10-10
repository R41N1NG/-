const XSD_SUBJECT_EVIDENCE = createXsdSubjectEvidence({
  holders: Object.keys(HOLDER_TO_RELIC), hardPatterns: DEFLOWER_HARD_RES,
});
function deflowerEvidenceIn(prose, holder) { return XSD_SUBJECT_EVIDENCE.deflower(prose, holder); }
