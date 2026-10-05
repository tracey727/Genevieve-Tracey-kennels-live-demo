# GENEVIEVE Shared Core Adoption Audit — Kennels / Catteries

Date: 2026-10-05

Status: **STRONG PARTIAL ADOPTION / SYNTHETIC UNTIL EXTERNAL GATES**

## PRESENT

- facility isolation;
- server-side token-to-facility binding;
- role-gated writes;
- owner tokens scoped to one animal;
- revoked-token rejection path;
- safety operations, incidents, emergency state and workforce evidence;
- alerts with accountable owner field;
- audit events;
- Cloudflare + Neon canonical architecture;
- external readiness gates documented.

## Canonical alert mismatch to repair

Historical `yellow` remains accepted in several database/UI fields. The ecosystem standard is RED / AMBER / GREEN / HOLD.

Migration rule:
- existing yellow operational values become AMBER;
- new writes must use GREEN / AMBER / RED / HOLD only;
- no animal-care or safety meaning is removed;
- HOLD remains the state for missing/unverified evidence or controlled gates.

## Remaining external HOLD gates

Neon/Hyperdrive provisioning, first facility token, live Cloudflare deployment verification, backups/retention/recovery configuration, and legal/council/veterinary/WHS/privacy/insurance review remain external and must not be represented as complete.
