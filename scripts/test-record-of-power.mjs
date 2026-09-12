// scripts/test-record-of-power.mjs
// Automated Test Suite for 404TN Record of Power Data Architecture (Phase R2.3)
// Comprehensive test coverage: 38 rigorous tests validating schema, integrity, exact numeric provenance, eras, traces, and UI.

import fs from 'fs';
import assert from 'assert';
import {
  RECORD_TYPES,
  EPISTEMIC_CLASSIFICATION,
  PROMISE_STATUS,
  INSTITUTIONS_REGISTRY,
  SEED_RECORDS,
  RESPONSIBILITY_RECORDS,
  RELATIONSHIPS,
  SOURCE_MAP,
  validateRecordOfPower,
  getRecordById,
  getRecordsByYear,
  getRecordsByType,
  getRecordsByIssue,
  getRecordsByInstitution,
  getPromisesByStatus,
  getRelatedRecords,
  getResponsibilityForRecord,
  getSourcesForRecord,
  getAccountabilityTrace
} from '../src/record-of-power/index.js';

console.log("============================================================");
console.log("RUNNING RECORD OF POWER DATA ARCHITECTURE TEST SUITE (R2.3)");
console.log("============================================================\n");

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// Load source manifest
const sourceManifest = JSON.parse(fs.readFileSync('docs/source-manifest.json', 'utf8'));

// ============================================================
// 1. DATASET INTEGRITY & VALIDATION TESTS
// ============================================================

test("1. Runtime Schema & Manifest Validation Passes with Zero Errors across all Canonical Records", () => {
  const result = validateRecordOfPower({
    records: SEED_RECORDS,
    institutions: INSTITUTIONS_REGISTRY,
    relationships: RELATIONSHIPS,
    responsibility: RESPONSIBILITY_RECORDS,
    sourceManifest,
    throwOnError: true
  });

  assert.strictEqual(result.valid, true, "Validation should be valid");
  assert.strictEqual(result.errors.length, 0, "Errors should be zero");
  assert.ok(result.stats.totalRecords >= 80, `Should have >= 80 records (found: ${result.stats.totalRecords})`);
  assert.ok(result.stats.totalInstitutions >= 20, `Should have >= 20 institutions (found: ${result.stats.totalInstitutions})`);
  assert.ok(result.stats.totalResponsibilities >= 15, `Should have >= 15 responsibility entries (found: ${result.stats.totalResponsibilities})`);
  assert.ok(result.stats.totalRelationships >= 25, `Should have >= 25 relationships (found: ${result.stats.totalRelationships})`);
});

test("2. Institution Registry Integrity & Parent Hierarchy", () => {
  assert.ok(INSTITUTIONS_REGISTRY["INST-PRESIDENCY"]);
  assert.ok(INSTITUTIONS_REGISTRY["INST-GOV"]);
  assert.ok(INSTITUTIONS_REGISTRY["INST-SONEDE"]);
  assert.ok(INSTITUTIONS_REGISTRY["INST-STEG"]);
  assert.ok(INSTITUTIONS_REGISTRY["INST-ANPE"]);
  assert.ok(INSTITUTIONS_REGISTRY["INST-INLUCC"]);
  assert.ok(INSTITUTIONS_REGISTRY["INST-CPG"]);
  assert.ok(INSTITUTIONS_REGISTRY["INST-SNJT"]);
  assert.ok(INSTITUTIONS_REGISTRY["INST-UGTT"]);
  assert.ok(INSTITUTIONS_REGISTRY["INST-FTDES"]);
  assert.ok(INSTITUTIONS_REGISTRY["INST-CA"]);
  assert.ok(INSTITUTIONS_REGISTRY["INST-FIPA"]);

  assert.strictEqual(INSTITUTIONS_REGISTRY["INST-GOV"].parent_institution_id, "INST-PRESIDENCY");
  assert.strictEqual(INSTITUTIONS_REGISTRY["INST-SONEDE"].parent_institution_id, "INST-MOA");
  assert.strictEqual(INSTITUTIONS_REGISTRY["INST-ANPE"].parent_institution_id, "INST-MOENV");
});

test("3. Canonical Record Types Diversity in Expanded Dataset", () => {
  const types = new Set(SEED_RECORDS.map(r => r.record_type));
  assert.ok(types.has(RECORD_TYPES.EVENT), "Must have EVENT");
  assert.ok(types.has(RECORD_TYPES.PROMISE), "Must have PROMISE");
  assert.ok(types.has(RECORD_TYPES.DECISION), "Must have DECISION");
  assert.ok(types.has(RECORD_TYPES.LAW), "Must have LAW");
  assert.ok(types.has(RECORD_TYPES.INSTITUTIONAL_CHANGE), "Must have INSTITUTIONAL_CHANGE");
  assert.ok(types.has(RECORD_TYPES.OFFICIAL_STATEMENT), "Must have OFFICIAL_STATEMENT");
  assert.ok(types.has(RECORD_TYPES.OPPOSITION_CLAIM), "Must have OPPOSITION_CLAIM");
  assert.ok(types.has(RECORD_TYPES.OUTCOME), "Must have OUTCOME");
  assert.ok(types.has(RECORD_TYPES.INDICATOR), "Must have INDICATOR");
  assert.ok(types.has(RECORD_TYPES.DATA_GAP), "Must have DATA_GAP");
});

test("4. Canonical Type Enum Coverage & EVIDENCE_LINK Architectural Semantics", () => {
  const allEnumTypes = Object.values(RECORD_TYPES);
  assert.strictEqual(allEnumTypes.length, 11, "Schema must define exactly 11 RECORD_TYPES");
  assert.ok(allEnumTypes.includes("EVIDENCE_LINK"), "Schema must define EVIDENCE_LINK bridging type");

  // 10 narrative/indicator types are instantiated as top-level canonical records in SEED_RECORDS
  const instantiatedTypes = new Set(SEED_RECORDS.map(r => r.record_type));
  assert.strictEqual(instantiatedTypes.size, 10, "SEED_RECORDS must instantiate all 10 narrative record types");
  assert.ok(!instantiatedTypes.has("EVIDENCE_LINK"), "EVIDENCE_LINK is reserved as a bridging type for raw evidence binding");
});

// ============================================================
// 2. QUERY SELECTORS & FILTER ENGINE TESTS
// ============================================================

test("5. Selector: getRecordById() handles found and missing records", () => {
  const dec117 = getRecordById("ROP-DEC-2021-0922-001");
  assert.ok(dec117);
  assert.strictEqual(dec117.short_title, "Decree 117 Exceptional Measures");
  assert.strictEqual(dec117.classification, EPISTEMIC_CLASSIFICATION.FACT);

  const missing = getRecordById("ROP-NONEXISTENT");
  assert.strictEqual(missing, null);
});

test("6. Selector: getRecordsByYear() covers all 8 chronological eras (2019–2026)", () => {
  const years = [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
  for (const yr of years) {
    const recs = getRecordsByYear(yr);
    assert.ok(recs.length >= 3, `Year ${yr} must have at least 3 records (found: ${recs.length})`);
  }
});

test("7. Selector: getRecordsByType() retrieves specific canonical types", () => {
  const laws = getRecordsByType(RECORD_TYPES.LAW);
  assert.ok(laws.length >= 5);
  assert.ok(laws.some(l => l.id === "ROP-LAW-2022-CONST-001"));
  assert.ok(laws.some(l => l.id === "ROP-LAW-2022-054-001"));
  assert.ok(laws.some(l => l.id === "ROP-LAW-2024-BCT-LENDING"));
  assert.ok(laws.some(l => l.id === "ROP-LAW-2024-ELEC-STRIP"));

  const gaps = getRecordsByType(RECORD_TYPES.DATA_GAP);
  assert.ok(gaps.length >= 4);
});

test("8. Selector: getRecordsByIssue() filters by policy domain", () => {
  const waterRecs = getRecordsByIssue("water");
  assert.ok(waterRecs.length >= 2);
  assert.ok(waterRecs.some(r => r.id === "ROP-OUT-2026-WATER-001"));

  const antiCorrRecs = getRecordsByIssue("anti_corruption");
  assert.ok(antiCorrRecs.length >= 2);
});

test("9. Selector: getRecordsByInstitution() retrieves records by jurisdiction", () => {
  const presRecs = getRecordsByInstitution("INST-PRESIDENCY");
  assert.ok(presRecs.length >= 10);

  const anpeRecs = getRecordsByInstitution("INST-ANPE");
  assert.ok(anpeRecs.length >= 1);
  assert.ok(anpeRecs.some(r => r.id === "ROP-GAP-2026-GABES-AIR-001"));
});

test("10. Selector: getPromisesByStatus() retrieves promises by lifecycle status", () => {
  const unresolved = getPromisesByStatus("UNRESOLVED");
  assert.ok(unresolved.length >= 1);
  assert.ok(unresolved.some(r => r.id === "ROP-PRM-2019-RECON-001"));

  const disputed = getPromisesByStatus("DISPUTED");
  assert.ok(disputed.length >= 1);
  assert.ok(disputed.some(r => r.id === "ROP-PRM-2019-SOV-001"));
});

test("11. Selector: getRelatedRecords() traverses directional edges", () => {
  const relatedToJul25 = getRelatedRecords("ROP-EVT-2021-0725-001");
  assert.ok(relatedToJul25.length >= 2);
  const ids = relatedToJul25.map(r => r.id);
  assert.ok(ids.includes("ROP-DEC-2021-0922-001"));
  assert.ok(ids.includes("ROP-STM-2021-0725-001"));
});

test("12. Selector: getResponsibilityForRecord() resolves institutional authority", () => {
  const waterRsp = getResponsibilityForRecord("ROP-OUT-2026-WATER-001");
  assert.ok(waterRsp.length >= 2);
  assert.ok(waterRsp.some(r => r.institution_id === "INST-SONEDE" && r.responsibility_type === "SERVICE_DELIVERY"));
  assert.ok(waterRsp.some(r => r.institution_id === "INST-MOA" && r.responsibility_type === "POLICY_AUTHORITY"));
});

test("13. Selector: getSourcesForRecord() resolves full source metadata", () => {
  const sources = getSourcesForRecord("ROP-EVT-2019-ELEC-001", SEED_RECORDS, sourceManifest);
  assert.ok(sources.length >= 1);
  assert.strictEqual(sources[0].source_id, "SRC-ISIE-ELEC2019");
});

// ============================================================
// 3. MULTI-HOP ACCOUNTABILITY TRAVERSAL TESTS (ALL 7 TRACES)
// ============================================================

test("14. Accountability Trace 1: Penal Reconciliation & Asset Recovery", () => {
  const trace = getAccountabilityTrace("ROP-PRM-2019-RECON-001", {
    records: SEED_RECORDS,
    institutions: INSTITUTIONS_REGISTRY,
    relationships: RELATIONSHIPS,
    responsibility: RESPONSIBILITY_RECORDS,
    sourceManifest
  });

  assert.ok(trace);
  assert.strictEqual(trace.primaryRecord.id, "ROP-PRM-2019-RECON-001");
  assert.ok(trace.outcomes.some(o => o.id === "ROP-OUT-2026-RECON-001"));
  assert.ok(trace.dataGaps.some(g => g.id === "ROP-GAP-2026-RECON-RECEIPTS-001"));
  assert.ok(trace.responsibleInstitutions.some(r => r.institution_id === "INST-MOF"));
  assert.ok(trace.sources.length >= 1);
});

test("15. Accountability Trace 2: July 25 Rupture & Decree 117", () => {
  const trace = getAccountabilityTrace("ROP-DEC-2021-0922-001", {
    records: SEED_RECORDS,
    institutions: INSTITUTIONS_REGISTRY,
    relationships: RELATIONSHIPS,
    responsibility: RESPONSIBILITY_RECORDS,
    sourceManifest
  });

  assert.ok(trace);
  assert.ok(trace.laws.some(l => l.id === "ROP-LAW-2022-CONST-001"));
  assert.ok(trace.institutionalChanges.some(ic => ic.id === "ROP-INS-2022-CSM-001"));
  assert.ok(trace.decisions.some(d => d.id === "ROP-DEC-2022-JUDGES-001"));
  assert.ok(Array.isArray(trace.actions));
  assert.strictEqual(trace.actions.length, trace.decisions.length + trace.laws.length + trace.institutionalChanges.length);
});

test("16. Accountability Trace 3: Judiciary Restructuring & Revocation of 57 Magistrates", () => {
  const trace = getAccountabilityTrace("ROP-INS-2022-CSM-001", {
    records: SEED_RECORDS,
    institutions: INSTITUTIONS_REGISTRY,
    relationships: RELATIONSHIPS,
    responsibility: RESPONSIBILITY_RECORDS,
    sourceManifest
  });

  assert.ok(trace);
  assert.ok(trace.decisions.some(d => d.id === "ROP-DEC-2022-JUDGES-001"));
  assert.ok(trace.outcomes.some(o => o.id === "ROP-OUT-2022-JUDICIAL-INJ"));
});

test("17. Accountability Trace 4: Decree-Law 54 / Media & Speech Proceedings", () => {
  const trace = getAccountabilityTrace("ROP-LAW-2022-054-001", {
    records: SEED_RECORDS,
    institutions: INSTITUTIONS_REGISTRY,
    relationships: RELATIONSHIPS,
    responsibility: RESPONSIBILITY_RECORDS,
    sourceManifest
  });

  assert.ok(trace);
  assert.ok(trace.outcomes.some(o => o.id === "ROP-OUT-2026-DL54-CONVICT"));
});

test("18. Accountability Trace 5: Macroeconomic Sovereignty / BCT Direct Lending", () => {
  const trace = getAccountabilityTrace("ROP-PRM-2019-SOV-001", {
    records: SEED_RECORDS,
    institutions: INSTITUTIONS_REGISTRY,
    relationships: RELATIONSHIPS,
    responsibility: RESPONSIBILITY_RECORDS,
    sourceManifest
  });

  assert.ok(trace);
  assert.ok(trace.laws.some(l => l.id === "ROP-LAW-2024-BCT-LENDING"));
  assert.ok(trace.indicators.some(i => i.id === "ROP-IND-GDP-GROWTH-001"));
  assert.ok(trace.indicators.some(i => i.id === "ROP-IND-UNEMP-GRAD-001"));
});

test("19. Accountability Trace 6: Gabès Relocation & Environmental Ambient Air Data Gap", () => {
  const trace = getAccountabilityTrace("ROP-OUT-2026-GABES-RELOC-FAIL", {
    records: SEED_RECORDS,
    institutions: INSTITUTIONS_REGISTRY,
    relationships: RELATIONSHIPS,
    responsibility: RESPONSIBILITY_RECORDS,
    sourceManifest
  });

  assert.ok(trace);
  assert.ok(trace.dataGaps.some(g => g.id === "ROP-GAP-2026-GABES-AIR-001"));
});

test("20. Accountability Trace 7: 2024 Presidential Election & Administrative Court Dispute", () => {
  const trace = getAccountabilityTrace("ROP-DEC-2024-ISIE-DISQUAL", {
    records: SEED_RECORDS,
    institutions: INSTITUTIONS_REGISTRY,
    relationships: RELATIONSHIPS,
    responsibility: RESPONSIBILITY_RECORDS,
    sourceManifest
  });

  assert.ok(trace);
  assert.ok(trace.laws.some(l => l.id === "ROP-LAW-2024-ELEC-STRIP"));
});

// ============================================================
// 4. EXACT NUMERIC PROVENANCE & REGRESSION TESTS
// ============================================================

test("21. Exact Numeric Provenance: Q2 2026 Higher-Education Graduate Unemployment = 26.6%", () => {
  const unemp = getRecordById("ROP-IND-UNEMP-GRAD-001");
  assert.ok(unemp);
  assert.strictEqual(unemp.value, "26.6%", "Q2 2026 Graduate Unemployment must be exactly 26.6%");
  assert.strictEqual(unemp.unit, "% of Active University Graduates");
  assert.strictEqual(unemp.observation_type, "QUARTERLY");
  assert.ok(unemp.source_ids.includes("SRC-INS-EMP2026Q2"));
  assert.ok(unemp.editorial_notes.includes("35.6% vs 14.2%"), "Must note gender breakdown in editorial notes");
});

test("22. Exact Numeric Provenance: Q2 2026 Real GDP Growth YoY = +2.3%", () => {
  const gdp = getRecordById("ROP-IND-GDP-GROWTH-001");
  assert.ok(gdp);
  assert.strictEqual(gdp.value, "+2.3%", "Q2 2026 Real GDP YoY Growth must be exactly +2.3%");
  assert.strictEqual(gdp.observation_type, "PRELIMINARY");
  assert.ok(gdp.source_ids.includes("SRC-INS-ACC2026Q2"));
  assert.ok(gdp.summary.includes("+1.4% quarter-on-quarter"), "Must state QoQ growth in summary");
});

test("23. Exact Numeric Provenance: August 2026 Food CPI Inflation = 7.5% YoY", () => {
  const food = getRecordById("ROP-IND-2026-INFLATION-FOOD");
  assert.ok(food);
  assert.strictEqual(food.value, "7.5%", "August 2026 Food & Beverage Inflation must be exactly 7.5%");
  assert.strictEqual(food.observation_type, "MONTHLY");
  assert.ok(food.source_ids.includes("SRC-INS-IPC202608"));
  assert.ok(food.editorial_notes.includes("5.4%"), "Must note headline CPI of 5.4%");
});

test("24. Exact Provenance: Community Enterprises Uses Ministry Source & 95M TND Financing Clarification", () => {
  const comm = getRecordById("ROP-OUT-2025-COMMUNITY-YIELD");
  assert.ok(comm);
  assert.strictEqual(comm.title, "Community Enterprises — Administrative Rollout in 2025");
  assert.ok(!comm.source_ids.includes("SRC-INS-EMP2026Q2"), "Must NOT multiplex INS employment survey for community enterprise counts");
  assert.ok(comm.source_ids.includes("SRC-MEFP-COMM2025"), "Must cite dedicated Ministry of Employment source");
  assert.ok(comm.measurement.includes("95M TND"), "Must clarify 95M TND is allocated financing");
  assert.ok(comm.summary.includes("236 created with 60 fully operational by November 15, 2025"), "Must contain dated snapshot");
});

test("25. Exact Provenance: Arab Barometer Wave VIII Explicit Question & President vs Government Trust", () => {
  const ab = getRecordById("ROP-IND-2024-AB-TRUST-DROP");
  assert.ok(ab);
  assert.strictEqual(ab.value, "43%", "Trust in President must be 43%");
  assert.ok(ab.source_ids.includes("SRC-AB-WAVEVIII"));
  assert.ok(ab.summary.includes("Trust in the President of the Republic"), "Must explicitly state President trust");
  assert.ok(ab.editorial_notes.includes("Distinct from Wave VIII trust in government (24%)"), "Must distinguish president vs government trust");
});

// ============================================================
// 5. EPISTEMIC & METHODOLOGICAL INVARIANTS TESTS
// ============================================================

test("26. Semantic & Epistemic Properties on High-Risk Records", () => {
  const water = getRecordById("ROP-OUT-2026-WATER-001");
  assert.strictEqual(water.causation_status, "SUPPORTED_ASSOCIATION");

  const stm2021 = getRecordById("ROP-STM-2021-0725-001");
  assert.strictEqual(stm2021.classification, EPISTEMIC_CLASSIFICATION.CLAIM);

  const opp2024 = getRecordById("ROP-OPP-2024-ISIE-001");
  assert.strictEqual(opp2024.classification, EPISTEMIC_CLASSIFICATION.CLAIM);

  const gabesGap = getRecordById("ROP-GAP-2026-GABES-AIR-001");
  assert.strictEqual(gabesGap.data_gap_status, "NOT_PUBLISHED");

  const reconGap = getRecordById("ROP-GAP-2026-RECON-RECEIPTS-001");
  assert.strictEqual(reconGap.data_gap_status, "INACCESSIBLE");
});

test("27. Integrity: No Duplicate Record IDs in Dataset", () => {
  const seenIds = new Set();
  for (const r of SEED_RECORDS) {
    assert.ok(!seenIds.has(r.id), `Duplicate record ID detected: ${r.id}`);
    seenIds.add(r.id);
  }
  assert.strictEqual(seenIds.size, SEED_RECORDS.length);
});

test("28. Integrity: No Orphan Relationship Edges (Both from_id and to_id Exist)", () => {
  const recordIds = new Set(SEED_RECORDS.map(r => r.id));
  const instIds = new Set(Object.keys(INSTITUTIONS_REGISTRY));

  for (const rel of RELATIONSHIPS) {
    const fromValid = recordIds.has(rel.from_id) || instIds.has(rel.from_id);
    const toValid = recordIds.has(rel.to_id) || instIds.has(rel.to_id);
    assert.ok(fromValid, `Orphan from_id in relationship: ${rel.from_id}`);
    assert.ok(toValid, `Orphan to_id in relationship: ${rel.to_id}`);
  }
});

test("29. Integrity: No Orphan Responsibility Allocations (All record_id and institution_id Exist)", () => {
  const recordIds = new Set(SEED_RECORDS.map(r => r.id));
  const instIds = new Set(Object.keys(INSTITUTIONS_REGISTRY));

  for (const rsp of RESPONSIBILITY_RECORDS) {
    assert.ok(recordIds.has(rsp.record_id), `Orphan record_id in responsibility: ${rsp.record_id}`);
    assert.ok(instIds.has(rsp.institution_id), `Orphan institution_id in responsibility: ${rsp.institution_id}`);
  }
});

test("30. Integrity: All Source References Exist in Manifest and Sources Map", () => {
  const manifestSourceIds = new Set(sourceManifest.map(s => s.source_id));
  for (const r of SEED_RECORDS) {
    if (Array.isArray(r.source_ids)) {
      for (const sid of r.source_ids) {
        assert.ok(manifestSourceIds.has(sid), `Record ${r.id} references unknown source_id ${sid}`);
        assert.ok(SOURCE_MAP.has(sid), `Source ${sid} missing from runtime SOURCE_MAP`);
      }
    }
  }
});

test("31. Integrity: All Indicator Records Have Explicit Unit and Reference Period", () => {
  const indicators = SEED_RECORDS.filter(r => r.record_type === RECORD_TYPES.INDICATOR);
  assert.ok(indicators.length >= 10);
  for (const ind of indicators) {
    assert.ok(ind.unit, `Indicator ${ind.id} missing 'unit'`);
    assert.ok(ind.reference_period, `Indicator ${ind.id} missing 'reference_period'`);
    assert.ok(ind.observation_type, `Indicator ${ind.id} missing 'observation_type'`);
  }
});

test("32. Integrity: All Promise Records Have Valid PROMISE_STATUS Enum Values", () => {
  const promises = SEED_RECORDS.filter(r => r.record_type === RECORD_TYPES.PROMISE);
  const validStatuses = new Set(Object.values(PROMISE_STATUS));
  for (const p of promises) {
    assert.ok(validStatuses.has(p.status), `Promise ${p.id} has invalid status '${p.status}'`);
  }
});

test("33. Integrity: Data Gap Neutrality Language Invariants (Zero Inferred Intent Words)", () => {
  const forbiddenWords = [/\bwithheld\b/i, /\bconcealed\b/i, /\bsuppressed\b/i, /\bopacity\b/i];
  for (const r of SEED_RECORDS) {
    const textToScan = `${r.title} ${r.summary} ${r.editorial_notes || ''}`;
    for (const pat of forbiddenWords) {
      assert.ok(!pat.test(textToScan), `Record ${r.id} contains forbidden intent wording matching ${pat}`);
    }
  }
});

test("34. Integrity: All Original 18 Seed Records Preserved and Verifiable", () => {
  const original18Ids = [
    "ROP-EVT-2019-ELEC-001",
    "ROP-PRM-2019-RECON-001",
    "ROP-PRM-2019-SOV-001",
    "ROP-EVT-2021-0725-001",
    "ROP-STM-2021-0725-001",
    "ROP-DEC-2021-0922-001",
    "ROP-INS-2022-CSM-001",
    "ROP-DEC-2022-JUDGES-001",
    "ROP-LAW-2022-CONST-001",
    "ROP-LAW-2022-054-001",
    "ROP-EVT-2024-ELEC-001",
    "ROP-OPP-2024-ISIE-001",
    "ROP-IND-UNEMP-GRAD-001",
    "ROP-IND-GDP-GROWTH-001",
    "ROP-OUT-2026-WATER-001",
    "ROP-OUT-2026-RECON-001",
    "ROP-OUT-2026-GABES-RELOC-FAIL",
    "ROP-GAP-2026-GABES-AIR-001"
  ];

  for (const id of original18Ids) {
    const rec = getRecordById(id);
    assert.ok(rec, `Original seed record ${id} must exist in SEED_RECORDS`);
  }
});

test("35. Validation Engine Catches Malformed Data, Broken Refs, Invalid Date Ranges & Self-Loops", () => {
  // 1. Invalid record type
  const badType = validateRecordOfPower({
    records: [{ id: "ROP-BAD", record_type: "INVALID_TYPE", classification: "FACT", date_precision: "YEAR", verification_status: "VERIFIED", title: "T", short_title: "S", summary: "Sum" }],
    institutions: INSTITUTIONS_REGISTRY,
    relationships: [],
    responsibility: [],
    sourceManifest,
    throwOnError: false
  });
  assert.strictEqual(badType.valid, false);
  assert.ok(badType.errors.some(e => e.includes("invalid record_type")));

  // 2. Broken internal record ref
  const brokenRef = validateRecordOfPower({
    records: [{
      id: "ROP-TEST-REF",
      record_type: RECORD_TYPES.EVENT,
      classification: EPISTEMIC_CLASSIFICATION.FACT,
      date_precision: "EXACT_DAY",
      verification_status: "VERIFIED",
      title: "Test",
      short_title: "Test",
      summary: "Summary",
      related_record_ids: ["ROP-NON-EXISTENT"]
    }],
    institutions: INSTITUTIONS_REGISTRY,
    relationships: [],
    responsibility: [],
    sourceManifest,
    throwOnError: false
  });
  assert.strictEqual(brokenRef.valid, false);
  assert.ok(brokenRef.errors.some(e => e.includes("unresolved reference in 'related_record_ids'")));

  // 3. Invalid date range (date_start > date_end)
  const badDate = validateRecordOfPower({
    records: [{
      id: "ROP-TEST-DATE",
      record_type: RECORD_TYPES.EVENT,
      classification: EPISTEMIC_CLASSIFICATION.FACT,
      date_precision: "EXACT_DAY",
      verification_status: "VERIFIED",
      date_start: "2026-08-01",
      date_end: "2026-07-01",
      title: "Test",
      short_title: "Test",
      summary: "Summary"
    }],
    institutions: INSTITUTIONS_REGISTRY,
    relationships: [],
    responsibility: [],
    sourceManifest,
    throwOnError: false
  });
  assert.strictEqual(badDate.valid, false);
  assert.ok(badDate.errors.some(e => e.includes("after date_end")));

  // 4. Self-referential relationship
  const selfLoop = validateRecordOfPower({
    records: SEED_RECORDS,
    institutions: INSTITUTIONS_REGISTRY,
    relationships: [{
      from_id: "ROP-EVT-2019-ELEC-001",
      to_id: "ROP-EVT-2019-ELEC-001",
      relationship_type: "PROMISE_FOLLOWED_BY_ACTION"
    }],
    responsibility: RESPONSIBILITY_RECORDS,
    sourceManifest,
    throwOnError: false
  });
  assert.strictEqual(selfLoop.valid, false);
  assert.ok(selfLoop.errors.some(e => e.includes("self-referential")));
});

// ============================================================
// 6. PHASE R2.3 UI INTEGRATION TESTS
// ============================================================
import { renderPresidencyReportViewHtml } from '../src/presidency-data.js';

test("36. R2.3 UI: renderPresidencyReportViewHtml generates semantic HTML with single H1", () => {
  const html = renderPresidencyReportViewHtml();
  assert.ok(typeof html === 'string', "Output must be a string");
  assert.ok(html.length > 5000, "HTML must be substantial");

  // Single H1 Check
  const h1Matches = html.match(/<h1[\s\S]*?<\/h1>/gi) || [];
  assert.strictEqual(h1Matches.length, 1, "Must contain exactly one <h1> tag");
  assert.ok(h1Matches[0].includes("Tunisia under Kais Saied, 2019–2026"), "H1 must match canonical title");
});

test("37. R2.3 UI: Contains all 8 Chronological Era Anchor IDs (#year-2019 through #year-2026)", () => {
  const html = renderPresidencyReportViewHtml();
  assert.ok(html.includes('id="year-2019"'), "Must have #year-2019 anchor");
  assert.ok(html.includes('id="year-2020"'), "Must have #year-2020 anchor");
  assert.ok(html.includes('id="year-2021"'), "Must have #year-2021 anchor");
  assert.ok(html.includes('id="year-2022"'), "Must have #year-2022 anchor");
  assert.ok(html.includes('id="year-2023"'), "Must have #year-2023 anchor");
  assert.ok(html.includes('id="year-2024"'), "Must have #year-2024 anchor");
  assert.ok(html.includes('id="year-2025"'), "Must have #year-2025 anchor");
  assert.ok(html.includes('id="year-2026"'), "Must have #year-2026 anchor");
});

test("38. R2.3 UI: Epistemic Distinctions & Correct Macro Indicator Numbers Rendered", () => {
  const html = renderPresidencyReportViewHtml();
  assert.ok(html.includes("FACT"), "Must include FACT badge");
  assert.ok(html.includes("CLAIM · ATTRIBUTED"), "Must include CLAIM badge");
  assert.ok(html.includes("ANALYSIS"), "Must include ANALYSIS badge");
  assert.ok(html.includes("404TN EPISTEMIC STANDARD"), "Must have epistemic methodology header");

  // Check verified numeric values are rendered on /presidency
  assert.ok(html.includes("26.6%"), "Must render 26.6% for Q2 2026 Graduate Unemployment");
  assert.ok(html.includes("+2.3%"), "Must render +2.3% for Q2 2026 Real GDP YoY Growth");
  assert.ok(html.includes("7.5%"), "Must render 7.5% for August 2026 Food Inflation");
});


// ============================================================
// 7. PHASE R2.4A READING ARCHITECTURE & DOM INTEGRITY TESTS
// ============================================================
import { TRACE_FAMILIES, CURATED_ERA_CONFIG } from '../src/presidency-data.js';

test("39. R2.4A UI: Presidency Reading Architecture 8-Part Structure & Anchors", () => {
  const html = renderPresidencyReportViewHtml();

  // Section 01: Opener
  assert.ok(html.includes('Tunisia under Kais Saied, 2019–2026'), "Must contain header H1");

  // Section 02: The Record in Numbers
  assert.ok(html.includes('id="the-record-in-numbers"'), "Must contain #the-record-in-numbers section");
  assert.ok(html.includes('88'), "Must display total records count");
  assert.ok(html.includes('08'), "Must display total eras count");

  // Section 03: Accountability Chains
  assert.ok(html.includes('id="accountability-chains"'), "Must contain #accountability-chains section");

  // Section 04: Presidential Spine
  assert.ok(html.includes('id="presidential-spine"'), "Must contain #presidential-spine section");

  // Section 05: Eras 2019 to 2026
  for (let y = 2019; y <= 2026; y++) {
    assert.ok(html.includes(`id="year-${y}"`), `Must contain anchor #year-${y}`);
  }

  // Section 06: Full Archive Access
  assert.ok(html.includes('id="full-archive-access"'), "Must contain #full-archive-access section");

  // Section 07: Methodological Closing
  assert.ok(html.includes('id="methodological-closing"'), "Must contain #methodological-closing section");
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

test("40. R2.4A UI: All 7 Accountability Trace Families Render with Valid Nodes & Canonical Provenance", () => {
  const html = renderPresidencyReportViewHtml();
  assert.strictEqual(TRACE_FAMILIES.length, 7, "Must define exactly 7 trace families");

  for (const tf of TRACE_FAMILIES) {
    assert.ok(html.includes(`id="${tf.id}"`), `Must render trace container for ${tf.id}`);
    assert.ok(html.includes(escapeHtml(tf.title)), `Must render title for ${tf.title}`);

    // Check every step node in chain exists in DOM and resolves to canonical record
    for (const step of tf.chain) {
      const rec = getRecordById(step.recordId);
      assert.ok(rec, `Step record ID ${step.recordId} must exist in canonical dataset`);
      assert.ok(html.includes(rec.id), `Step record ID ${rec.id} must be referenced in DOM`);
      assert.ok(html.includes(escapeHtml(step.role)), `Step role ${step.role} must be rendered`);
    }
  }
});

test("41. R2.4A UI: All 88 Canonical Records Rendered in the DOM with Zero Omissions", () => {
  const html = renderPresidencyReportViewHtml();
  assert.strictEqual(SEED_RECORDS.length, 88, "Dataset must contain exactly 88 canonical records");

  // Every single record ID must be present in the HTML output
  for (const rec of SEED_RECORDS) {
    assert.ok(
      html.includes(`id="${rec.id}"`) || html.includes(`href="#${rec.id}"`),
      `Canonical record ${rec.id} must be accessible and indexed in /presidency DOM`
    );
  }
});

test("42. R2.4A UI: Era Curation Renders Primary Reading Path & Accessible <details> for Secondary Records", () => {
  const html = renderPresidencyReportViewHtml();

  // Eras 2019 to 2025 must have curated config with featured and secondary records
  for (let y = 2019; y <= 2025; y++) {
    const config = CURATED_ERA_CONFIG[y];
    assert.ok(config, `Config must exist for year ${y}`);
    assert.ok(config.featuredIds.length >= 3 && config.featuredIds.length <= 5, `Year ${y} must feature 3-5 records`);

    // Check details element exists for eras with secondary records
    if (config.allIds.length > config.featuredIds.length) {
      assert.ok(html.includes(`VIEW FULL ${y} ARCHIVE (${config.allIds.length} RECORDS)`), `Must render disclosure button for ${y}`);
    }
  }
});

test("43. R2.4A UI: DOM ID Uniqueness across Entire Generated Presidency HTML", () => {
  const html = renderPresidencyReportViewHtml();
  const idRegex = /\sid="([^"]+)"/g;
  const ids = [];
  let match;
  while ((match = idRegex.exec(html)) !== null) {
    ids.push(match[1]);
  }

  const idCounts = {};
  const duplicates = [];
  for (const id of ids) {
    idCounts[id] = (idCounts[id] || 0) + 1;
    if (idCounts[id] === 2) {
      duplicates.push(id);
    }
  }

  assert.strictEqual(duplicates.length, 0, `DOM IDs must be unique across /presidency view. Duplicates: ${duplicates.join(', ')}`);
});

test("44. R2.4A UI: Exactly One Global Footer Invariant in Full Site Prerender", async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const indexHtmlPath = path.resolve(process.cwd(), 'index.html');
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

  const footerMatches = indexHtml.match(/<footer[\s\S]*?<\/footer>/gi) || [];
  assert.strictEqual(footerMatches.length, 1, "index.html template must contain exactly ONE <footer> element");

  // In /presidency rendered article, verify no nested <footer> tag exists
  const presHtml = renderPresidencyReportViewHtml();
  const presFooterMatches = presHtml.match(/<footer[\s\S]*?<\/footer>/gi) || [];
  assert.strictEqual(presFooterMatches.length, 0, "renderPresidencyReportViewHtml must NOT contain nested <footer> tags");
});

test("45. R2.4A UI: Presidential Spine Navigation Links Match All 8 Era Anchor IDs", () => {
  const html = renderPresidencyReportViewHtml();
  for (let y = 2019; y <= 2026; y++) {
    assert.ok(html.includes(`href="#year-${y}"`), `Spine must link to #year-${y}`);
    assert.ok(html.includes(`id="year-${y}"`), `Target anchor #year-${y} must exist in DOM`);
  }
});

console.log("\n============================================================");
console.log(`RECORD OF POWER TEST SUMMARY: All ${passed} tests PASSED!`);
console.log("============================================================\n");
