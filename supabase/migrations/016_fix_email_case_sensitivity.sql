-- Migration: Fix case-sensitive email comparison in RLS policies
-- Date: 2026-01-16
-- Purpose: Make email comparisons case-insensitive to fix login issues
--
-- Problem: The RLS policy uses `auth.jwt() ->> 'email' = email` which is
-- case-sensitive. If Google OAuth returns "User@Gmail.com" but the quiz
-- stored "user@gmail.com", the user cannot access their own record.

-- Drop the existing case-sensitive policies
DROP POLICY IF EXISTS "Members can view own profile by email" ON users;
DROP POLICY IF EXISTS "Members can update own profile by email" ON users;

-- Recreate with case-insensitive comparison using LOWER()
CREATE POLICY "Members can view own profile by email"
    ON users
    FOR SELECT
    USING (
        LOWER(auth.jwt() ->> 'email') = LOWER(email)
    );

CREATE POLICY "Members can update own profile by email"
    ON users
    FOR UPDATE
    USING (
        LOWER(auth.jwt() ->> 'email') = LOWER(email)
    );

-- Add comments
COMMENT ON POLICY "Members can view own profile by email" ON users IS 'Allows users to view their profile by case-insensitive email match from JWT';
COMMENT ON POLICY "Members can update own profile by email" ON users IS 'Allows users to update their profile by case-insensitive email match from JWT';
