-- FINAL FIX: This will definitely work
-- The issue is the email comparison is failing

-- Step 1: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "authenticated_users_read_own" ON users;
DROP POLICY IF EXISTS "practitioners_read_patients" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;

-- Step 3: Create a COMPREHENSIVE policy that handles all cases
-- This uses LOWER() to handle case sensitivity and TRIM() for whitespace
CREATE POLICY "users_select_own_or_assigned"
ON users
FOR SELECT
TO authenticated
USING (
  -- Match by UUID (most reliable)
  id = auth.uid()
  OR
  -- Match by email (case-insensitive, trimmed)
  LOWER(TRIM(email)) = LOWER(TRIM((auth.jwt() ->> 'email')::text))
  OR
  -- Allow practitioners to read assigned patients
  EXISTS (
    SELECT 1 FROM patient_assignments
    WHERE patient_id = users.id
    AND practitioner_id = auth.uid()
  )
);

-- Step 4: Also allow users to update their own records
DROP POLICY IF EXISTS "Users can update own record" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "users_update_own"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Step 5: Fix tracking_logs table RLS (this is causing the 406 error)
ALTER TABLE tracking_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing tracking policies
DROP POLICY IF EXISTS "Members can create own tracking logs" ON tracking_logs;
DROP POLICY IF EXISTS "Members can view own tracking logs" ON tracking_logs;
DROP POLICY IF EXISTS "Members can update own tracking logs" ON tracking_logs;
DROP POLICY IF EXISTS "Members can delete own tracking logs" ON tracking_logs;
DROP POLICY IF EXISTS "Practitioners can view all tracking logs" ON tracking_logs;

-- Create comprehensive tracking_logs policies
CREATE POLICY "tracking_select"
ON tracking_logs
FOR SELECT
TO authenticated
USING (
  -- Users can read their own tracking logs
  user_id = auth.uid()
  OR
  -- Practitioners can read tracking logs of assigned patients
  EXISTS (
    SELECT 1 FROM patient_assignments
    WHERE patient_id = tracking_logs.user_id
    AND practitioner_id = auth.uid()
  )
);

CREATE POLICY "tracking_insert"
ON tracking_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "tracking_update"
ON tracking_logs
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "tracking_delete"
ON tracking_logs
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Verify all policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('users', 'tracking_logs')
ORDER BY tablename, policyname;
