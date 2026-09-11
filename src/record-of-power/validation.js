// src/record-of-power/validation.js
// 404TN — Runtime Validation Engine for Record of Power Architecture

import {
  RECORD_TYPES,
  EPISTEMIC_CLASSIFICATION,
  DATE_PRECISION,
  VERIFICATION_STATUS,
  EVENT_STATUS,
  PROMISE_STATUS,
  LEGAL_STATUS,
  STATEMENT_TYPE,
  OUTCOME_TYPE,
  CAUSATION_STATUS,
  OBSERVATION_TYPE,
  DATA_GAP_STATUS,
  RESPONSIBILITY_TYPE,
  RELATIONSHIP_TYPE
} from './schema.js';
import { INSTITUTIONS_REGISTRY } from './institutions.js';
import { SEED_RECORDS } from './records.js';
import { RESPONSIBILITY_RECORDS } from './responsibility.js';
import { RELATIONSHIPS } from './relationships.js';

/**
 * Validates the full Record of Power dataset integrity.
 * @param {Object} options
 * @param {Array} [options.records=SEED_RECORDS]
 * @param {Object} [options.institutions=INSTITUTIONS_REGISTRY]
 * @param {Array} [options.relationships=RELATIONSHIPS]
 * @param {Array} [options.responsibility=RESPONSIBILITY_RECORDS]
 * @param {Array} [options.sourceManifest=null] Optional array of sources from source-manifest.json
 * @param {boolean} [options.throwOnError=false]
 * @returns {{ valid: boolean, errors: string[], warnings: string[], stats: Object }}
 */
export function validateRecordOfPower({
  records = SEED_RECORDS,
  institutions = INSTITUTIONS_REGISTRY,
  relationships = RELATIONSHIPS,
  responsibility = RESPONSIBILITY_RECORDS,
  sourceManifest = null,
  throwOnError = false
} = {}) {
  const errors = [];
  const warnings = [];
  const recordIdSet = new Set();
  const institutionIdSet = new Set(Object.keys(institutions));
  const validSourceIds = sourceManifest ? new Set(sourceManifest.map(s => s.source_id)) : null;

  // 1. Validate Institutions Registry
  for (const [key, inst] of Object.entries(institutions)) {
    if (key !== inst.institution_id) {
      errors.push(`Institution key '${key}' does not match institution_id '${inst.institution_id}'`);
    }
    if (!inst.name || !inst.short_name || !inst.institution_type) {
      errors.push(`Institution '${inst.institution_id}' is missing required descriptor fields (name, short_name, institution_type)`);
    }
    if (inst.parent_institution_id && !institutionIdSet.has(inst.parent_institution_id)) {
      errors.push(`Institution '${inst.institution_id}' references unknown parent_institution_id '${inst.parent_institution_id}'`);
    }
    if (validSourceIds && Array.isArray(inst.source_ids)) {
      inst.source_ids.forEach(sid => {
        if (!validSourceIds.has(sid)) {
          errors.push(`Institution '${inst.institution_id}' references unknown source_id '${sid}'`);
        }
      });
    }
  }

  // 2. Validate Records
  records.forEach((rec, idx) => {
    // Unique ID
    if (!rec.id || typeof rec.id !== 'string') {
      errors.push(`Record at index ${idx} is missing a valid 'id'`);
      return;
    }
    if (recordIdSet.has(rec.id)) {
      errors.push(`Duplicate record ID found: '${rec.id}'`);
    }
    recordIdSet.add(rec.id);

    // Record Type
    if (!RECORD_TYPES[rec.record_type]) {
      errors.push(`Record '${rec.id}' has invalid record_type: '${rec.record_type}'`);
    }

    // Epistemic Classification
    if (!EPISTEMIC_CLASSIFICATION[rec.classification]) {
      errors.push(`Record '${rec.id}' has invalid classification: '${rec.classification}'`);
    }

    // Date Precision
    if (!DATE_PRECISION[rec.date_precision]) {
      errors.push(`Record '${rec.id}' has invalid date_precision: '${rec.date_precision}'`);
    }

    // Verification Status
    if (!VERIFICATION_STATUS[rec.verification_status]) {
      errors.push(`Record '${rec.id}' has invalid verification_status: '${rec.verification_status}'`);
    }

    // Date Range Validation
    if (rec.date_start && rec.date_end && rec.date_start > rec.date_end) {
      errors.push(`Record '${rec.id}' has date_start '${rec.date_start}' after date_end '${rec.date_end}'`);
    }

    // Common Text Fields
    if (!rec.title || !rec.short_title || !rec.summary) {
      errors.push(`Record '${rec.id}' is missing required text fields (title, short_title, summary)`);
    }

    // Validate institution references
    if (Array.isArray(rec.institution_ids)) {
      rec.institution_ids.forEach(instId => {
        if (!institutionIdSet.has(instId)) {
          errors.push(`Record '${rec.id}' references unknown institution_id '${instId}'`);
        }
      });
    }

    // Validate source references
    if (validSourceIds && Array.isArray(rec.source_ids)) {
      rec.source_ids.forEach(sid => {
        if (!validSourceIds.has(sid)) {
          errors.push(`Record '${rec.id}' references unknown source_id '${sid}'`);
        }
      });
    }

    // Validate internal record references
    const checkRecordRefs = (field, arr) => {
      if (Array.isArray(arr)) {
        arr.forEach(targetId => {
          if (!records.some(r => r.id === targetId)) {
            errors.push(`Record '${rec.id}' has unresolved reference in '${field}': '${targetId}'`);
          }
        });
      }
    };
    checkRecordRefs('related_record_ids', rec.related_record_ids);
    checkRecordRefs('action_record_ids', rec.action_record_ids);
    checkRecordRefs('outcome_record_ids', rec.outcome_record_ids);
    checkRecordRefs('implementation_records', rec.implementation_records);
    checkRecordRefs('outcome_records', rec.outcome_records);

    // Type-Specific Validations
    if (rec.record_type === RECORD_TYPES.PROMISE) {
      if (!PROMISE_STATUS[rec.status]) {
        errors.push(`Promise '${rec.id}' has invalid status: '${rec.status}'`);
      }
      if (!rec.promise_text || !rec.speaker || !rec.policy_area) {
        errors.push(`Promise '${rec.id}' is missing required promise fields (promise_text, speaker, policy_area)`);
      }
    } else if (rec.record_type === RECORD_TYPES.DECISION) {
      if (!rec.decision_type || !rec.decision_maker) {
        errors.push(`Decision '${rec.id}' is missing required decision fields (decision_type, decision_maker)`);
      }
    } else if (rec.record_type === RECORD_TYPES.LAW) {
      if (!rec.official_title || !rec.instrument_type) {
        errors.push(`Law '${rec.id}' is missing required legal instrument fields (official_title, instrument_type)`);
      }
      if (!LEGAL_STATUS[rec.status]) {
        errors.push(`Law '${rec.id}' has invalid status '${rec.status}'`);
      }
    } else if (rec.record_type === RECORD_TYPES.OFFICIAL_STATEMENT) {
      if (!rec.speaker || !rec.statement_type || !STATEMENT_TYPE[rec.statement_type]) {
        errors.push(`Statement '${rec.id}' has invalid speaker or statement_type: '${rec.statement_type}'`);
      }
    } else if (rec.record_type === RECORD_TYPES.OUTCOME) {
      if (!rec.outcome_type || !OUTCOME_TYPE[rec.outcome_type]) {
        errors.push(`Outcome '${rec.id}' has invalid outcome_type: '${rec.outcome_type}'`);
      }
      if (!rec.causation_status || !CAUSATION_STATUS[rec.causation_status]) {
        errors.push(`Outcome '${rec.id}' has invalid causation_status: '${rec.causation_status}'`);
      }
    } else if (rec.record_type === RECORD_TYPES.INDICATOR) {
      if (!rec.observation_type || !OBSERVATION_TYPE[rec.observation_type]) {
        errors.push(`Indicator '${rec.id}' has invalid observation_type: '${rec.observation_type}'`);
      }
      if (!rec.name || !rec.value || !rec.unit) {
        errors.push(`Indicator '${rec.id}' is missing required indicator fields (name, value, unit)`);
      }
    } else if (rec.record_type === RECORD_TYPES.DATA_GAP) {
      if (!rec.data_gap_status || !DATA_GAP_STATUS[rec.data_gap_status]) {
        errors.push(`Data Gap '${rec.id}' has invalid data_gap_status: '${rec.data_gap_status}'`);
      }
      if (!rec.missing_information || !rec.institution_expected_to_hold_data) {
        errors.push(`Data Gap '${rec.id}' is missing required fields (missing_information, institution_expected_to_hold_data)`);
      }
    }
  });

  // 3. Validate Responsibility Records
  responsibility.forEach((rsp, idx) => {
    if (!rsp.responsibility_id || !rsp.record_id || !rsp.institution_id) {
      errors.push(`Responsibility record at index ${idx} is missing required IDs (responsibility_id, record_id, institution_id)`);
      return;
    }
    if (!recordIdSet.has(rsp.record_id)) {
      errors.push(`Responsibility '${rsp.responsibility_id}' references unknown record_id '${rsp.record_id}'`);
    }
    if (!institutionIdSet.has(rsp.institution_id)) {
      errors.push(`Responsibility '${rsp.responsibility_id}' references unknown institution_id '${rsp.institution_id}'`);
    }
    if (!RESPONSIBILITY_TYPE[rsp.responsibility_type]) {
      errors.push(`Responsibility '${rsp.responsibility_id}' has invalid responsibility_type '${rsp.responsibility_type}'`);
    }
    if (validSourceIds && Array.isArray(rsp.source_ids)) {
      rsp.source_ids.forEach(sid => {
        if (!validSourceIds.has(sid)) {
          errors.push(`Responsibility '${rsp.responsibility_id}' references unknown source_id '${sid}'`);
        }
      });
    }
  });

  // 4. Validate Relationships
  relationships.forEach((rel, idx) => {
    if (!rel.from_id || !rel.to_id || !rel.relationship_type) {
      errors.push(`Relationship at index ${idx} is missing from_id, to_id, or relationship_type`);
      return;
    }
    if (rel.from_id === rel.to_id) {
      errors.push(`Relationship at index ${idx} is self-referential: from_id '${rel.from_id}' === to_id '${rel.to_id}'`);
    }
    if (!RELATIONSHIP_TYPE[rel.relationship_type]) {
      errors.push(`Relationship at index ${idx} has invalid relationship_type '${rel.relationship_type}'`);
    }
    const fromValid = recordIdSet.has(rel.from_id) || institutionIdSet.has(rel.from_id);
    const toValid = recordIdSet.has(rel.to_id) || institutionIdSet.has(rel.to_id);

    if (!fromValid) {
      errors.push(`Relationship at index ${idx} has unresolved from_id '${rel.from_id}'`);
    }
    if (!toValid) {
      errors.push(`Relationship at index ${idx} has unresolved to_id '${rel.to_id}'`);
    }
  });

  const valid = errors.length === 0;

  if (!valid && throwOnError) {
    throw new Error(`Record of Power Validation Failed with ${errors.length} error(s):\n - ` + errors.join('\n - '));
  }

  return {
    valid,
    errors,
    warnings,
    stats: {
      totalRecords: records.length,
      recordsByType: records.reduce((acc, r) => {
        acc[r.record_type] = (acc[r.record_type] || 0) + 1;
        return acc;
      }, {}),
      totalInstitutions: Object.keys(institutions).length,
      totalResponsibilities: responsibility.length,
      totalRelationships: relationships.length
    }
  };
}
