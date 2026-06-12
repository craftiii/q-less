-- 1. providers
CREATE TABLE providers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  address       TEXT,
  qr_token      TEXT UNIQUE NOT NULL,
  plan_type     TEXT CHECK (plan_type IN ('free', 'basic', 'premium')) DEFAULT 'free',
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. services
CREATE TABLE services (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  duration_min  INTEGER NOT NULL,
  buffer_min    INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 3. queue_entries
CREATE TABLE queue_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  service_id      UUID NOT NULL REFERENCES services(id),
  customer_token  TEXT NOT NULL,
  position        INTEGER NOT NULL,
  status          TEXT CHECK (status IN ('waiting', 'in_service', 'done', 'cancelled')) DEFAULT 'waiting',
  checked_in_at   TIMESTAMPTZ DEFAULT now(),
  called_at       TIMESTAMPTZ,
  geo_lat         FLOAT,
  geo_lng         FLOAT,
  geo_updated_at  TIMESTAMPTZ,
  alert_sent      BOOLEAN DEFAULT false
);

-- 4. catalog_templates (premium)
CREATE TABLE catalog_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category      TEXT NOT NULL,
  name          TEXT NOT NULL,
  duration_min  INTEGER NOT NULL
);

-- 5. DB Function: advance_queue
CREATE OR REPLACE FUNCTION advance_queue(p_provider_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE queue_entries
  SET status = 'done', called_at = now()
  WHERE provider_id = p_provider_id
    AND status = 'in_service';

  UPDATE queue_entries
  SET status = 'in_service', called_at = now()
  WHERE id = (
    SELECT id FROM queue_entries
    WHERE provider_id = p_provider_id
      AND status = 'waiting'
    ORDER BY position ASC
    LIMIT 1
  );

  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY position ASC) AS new_pos
    FROM queue_entries
    WHERE provider_id = p_provider_id
      AND status = 'waiting'
  )
  UPDATE queue_entries q
  SET position = r.new_pos
  FROM ranked r
  WHERE q.id = r.id;
END;
$$ LANGUAGE plpgsql;

-- 6. RLS
ALTER TABLE queue_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE services         ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_templates ENABLE ROW LEVEL SECURITY;

-- providers
CREATE POLICY "Provider reads own profile"
  ON providers FOR SELECT USING (id = auth.uid());
CREATE POLICY "Provider inserts own profile"
  ON providers FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "Provider updates own profile"
  ON providers FOR UPDATE USING (id = auth.uid());

-- services
CREATE POLICY "Provider manages own services"
  ON services FOR ALL USING (provider_id = auth.uid());
CREATE POLICY "Anyone reads active services"
  ON services FOR SELECT USING (is_active = true);

-- catalog_templates
CREATE POLICY "Anyone can read templates"
  ON catalog_templates FOR SELECT USING (true);

-- queue_entries
CREATE POLICY "Provider manages own queue"
  ON queue_entries FOR ALL USING (provider_id = auth.uid());
CREATE POLICY "Customer inserts own entry"
  ON queue_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Customer sees own entry"
  ON queue_entries FOR SELECT
  USING (customer_token = current_setting('app.customer_token', true));
CREATE POLICY "Customer updates own geo"
  ON queue_entries FOR UPDATE
  USING (customer_token = current_setting('app.customer_token', true))
  WITH CHECK (customer_token = current_setting('app.customer_token', true));

-- 7. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE queue_entries;
