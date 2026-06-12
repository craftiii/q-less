-- Staff profile + auth fields
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS invite_status TEXT CHECK (invite_status IN ('pending','accepted')) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS is_suspended  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar_url   TEXT,
  ADD COLUMN IF NOT EXISTS bio          TEXT,
  ADD COLUMN IF NOT EXISTS specialties  TEXT[] DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS staff_user_id_idx ON staff(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS staff_email_idx   ON staff(email)   WHERE email   IS NOT NULL;

-- Ratings
CREATE TABLE IF NOT EXISTS ratings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_entry_id UUID REFERENCES queue_entries(id) ON DELETE CASCADE,
  staff_id       UUID REFERENCES staff(id) ON DELETE CASCADE,
  provider_id    UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  score          INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment        TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Provider sees all ratings for their staff
CREATE POLICY "Provider sees own ratings"
  ON ratings FOR SELECT
  USING (provider_id = auth.uid());

-- Staff sees own ratings via user_id lookup
CREATE POLICY "Staff sees own ratings"
  ON ratings FOR SELECT
  USING (
    staff_id IN (SELECT id FROM staff WHERE user_id = auth.uid())
  );

-- Anon can insert a rating (after service)
CREATE POLICY "Customer submits rating"
  ON ratings FOR INSERT
  WITH CHECK (true);

GRANT SELECT, INSERT ON ratings TO anon, authenticated;

-- Show ratings toggle on providers
ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS show_ratings BOOLEAN DEFAULT false;

-- RLS: staff member can read/update own row
CREATE POLICY "Staff reads own profile"
  ON staff FOR SELECT
  USING (user_id = auth.uid() OR provider_id = auth.uid());

CREATE POLICY "Staff updates own profile"
  ON staff FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RPC: link user_id to staff record on first login
CREATE OR REPLACE FUNCTION link_staff_account(p_staff_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE staff
  SET user_id = auth.uid(), invite_status = 'accepted'
  WHERE id = p_staff_id
    AND user_id IS NULL;
END;
$$;

-- RPC: get staff profile for logged-in user
CREATE OR REPLACE FUNCTION get_my_staff_profile()
RETURNS staff
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_staff staff;
BEGIN
  SELECT * INTO v_staff FROM staff WHERE user_id = auth.uid() LIMIT 1;
  RETURN v_staff;
END;
$$;
