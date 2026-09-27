# Live infrastructure status — GENEVIEVE Kennels Command

Updated: 2026-09-27

## Neon

- Project: `GENEVIEVE Kennels Command`
- Project ID: `red-mouse-72199262`
- Production branch: `main`
- Branch ID: `br-holy-pond-ae32nfq5`
- Canonical application database: `kennels_prod`
- Runtime Postgres role: `kennel_runtime`
- Legacy/reference database: `neondb` — preserved; do not point the production Worker at it.

The canonical migrations `0001_core.sql` and `0002_operations.sql` have been applied to `kennels_prod`. The runtime role has CONNECT/USAGE plus SELECT/INSERT/UPDATE and sequence usage. It intentionally does not have blanket DELETE permission.

## Cloudflare

Pending external connection:

1. Create/confirm Hyperdrive for the `kennels_prod` database using `kennel_runtime`.
2. Bind that Hyperdrive to the Worker as `HYPERDRIVE`.
3. Set GitHub production secrets required by the manual deployment workflow.
4. Deploy and run the authenticated smoke test.

No Neon owner credential should be used by the Worker.
