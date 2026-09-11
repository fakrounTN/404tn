// src/record-of-power/selectors.js
// 404TN — Pure Query Helpers & Accountability Traversal Engine (Phase R2.1)

import { RECORD_TYPES } from './schema.js';
import { SEED_RECORDS } from './records.js';
import { INSTITUTIONS_REGISTRY } from './institutions.js';
import { RELATIONSHIPS } from './relationships.js';
import { RESPONSIBILITY_RECORDS } from './responsibility.js';

/**
 * Retrieves a single record by its canonical ID.
 */
export function getRecordById(id, records = SEED_RECORDS) {
  if (!id) return null;
  return records.find(r => r.id === id) || null;
}

/**
 * Retrieves records starting in or spanning a specific year.
 */
export function getRecordsByYear(year, records = SEED_RECORDS) {
  const yStr = String(year);
  return records.filter(r => {
    if (r.date_start && r.date_start.startsWith(yStr)) return true;
    if (r.date_end && r.date_end.startsWith(yStr)) return true;
    return false;
  });
}

/**
 * Retrieves records filtered by RECORD_TYPES.
 */
export function getRecordsByType(type, records = SEED_RECORDS) {
  return records.filter(r => r.record_type === type);
}

/**
 * Retrieves records containing a specific issue tag.
 */
export function getRecordsByIssue(issueTag, records = SEED_RECORDS) {
  if (!issueTag) return [];
  return records.filter(r => Array.isArray(r.issue_tags) && r.issue_tags.includes(issueTag));
}

/**
 * Retrieves records where an institution has jurisdiction or was affected.
 */
export function getRecordsByInstitution(institutionId, records = SEED_RECORDS) {
  if (!institutionId) return [];
  return records.filter(r => Array.isArray(r.institution_ids) && r.institution_ids.includes(institutionId));
}

/**
 * Retrieves promises filtered by PROMISE_STATUS.
 */
export function getPromisesByStatus(status, records = SEED_RECORDS) {
  return records.filter(r => r.record_type === RECORD_TYPES.PROMISE && (!status || r.status === status));
}

/**
 * Retrieves related records for a given record ID, optionally filtered by relationship type.
 */
export function getRelatedRecords(recordId, relationshipType = null, records = SEED_RECORDS, relationships = RELATIONSHIPS) {
  if (!recordId) return [];
  const matchingEdges = relationships.filter(rel => {
    const matchesRecord = rel.from_id === recordId || rel.to_id === recordId;
    const matchesType = !relationshipType || rel.relationship_type === relationshipType;
    return matchesRecord && matchesType;
  });

  const relatedIds = new Set();
  matchingEdges.forEach(rel => {
    if (rel.from_id !== recordId) relatedIds.add(rel.from_id);
    if (rel.to_id !== recordId) relatedIds.add(rel.to_id);
  });

  return Array.from(relatedIds)
    .map(id => getRecordById(id, records))
    .filter(Boolean);
}

/**
 * Retrieves structured responsibility entries for a specific record.
 */
export function getResponsibilityForRecord(recordId, responsibility = RESPONSIBILITY_RECORDS, institutions = INSTITUTIONS_REGISTRY) {
  if (!recordId) return [];
  return responsibility
    .filter(rsp => rsp.record_id === recordId)
    .map(rsp => ({
      ...rsp,
      institution: institutions[rsp.institution_id] || null
    }));
}

/**
 * Retrieves full source objects from source manifest for a record.
 */
export function getSourcesForRecord(recordId, records = SEED_RECORDS, sourceManifest = []) {
  const rec = getRecordById(recordId, records);
  if (!rec || !Array.isArray(rec.source_ids) || !Array.isArray(sourceManifest)) return [];
  const sMap = new Map(sourceManifest.map(s => [s.source_id, s]));
  return rec.source_ids.map(sid => sMap.get(sid)).filter(Boolean);
}

/**
 * Multi-hop Accountability Traversal Engine.
 * Resolves: PROMISE -> DECISIONS -> LAWS -> INSTITUTIONS -> OUTCOMES -> INDICATORS -> DATA GAPS
 * 
 * @param {string} promiseOrRecordId
 * @param {Object} [context]
 * @returns {Object} Structured accountability bundle
 */
export function getAccountabilityTrace(promiseOrRecordId, {
  records = SEED_RECORDS,
  institutions = INSTITUTIONS_REGISTRY,
  relationships = RELATIONSHIPS,
  responsibility = RESPONSIBILITY_RECORDS,
  sourceManifest = []
} = {}) {
  const primaryRecord = getRecordById(promiseOrRecordId, records);
  if (!primaryRecord) return null;

  // 1. Direct Related Records via Graph
  const directlyRelated = getRelatedRecords(promiseOrRecordId, null, records, relationships);
  
  // 2. Multi-hop traversal to collect full trace
  const allTraceRecords = new Map();
  allTraceRecords.set(primaryRecord.id, primaryRecord);
  directlyRelated.forEach(r => allTraceRecords.set(r.id, r));

  // Second hop for outcomes and indicators
  directlyRelated.forEach(r => {
    const secondHop = getRelatedRecords(r.id, null, records, relationships);
    secondHop.forEach(r2 => allTraceRecords.set(r2.id, r2));
  });

  const recordList = Array.from(allTraceRecords.values());

  // 3. Partition by Canonical Types
  // Note: "actions" in accountability traversal refers to implementation-capable record types
  // (DECISION, LAW, INSTITUTIONAL_CHANGE), not a separate phantom record type.
  const decisions = recordList.filter(r => r.record_type === RECORD_TYPES.DECISION);
  const laws = recordList.filter(r => r.record_type === RECORD_TYPES.LAW);
  const institutionalChanges = recordList.filter(r => r.record_type === RECORD_TYPES.INSTITUTIONAL_CHANGE);
  const actions = [...decisions, ...laws, ...institutionalChanges];
  const outcomes = recordList.filter(r => r.record_type === RECORD_TYPES.OUTCOME);
  const indicators = recordList.filter(r => r.record_type === RECORD_TYPES.INDICATOR);
  const statements = recordList.filter(r => r.record_type === RECORD_TYPES.OFFICIAL_STATEMENT);
  const oppositionClaims = recordList.filter(r => r.record_type === RECORD_TYPES.OPPOSITION_CLAIM);
  const dataGaps = recordList.filter(r => r.record_type === RECORD_TYPES.DATA_GAP);

  // 4. Resolve Responsible Institutions
  const responsibleEntries = [];
  recordList.forEach(r => {
    const rsps = getResponsibilityForRecord(r.id, responsibility, institutions);
    rsps.forEach(rsp => responsibleEntries.push(rsp));
  });

  // 5. Resolve Sources
  const allSourceIds = new Set();
  recordList.forEach(r => {
    if (Array.isArray(r.source_ids)) {
      r.source_ids.forEach(sid => allSourceIds.add(sid));
    }
  });
  const sMap = new Map(sourceManifest.map(s => [s.source_id, s]));
  const resolvedSources = Array.from(allSourceIds).map(sid => sMap.get(sid)).filter(Boolean);

  return {
    primaryRecord,
    actions,
    decisions,
    laws,
    institutionalChanges,
    outcomes,
    indicators,
    statements,
    oppositionClaims,
    dataGaps,
    responsibleInstitutions: responsibleEntries,
    sources: resolvedSources,
    stats: {
      totalRelatedRecords: recordList.length,
      actionsCount: actions.length,
      outcomesCount: outcomes.length,
      indicatorsCount: indicators.length,
      dataGapsCount: dataGaps.length
    }
  };
}
