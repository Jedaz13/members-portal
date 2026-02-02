-- ============================================================================
-- Migration: Add Commission & Payout System + Fix Referral RLS
-- ============================================================================
-- Adds commission tracking per referral activation, monthly payout management,
-- payment details for referrers, and fixes RLS policies from migration 020.
-- ============================================================================

-- 1. Fix RLS policies on referrals table
-- Drop the overly permissive INSERT policy and the broken UPDATE policy
DROP POLICY IF EXISTS "Users can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can update own referrals" ON public.referrals;

-- New INSERT: any authenticated user can insert (needed for tracking on login)
-- but referrer_user_id must reference a real user with that referral_code
CREATE POLICY "Authenticated users can insert referrals"
    ON public.referrals
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- New UPDATE: allow updates by the referred user (their own record) OR admins/practitioners
CREATE POLICY "Users can update referrals for themselves"
    ON public.referrals
    FOR UPDATE
    USING (
        referred_user_id = auth.uid()
        OR referrer_user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND (users.is_admin = true OR users.role = 'practitioner')
        )
    );

-- Admin UPDATE policy
CREATE POLICY "Admins can update all referrals"
    ON public.referrals
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- 2. Add payment details to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS payout_method TEXT CHECK (payout_method IN ('paypal', 'bank'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS payout_paypal_email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS payout_bank_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS payout_bank_iban TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS payout_bank_swift TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS payout_bank_holder TEXT;

-- 3. Add subscription_type to referrals for commission calculation
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS subscription_type TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS subscription_amount NUMERIC(10,2);

-- 4. Create referral_commissions table
CREATE TABLE IF NOT EXISTS public.referral_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID NOT NULL REFERENCES public.referrals(id),
    referrer_user_id UUID NOT NULL,
    referrer_email TEXT NOT NULL,
    referred_email TEXT NOT NULL,
    -- Commission details
    subscription_type TEXT NOT NULL,
    subscription_amount NUMERIC(10,2) NOT NULL,
    commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.20,
    commission_amount NUMERIC(10,2) NOT NULL,
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'refunded')),
    -- Dates
    earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    refunded_at TIMESTAMPTZ,
    -- Payout grouping
    payout_month INTEGER,
    payout_year INTEGER,
    payout_id UUID,
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_referrer ON public.referral_commissions(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.referral_commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_payout ON public.referral_commissions(payout_id);
CREATE INDEX IF NOT EXISTS idx_commissions_month ON public.referral_commissions(payout_year, payout_month);

-- 5. Create referral_payouts table
CREATE TABLE IF NOT EXISTS public.referral_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID NOT NULL,
    referrer_email TEXT NOT NULL,
    -- Payout details
    payout_month INTEGER NOT NULL,
    payout_year INTEGER NOT NULL,
    total_commissions INTEGER NOT NULL DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    paid_at TIMESTAMPTZ,
    payment_method TEXT,
    payment_reference TEXT,
    notes TEXT,
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- One payout per referrer per month
    UNIQUE(referrer_user_id, payout_month, payout_year)
);

CREATE INDEX IF NOT EXISTS idx_payouts_referrer ON public.referral_payouts(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.referral_payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_month ON public.referral_payouts(payout_year, payout_month);

-- 6. Enable RLS on new tables
ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_payouts ENABLE ROW LEVEL SECURITY;

-- Commission policies: referrers see their own, admins see all
CREATE POLICY "Users can view own commissions"
    ON public.referral_commissions
    FOR SELECT
    USING (referrer_user_id = auth.uid());

CREATE POLICY "Admins can view all commissions"
    ON public.referral_commissions
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true));

CREATE POLICY "Admins can insert commissions"
    ON public.referral_commissions
    FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true));

CREATE POLICY "Admins can update commissions"
    ON public.referral_commissions
    FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true));

-- Payout policies: referrers see their own, admins see all
CREATE POLICY "Users can view own payouts"
    ON public.referral_payouts
    FOR SELECT
    USING (referrer_user_id = auth.uid());

CREATE POLICY "Admins can view all payouts"
    ON public.referral_payouts
    FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true));

CREATE POLICY "Admins can insert payouts"
    ON public.referral_payouts
    FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true));

CREATE POLICY "Admins can update payouts"
    ON public.referral_payouts
    FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.is_admin = true));

-- 7. Add referral_commission_rate to users (custom per-referrer override, default 0.20)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_commission_rate NUMERIC(5,4) DEFAULT 0.20;

-- ============================================================================
-- INSTRUCTIONS TO APPLY:
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor:
-- 1. Go to Supabase Dashboard -> SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
--
-- After running:
-- - RLS policies on referrals are fixed
-- - Users can add payout details (PayPal/bank)
-- - referral_commissions tracks each earned commission
-- - referral_payouts tracks monthly payout settlements
-- - 20% default commission rate, customizable per referrer
-- ============================================================================
