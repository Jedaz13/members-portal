-- ============================================================================
-- Migration 019: Fix Live Q&A Sessions RLS Policies for Admin Access
-- ============================================================================
-- Problem: The existing RLS policies on live_qa_sessions only check for
-- users.role = 'practitioner' using id = auth.uid(). This fails for:
-- 1. Admin users who have is_admin = true but role != 'practitioner'
-- 2. Users whose UUID doesn't match their auth.uid() (quiz-first users)
--
-- Solution: Update policies to use email-based lookup and check for both
-- is_admin = true OR role = 'practitioner', matching the approach used in
-- migration 017_fix_practitioner_rls_email_lookup.sql
-- ============================================================================

-- Drop the existing policies that use id-based lookup
DROP POLICY IF EXISTS "Practitioners can insert sessions" ON live_qa_sessions;
DROP POLICY IF EXISTS "Practitioners can update sessions" ON live_qa_sessions;
DROP POLICY IF EXISTS "Practitioners can delete sessions" ON live_qa_sessions;

-- Policy: Admins/Practitioners can insert sessions (email-based lookup)
CREATE POLICY "Admins can insert sessions"
ON live_qa_sessions FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.email = (auth.jwt() ->> 'email')
        AND (u.is_admin = true OR u.role = 'practitioner')
    )
);

-- Policy: Admins/Practitioners can update sessions (email-based lookup)
CREATE POLICY "Admins can update sessions"
ON live_qa_sessions FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.email = (auth.jwt() ->> 'email')
        AND (u.is_admin = true OR u.role = 'practitioner')
    )
);

-- Policy: Admins/Practitioners can delete sessions (email-based lookup)
CREATE POLICY "Admins can delete sessions"
ON live_qa_sessions FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.email = (auth.jwt() ->> 'email')
        AND (u.is_admin = true OR u.role = 'practitioner')
    )
);

-- Add helpful comments
COMMENT ON POLICY "Admins can insert sessions" ON live_qa_sessions IS 'Allows admins and practitioners to create new Q&A sessions';
COMMENT ON POLICY "Admins can update sessions" ON live_qa_sessions IS 'Allows admins and practitioners to update Q&A sessions';
COMMENT ON POLICY "Admins can delete sessions" ON live_qa_sessions IS 'Allows admins and practitioners to delete Q&A sessions';

-- ============================================================================
-- INSTRUCTIONS TO APPLY:
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
-- ============================================================================
