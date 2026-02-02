-- ============================================================================
-- Migration: Add Referral System
-- ============================================================================
-- Adds referral tracking for members. Each member gets a unique referral code.
-- When someone signs up through a referral link, the referral is tracked
-- through quiz completion, trial start, and account activation stages.
-- ============================================================================

-- 1. Add referral columns to users table (for members, not just practitioners)
-- referral_code already exists from migration 004 for practitioners
-- Add referred_by to track who referred this user
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by_user_id UUID;

-- 2. Create referrals tracking table
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID NOT NULL,
    referrer_email TEXT NOT NULL,
    referrer_code TEXT NOT NULL,
    referred_email TEXT,
    referred_user_id UUID,
    -- Funnel stages
    quiz_completed BOOLEAN DEFAULT false,
    quiz_completed_at TIMESTAMPTZ,
    trial_started BOOLEAN DEFAULT false,
    trial_started_at TIMESTAMPTZ,
    account_activated BOOLEAN DEFAULT false,
    account_activated_at TIMESTAMPTZ,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_user_id ON public.referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_code ON public.referrals(referrer_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_email ON public.referrals(referred_email);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON public.referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON public.users(referral_code);

-- 4. Enable RLS on referrals table
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own referrals (as referrer)
CREATE POLICY "Users can view own referrals"
    ON public.referrals
    FOR SELECT
    USING (referrer_user_id = auth.uid());

-- Policy: Users can insert referrals (for tracking)
CREATE POLICY "Users can insert referrals"
    ON public.referrals
    FOR INSERT
    WITH CHECK (true);

-- Policy: Users can update referrals they created
CREATE POLICY "Users can update own referrals"
    ON public.referrals
    FOR UPDATE
    USING (referrer_user_id = auth.uid());

-- Policy: Admins and practitioners can view all referrals
CREATE POLICY "Admins can view all referrals"
    ON public.referrals
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND (users.is_admin = true OR users.role = 'practitioner')
        )
    );

-- 5. Create referral stats view for easy querying
CREATE OR REPLACE VIEW public.referral_stats AS
SELECT
    u.id AS referrer_id,
    u.email AS referrer_email,
    u.name AS referrer_name,
    u.referral_code,
    COUNT(r.id) AS total_referrals,
    COUNT(CASE WHEN r.quiz_completed THEN 1 END) AS quiz_completions,
    COUNT(CASE WHEN r.trial_started THEN 1 END) AS trials_started,
    COUNT(CASE WHEN r.account_activated THEN 1 END) AS accounts_activated
FROM public.users u
LEFT JOIN public.referrals r ON r.referrer_code = u.referral_code
WHERE u.referral_code IS NOT NULL
GROUP BY u.id, u.email, u.name, u.referral_code;

-- 6. Function to generate a unique referral code for a user
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    base_code TEXT;
    final_code TEXT;
    counter INTEGER := 0;
BEGIN
    -- Generate base code from email prefix
    base_code := lower(split_part(user_email, '@', 1));
    -- Remove non-alphanumeric characters
    base_code := regexp_replace(base_code, '[^a-z0-9]', '', 'g');
    -- Truncate to 20 chars
    base_code := left(base_code, 20);

    final_code := base_code;

    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM public.users WHERE referral_code = final_code) LOOP
        counter := counter + 1;
        final_code := base_code || counter::TEXT;
    END LOOP;

    -- Update the user's referral code
    UPDATE public.users SET referral_code = final_code WHERE email = user_email;

    RETURN final_code;
END;
$$;

-- ============================================================================
-- INSTRUCTIONS TO APPLY:
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor:
-- 1. Go to Supabase Dashboard -> SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
--
-- After running:
-- - Users will have referral_code and referred_by columns
-- - referrals table tracks the full funnel
-- - referral_stats view provides aggregated metrics
-- - generate_referral_code() creates unique codes from email
-- ============================================================================
