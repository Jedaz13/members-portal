-- Migration: Add practitioner email notifications via Make.com webhook
-- When a patient (member) sends a message, notify the practitioner via webhook
-- Security: Does NOT include message content - only metadata

-- Step 1: Enable HTTP extension for making webhook calls
create extension if not exists http with schema extensions;

-- Step 2: Create webhook notification function
create or replace function notify_practitioner_new_message()
returns trigger as $$
declare
  patient_name text;
  practitioner_record record;
  webhook_url text := 'YOUR_MAKE_WEBHOOK_URL_HERE';
  webhook_payload jsonb;
begin
  -- Only notify when a MEMBER sends a message (not practitioner replies)
  if NEW.sender_type != 'member' then
    return NEW;
  end if;

  -- Only proceed if there's a practitioner assigned
  if NEW.practitioner_id is null then
    return NEW;
  end if;

  -- Get patient name from users table
  select name into patient_name
  from public.users
  where id = NEW.user_id;

  -- Get practitioner details
  select id, email, name into practitioner_record
  from public.users
  where id = NEW.practitioner_id;

  -- Skip if practitioner not found
  if practitioner_record.email is null then
    return NEW;
  end if;

  -- Build webhook payload (NO message content for security!)
  webhook_payload := jsonb_build_object(
    'event', 'new_patient_message',
    'practitioner_email', practitioner_record.email,
    'practitioner_name', practitioner_record.name,
    'patient_name', coalesce(patient_name, 'A member'),
    'patient_id', NEW.user_id,
    'message_id', NEW.id,
    'timestamp', NEW.created_at
  );

  -- Send webhook to Make.com
  perform extensions.http_post(
    webhook_url,
    webhook_payload::text,
    'application/json'
  );

  return NEW;
exception
  when others then
    -- Log error but don't block message insertion
    raise warning 'Failed to send practitioner notification webhook: %', SQLERRM;
    return NEW;
end;
$$ language plpgsql security definer;

-- Step 3: Create trigger on messages table
-- Drop existing trigger if any
drop trigger if exists on_new_patient_message on public.messages;

-- Create new trigger (fires AFTER insert to not block message creation)
create trigger on_new_patient_message
  after insert on public.messages
  for each row
  execute function notify_practitioner_new_message();

-- Add comment documenting the webhook payload format
comment on function notify_practitioner_new_message() is
'Sends webhook notification to Make.com when a patient sends a message to their practitioner.

Webhook Payload Format:
{
  "event": "new_patient_message",
  "practitioner_email": "practitioner@example.com",
  "practitioner_name": "Dr. Smith",
  "patient_name": "John",
  "patient_id": "uuid",
  "message_id": "uuid",
  "timestamp": "2026-01-09T15:30:00+00:00"
}

IMPORTANT: Message content is NOT included for security/privacy reasons.

To update webhook URL after creating Make.com scenario:
ALTER FUNCTION notify_practitioner_new_message()
  SET webhook_url = ''https://hook.eu1.make.com/xxxxxxxxxxxxx'';

Or recreate the function with the actual URL.';
