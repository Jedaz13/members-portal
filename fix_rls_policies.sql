-- Fix RLS policies for users table to allow proper access

-- First, check current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Practitioners can read assigned patients" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Users can read their own record" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to read users" ON users;

-- Create new comprehensive RLS policies

-- 1. Allow users to read their own record (by auth email)
CREATE POLICY "Users can read own record by email"
ON users
FOR SELECT
TO authenticated
USING (email = auth.jwt() ->> 'email');

-- 2. Allow users to read their own record (by auth ID)
CREATE POLICY "Users can read own record by id"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. Allow practitioners to read their assigned patients
CREATE POLICY "Practitioners can read assigned patients"
ON users
FOR SELECT
TO authenticated
USING (
  role = 'practitioner' OR
  id IN (
    SELECT patient_id
    FROM patient_assignments
    WHERE practitioner_id = auth.uid()
  )
);

-- 4. Allow users to update their own record
CREATE POLICY "Users can update own record"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Check the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'users';
