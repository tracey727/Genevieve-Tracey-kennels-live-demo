# Kennels Cross-Sector Reuse Audit — Aged Care, Childcare & Psychology
**15 October 2026 | ON TRACK by TRACE / GENEVIEVE Animals**
**Scope:** directly inspected source packages in the user's GENEVIEVE Library and the current canonical Psychological Command Centre GitHub repository. Cross-sector REUSE is restricted to *process patterns and independent kennel-domain code*, never regulated records, credentials, clinical algorithms or source deployment configs.

## Sources actually inspected

### 1. GENEVIEVE Aged Care V2.1 — stronger engineering, fictional-data state
Owned Library archive \`GENEVIEVE_AGED_CARE_COMMAND_AND_PRODUCTION_MODULE_V2_1.zip\` (~1.19 MB; 80 archive entries) contains \`src/aged-care.mjs\`, \`src/accountability.mjs\`, \`src/rbac.mjs\`, \`database/migrations/003_aged_care.sql\`, \`config/aged-care.json\`, release gates, seven test files and \`public/\` UI. Its included test report records 14 passing tests but is historical packaged evidence, not freshly re-run production CI. Dashboard and records are **fictional demonstrations**; own README explicitly prohibits real resident/staff/health data until gates are complete. The ZIP also contains old \`vercel.json\`, a Dockerfile and Render config. **Do not copy deployments or dependencies** into Kennels; its platform is GitHub + Neon + Cloudflare only.

Relevant aged-care donor principles:
- clear primary/backup responsibility, due time and factual observation;
- reviewed care plans with allergies, nutrition, mobility observations and individual preferences, appropriately translated to animals and veterinary authority;
- unaccepted care-task attention; incident investigations and evidence before closure;
- supporter/family communications governed by authority/consent;
- safe emergency continuity and human-controlled escalation;
- tenant-bound roles and append-only audit patterns (**must be independently developed and tested on kennel backend**).

Older \`GENEVIEVE_AGED_CARE_SAFETY_PLATFORM_V1.zip\` has single-file care-plan/task/incident examples and a numerical human falls-risk scoring routine. **Exclude** the numeric falls/medication/confusion scoring system, legal reporting (SIRS), personal care and clinical-care governance from animal logic.

### 2. GENEVIEVE Childcare Safety V1 — small safety foundation, not a full operational product
Owned Library ZIP \`GENEVIEVE_CHILDCARE_SAFETY_PLATFORM_V1.zip\` (~3 KB; 16 archive entries) contains minimal \`src/attendance.js\`, \`src/carePlans.js\`, \`src/incidents.js\`, \`docs/WORKFLOW.md\`, and sample/schema/checklist. It does not itself verify real child identity, educator qualifications, regulatory ratios, legitimate collection authority or secure production backend.

Transfer the **principles** of presence/headcount accounting, accurate arrival/departure timestamps, exact authorised collector check, and a controlled release checkpoint. Kennels already has intake/pickup and owner portal; **strengthen**, don't replicate. Exclude all child profiles, identity, diagnoses, photos and childcare-specific supervision/ratio/regulatory logic.

### 3. ON TRACK Psychological Command Centre — current canonical GitHub source
Canonical \`tracey727/ON-TRACK-Psychological-Command-Centre\`. The root README says this supersedes historical Irene/psychology references. \`governance/BUILD_STATE.json\` records Phase 19 as formally closed; Phase 19 is an explicit real-data admission policy gate, **not permission to process real people**. Current code/docs examined:
- \`README_PHASE_9_5.md\` — proposed handover does not change predecessor ownership before actual acceptance.
- \`README_PHASE_10.md\` — referral/callback must remain visible until accepted/replied.
- \`README_PHASE_12_5.md\` — coverage acceptance requires the exact active receiver, not viewing or opening an item.
- \`README_PHASE_18.md\` — staff overload/leave cover/competency/wellbeing safeguards, with no staff scoring/surveillance.
- \`README_PHASE_18_3.md\` — induction/training currency and independently attested role readiness.
- \`apps/clinician/home-today/unaccepted-handovers.ts\`, \`apps/clinician/handover-leave-continuity/unexpected-absence-reassignment.ts\` — explicit pending ownership, safe absence cover, no automatic client communication or clinical decision.

Kennel transfer opportunities:
- worker skill/induction records without ranking or employment decisions;
- only a *named and independently acknowledged* temporary carer/receiver can accept responsibility;
- no task, callback or owner contact silently disappears when a staff member is absent;
- confidentiality: owner/animal records may be visible only by authorised scope; no cross-product patient/therapy data.

## Already in Kennels — DO NOT duplicate
Animal passports (species-specific allergy/diet/medication/behaviour), care tasks, rounds, incidents, owner updates, authorised pickup and delivery, driver custody checklists, staff breaks/safety, stock, the Business & Staff Hub and Weather & Hazard simulations. Existing end-to-end UI-to-Neon migration is still HOLD.

## New kennel-specific implementation added in PR #11
Source files:
- \`GENEVIEVE_CATS_DOGS_LIVE_DEMO/kennel-continuity.js\`: pure source-independent rules, no live data integrations.
- \`GENEVIEVE_CATS_DOGS_LIVE_DEMO/kennel-continuity-ui.js\`: care continuity manager view using the existing synthetic browser store.
- \`tests/kennel-continuity.test.cjs\`: eleven regression tests enforcing no credential self-attestation, current training evidence, plan review dates, exact pickup matches, no premature care ownership transfer and overdue owner follow-ups.
- \`GENEVIEVE_CATS_DOGS_LIVE_DEMO/index.html\`: new **Care Continuity & Staff Readiness** screen and Business Hub navigation shortcut.

Functions added:
1. **Review due** for each in-care animal. Overdue → AMBER; missing evidence → HOLD. No clinical diagnosis.
2. **Independent training readiness evidence** per kennel role (animal handling, welfare, emergencies, staff handover, transport, collection). Missing or lapsed → HOLD; no staff ranking or automatic qualification decisions.
3. **Pickup preflight** requires an exact authorised contact name (not substring), factual ID and authority checks, condition and manager review. The tool **cannot authorise actual release** or save a collector identity.
4. **Propose care-task cover** to an active named receiver, with independent manager review. Prior owner never disappears from the existing care task; acceptance only creates demo evidence, NOT a live owner change. Final server transaction and authenticated receiver attestation remain future work.
5. **Owner callback queue** with named staff, due times, visible overdue and incomplete items. A separate completed-response evidence and manager review gate is required before closure; an attempted response remains open. No real owner messaging or data transfer.

## HOLD / next work before real use
- Only browser localStorage and same-device demo state exist for new workflows; real authentication, manager role proof, role-specific competency policy and independent attestation require a tenant-scoped backend.
- Replace free-text \`pickupAuthorised\` with an explicit consent/authority history, secure identity evidence and purpose-bound collector records. Do not auto-release animals.
- All actual transfers must be atomic with an audit event and durable checks; existing care task ownership cannot be changed by a browser button.
- Staff absence and protected recovery time must not become productivity surveillance or automatic shift/leave determination.
- Incident investigation/corrective-action evidence should be expanded in a **separately tested** kennel-specific release gate; not claimed implemented by this change.
- Live animal-care guidance, infection/veterinary policy, insurance, QLD/local government licensing, privacy, recovery, mobile accessibility and multi-user tests remain required before paid live customer use.
- No direct link is allowed to the aged-care, childcare or psychological products' production databases, identity providers, data or confidential records.

**Commercial packaging:** this is applicable staff and animal-care safety functionality to include in the planned **A$249 per location per month** complete subscription once production-ready. Further add-on pricing needs real customer pilots and support cost evidence; this document does not claim measured savings, compliance accreditation or live client outcomes.
