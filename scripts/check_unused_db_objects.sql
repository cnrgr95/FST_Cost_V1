-- =====================================================
-- Veritabanı Temizlik Kontrol Scripti
-- Kullanılmayan Tablolar ve Sütunları Tespit Eder
-- =====================================================
-- Kullanım: psql -U postgres -d database_name -f scripts/check_unused_db_objects.sql
-- ÖNEMLİ: Kullanılmayan objeleri temizlemeden ÖNCE YEDEK ALIN!
-- =====================================================

-- 1. TÜM TABLOLARI LİSTELE
SELECT 
    table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. KULLANILAN TABLOLAR (Kod tabanında tespit edilen)
-- Aşağıdaki tablolar kod tabanında kullanılıyor:
-- countries, regions, cities, sub_regions
-- users, departments, positions
-- merchants, tours, tour_sub_regions, tour_contract_routes
-- vehicle_companies, vehicle_types, vehicle_contracts, vehicle_contract_routes
-- currencies, country_currencies, exchange_rates

-- 3. KULLANILMAYAN TABLOLARI TESPİT ET
SELECT table_name AS "KULLANILMAYAN_TABLO"
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name NOT IN (
    'countries', 'regions', 'cities', 'sub_regions',
    'users', 'departments', 'positions',
    'merchants', 'tours', 'tour_sub_regions', 
    'tour_contract_routes',
    'vehicle_companies', 'vehicle_types', 'vehicle_contracts', 
    'vehicle_contract_routes', 'currencies', 'country_currencies', 
    'exchange_rates'
)
ORDER BY table_name;

-- 4. HER TABLODAKİ TÜM SÜTUNLARI LİSTELE
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 5. FOREIGN KEY İLİŞKİLERİNİ KONTROL ET (Bağımlılıklar)
SELECT 
    tc.table_name AS "TABLO", 
    kcu.column_name AS "SÜTUN",
    ccu.table_name AS "BAĞLI_TABLO",
    ccu.column_name AS "BAĞLI_SÜTUN",
    tc.constraint_name AS "CONSTRAINT_ADI"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 6. INDEX'LERİ KONTROL ET
SELECT 
    tablename AS "TABLO",
    indexname AS "INDEX_ADI",
    indexdef AS "INDEX_TANIMI"
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 7. ŞÜPHELI TABLOLAR (Muhtemelen kullanılmıyor)
-- Bu tablolar kod tabanında hiç kullanılmıyor:
-- - costs
-- - cost_items
-- - cost_types
-- - price_lists
-- - sessions (eğer custom session tablosu varsa)

SELECT table_name AS "ŞÜPHELI_TABLO"
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name IN ('costs', 'cost_items', 'cost_types', 'price_lists', 'sessions')
ORDER BY table_name;

-- 8. TABLO BOYUTLARINI KONTROL ET (Kullanılmayan tablolar genelde boştur)
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 9. BOŞ TABLOLARI BUL (Hiç kayıt yok)
SELECT 
    t.table_name,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = t.table_name) AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND NOT EXISTS (
    -- Tabloda satır var mı kontrol et (örnek sorgu, her tablo için ayrı kontrol gerekir)
    SELECT 1 FROM information_schema.tables t2
    WHERE t2.table_name = t.table_name
)
ORDER BY t.table_name;

-- NOT: Boş tablo kontrolü için her tablo adını dinamik olarak kullanmak gerekir
-- Aşağıdaki script bunu otomatik yapar:

-- 10. BOŞ TABLOLARI BUL (Junction/İlişkisel tablolar hariç)
DO $$
DECLARE
    r RECORD;
    row_count INTEGER;
    -- Junction/ilişkisel tablolar - boş olmaları normal
    junction_tables TEXT[] := ARRAY['tour_contract_routes', 'tour_sub_regions'];
BEGIN
    FOR r IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', r.table_name) INTO row_count;
        IF row_count = 0 THEN
            IF r.table_name = ANY(junction_tables) THEN
                RAISE NOTICE 'BOŞ TABLO (JUNCTION - NORMAL): % (0 satır) - Kod tabanında kullanılıyor, silinmemeli', r.table_name;
            ELSE
                RAISE NOTICE 'BOŞ TABLO (KONTROL GEREKLİ): % (0 satır)', r.table_name;
            END IF;
        END IF;
    END LOOP;
END $$;

