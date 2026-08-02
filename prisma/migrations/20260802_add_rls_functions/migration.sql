-- ==============================================
-- RLS FUNCTIONS & POLICIES FOR NEON.TECH (FIXED)
-- ==============================================

-- Step 1: Hapus fungsi lama jika ada
DROP FUNCTION IF EXISTS current_user_id() CASCADE;
DROP FUNCTION IF EXISTS current_user_role() CASCADE;

-- Step 2: Buat fungsi current_user_id() return TEXT (bukan UUID)
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_id', true), '');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 3: Buat fungsi current_user_role() return TEXT
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_user_role', true), '');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 4: Enable RLS di tabel Quiz
ALTER TABLE "Quiz" ENABLE ROW LEVEL SECURITY;

-- Step 5: Hapus policy lama (biar bersih)
DROP POLICY IF EXISTS "Instructors can view own quizzes" ON "Quiz";
DROP POLICY IF EXISTS "Students can view published quizzes" ON "Quiz";
DROP POLICY IF EXISTS "Only instructors can insert quizzes" ON "Quiz";
DROP POLICY IF EXISTS "Only owners can update quizzes" ON "Quiz";
DROP POLICY IF EXISTS "Only owners can delete quizzes" ON "Quiz";

-- Step 6: Buat policy baru (dengan perbandingan TEXT = TEXT)
CREATE POLICY "Instructors can view own quizzes" ON "Quiz"
FOR SELECT
USING (
  instructor_id = current_user_id() OR 
  current_user_role() = 'admin' OR 
  is_public = true
);

CREATE POLICY "Students can view published quizzes" ON "Quiz"
FOR SELECT
USING (
  status = 'published' AND (
    is_public = true OR true -- FASE 4 nanti ditambah event check
  )
);

CREATE POLICY "Only instructors can insert quizzes" ON "Quiz"
FOR INSERT
WITH CHECK (current_user_role() IN ('instructor', 'admin'));

CREATE POLICY "Only owners can update quizzes" ON "Quiz"
FOR UPDATE
USING (instructor_id = current_user_id() OR current_user_role() = 'admin');

CREATE POLICY "Only owners can delete quizzes" ON "Quiz"
FOR DELETE
USING (instructor_id = current_user_id() OR current_user_role() = 'admin');

-- ==============================================
-- SELESAI RLS SETUP (FIXED)
-- ==============================================
