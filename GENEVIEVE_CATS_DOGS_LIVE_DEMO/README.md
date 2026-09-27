# GENEVIEVE App™ Cats & Dogs Care Command — Canonical Kennels Command Centre

This folder is the canonical Cats & Dogs kennel/cattery interface. It preserves the richer multi-species experience and now includes the useful recovered Safety Command functions rebuilt cleanly rather than merging the corrupted recovery HTML.

## Main views

- `index.html` — management command dashboard
- `employee.html` — attendant phone rounds and tasks
- `transport.html` — driver pickup/delivery and handover checks
- `owner.html` — restricted owner portal demonstration
- Safety Command Centre — daily operations, workforce safety/fairness, mobility/physio evidence, stock/expiry assurance and compliance evidence register

## Operational capabilities

- Cats and dogs with species-specific records
- Bookings, intake, drop-off and authorised pickup
- Dog runs, cat suites, isolation and medical rooms
- Explainable placement/matching support with human decision authority
- Feeding, medication, welfare, physio/mobility, grooming and vet tasks
- Live employee rounds
- Transport chain of custody
- Emergency command scenarios and headcount
- Incidents, near misses, SOS and audit evidence
- Stock low-level and expiry controls; **expired stock is RED**
- Daily morning/midday/evening assurance checks
- Staff break and closing-shift evidence
- Compliance evidence register
- Offline cache for demonstration use
- Same-browser tab synchronisation using `BroadcastChannel` and `localStorage`

## Architecture

Production architecture is locked to **GitHub + Cloudflare + Neon**.

The repository now contains:

- `worker/` — authenticated Cloudflare Worker API
- `migrations/0001_core.sql` — Neon schema
- `wrangler.toml` — Cloudflare Worker + static assets configuration
- `docs/CANONICAL_DEPLOYMENT.md` — deployment and security gate

The browser demonstration intentionally remains synthetic/local until the authenticated API, Hyperdrive and Neon runtime role are deployed and verified.

## Important safety boundary

This system supports operations and evidence. It does not replace kennel management, trained staff judgement, veterinarians, emergency services, legal advisers, WHS obligations, insurers or council/regulatory requirements.

Do not enter real owner, animal medical, employee or payment data into the static browser demonstration.

## Local demonstration

1. Open `index.html`.
2. Open `employee.html` in another browser tab to demonstrate live rounds.
3. Use **Safety Command** to demonstrate daily assurance, workforce evidence, physio observations, stock expiry escalation and compliance evidence.

## Branding

GENEVIEVE App™ is presented as a trademark. Do not use ® unless registration has been confirmed for the relevant mark and use.
