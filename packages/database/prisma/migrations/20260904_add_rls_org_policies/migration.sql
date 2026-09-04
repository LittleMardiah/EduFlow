-- ==============================================
-- TD-EDU-DB-002: RLS policies dengan organization_id
-- Enables Row Level Security and org-scoped policies
-- on Quiz & Event (and supporting User/Submission access).
-- ==============================================

-- Step 1: Hapus fungsi lama jika ada
DROP FUNCTION IF EXISTS current_user_id() CASCADE;
DROP FUNCTION IF EXISTS current_user_role() CASCADE;

-- Step 2: Fungsi current_user_id() return TEXT
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_id', true), '');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 3: Fungsi current_user_role() return TEXT
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_role', true), '');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 4: Fungsi current_user_org() return TEXT
CREATE OR REPLACE FUNCTION current_user_org()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_org', true), '');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==============================================
-- RLS: Quiz
-- ==============================================
ALTER TABLE "Quiz" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Quiz org: instructors view own org" ON "Quiz";
DROP POLICY IF EXISTS "Quiz org: students view published in org" ON "Quiz";
DROP POLICY IF EXISTS "Quiz org: instructors insert into org" ON "Quiz";
DROP POLICY IF EXISTS "Quiz org: owners update" ON "Quiz";
DROP POLICY IF EXISTS "Quiz org: owners delete" ON "Quiz";

CREATE POLICY "Quiz org: instructors view own org" ON "Quiz"
FOR SELECT
USING (
  current_user_org() IS NULL
  OR organization_id = current_user_org()
  OR instructor_id = current_user_id()
  OR current_user_role() = 'admin'
);

CREATE POLICY "Quiz org: students view published in org" ON "Quiz"
FOR SELECT
USING (
  status = 'published'
  AND (current_user_org() IS NULL OR organization_id = current_user_org())
);

CREATE POLICY "Quiz org: instructors insert into org" ON "Quiz"
FOR INSERT
WITH CHECK (
  current_user_role() IN ('instructor', 'admin')
  AND (current_user_org() IS NULL OR organization_id = current_user_org())
);

CREATE POLICY "Quiz org: owners update" ON "Quiz"
FOR UPDATE
USING (instructor_id = current_user_id() OR current_user_role() = 'admin')
WITH CHECK (organization_id = current_user_org() OR current_user_role() = 'admin');

CREATE POLICY "Quiz org: owners delete" ON "Quiz"
FOR DELETE
USING (instructor_id = current_user_id() OR current_user_role() = 'admin');

-- ==============================================
-- RLS: Event
-- ==============================================
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Event org: view own org" ON "Event";
DROP POLICY IF EXISTS "Event org: instructors insert into org" ON "Event";
DROP POLICY IF EXISTS "Event org: owners update" ON "Event";
DROP POLICY IF EXISTS "Event org: owners delete" ON "Event";

CREATE POLICY "Event org: view own org" ON "Event"
FOR SELECT
USING (
  current_user_org() IS NULL
  OR organization_id = current_user_org()
  OR created_by = current_user_id()
  OR current_user_role() = 'admin'
);

CREATE POLICY "Event org: instructors insert into org" ON "Event"
FOR INSERT
WITH CHECK (
  current_user_role() IN ('instructor', 'admin')
  AND (current_user_org() IS NULL OR organization_id = current_user_org())
);

CREATE POLICY "Event org: owners update" ON "Event"
FOR UPDATE
USING (created_by = current_user_id() OR current_user_role() = 'admin')
WITH CHECK (organization_id = current_user_org() OR current_user_role() = 'admin');

CREATE POLICY "Event org: owners delete" ON "Event"
FOR DELETE
USING (created_by = current_user_id() OR current_user_role() = 'admin');
