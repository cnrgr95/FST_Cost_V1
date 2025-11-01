-- UTF-8 Encoding Fix Script
-- Run this script if you're experiencing Turkish character encoding issues
-- 
-- Usage:
-- psql -U postgres -d fst_cost_db -f database/fix_encoding.sql

-- Set client encoding to UTF8
SET client_encoding = 'UTF8';

-- Verify current encoding
SELECT 
    datname as database_name,
    pg_encoding_to_char(encoding) as database_encoding
FROM pg_database 
WHERE datname = current_database();

-- Show current client encoding
SHOW client_encoding;

-- Verify server encoding settings
SHOW lc_collate;
SHOW lc_ctype;

-- If you need to convert existing data, use this pattern:
-- UPDATE table_name SET column_name = convert(convert_from(column_name::bytea, 'LATIN1'), 'UTF8');
-- 
-- Note: This only works if the data was stored in LATIN1 but should be UTF8.
-- If the database encoding is wrong, you'll need to recreate the database.

