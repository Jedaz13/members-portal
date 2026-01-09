-- Migration: Add user settings for notifications and profile
-- Adds notification preferences, bio, and avatar support

-- Add notification and profile columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add comment for documentation
COMMENT ON COLUMN public.users.email_notifications IS 'Whether user wants to receive email notifications for new messages';
COMMENT ON COLUMN public.users.bio IS 'User bio/description shown on their profile';
COMMENT ON COLUMN public.users.avatar_url IS 'URL to user avatar image in storage';

-- Update the webhook function to check notification preferences
CREATE OR REPLACE FUNCTION notify_practitioner_new_message()
RETURNS trigger AS $$
DECLARE
  patient_record record;
  practitioner_record record;
  actual_practitioner_id uuid;
  webhook_url text := 'https://hook.eu1.make.com/a0xoeham6c7rea4eaohx19n6mcadzx6g';
  webhook_payload jsonb;
  recipient_wants_notifications boolean;
BEGIN

  -- Get practitioner_id: use from message OR look up from patient_assignments
  actual_practitioner_id := NEW.practitioner_id;

  IF actual_practitioner_id IS NULL THEN
    SELECT practitioner_id INTO actual_practitioner_id
    FROM patient_assignments
    WHERE patient_id = NEW.user_id
      AND status = 'active'
    LIMIT 1;
  END IF;

  -- Skip if no practitioner found
  IF actual_practitioner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get patient details
  SELECT id, email, name, email_notifications INTO patient_record
  FROM public.users
  WHERE id = NEW.user_id;

  -- Get practitioner details
  SELECT id, email, name, email_notifications INTO practitioner_record
  FROM public.users
  WHERE id = actual_practitioner_id;

  -- Determine who should receive notification based on sender_type
  IF NEW.sender_type = 'member' THEN
    -- Patient sent message -> notify practitioner (if they want notifications)
    recipient_wants_notifications := COALESCE(practitioner_record.email_notifications, true);
  ELSE
    -- Practitioner sent message -> notify patient (if they want notifications)
    recipient_wants_notifications := COALESCE(patient_record.email_notifications, true);
  END IF;

  -- Skip if recipient has disabled notifications
  IF NOT recipient_wants_notifications THEN
    RETURN NEW;
  END IF;

  -- Build webhook payload based on sender type
  webhook_payload := jsonb_build_object(
    'event', 'new_message',
    'sender_type', NEW.sender_type,
    'practitioner_email', practitioner_record.email,
    'practitioner_name', practitioner_record.name,
    'patient_email', patient_record.email,
    'patient_name', COALESCE(patient_record.name, 'A member'),
    'patient_id', NEW.user_id,
    'message_id', NEW.id,
    'timestamp', NEW.created_at
  );

  -- Send webhook
  PERFORM extensions.http_post(
    webhook_url,
    webhook_payload::text,
    'application/json'
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Webhook failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policy for users to update their own settings
CREATE POLICY IF NOT EXISTS "Users can update their own settings"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
