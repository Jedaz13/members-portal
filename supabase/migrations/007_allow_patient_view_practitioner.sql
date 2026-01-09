-- ============================================================================
-- Migration: Allow Patients to View Their Assigned Practitioner
-- ============================================================================
-- Problem: RLS on users table prevents patients from reading their
-- practitioner's profile (name, credentials, bio, etc.)
--
-- Solution: Add policy allowing patients to view basic info about their
-- assigned practitioner
-- ============================================================================

-- Policy: Allow patients to view their assigned practitioner's profile
CREATE POLICY "Patients can view assigned practitioner profile"
    ON users
    FOR SELECT
    USING (
        -- Allow if the user being viewed is the assigned practitioner of the current user
        EXISTS (
            SELECT 1 FROM patient_assignments pa
            WHERE pa.patient_id = auth.uid()
            AND pa.practitioner_id = users.id
            AND pa.status = 'active'
        )
    );

-- ============================================================================
-- INSTRUCTIONS TO APPLY:
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
--
-- This allows patients to see their practitioner's:
-- - name
-- - avatar_url
-- - credentials
-- - bio
-- - specializations
-- ============================================================================
