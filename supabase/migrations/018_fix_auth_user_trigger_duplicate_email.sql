-- ============================================================================
-- Migration: Fix Auth User Trigger for Duplicate Email Issue
-- ============================================================================
-- Problem: When a user pays via Stripe, a record is created in public.users
-- with their email. Later, when they try to create an account (auth.signUp),
-- the trigger that creates a public.users record fails because the email
-- already exists (unique constraint violation).
--
-- Error message users see: "Database error saving new user"
--
-- Solution: Modify the handle_new_user() function to use ON CONFLICT,
-- so it updates the existing record instead of failing when the email exists.
-- This links the auth.users.id to the existing public.users record.
-- ============================================================================

-- Create or replace the function that handles new auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert new user or update existing user if email already exists
    -- This handles the case where a user record was created via Stripe payment
    -- before the user signed up for an account
    INSERT INTO public.users (
        id,
        email,
        name,
        avatar_url,
        created_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        -- Link the auth ID to the existing user record
        id = EXCLUDED.id,
        -- Update name and avatar if provided (from Google sign-in)
        name = COALESCE(EXCLUDED.name, users.name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url);

    RETURN NEW;
END;
$$;

-- Drop the existing trigger if it exists (to ensure clean recreation)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger that fires when a new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- INSTRUCTIONS TO APPLY:
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
--
-- After running this migration:
-- - Users who paid via Stripe can now create their account
-- - Their existing user data (trial status, etc.) will be preserved
-- - Their auth ID will be linked to their existing user record
-- ============================================================================
