-- ==============================================
-- TD-EDU-DB-002: Fix hardcoded organization_id
-- Ensure default organization exists & backfill users
-- ==============================================

-- Step 1: Buat default organization 'org-default' jika belum ada.
--        admin_id diambil dari user admin aktif pertama, atau user aktif pertama.
INSERT INTO "Organization" ("id", "name", "slug", "description", "admin_id", "status", "created_at", "updated_at")
SELECT
  'org-default',
  'Default Organization',
  'default',
  'Default organization for users without an assigned organization',
  COALESCE(
    (SELECT id FROM "User" WHERE role = 'admin' AND status = 'active' AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1),
    (SELECT id FROM "User" WHERE status = 'active' AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1)
  ),
  'active',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM "Organization" WHERE slug = 'default'
);

-- Step 2: Backfill user yang organization_id NULL ke org-default
UPDATE "User"
SET "organization_id" = 'org-default',
    "updated_at" = now()
WHERE "organization_id" IS NULL;
