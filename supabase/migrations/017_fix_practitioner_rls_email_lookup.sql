-- ============================================================================
-- Migration: Fix Practitioner RLS Policies for Email-Based User Lookup
-- ============================================================================
-- Problem: The existing RLS policies check `id = auth.uid()` to determine if
-- a user is a practitioner. However, users who took the quiz first have a
-- random UUID as their id, which doesn't match their Google auth.uid().
--
-- Solution: Update the practitioner policies to use email-based lookup,
-- matching the approach in migration 002_fix_user_lookup_rls.sql
-- ============================================================================

-- Drop the existing practitioner policies that use id-based lookup
DROP POLICY IF EXISTS "Practitioners can view all profiles" ON users;
DROP POLICY IF EXISTS "Practitioners can update all profiles" ON users;

-- Policy: Admins/Practitioners can view ALL user profiles (email-based lookup)
-- This enables admins to see all members, including in the Host dropdown
CREATE POLICY "Practitioners can view all profiles"
    ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.email = (auth.jwt() ->> 'email')
            AND (u.is_admin = true OR u.role = 'practitioner')
        )
    );

-- Policy: Admins/Practitioners can update any user profile (email-based lookup)
-- This enables admins to manage member subscriptions, etc.
CREATE POLICY "Practitioners can update all profiles"
    ON users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.email = (auth.jwt() ->> 'email')
            AND (u.is_admin = true OR u.role = 'practitioner')
        )
    );

-- ============================================================================
-- Also fix the tracking_logs and messages policies for consistency
-- ============================================================================

-- Fix tracking_logs practitioner policy
DROP POLICY IF EXISTS "Practitioners can view all tracking logs" ON tracking_logs;

CREATE POLICY "Practitioners can view all tracking logs"
    ON tracking_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.email = (auth.jwt() ->> 'email')
            AND (u.is_admin = true OR u.role = 'practitioner')
        )
    );

-- Fix messages practitioner policies
DROP POLICY IF EXISTS "Practitioners can view all messages" ON messages;
DROP POLICY IF EXISTS "Practitioners can send messages" ON messages;
DROP POLICY IF EXISTS "Practitioners can update all messages" ON messages;

CREATE POLICY "Practitioners can view all messages"
    ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.email = (auth.jwt() ->> 'email')
            AND (u.is_admin = true OR u.role = 'practitioner')
        )
    );

CREATE POLICY "Practitioners can send messages"
    ON messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.email = (auth.jwt() ->> 'email')
            AND (u.is_admin = true OR u.role = 'practitioner')
        )
    );

CREATE POLICY "Practitioners can update all messages"
    ON messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.email = (auth.jwt() ->> 'email')
            AND (u.is_admin = true OR u.role = 'practitioner')
        )
    );

-- ============================================================================
-- INSTRUCTIONS TO APPLY:
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
-- ============================================================================
