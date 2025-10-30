-- Cleanup script: Drop structurally-unlinked columns (not in PK, not in any FK)
-- Target DB: fst_cost_db (PostgreSQL)
-- How it works:
--  1) Lists candidate columns
--  2) Optionally executes ALTER TABLE ... DROP COLUMN for each candidate
-- SAFETY:
--  - Excludes columns by name that are typically business-critical (name, code, created_at, updated_at, status, email, phone, symbol, location_url, authorized_* , contact_* , operasyon_* , unit_name, rate, rate_date, end_date, source, is_active)
--  - Review the candidate list before enabling execution

-- =============================
-- 1) Candidate list (read-only)
-- =============================
WITH pk_cols AS (
  SELECT tc.table_name, kcu.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
  WHERE tc.table_schema='public' AND tc.constraint_type='PRIMARY KEY'
),
fk_cols AS (
  SELECT kcu.table_name AS table_name, kcu.column_name AS column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
  WHERE tc.table_schema='public' AND tc.constraint_type='FOREIGN KEY'
  UNION
  SELECT ccu.table_name, ccu.column_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
   AND ccu.table_schema   = tc.table_schema
  WHERE tc.table_schema='public' AND tc.constraint_type='FOREIGN KEY'
)
SELECT c.table_name, c.column_name, c.data_type, c.is_nullable
FROM information_schema.columns c
LEFT JOIN pk_cols p  ON p.table_name=c.table_name  AND p.column_name=c.column_name
LEFT JOIN fk_cols fk ON fk.table_name=c.table_name AND fk.column_name=c.column_name
WHERE c.table_schema='public'
  AND p.column_name IS NULL
  AND fk.column_name IS NULL
  AND c.column_name NOT IN (
    'name','code','created_at','updated_at','status','email','phone','symbol','location_url',
    'authorized_person','authorized_email','authorized_phone','contact_person','contact_email','contact_phone',
    'operasyon_name','operasyon_email','operasyon_phone','unit_name','rate','rate_date','end_date','source','is_active'
  )
ORDER BY c.table_name, c.ordinal_position;

-- ======================================
-- 2) Execute drops (set toggle to enable)
-- ======================================
DO $$
DECLARE
  exec_drops boolean := false; -- CHANGE TO true AFTER REVIEW
  r record;
BEGIN
  FOR r IN (
    WITH pk_cols AS (
      SELECT tc.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema='public' AND tc.constraint_type='PRIMARY KEY'
    ),
    fk_cols AS (
      SELECT kcu.table_name AS table_name, kcu.column_name AS column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema='public' AND tc.constraint_type='FOREIGN KEY'
      UNION
      SELECT ccu.table_name, ccu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema   = tc.table_schema
      WHERE tc.table_schema='public' AND tc.constraint_type='FOREIGN KEY'
    )
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    LEFT JOIN pk_cols p  ON p.table_name=c.table_name  AND p.column_name=c.column_name
    LEFT JOIN fk_cols fk ON fk.table_name=c.table_name AND fk.column_name=c.column_name
    WHERE c.table_schema='public'
      AND p.column_name IS NULL
      AND fk.column_name IS NULL
      AND c.column_name NOT IN (
        'name','code','created_at','updated_at','status','email','phone','symbol','location_url',
        'authorized_person','authorized_email','authorized_phone','contact_person','contact_email','contact_phone',
        'operasyon_name','operasyon_email','operasyon_phone','unit_name','rate','rate_date','end_date','source','is_active'
      )
    ORDER BY c.table_name, c.ordinal_position
  ) LOOP
    RAISE NOTICE 'Candidate to drop: %.% ', r.table_name, r.column_name;
    IF exec_drops THEN
      EXECUTE format('ALTER TABLE %I DROP COLUMN %I', r.table_name, r.column_name);
    END IF;
  END LOOP;
END $$;


