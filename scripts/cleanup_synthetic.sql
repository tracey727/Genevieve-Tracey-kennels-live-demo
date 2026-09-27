-- Removes ONLY the deterministic synthetic facility from scripts/seed_synthetic.sql.
-- Safe scope: cascading delete from this one fixed UUID.
BEGIN;
DELETE FROM facilities WHERE id='11111111-1111-4111-8111-111111111111';
COMMIT;
