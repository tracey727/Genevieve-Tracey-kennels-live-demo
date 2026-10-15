# Kennels Security & Safety — synthetic regression test matrix

**Scope:** Authorised synthetic tenants and animals only. Evidence must include timestamp, commit SHA, deployed version, expected vs actual and redacted HTTP status. Never commit tokens or customer records.

| ID | Test | Expected |
|---|---|---|
| K-01 | Deploy without HYPERDRIVE binding | No false health GREEN; service returns 5xx |
| K-02 | Health against wrong database or privileged owner runtime role | HTTP 503, `ok:false` |
| K-03 | Health against `kennels_prod` with `kennel_runtime` and correct core schema | HTTP 200; `schema_ready:true` |
| K-04 | Missing/invalid/revoked token against /api/session | HTTP 401 |
| K-05 | Attendant writes compliance evidence | HTTP 403 |
| K-06 | Auditor writes compliance evidence | HTTP 403 |
| K-07 | Manager writes valid compliance evidence | Accepted and audited |
| K-08 | Attendant attempts workforce event with another `subject` | HTTP 403 |
| K-09 | Attendant logs own break | Accepted, attributed to actor, audited |
| K-10 | Manager logs approved delegated workforce event | Accepted and audited with true actor |
| K-11 | Facility A books/records custody for Facility B animal | HTTP 404; no mutation/audit success claim |
| K-12 | Facility A creates incident, task, owner update or physio for Facility B animal | HTTP 404; no cross-facility record |
| K-13 | Owner token requests other animal or staff routes | HTTP 403/404 |
| K-14 | Incident severity `hold` | Accepted by validator and schema |
| K-15 | Confirm expired stock | RED and manager workflow evidence; never claim automated removal |
| K-16 | Simulated audit insertion error after business write | MUST roll back entire mutation (currently OPEN gap) |
| K-17 | Mobile staff rounds -> manager dashboard -> next shift | Consistent server-persisted handover; currently OPEN UI-to-API migration |
| K-18 | Backup -> restore to isolated synthetic target | Documented recovery and integrity verification; currently OPEN |

**Release rule:** Items K-01 through K-18 require real execution evidence before making claims about full production readiness. K-16 to K-18 are known development work, not already passed tests.
