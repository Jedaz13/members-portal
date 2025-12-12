-- ============================================================================
-- FIX: Allow users to insert their own profile
-- ============================================================================
-- The issue is that RLS might be blocking inserts. This script:
-- 1. Checks current policies
-- 2. Creates a more permissive insert policy
-- ============================================================================

-- First, let's see what's in the auth.users table (Supabase's internal auth)
-- This shows all users who have logged in with Google
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC;

-- Check if RLS is enabled on the users table
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- List all current policies on the users table
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'users';
