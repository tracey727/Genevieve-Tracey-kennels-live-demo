# GENEVIEVE App™ Cats & Dogs Care Command — Canonical Feature Inventory

## Connected views

1. Management command dashboard
2. Employee mobile rounds app
3. Driver pickup/delivery app
4. Restricted owner portal demonstration
5. Safety Command Centre

## Cats and dogs

- Species-specific animal passports
- Owner, vet, emergency and authorised-pickup information
- Vaccination, microchip, desexing, allergy, diet and medication fields
- Behaviour, handling, mobility, comfort and escape-risk notes
- Dog-specific reactivity, movement, play and heat controls
- Cat-specific appetite, litter, hiding, handling and escape controls

## Operations

- Bookings and intake
- Controlled drop-off and pickup custody
- Dog runs, cat suites, quiet, medical and isolation rooms
- Explainable preventative placement support
- Feeding, medication, welfare, mobility/physio, grooming and vet tasks
- Stock and expiry register
- Staff roster, training and WHS controls
- Live rounds
- Optional transport workflow
- Owner-approved updates

## Safety Command

- Morning / midday / evening operational assurance checklist
- Live staff break evidence and closing-shift rotation evidence
- Mobility and comfort observations with explicit escalation rather than diagnosis
- Expired stock = RED; low or expiring stock = AMBER
- Compliance evidence register
- Emergency scenarios, recovery task and animal headcount
- Incident, near-miss, SOS and audit records
- Human decision authority retained throughout

## Production foundation now present

- Cloudflare Worker API
- Neon PostgreSQL schema
- Facility isolation
- Server-side token-to-facility binding
- Hashed bearer-token lookup
- Role-gated writes
- Server audit events
- Cloudflare static-asset serving configuration
- CI integrity checks

## Remaining external deployment gates

- Provision Neon production database/runtime role
- Apply migration
- Provision first facility and access token
- Create Cloudflare Hyperdrive binding
- Deploy Worker and verify API against synthetic data
- Complete privacy/retention/backup/incident-response configuration
- Complete legal, council, veterinary, WHS and insurance review before real operational use
