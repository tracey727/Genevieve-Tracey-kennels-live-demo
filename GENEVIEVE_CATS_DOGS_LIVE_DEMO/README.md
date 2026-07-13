# GENEVIEVE App™ Cats & Dogs Care Command — Live Demo

A static, GitHub- and Vercel-compatible demonstration for combined boarding kennels and cattery operations.

## Main pages

- `index.html` — management command dashboard
- `employee.html` — attendant phone rounds and tasks
- `transport.html` — driver pickup/delivery and handover checks
- `owner.html` — limited owner portal demonstration

Both supplied GENEVIEVE logos appear in the management and phone views. Mr Gruff's supplied photograph is used in his profile.

## What works in the demo

- Cats and dogs with species-specific records
- Current facility state and safety colours
- Bookings and intake
- Drop-off and pickup custody records
- Rooms, dog runs and cat suites
- Feeding, medication, health and other care tasks
- Species-specific employee rounds
- Amber/red alerts, incidents and SOS
- Staff and WHS overview
- Optional transport chain-of-custody workflow
- Owner updates and pickup-authorisation request
- Audit trail and JSON data export
- Offline browser cache after the first hosted visit
- Same-browser tab synchronisation using `BroadcastChannel` and `localStorage`

## Important demo limitation

This package is deliberately static so it uploads easily and opens on a Windows computer without npm. It does **not** securely sync separate physical phones. Production use requires:

- authenticated staff and owner accounts
- a secure hosted database
- role-based permissions
- encrypted connections and backups
- audit-safe server timestamps
- privacy, retention and breach procedures
- a tested incident and business-continuity plan
- review by the kennel's legal, council, veterinary, WHS and insurance advisers

Do not enter real personal, medical, employee or payment data into this static demonstration.

## Open on your computer

1. Extract the ZIP.
2. Double-click `index.html`.
3. Open `employee.html` in another browser tab to demonstrate live rounds updating the dashboard.

## Deploy to GitHub and Vercel

Upload the **contents** of this folder so `index.html` is at the repository root.

Vercel settings:

- Framework Preset: `Other`
- Root Directory: `./`
- Build Command: leave blank
- Install Command: leave blank
- Output Directory: leave blank

## Branding

The supplied logo image files are used without redrawing or recolouring. The app crops only the unused black letterbox area from the GA source image and uses a square crop of Mr Gruff for avatar display.

GENEVIEVE App™ is presented as a trademark. Do not use ® unless registration has been confirmed for the relevant mark and use.
