-- Add email notification preference to user profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN NOT NULL DEFAULT true;

-- Enable pg_net for async HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ─── Vote Notifications ───────────────────────────────────────────────────────
-- When a user casts a phenotype vote on a profile, notify the profile owner.

CREATE OR REPLACE FUNCTION public.create_vote_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id     UUID;
  v_voter_nick   TEXT;
BEGIN
  -- Only fire for the main phenotype vote, not physical characteristics
  IF NEW.characteristic_type IS DISTINCT FROM 'phenotype' THEN
    RETURN NEW;
  END IF;

  -- Resolve profile owner via user_profiles
  BEGIN
    SELECT user_id INTO v_owner_id
    FROM public.user_profiles
    WHERE id = NEW.profile_id::uuid
    LIMIT 1;
  EXCEPTION WHEN invalid_text_representation THEN
    -- profile_id is not a valid UUID — skip
    RETURN NEW;
  END;

  -- Skip if owner not found or user is voting on their own profile
  IF v_owner_id IS NULL OR v_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get the voter's nickname for the notification message
  SELECT nickname INTO v_voter_nick
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Create the in-app notification (the email trigger fires from notifications INSERT)
  PERFORM public.create_notification(
    v_owner_id,
    'vote',
    COALESCE(v_voter_nick, 'Someone') || ' voted on your profile',
    NEW.profile_id,
    NULL
  );

  RETURN NEW;
END;
$$;

-- Fire only on INSERT (first vote), not on UPDATE (vote change)
DROP TRIGGER IF EXISTS trg_create_vote_notification ON public.votes;
CREATE TRIGGER trg_create_vote_notification
  AFTER INSERT ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.create_vote_notification();

-- ─── Email Sender ─────────────────────────────────────────────────────────────
-- After every notification is inserted, call the edge function asynchronously
-- via pg_net so the email is sent without blocking the main transaction.

CREATE OR REPLACE FUNCTION public.send_notification_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  PERFORM net.http_post(
    url     := 'https://jmygqrqfzglbislftczz.supabase.co/functions/v1/send-email-notification',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := jsonb_build_object(
      'notification_id', NEW.id,
      'user_id',         NEW.user_id,
      'type',            NEW.type,
      'message',         NEW.message,
      'profile_id',      COALESCE(NEW.profile_id, '')
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_send_notification_email ON public.notifications;
CREATE TRIGGER trg_send_notification_email
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_notification_email();
