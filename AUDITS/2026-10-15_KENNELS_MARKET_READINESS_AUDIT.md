# Kennels & Catteries — market-readiness audit (15 October 2026, Australia/Brisbane)

**Owner:** ON TRACK by TRACE / GENEVIEVE Animals
**Scope:** connected GitHub, Cloudflare and Neon evidence; static source review; non-destructive database metadata checks.
**Verdict:** **HOLD for live customers; demonstrable synthetic interface and substantial backend foundation**.
**Change boundary:** PR branch only. No changes to `main`, Cloudflare production Workers, Neon schema/data, Hyperdrive secrets, or existing customer records.

## Verified infrastructure (15 October 2026)
- Canonical code: `tracey727/Genevieve-Tracey-kennels-live-demo` `main`; source identifies `GENEVIEVE_CATS_DOGS_LIVE_DEMO/` as the canonical browser UI.
- Neon project: `GENEVIEVE Kennels Command` (`red-mouse-72199262`); production database: `kennels_prod`, distinct from the same project's default `neondb`.
- `kennels_prod` contains 21 public tables, including `facilities`, `access_tokens`, `animals`, `audit_events`, `stock_items`, `daily_ops`, `rounds`, `transports` and `pickup_authority_requests`. The first and second migration targets are represented.
- Database runtime role `kennel_runtime` exists. Read-only privilege probes confirmed SELECT on `facilities`, `animals`, `access_tokens` and INSERT on `audit_events`.
- Database contains 1 facility and 6 animal records, **not verified as customer versus synthetic records**; do not publish or reuse data without provenance and consent. There were **zero non-revoked access tokens** when checked. No token values were read.
- Cloudflare Hyperdrive `genevieve-kennels-prod` exists and points at `kennels_prod` using `kennel_runtime`. No Hyperdrive password or connection secret was read or disclosed.
- Cloudflare account worker inventory contained 55 Workers, none named `genevieve-kennels-command-centre`; direct settings lookup returned Worker-not-found. Two Pages projects were found, neither a Kennels project.
- The canonical demo still uses browser storage / cross-tab sync. Backend API routes and schema exist, but the UI-to-API migration and authenticated end-to-end test remain unproven.

## Source-level weaknesses found; fixes proposed on this PR
1. `POST /api/compliance` mistakenly allowed the `auditor` role to write, contradicting its intended read-only authority. Restrict to manager.
2. An attendant could supply another person's `subject` in workforce events. Reject attempts to record for others unless the actor is a manager.
3. Several animal-linked POST endpoints only checked an animal UUID/foreign key, not the actor's **facility**. Require a matching active animal in the actor's facility before writes. This is one application-level defence; a DB-level composite-key/constraint review is still recommended.
4. Incident validation included duplicate `amber` and omitted the supported `hold` state.
5. `GET /api/health` previously returned success for any reachable database/role even if the critical schema was absent. New health gate checks core tables and the expected DB/runtime role, failing closed with HTTP 503 on wrong target.

## Remaining blockers (do not label production GREEN)
- No deployed Kennels Worker and no authenticated staff tokens at checkpoint. Prepare deployment only after safe configuration review.
- Confirm actual GitHub Actions secrets **exist**, are correctly scoped and not overprivileged. Presence not independently tested by this audit.
- Before writing operational data, run complete synthetic end-to-end API tests for role permissions, cross-facility denial, revocation, owner scope, staff attribution and audit persistence.
- Implement server/database transactional integrity for action plus audit events; current separate statements can leave unaudited mutations if the second write fails.
- Verify UI screen-by-screen against the API. Browser-storage data must not be mistaken for real persistent multi-user state.
- Confirm backup/restore, retention, breach response, Australian privacy and applicable council, WHS, veterinary and insurance reviews.
- A production deployment or synthetic smoke test alone does **not** authorise real owner/animal medical/employee/payment data or a paying live trial.
- Carefully distinguish demonstration functionality from a live recurring-revenue service.

## Next gated sequence
1. Review/merge PR after CI, focused review and synthetic regression checks.
2. Confirm Hyperdrive still targets `kennels_prod` as `kennel_runtime` and check the intended Cloudflare account.
3. Provision new high-entropy manager token through secure tooling; store only its hash in `access_tokens` and avoid transmitting the raw token in chats, issues or commits.
4. Confirm GitHub Actions deploy secrets; deploy the dedicated Worker to a controlled **synthetic-only** environment; check new fail-closed `/api/health`.
5. Run authenticated smoke tests, positive and negative role tests, tenant isolation, revocation, audit and backup-recovery checks.
6. Migrate staff/management/driver/owner screens off browser storage with appropriate review and role-specific flows.
7. Complete professional and customer-acceptance gates before any live subscription agreement.

**Portfolio boundary:** kennel health may be reported to the GENEVIEVE Ecosystem Control Centre as minimum-necessary status/metadata only. Animal, owner and staff data must stay isolated in this product.
