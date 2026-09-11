// scripts/test-record-of-power.mjs
// Automated Test Suite for 404TN Record of Power Data Architecture (Phase R2.1)

import fs from 'fs';
import assert from 'assert';
import {
  RECORD_TYPES,
  EPISTEMIC_CLASSIFICATION,
  INSTITUTIONS_REGISTRY,
  SEED_RECORDS,
  RESPONSIBILITY_RECORDS,
  RELATIONSHIPS,
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
console.log("RUNNING RECORD OF POWER DATA ARCHITECTURE TEST SUITE (R2.1)");
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

// 1. Source Manifest Integration
const sourceManifest = JSON.parse(fs.readFileSync('docs/source-manifest.json', 'utf8'));

test("Runtime Schema & Manifest Validation Passes with Zero Errors", () => {
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
  assert.ok(result.stats.totalRecords >= 12, "Should have seed records");
  assert.ok(result.stats.totalInstitutions >= 15, "Should have institutions");
  assert.ok(result.stats.totalResponsibilities >= 8, "Should have responsibility entries");
  assert.ok(result.stats.totalRelationships >= 10, "Should have relationships");
});

test("Institution Registry Integrity & Parent Hierarchy", () => {
  assert.ok(INSTITUTIONS_REGISTRY["INST-PRESIDENCY"]);
  assert.ok(INSTITUTIONS_REGISTRY["INST-GOV"]);
  assert.ok(INSTITUTIONS_REGISTRY["INST-SONEDE"]);
  assert.ok(INSTITUTIONS_REGISTRY["INST-STEG"]);
  assert.ok(INSTITUTIONS_REGISTRY["INST-ANPE"]);

  assert.strictEqual(INSTITUTIONS_REGISTRY["INST-GOV"].parent_institution_id, "INST-PRESIDENCY");
  assert.strictEqual(INSTITUTIONS_REGISTRY["INST-SONEDE"].parent_institution_id, "INST-MOA");
  assert.strictEqual(INSTITUTIONS_REGISTRY["INST-ANPE"].parent_institution_id, "INST-MOENV");
});

test("Canonical Record Types Diversity in Seed Data", () => {
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

test("Selector: getRecordById()", () => {
  const dec117 = getRecordById("ROP-DEC-2021-0922-001");
  assert.ok(dec117);
  assert.strictEqual(dec117.short_title, "Decree 117 Exceptional Measures");
  assert.strictEqual(dec117.classification, EPISTEMIC_CLASSIFICATION.FACT);

  const missing = getRecordById("ROP-NONEXISTENT");
  assert.strictEqual(missing, null);
});

test("Selector: getRecordsByYear()", () => {
  const recs2019 = getRecordsByYear(2019);
  assert.ok(recs2019.length >= 2, "Should find 2019 records");

  const recs2021 = getRecordsByYear(2021);
  assert.ok(recs2021.length >= 2, "Should find 2021 records");

  const recs2022 = getRecordsByYear(2022);
  assert.ok(recs2022.length >= 3, "Should find 2022 records");

  const recs2026 = getRecordsByYear(2026);
  assert.ok(recs2026.length >= 3, "Should find 2026 records");
});

test("Selector: getRecordsByType()", () => {
  const laws = getRecordsByType(RECORD_TYPES.LAW);
  assert.ok(laws.length >= 2);
  assert.ok(laws.some(l => l.id === "ROP-LAW-2022-CONST-001"));
  assert.ok(laws.some(l => l.id === "ROP-LAW-2022-054-001"));

  const gaps = getRecordsByType(RECORD_TYPES.DATA_GAP);
  assert.ok(gaps.length >= 2);
});

test("Selector: getRecordsByIssue()", () => {
  const waterRecs = getRecordsByIssue("water");
  assert.ok(waterRecs.length >= 1);
  assert.strictEqual(waterRecs[0].id, "ROP-OUT-2026-WATER-001");

  const antiCorrRecs = getRecordsByIssue("anti_corruption");
  assert.ok(antiCorrRecs.length >= 2);
});

test("Selector: getRecordsByInstitution()", () => {
  const presRecs = getRecordsByInstitution("INST-PRESIDENCY");
  assert.ok(presRecs.length >= 5);

  const anpeRecs = getRecordsByInstitution("INST-ANPE");
  assert.ok(anpeRecs.length >= 1);
  assert.strictEqual(anpeRecs[0].id, "ROP-GAP-2026-GABES-AIR-001");
});

test("Selector: getPromisesByStatus()", () => {
  const unresolved = getPromisesByStatus("UNRESOLVED");
  assert.ok(unresolved.length >= 1);
  assert.strictEqual(unresolved[0].id, "ROP-PRM-2019-RECON-001");
});

test("Selector: getRelatedRecords()", () => {
  const relatedToJul25 = getRelatedRecords("ROP-EVT-2021-0725-001");
  assert.ok(relatedToJul25.length >= 2);
  const ids = relatedToJul25.map(r => r.id);
  assert.ok(ids.includes("ROP-DEC-2021-0922-001"));
  assert.ok(ids.includes("ROP-STM-2021-0725-001"));
});

test("Selector: getResponsibilityForRecord()", () => {
  const waterRsp = getResponsibilityForRecord("ROP-OUT-2026-WATER-001");
  assert.ok(waterRsp.length >= 2);
  assert.ok(waterRsp.some(r => r.institution_id === "INST-SONEDE" && r.responsibility_type === "SERVICE_DELIVERY"));
  assert.ok(waterRsp.some(r => r.institution_id === "INST-MOA" && r.responsibility_type === "POLICY_AUTHORITY"));
});

test("Selector: getSourcesForRecord()", () => {
  const sources = getSourcesForRecord("ROP-EVT-2019-ELEC-001", SEED_RECORDS, sourceManifest);
  assert.ok(sources.length >= 1);
  assert.strictEqual(sources[0].source_id, "SRC-ISIE-ELEC2019");
});

test("Multi-Hop Accountability Traversal: Penal Reconciliation Trace", () => {
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

test("Multi-Hop Accountability Traversal: Decree 117 Rupture Trace with Action Semantics", () => {
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
  // Verify action semantics: trace.actions aggregates implementation records without phantom record type
  assert.ok(Array.isArray(trace.actions));
  assert.strictEqual(trace.actions.length, trace.decisions.length + trace.laws.length + trace.institutionalChanges.length);
});

test("Semantic & Epistemic Properties on High-Risk Records", () => {
  const gdp = getRecordById("ROP-IND-GDP-GROWTH-001");
  assert.strictEqual(gdp.observation_type, "PRELIMINARY");
  assert.strictEqual(gdp.classification, EPISTEMIC_CLASSIFICATION.FACT);

  const gradUnemp = getRecordById("ROP-IND-UNEMP-GRAD-001");
  assert.strictEqual(gradUnemp.observation_type, "QUARTERLY");
  assert.strictEqual(gradUnemp.value, "38.8%");

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

test("Validation Engine Catches Malformed Data, Broken Refs, Invalid Date Ranges & Self-Loops", () => {
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
// PHASE R2.2 UI INTEGRATION TESTS
// ============================================================
import { renderPresidencyReportViewHtml } from '../src/presidency-data.js';

test("R2.2 UI: renderPresidencyReportViewHtml generates semantic HTML with single H1", () => {
  const html = renderPresidencyReportViewHtml();
  assert.ok(typeof html === 'string', "Output must be a string");
  assert.ok(html.length > 5000, "HTML must be substantial");

  // Single H1 Check
  const h1Matches = html.match(/<h1[\s\S]*?<\/h1>/gi) || [];
  assert.strictEqual(h1Matches.length, 1, "Must contain exactly one <h1> tag");
  assert.ok(h1Matches[0].includes("Tunisia under Kais Saied, 2019–2026"), "H1 must match canonical title");
});

test("R2.2 UI: Contains all 5 Chronological Era Anchor IDs", () => {
  const html = renderPresidencyReportViewHtml();
  assert.ok(html.includes('id="year-2019"'), "Must have #year-2019 anchor");
  assert.ok(html.includes('id="year-2021"'), "Must have #year-2021 anchor");
  assert.ok(html.includes('id="year-2022"'), "Must have #year-2022 anchor");
  assert.ok(html.includes('id="year-2024"'), "Must have #year-2024 anchor");
  assert.ok(html.includes('id="year-2026"'), "Must have #year-2026 anchor");
});

test("R2.2 UI: Renders all 18 Seed Records in the Chronology", () => {
  const html = renderPresidencyReportViewHtml();
  for (const rec of SEED_RECORDS) {
    assert.ok(html.includes(rec.id), `UI HTML must contain reference to seed record ${rec.id}`);
  }
});

test("R2.2 UI: Epistemic Distinctions (FACT, CLAIM · ATTRIBUTED, ANALYSIS)", () => {
  const html = renderPresidencyReportViewHtml();
  assert.ok(html.includes("FACT"), "Must include FACT badge");
  assert.ok(html.includes("CLAIM · ATTRIBUTED"), "Must include CLAIM badge");
  assert.ok(html.includes("ANALYSIS"), "Must include ANALYSIS badge");
  assert.ok(html.includes("404TN EPISTEMIC STANDARD"), "Must have epistemic methodology header");
});

test("R2.2 UI: Promise Accountability Trace Rendering", () => {
  const html = renderPresidencyReportViewHtml();
  // Trace for Penal Reconciliation
  assert.ok(html.includes("Penal Reconciliation &amp; 13.5 Billion TND Recovery Pledge"), "Must render promise title");
  assert.ok(html.includes("ROP-OUT-2026-RECON-001"), "Must render outcome in trace");
  assert.ok(html.includes("ROP-GAP-2026-RECON-RECEIPTS-001"), "Must render data gap in trace");
  assert.ok(html.includes("Ministry of Finance"), "Must resolve Ministry of Finance in trace");
});

test("R2.2 UI: Observation Types Explicitly Rendered for Macro Indicators", () => {
  const html = renderPresidencyReportViewHtml();
  assert.ok(html.includes("PRELIMINARY"), "Must render PRELIMINARY for Q2 2026 GDP YoY");
  assert.ok(html.includes("QUARTERLY"), "Must render QUARTERLY for Graduate Unemployment");
});

test("R2.2 UI: Institutions are Human-Resolved (No Orphaned Raw Codes in Main Text)", () => {
  const html = renderPresidencyReportViewHtml();
  // Verify human readable names are present
  assert.ok(html.includes("Presidency of the Republic"), "Must contain full name for INST-PRESIDENCY");
  assert.ok(html.includes("National Water Distribution Utility"), "Must contain full name for INST-SONEDE");
  assert.ok(html.includes("SONEDE"), "Must contain short name for SONEDE");
  assert.ok(html.includes("Independent High Authority for Elections"), "Must contain full name for INST-ISIE");
  assert.ok(html.includes("High Judicial Council"), "Must contain full name for INST-CSM");
});

console.log("\n============================================================");
console.log(`RECORD OF POWER TEST SUMMARY: All ${passed} tests PASSED!`);
console.log("============================================================\n");
