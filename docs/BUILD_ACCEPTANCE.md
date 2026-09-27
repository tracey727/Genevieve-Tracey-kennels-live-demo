# Canonical Kennels Command Centre — build acceptance

## GREEN — repository work complete

- Canonical base is the richer Cats & Dogs live interface.
- Recovered safety branch was audited and **not** merged wholesale.
- Known recovered malformed button markup and mojibake are blocked by CI.
- Safety Command was rebuilt cleanly: daily operations, workforce evidence, physio/mobility observations, stock/expiry assurance and compliance register.
- Expired stock is RED and creates a manager alert in the demonstration.
- Existing kennel/cattery bookings, custody, placement, rounds, emergency, incidents, transport and owner views are preserved.
- Cloudflare Worker API exists with server-side token-to-facility binding and role-gated writes.
- Neon schema exists with facility isolation and immutable-style audit events.
- Cloudflare static-assets configuration exists.
- Manual production deployment workflow exists and fails closed when required secrets are missing.
- Vercel runtime/configuration artifacts have been removed from the canonical branch.
- CI checks JavaScript syntax, corruption markers, runtime platform drift, required files and obvious committed database URLs.

## External gates before live operational data

These cannot be truthfully marked complete from repository code alone:

1. Provision/confirm the kennel Neon project and dedicated runtime role.
2. Apply `migrations/0001_core.sql`.
3. Provision first facility and hashed access token.
4. Create Cloudflare Hyperdrive and set GitHub production secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `HYPERDRIVE_ID`
5. Run the manual Cloudflare deployment workflow.
6. Verify `/api/health`, authentication, facility isolation, write/audit flows and token revocation with synthetic data.
7. Configure backups, retention, incident response and recovery.
8. Complete legal, council, veterinary, WHS, privacy and insurance review before real operational use.

Until those gates are complete, the browser demonstration must remain synthetic/demo-only.
