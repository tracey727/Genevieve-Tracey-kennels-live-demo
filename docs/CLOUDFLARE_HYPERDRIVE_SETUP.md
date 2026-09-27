# Cloudflare Hyperdrive handoff — GENEVIEVE Kennels Command

This is the exact infrastructure target for the canonical kennel build.

## Worker

- Worker name: `genevieve-kennels-command-centre`
- Hyperdrive binding name required by code: `HYPERDRIVE`
- Canonical repository: `tracey727/Genevieve-Tracey-kennels-live-demo`
- Production branch: `main`

## Neon connection target

Use the dedicated runtime role. **Do not use `neondb_owner` in Cloudflare.**

- Neon project: `GENEVIEVE Kennels Command`
- Project ID: `red-mouse-72199262`
- Neon branch: `main`
- Branch ID: `br-holy-pond-ae32nfq5`
- Database: `kennels_prod`
- Runtime user: `kennel_runtime`
- Host: `ep-long-leaf-ae3ojr9o-pooler.c-2.us-east-2.aws.neon.tech`
- Port: `5432`
- TLS/SSL: required

The runtime password is a secret. Retrieve/copy it from Neon only when Cloudflare asks for the database password. Never paste it into repository files, issues, commits, screenshots or chat.

## Hyperdrive creation values

Recommended Hyperdrive name:

`genevieve-kennels-prod`

Use the Neon values above and the current password for `kennel_runtime`.

After Cloudflare creates the Hyperdrive, copy its Hyperdrive ID into the GitHub Actions production secret:

`HYPERDRIVE_ID`

The deployment workflow also requires:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Deployment gate

Run **Deploy Kennels to Cloudflare** only after all three GitHub secrets exist.

The workflow validates the canonical build first, renders the Hyperdrive binding without committing secrets, deploys the Worker, and removes the rendered configuration afterward.

## Post-deploy verification

1. `GET /api/health` returns HTTP 200 and database `kennels_prod`.
2. The reported database role is `kennel_runtime`.
3. Authenticated `/api/session` works.
4. Synthetic dashboard/animals data loads.
5. A revoked token is rejected.
6. An owner token cannot access internal routes.
7. Cross-facility access is rejected.

Until those checks pass, keep the deployment synthetic/demo-only.
