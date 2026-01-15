-- Migration: Add columns for enhanced authentication and Stripe integration
-- Date: 2025-01-15
-- Purpose: Support email/password auth, Stripe Customer Portal, and notification preferences

-- Add stripe_customer_id for Stripe Customer Portal integration
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add subscription_started_at for tracking membership start date
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE;

-- Add email_notifications for practitioner message notifications (default true)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Add qa_notifications for Live Q&A email notifications (default true)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS qa_notifications BOOLEAN DEFAULT true;

-- Update subscription_type check constraint to include 'annual' option
-- First drop the existing constraint if it exists
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_subscription_type_check;

-- Add updated constraint with annual option
ALTER TABLE public.users
ADD CONSTRAINT users_subscription_type_check
CHECK (subscription_type IN ('monthly', '6month', 'annual'));

-- Add index on stripe_customer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id
ON public.users(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

-- Add index on status for efficient filtering
CREATE INDEX IF NOT EXISTS idx_users_status
ON public.users(status);

-- Comment on new columns
COMMENT ON COLUMN public.users.stripe_customer_id IS 'Stripe Customer ID for billing portal access';
COMMENT ON COLUMN public.users.subscription_started_at IS 'When the user first started a paid subscription';
COMMENT ON COLUMN public.users.email_notifications IS 'Receive email when practitioner responds to messages';
COMMENT ON COLUMN public.users.qa_notifications IS 'Receive email about upcoming Live Q&A sessions';
