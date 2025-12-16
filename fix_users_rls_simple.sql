-- Simple fix for users table RLS policies
-- This will allow authenticated users to read their own records

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can read own record by email" ON users;
DROP POLICY IF EXISTS "Users can read own record by id" ON users;
DROP POLICY IF EXISTS "authenticated_users_select" ON users;

-- Create ONE simple policy that allows users to read their own data
-- This checks both auth.uid() = id AND email matches
CREATE POLICY "Users can read own data"
ON users
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Keep the practitioner policy
-- (This allows practitioners to read their assigned patients)
-- The "Practitioners can read assigned patients" policy should already exist

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
