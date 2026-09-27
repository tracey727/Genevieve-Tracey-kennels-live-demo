# Production API surface

All routes except `GET /api/health` require a Bearer token. Facility identity is derived from the server-side token record; the browser cannot choose its own facility.

## Internal roles

Roles: manager, attendant, driver, reception, auditor.

- Session: `GET /api/session`
- Dashboard: `GET /api/dashboard`
- Animals: `GET|POST /api/animals`, `PATCH|DELETE /api/animals/:id`
- Staff: `GET /api/staff`
- Kennels/rooms: `GET /api/kennels`
- Bookings: `GET|POST /api/bookings`, `PATCH /api/bookings/:id`
- Custody: `GET|POST /api/custody`
- Care tasks: `GET|POST /api/tasks`, `PATCH /api/tasks/:id`
- Rounds: `GET /api/rounds`, `PATCH /api/rounds/:id`
- Transport: `GET /api/transports`, `PATCH /api/transports/:id`
- Incidents: `GET|POST /api/incidents`
- Alerts: `GET /api/alerts`, `PATCH /api/alerts/:id`
- Emergency: `GET|POST /api/emergency`
- Safety daily operations: `GET|POST /api/safety/daily-ops`
- Mobility/physio observations: `GET|POST /api/safety/physio`
- Stock: `GET|POST /api/stock`, `PATCH /api/stock/:id`
- Workforce evidence: `POST /api/workforce-events`
- Compliance: `GET|POST /api/compliance`
- Owner updates: `GET|POST /api/owner-updates`
- Pickup-authority review: `GET /api/pickup-authority-requests`, `PATCH /api/pickup-authority-requests/:id`
- Audit: `GET /api/audit`

## Owner role

An owner token is bound server-side to exactly one `animal_id`.

Allowed:

- `GET /api/session`
- `GET /api/owner/me`
- `POST /api/owner/pickup-authority-requests`

All internal routes are rejected for owner tokens.

## Safety boundary

The API records and escalates operational information. It does not diagnose animals, make veterinary decisions, replace emergency services or override trained staff/management authority.
