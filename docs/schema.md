# Q-Less — Database Schema (Supabase / PostgreSQL)

## Technology Decision
Supabase over Firebase because:
- PostgreSQL gives us typed relations and Row-Level Security (RLS) out of the box
- Supabase Realtime runs directly on DB changes — no separate pub/sub needed
- SQL migrations are versionable (supabase/migrations/)

---

## Tables

### providers
```sql
CREATE TABLE providers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  address       TEXT,
  qr_token      TEXT UNIQUE NOT NULL,   -- immutable, used for QR code URL
  plan_type     TEXT CHECK (plan_type IN ('free', 'basic', 'premium')) DEFAULT 'free',
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### services
Belongs to a provider. Defines the service catalog.
```sql
CREATE TABLE services (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,           -- e.g. "Short Haircut"
  duration_min  INTEGER NOT NULL,        -- e.g. 20
  buffer_min    INTEGER DEFAULT 0,       -- break after service
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### queue_entries
Core table. One row per customer currently in queue.
```sql
CREATE TABLE queue_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  service_id      UUID NOT NULL REFERENCES services(id),
  customer_token  TEXT NOT NULL,         -- anonymous, stored in localStorage + URL
  position        INTEGER NOT NULL,      -- NEVER write from client, only via DB Function
  status          TEXT CHECK (status IN ('waiting', 'in_service', 'done', 'cancelled')) DEFAULT 'waiting',
  checked_in_at   TIMESTAMPTZ DEFAULT now(),
  called_at       TIMESTAMPTZ,           -- nullable, set when provider hits "Next"
  geo_lat         FLOAT,                 -- nullable, last known GPS position
  geo_lng         FLOAT,                 -- nullable
  geo_updated_at  TIMESTAMPTZ,           -- nullable, used for staleness check
  alert_sent      BOOLEAN DEFAULT false
);
```

### catalog_templates
Premium feature. Q-Less-managed templates per industry.
```sql
CREATE TABLE catalog_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category      TEXT NOT NULL,           -- e.g. "Barbershop", "Auto Repair"
  name          TEXT NOT NULL,           -- e.g. "Standard Haircut"
  duration_min  INTEGER NOT NULL
);
```

---

## DB Functions (Server-Side Only)

### advance_queue
Called when provider clicks "Done / Next Customer".
Recalculates positions with a lock to prevent race conditions.
Never call position updates from the client.

```sql
CREATE OR REPLACE FUNCTION advance_queue(p_provider_id UUID)
RETURNS void AS $$
BEGIN
  -- Mark current in_service entry as done
  UPDATE queue_entries
  SET status = 'done', called_at = now()
  WHERE provider_id = p_provider_id
    AND status = 'in_service';

  -- Pull next waiting customer into service
  UPDATE queue_entries
  SET status = 'in_service', called_at = now()
  WHERE id = (
    SELECT id FROM queue_entries
    WHERE provider_id = p_provider_id
      AND status = 'waiting'
    ORDER BY position ASC
    LIMIT 1
  );

  -- Reindex positions for remaining waiting entries
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
```

---

## Row-Level Security (RLS) Policies

Enable RLS on all tables. Key rules:

```sql
-- Providers can only see and edit their own data
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider sees own queue"
  ON queue_entries FOR SELECT
  USING (provider_id = auth.uid());

-- Customers can only read/update their own entry via token
CREATE POLICY "Customer sees own entry"
  ON queue_entries FOR SELECT
  USING (customer_token = current_setting('app.customer_token', true));

CREATE POLICY "Customer updates own geo"
  ON queue_entries FOR UPDATE
  USING (customer_token = current_setting('app.customer_token', true))
  WITH CHECK (customer_token = current_setting('app.customer_token', true));
```

---

## Realtime Subscriptions

Enable Realtime on queue_entries for live queue updates.
In Supabase dashboard: Table Editor → queue_entries → Enable Realtime.

Or via SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE queue_entries;
```

Frontend subscribes in useQueue.js:

channel: queue_entries
filter:  provider_id=eq.{providerId}
events:  INSERT, UPDATE

---

## Wait Time Calculation Logic
(implemented in src/utils/timeCalculator.js)

total_wait = SUM of (duration_min + buffer_min) for all entries
             WHERE status = 'waiting' AND position < customer_position
           + duration_min of currently in_service entry * estimated_remaining_fraction

GPS path (precise):    notify when travel_time_min >= total_wait - ALERT_THRESHOLD_MIN
Fallback path (no GPS): notify purely time-based at total_wait - ALERT_THRESHOLD_MIN

---

## Migration File
Location: supabase/migrations/001_initial_schema.sql
Contains all CREATE TABLE, DB Functions, and RLS policies above in order:
1. CREATE TABLE providers
2. CREATE TABLE services
3. CREATE TABLE queue_entries
4. CREATE TABLE catalog_templates
5. CREATE FUNCTION advance_queue
6. RLS policies
7. ALTER PUBLICATION (Realtime)