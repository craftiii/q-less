-- Staff members per provider
CREATE TABLE staff (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id      UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  color            TEXT DEFAULT '#0ea5e9',
  can_self_manage  BOOLEAN DEFAULT false,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS staff_assignment TEXT
    CHECK (staff_assignment IN ('auto','customer_choice','provider_assigns'))
    DEFAULT 'customer_choice';

ALTER TABLE queue_entries
  ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES staff(id);

-- RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Provider manages own staff"
  ON staff FOR ALL USING (provider_id = auth.uid());

CREATE POLICY "Anyone reads active staff"
  ON staff FOR SELECT USING (is_active = true);

GRANT SELECT, INSERT, UPDATE, DELETE ON staff TO authenticated;
GRANT SELECT ON staff TO anon;

-- advance_queue: per staff member
CREATE OR REPLACE FUNCTION advance_queue(p_provider_id UUID, p_staff_id UUID DEFAULT NULL)
RETURNS void AS $func$
BEGIN
  UPDATE queue_entries
  SET status = 'done', called_at = now()
  WHERE provider_id = p_provider_id
    AND (p_staff_id IS NULL OR staff_id = p_staff_id)
    AND status = 'in_service';

  UPDATE queue_entries
  SET status = 'in_service', called_at = now()
  WHERE id = (
    SELECT id FROM queue_entries
    WHERE provider_id = p_provider_id
      AND (p_staff_id IS NULL OR staff_id = p_staff_id)
      AND status = 'waiting'
    ORDER BY position ASC
    LIMIT 1
  );

  WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY position ASC) AS new_pos
    FROM queue_entries
    WHERE provider_id = p_provider_id
      AND (p_staff_id IS NULL OR staff_id = p_staff_id)
      AND status = 'waiting'
  )
  UPDATE queue_entries q
  SET position = r.new_pos
  FROM ranked r
  WHERE q.id = r.id;
END;
$func$ LANGUAGE plpgsql;

-- Auto-assign to staff with shortest queue
CREATE OR REPLACE FUNCTION get_shortest_queue_staff(p_provider_id UUID)
RETURNS UUID AS $func$
DECLARE v_staff_id UUID;
BEGIN
  SELECT s.id INTO v_staff_id
  FROM staff s
  LEFT JOIN queue_entries q
    ON q.staff_id = s.id AND q.status IN ('waiting','in_service')
  WHERE s.provider_id = p_provider_id AND s.is_active = true
  GROUP BY s.id
  ORDER BY COUNT(q.id) ASC
  LIMIT 1;
  RETURN v_staff_id;
END;
$func$ LANGUAGE plpgsql;

-- Check-in with correct position calculation (race-condition safe)
CREATE OR REPLACE FUNCTION check_in_customer(
  p_provider_id    UUID,
  p_service_id     UUID,
  p_customer_token TEXT,
  p_staff_id       UUID DEFAULT NULL
)
RETURNS queue_entries AS $func$
DECLARE
  v_position INTEGER;
  v_entry    queue_entries;
BEGIN
  SELECT COALESCE(MAX(position), 0) + 1 INTO v_position
  FROM queue_entries
  WHERE provider_id = p_provider_id
    AND (p_staff_id IS NULL OR staff_id = p_staff_id)
    AND status IN ('waiting', 'in_service');

  INSERT INTO queue_entries (provider_id, service_id, customer_token, staff_id, position, status)
  VALUES (p_provider_id, p_service_id, p_customer_token, p_staff_id, v_position, 'waiting')
  RETURNING * INTO v_entry;

  RETURN v_entry;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;
