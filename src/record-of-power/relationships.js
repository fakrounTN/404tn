// src/record-of-power/relationships.js
// 404TN — Directional Relationship Graph for Record of Power (Phase R2.1)

import { RELATIONSHIP_TYPE } from './schema.js';

export const RELATIONSHIPS = Object.freeze([
  // 1. 2019 Mandate -> Promises
  {
    from_id: "ROP-EVT-2019-ELEC-001",
    to_id: "ROP-PRM-2019-RECON-001",
    relationship_type: RELATIONSHIP_TYPE.PROMISE_FOLLOWED_BY_ACTION,
    description: "2019 electoral victory established the political mandate for the penal reconciliation policy pledge."
  },
  {
    from_id: "ROP-EVT-2019-ELEC-001",
    to_id: "ROP-PRM-2019-SOV-001",
    relationship_type: RELATIONSHIP_TYPE.PROMISE_FOLLOWED_BY_ACTION,
    description: "2019 election established the doctrine of economic self-reliance and rejection of external conditionality."
  },

  // 2. Penal Reconciliation Promise -> Implementation -> Outcome -> Data Gap
  {
    from_id: "ROP-PRM-2019-RECON-001",
    to_id: "ROP-OUT-2026-RECON-001",
    relationship_type: RELATIONSHIP_TYPE.ACTION_PRODUCED_OUTCOME,
    description: "Penal reconciliation policy produced measured treasury receipts below 5% of target by mid-2026."
  },
  {
    from_id: "ROP-GAP-2026-RECON-RECEIPTS-001",
    to_id: "ROP-OUT-2026-RECON-001",
    relationship_type: RELATIONSHIP_TYPE.DATA_GAP_APPLIES_TO,
    description: "Lack of itemized penal reconciliation settlements limits full audit of recovery yields."
  },

  // 3. July 25 Event -> Decisions & Statements
  {
    from_id: "ROP-EVT-2021-0725-001",
    to_id: "ROP-STM-2021-0725-001",
    relationship_type: RELATIONSHIP_TYPE.STATEMENT_REFERS_TO_EVENT,
    description: "Presidential speech of July 25, 2021 provided the official justification for Article 80 emergency measures."
  },
  {
    from_id: "ROP-EVT-2021-0725-001",
    to_id: "ROP-DEC-2021-0922-001",
    relationship_type: RELATIONSHIP_TYPE.EVENT_TRIGGERED_DECISION,
    description: "July 25 exceptional situation led directly to the enactment of Decree 117 consolidating decree powers."
  },

  // 4. Decree 117 -> 2022 Constitution & Judicial Restructuring
  {
    from_id: "ROP-DEC-2021-0922-001",
    to_id: "ROP-LAW-2022-CONST-001",
    relationship_type: RELATIONSHIP_TYPE.ACTION_PRODUCED_OUTCOME,
    description: "Decree 117 organized the consultative and drafting track leading to the 2022 Constitution referendum."
  },
  {
    from_id: "ROP-DEC-2021-0922-001",
    to_id: "ROP-INS-2022-CSM-001",
    relationship_type: RELATIONSHIP_TYPE.DECISION_AFFECTED_INSTITUTION,
    description: "Decree power under Decree 117 was used to dissolve the High Judicial Council."
  },
  {
    from_id: "ROP-INS-2022-CSM-001",
    to_id: "ROP-DEC-2022-JUDGES-001",
    relationship_type: RELATIONSHIP_TYPE.PROMISE_FOLLOWED_BY_ACTION,
    description: "Restructuring of the judicial council was followed by executive revocation of 57 magistrates."
  },

  // 5. 2022 Constitution -> Decree 54
  {
    from_id: "ROP-LAW-2022-CONST-001",
    to_id: "ROP-LAW-2022-054-001",
    relationship_type: RELATIONSHIP_TYPE.DECISION_AUTHORIZED_BY_LAW,
    description: "Decree-Law 54 promulgated by presidential decree under the new constitutional order."
  },

  // 6. 2024 Election -> Opposition Disputes
  {
    from_id: "ROP-OPP-2024-ISIE-001",
    to_id: "ROP-EVT-2024-ELEC-001",
    relationship_type: RELATIONSHIP_TYPE.RECORD_DISPUTES_RECORD,
    description: "Opposition disputed election integrity regarding candidate disqualifications and non-execution of Administrative Court rulings."
  },

  // 7. Water Outcome -> Environmental & Infrastructure Context
  {
    from_id: "ROP-OUT-2026-WATER-001",
    to_id: "INST-SONEDE",
    relationship_type: RELATIONSHIP_TYPE.INSTITUTION_RESPONSIBLE_FOR,
    description: "SONEDE holds operational responsibility for potable water distribution and network rationing."
  },

  // 8. Indicators -> Macro Outcomes
  {
    from_id: "ROP-IND-GDP-GROWTH-001",
    to_id: "ROP-PRM-2019-SOV-001",
    relationship_type: RELATIONSHIP_TYPE.OUTCOME_MEASURED_BY_INDICATOR,
    description: "Real GDP growth telemetry (+0.8% in Q2 2026) measures macroeconomic performance under the sovereign self-reliance model."
  },
  {
    from_id: "ROP-IND-UNEMP-GRAD-001",
    to_id: "ROP-PRM-2019-SOV-001",
    relationship_type: RELATIONSHIP_TYPE.OUTCOME_MEASURED_BY_INDICATOR,
    description: "Graduate unemployment (38.8% in Q2 2026) measures structural youth labor market absorption."
  },

  // 9. Gabès Data Gap
  {
    from_id: "ROP-GAP-2026-GABES-AIR-001",
    to_id: "INST-ANPE",
    relationship_type: RELATIONSHIP_TYPE.INSTITUTION_RESPONSIBLE_FOR,
    description: "ANPE is the designated environmental agency holding operational continuous ambient air quality telemetry."
  }
]);
