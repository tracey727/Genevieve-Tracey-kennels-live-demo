# Canonical Kennels Command Centre — deployment gate

Architecture is locked to **GitHub + Cloudflare + Neon**.

## Canonical source

Repository: `tracey727/Genevieve-Tracey-kennels-live-demo`

Canonical production branch: `main`

The old dog-kennels repository remains a recovery/source reference only. Do not merge its recovered HTML wholesale.

## Before first production deployment

1. Create a Neon database/branch dedicated to kennels.
2. Create a least-privilege runtime role for the Worker. Do not use the Neon owner credential at runtime.
3. Apply `migrations/0001_core.sql`, then `migrations/0002_operations.sql`.
4. Create one facility UUID.
5. Generate a long random bearer token, store only its SHA-256 hash in `access_tokens`, and give the clear token only to the authorised user/device.
6. Create Cloudflare Hyperdrive with the runtime-role connection string.
7. Bind it to the Worker as `HYPERDRIVE`.
8. Deploy with `npx wrangler deploy`.
9. Verify `GET /api/health` and confirm the reported database role is the dedicated runtime role.
10. Verify internal role access across animals, bookings, custody, rounds, transport, incidents, safety, stock, compliance and audit routes.
11. Verify an owner token can see only its scoped animal and approved owner updates, and cannot call internal routes.
12. Verify facility isolation, write/audit behaviour and revoked-token rejection with synthetic data.
13. Do not enter real owner, animal medical, staff or payment data until privacy, retention, incident response, backup and legal/WHS/veterinary review are complete.

## Auth model

The API does not trust a browser-supplied facility ID. Bearer tokens are stored only as SHA-256 hashes and are bound server-side to one facility and one role.

Roles: manager, attendant, driver, reception, auditor.

## Current front-end state

The polished demonstration remains browser-storage based so it stays safe to demonstrate without exposing production data. API migration should happen screen-by-screen after the production auth and Neon gate is verified.

## Alert rule

Expired stock is **RED** and must be removed from use. Expiring-within-30-days or low stock is **AMBER**. Normal/current is **GREEN**. Evidence/data uncertainty should be held for review rather than silently shown as clear.


## Resolved live infrastructure

For the exact Neon production host, database, runtime role and Hyperdrive values, see `docs/CLOUDFLARE_HYPERDRIVE_SETUP.md`.
