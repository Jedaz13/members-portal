-- ============================================================================
-- Migration: Fix User Lookup RLS Policy
-- ============================================================================
-- Problem: When users take the quiz, their record is created with a random UUID.
-- When they later log in with Google, their auth.uid() is DIFFERENT from the
-- database id. The existing RLS policy blocks them from reading their own row.
--
-- Solution: Add a policy that allows authenticated users to look up their row
-- by matching their email from the JWT token.
-- ============================================================================

-- Policy: Allow authenticated users to view their profile by email
-- This enables the login flow to find existing quiz takers
CREATE POLICY "Members can view own profile by email"
    ON users
    FOR SELECT
    USING (
        auth.jwt() ->> 'email' = email
    );

-- Policy: Allow authenticated users to update their profile by email
-- This enables linking the auth ID to the existing user record
CREATE POLICY "Members can update own profile by email"
    ON users
    FOR UPDATE
    USING (
        auth.jwt() ->> 'email' = email
    );

-- ============================================================================
-- INSTRUCTIONS TO APPLY:
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
-- ============================================================================
