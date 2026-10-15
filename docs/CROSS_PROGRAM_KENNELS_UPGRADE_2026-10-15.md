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
- Existing overdue animal-care tasks, delayed transport custody and cancelled/unused bookings appear in the manager exceptions; unused capacity is **not assigned a fictitious revenue figure**.
- One management exception list with room, financial, stock, handover and supervision indicators. A manager can assign a review note, but cannot artificially close a finding without fixing underlying evidence.
- Offline demo assets included in the service worker's bumped cache; state remains in the same browser storage.
- Pure rules covered by eleven Node regression tests. CI now runs the test suite and verifies that the screens and scripts are present.

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


## Pet Relocation & Travel Budget (requested addition — 15 October 2026)

**Traveller Budget / Wayfarer source reviewed:** \`tracey727/travellers-budget\` has trip budgets, configurable expense categories, cross-currency expense entries and budget-versus-actual views, but not a kennel-specific animal handover workflow. **VIP Pet Travel** \`tracey727/genevieve-vip-pet-travel\` has a separate mobile/edge/database architecture, not an authorised data bridge. Existing Kennels driver screens already support vehicle/crate checks, pickup/delivery and custody handover.

**Now implemented in the same synthetic kennel UI and demo store:**
- Dedicated **Pet Relocation & Travel Budget** navigation/screen for kennel staff transporting dogs/cats to new homes, foster carers and approved receiving organisations.
- Trip records (animal, assigned staff member, origin/destination area labels, target arrival, approved AUD budget), with optional reference to an existing kennel transport job. Linking the reference does not rewrite a driver job.
- Separate verified/held expense records (fuel, tolls, accommodation, driver travel, animal food/water, equipment, veterinary contingency, other); spend and remaining budget. Unverified expenses cannot silently enter the verified total.
- Stop and arrival milestones entered manually. No GPS, map distance, dynamic ETA, route optimisation, automatic dispatch or fabricated travel metrics.
- Human-recorded safety checklist: correct animal/authorisation, containment/vehicle condition, food/water/rest needs, animal arrival condition, receiver identity/authority and explicit custody handover.
- State progression \`PLANNED\` → \`IN_TRANSIT\` → \`ARRIVED\` → \`COMPLETED\`; progression requires corresponding checks and arrival milestone. A completed trip without all safety evidence remains HOLD in the pure rules engine.
- Overdue and unaccepted receiving-home handover escalates; over-budget expenses are flagged but no amount is described as recovered revenue.
- Ten additional Node regression tests added to GitHub CI.

**Boundary:** This is an independently designed kennel module borrowing only the relevant travel budgeting and pet transport patterns. It **does not connect to Traveller Budget, Wayfarer, VIP Pet Travel or Revenue Rescue databases**, and it creates no real customer expense, finance, GPS, animal medical record, legal permit or authenticated receipt. The browser demo cannot establish real identity, professional safety compliance or physical delivery.

**Commercial packaging:** Include standard manually entered and evidenced relocation/travel-budget planning in the proposed **A$249 per-location monthly Kennels Complete subscription** when production-ready, without a separate GENEVIEVE software subscription. Actual transport expenses, paid delivery services, third-party mapping, additional vehicles and specialised multi-location fleet functions are separate operating costs or potential optional commercial features; no charges or automatic carrier fee deductions are implemented.

**Release gates before real transfers:** kennel-only encrypted and tenant-scoped travel/expense database; real staff roles and verified receiving-person permissions; accepted custody with durable audit/consent; incident/escalation; backup and retention; driver hours/fatigue; welfare, council/state/interstate transport, rescue/adoption authority, insurance and veterinary advice as applicable; tested offline/reconnect and multi-user handover. No automatic real-world transport decisions.


## Weather & Hazard Safety — Nature Has No Borders source-contract reuse

**Audit finding:** Prior Kennels UI offered weather/emergency-readiness checkboxes, a midday heat/stress check and manually triggered storm/flood/fire/heat emergency scenarios; it did **not** receive real weather or hazard events. The protected Nature Has No Borders program supports internal hazard coordination and mandatory separation of source warning, internal signal, modelled unverified consequences and human-verified decisions, but its \`docs/DATA_SOURCE_REGISTER.md\` registers potential BOM data as \`review_required\` for commercial ingestion, and no official-warning adapter was confirmed as approved for Kennels.

**Now implemented on the existing synthetic Kennels upgrade branch:**
- New **Weather & Hazard Safety** manager screen with clearly marked fictional exercises for heat, severe storms, flood, bushfire/smoke, cyclone, coastal inundation and power/water failures.
- \`kennel-weather.js\` uses the approved GENEVIEVE hazard vocabulary for independent kennel-specific, pure precaution rules, not a shared runtime or reused customer data.
- Scenarios drive recommended checks for animal housing/temperature/water, vulnerable-animal care plans, staff breaks and cover, gates and equipment, evacuation contingency, utilities and medication storage, driver/pet-relocation decision review, animal/owner headcount and receiving-handovers.
- Simulated scenario review/acknowledgement records stay in the demo's local browser store only. They do not transmit to Nature Has No Borders, emergency responders or animal owners, do not prove staff identity and never close an official public warning.
- A non-live banner and manager overview explicitly show **LIVE FEED NOT CONNECTED — NO WEATHER ALL-CLEAR**. A missing feed is HOLD, never GREEN.
- Source authenticity is fail-closed: even a client-supplied record claiming to be verified BOM data cannot become an official warning in the browser demo. Wrong areas, expired timestamps, unsupported hazard types and unverified sources are HOLD.
- \`tests/kennel-weather.test.cjs\` contains nine regression tests, including source spoofing, expiry and location mismatch, and is run in canonical CI.

**Remaining production work:** Only with the relevant source licence/use approval, owner permission, facility/service-area geolocation authority and privacy protection, create a minimum-necessary **read-only** adapter/bridge from Nature Has No Borders or an authorised source. Server-side it must verify origin, authenticity, authoritative warning wording, timestamp/expiry, coverage and severity, fail closed on outages, capture staff acknowledgements durably and provide a clearly accessible link to current official instructions. Demonstrate safe reconnect and notification delivery on separate staff devices and selected pet relocation journeys. No autonomous evacuation order, dispatch, vehicle-route alteration, public warning, staff instruction override or animal-care decision.

**Commercial scope:** Once source licensing, live deployment and operational acceptance are complete, weather/hazard monitoring and coordination should be included in the **A$249/month Kennels Complete subscription** as a product feature; external data licensing/SMS/telecom charges should be priced as real third-party costs, not concealed.
