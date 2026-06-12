-- FCM token for push notifications
ALTER TABLE queue_entries ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- RPC so anon can store their own FCM token (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION set_fcm_token(p_customer_token TEXT, p_fcm_token TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE queue_entries
  SET fcm_token = p_fcm_token
  WHERE customer_token = p_customer_token
    AND status IN ('waiting', 'in_service');
END;
$$;
