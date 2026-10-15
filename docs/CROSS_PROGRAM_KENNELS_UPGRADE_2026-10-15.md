# GENEVIEVE Kennels & Cattery Command Centre — Cross-Program Upgrade
**Date:** 15 October 2026 (Australia/Brisbane)  
**Source:** \`tracey727/Genevieve-Tracey-kennels-live-demo\`  
**Branch:** \`build/kennels-cross-program-intelligence-2026-10-15\`  
**Release state:** SYNTHETIC DEMONSTRATION; no live customer data, cross-product database or billing action.

## Product principle
Support staff doing the work. Reuse **applicable product patterns**, not customer data, sector-specific professional judgments, credentials, or wholesale codebases. Keep the existing Cats & Dogs safety and species-specific care, Cloudflare + Neon + GitHub only. Revenue Rescue remains **protected standalone** and unmodified.

## Audited capability map
| Existing GENEVIEVE source | Kennel/cattery use | Status in this upgrade | Boundary |
|---|---|---|---|
| ON TRACK Revenue Rescue | Exact completed-service references, missing invoice alerts, overdue invoice evidence, suspected duplicates, explicit HOLD, manager follow-up | **IMPLEMENTED** pure rules + browser-demo forms / action queue | Independent kennel rules; no RR data, Xero access, automated invoices, charges, refunds or debt collection |
| ON TRACK Stock Sense | Quantities/minimums, expiry, consumption estimates, supplier lead time, replenishment alerts | **IMPLEMENTED** read existing demo inventory + authorised manual rate evidence | No supplier or POS access; no automatic ordering or safety substitution |
| GENEVIEVE FAIR BREAK / FAIR TIME | Staff breaks, rotation, protected recovery time and cover | **REUSED** existing Safety Command workforce view, linked from Hub | No speed rankings, automatic task stuffing, wage/award determination or workplace surveillance |
| GENEVIEVE Shared Core | Owned actions, named acceptance, evidence-first state transitions, RED/AMBER/GREEN/HOLD | **IMPLEMENTED** demo handover offer/accept, manager finding review, status summary | No authenticated handover identity until backend onboarding; reviews never silently close source findings |
| Nature Has No Borders / Emergency | Explicit offered→accepted transfer and continuity visibility | **IMPLEMENTED** locally in kennel handover panel; existing Emergency Command retained | No emergency-service dispatch, automatic evacuation or public safety authority |
| Council Operations | Room/door inspection exceptions and evidence-first manager action queues | **IMPLEMENTED** room warning in unified action board | No council approvals or remote actuator/control authority |
| GENEVIEVE TIME SAVER | One manager view, reduced duplicate-entry pathways | **IMPLEMENTED** shared store-derived manager overview | No cross-program message transport or invented time-savings metrics |
| GENEVIEVE Healthcare / Aged Care operations | Care-task ownership, shift rounds and supervisor assurance | **ALREADY PRESENT** in the kennel UI | No clinical/medical decisions, hospital/aged-care records or staff productivity scoring |
| GENEVIEVE Animal Passport | Dog/cat-specific diet, allergy, handling, medication instructions, identity | **ALREADY PRESENT** | Restricted authorised views in future production; no sector data joins |
| GENEVIEVE Animal Transport/VIP | Custody and approved receiver, crate/vehicle safety, owner update | **ALREADY PRESENT** in driver/owner/manager demos | No off-platform ownership data transfer or verified GPS claims |
| GENEVIEVE Medication Safety / ScriptGuard | Stock expiry RED and species-/animal-specific veterinarian escalation | **REUSED** expiry and human escalation only | No prescribing, dispensing, dose calculation, or professional automation |
| GENEVIEVE Circular Earth / waste programme | Expiry/waste visibility and prevention | **PARTIAL** through stock alerts | Disposal evidence and verified waste measurement still future work |
| Council work orders / GENEVIEVE FAIR BREAK persistent APIs | Authenticated, durable task ownership and workforce evidence | **NOT YET IMPLEMENTED** (requires dedicated kennel backend schema) | No copying another product's database, tokens or shared payroll |
| Kennel subscription / bookkeeping | Dedicated commercial subscriptions and invoicing | **NOT CONNECTED** | No payments or billing without explicit owner approval and isolation proof |

## Implemented synthetic functionality
- New **Business & Staff Hub** nav item and responsive screen in the canonical kennel manager interface.
- Completed-service, invoice, payment, verified-reconciliation input forms. These write fictional training records to the existing demo store; no external billing calls.
- Pure reusable kennel-intelligence rules: an exact verified charge can be a **potential unbilled amount**, not recovered cash. A paid or partially paid invoice only counts as a distinct **verified outstanding balance** when invoice/amount/payment reconciliation is reliable; duplicate, contradictory or missing source data is HOLD and excluded from totals.
- Expired stock RED, low stock AMBER, approaching expiry AMBER, demand vs supplier lead-time AMBER. Forecast only uses manually verified positive rates; human approval is required for purchasing.
- Offered handovers with named sender/receiver and due time remain open until accepted in demo; overdue unaccepted items RED. No claim of live worker identity.
- Existing staff breaks/workforce Safety Command is linked instead of building a second break engine; no productivity ranking.
- One management exception list with room, financial, stock, handover and supervision indicators. A manager can assign a review note, but cannot artificially close a finding without fixing underlying evidence.
- Offline demo assets included in the service worker's bumped cache; state remains in the same browser storage.
- Pure rules covered by ten Node regression tests. CI now runs the test suite and verifies that the screens and scripts are present.

## Safety and acceptance
The polished four-view browser demonstration is **not** a secure production application. It uses localStorage, supports tab syncing only on the same device, and has no authenticated manager role for these forms. It must not contain real animal-owner, employment, financial or veterinarian records. Do not use its labels as statutory or veterinary compliance certification.

No new Neon table, Worker endpoint, API token, integration credential, real invoice, external recipient, booking change, real purchase, payroll or production deployment was created.

## Next engineering steps (ordered)
1. Resolve and merge source security PR #10 first after full behavioural tests. This upgrade is branched **from the security PR**, so merge or rebase in that order.
2. Verify this branch's CI and review its audited finite rules and UI. Check responsive keyboard/screenreader labels and mobile screens.
3. For revenue, choose explicit kennel authoritative sources and map invoice/service/payment IDs; build dedicated kennel-domain DB migration, idempotent event/ledger model, RLS/tenant constraints, staff/manager authorisation and transactional write+audit.
4. Migrate Hub actions and existing animal/stock/staff/owner screens one by one from browser storage to kennel-only authenticated Worker APIs, with permission denial and restoration testing.
5. Provision synthetic facility/roles/tokens safely, deploy controlled worker (not yet present), test health and rollback; verify isolated owner/animal scopes and cross-facility negative cases.
6. Review data minimisation, retention, independent backups, incident response, local council, animal welfare, WHS, veterinary and insurance requirements before a real paying subscription.

**No cross-product live bridge is authorised here.** A future Ecosystem Control Centre health entry may carry only minimum necessary status, version, test evidence and route reference — not animal, owner, staff or finance details.
