-- STEP 1: Diagnose the issue
-- Run this first to see what's happening

-- Check what auth.uid() returns for you
SELECT auth.uid() as my_auth_id;

-- Check if your user exists in the users table
SELECT id, email, name, role
FROM users
WHERE email = 'kvedarasgedas1997@gmail.com';

-- Check your auth email
SELECT email FROM auth.users WHERE id = auth.uid();

-- STEP 2: Temporary fix - disable RLS to verify data exists
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Now test your member portal - it should work
-- If it works, the issue is definitely the RLS policy

-- STEP 3: After confirming it works, re-enable RLS with a WORKING policy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing SELECT policies on users table
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can read own record by email" ON users;
DROP POLICY IF EXISTS "Users can read own record by id" ON users;
DROP POLICY IF EXISTS "authenticated_users_select" ON users;
DROP POLICY IF EXISTS "Practitioners can read assigned patients" ON users;

-- Create a SIMPLE policy that definitely works
-- This uses auth.jwt() which contains the user's email from Google OAuth
CREATE POLICY "authenticated_users_read_own"
ON users
FOR SELECT
TO authenticated
USING (
  email = (auth.jwt() ->> 'email')::text
);

-- Also allow practitioners to read their patients
CREATE POLICY "practitioners_read_patients"
ON users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM patient_assignments pa
    WHERE pa.patient_id = users.id
    AND pa.practitioner_id = auth.uid()
  )
);

-- Verify the policies
SELECT policyname, cmd, qual::text
FROM pg_policies
WHERE tablename = 'users'
AND schemaname = 'public';
