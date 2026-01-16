-- Migration: Add 4-month subscription type
-- Date: 2026-01-16
-- Purpose: Support new 4-month subscription plan ($149 for 4 months)

-- Update subscription_type check constraint to include '4month' option
-- First drop the existing constraint
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_subscription_type_check;

-- Add updated constraint with 4month option
ALTER TABLE public.users
ADD CONSTRAINT users_subscription_type_check
CHECK (subscription_type IN ('monthly', '6month', 'annual', '4month'));

-- Comment on the constraint change
COMMENT ON COLUMN public.users.subscription_type IS 'Subscription plan type: monthly ($47/month), 4month ($149/4 months), 6month, or annual ($297/year)';
