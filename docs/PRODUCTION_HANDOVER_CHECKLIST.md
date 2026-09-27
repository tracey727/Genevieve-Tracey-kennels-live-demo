# Production handover checklist

The repository build is considered **deployment-ready** only when every repository-controlled gate below is GREEN. Real operational use remains blocked until the external infrastructure and professional-review gates are completed.

## Repository-controlled gates

- [x] Canonical Cats & Dogs interface selected and legacy recovery HTML excluded.
- [x] Safety Command rebuilt cleanly.
- [x] Cloudflare Worker API present.
- [x] Neon migrations 0001 and 0002 present.
- [x] Facility isolation enforced server-side from the access token.
- [x] Owner token scope restricted to one animal.
- [x] Role-gated internal writes.
- [x] Audit events for write operations.
- [x] PostgreSQL 16 migration integration CI.
- [x] JavaScript syntax + corruption/platform integrity CI.
- [x] Manual fail-closed Cloudflare deployment workflow.
- [x] Synthetic seed and cleanup scripts.
- [x] Access-token provisioning helper.
- [x] Post-deploy authenticated smoke-test script.

## External infrastructure gates

- [ ] Kennel-specific Neon project/branch confirmed.
- [ ] Dedicated runtime Postgres role created.
- [ ] Migrations applied to Neon.
- [ ] Facility record provisioned.
- [ ] Access tokens generated and hashes inserted.
- [ ] Cloudflare Hyperdrive created against the runtime role.
- [ ] GitHub production secrets configured: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, HYPERDRIVE_ID.
- [ ] Manual Cloudflare deploy workflow succeeds.
- [ ] /api/health reports the intended runtime DB role.
- [ ] Internal authenticated smoke test GREEN.
- [ ] Owner isolation test GREEN.
- [ ] Revoked-token rejection test GREEN.
- [ ] Cross-facility isolation test GREEN.
- [ ] Backup/restore and retention procedures confirmed.

## Before real kennel data

- [ ] Privacy and retention review.
- [ ] Council/regulatory review applicable to the operator/location.
- [ ] Veterinary workflow review.
- [ ] WHS review.
- [ ] Insurance review.
- [ ] Incident/breach-response procedure approved.

Until those final gates are complete, use synthetic data only.
