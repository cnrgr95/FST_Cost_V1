-- FST Cost Management Database
-- Sample Data Insert Script

-- 1. COUNTRIES
INSERT INTO countries (id, name, code, created_at) VALUES (1, 'Turkiye', 'TR', '2025-10-26 15:18:17')
ON CONFLICT (id) DO NOTHING;

-- 2. REGIONS
INSERT INTO regions (id, name, country_id, created_at) VALUES (1, 'Akdeniz', 1, '2025-10-26 15:18:29')
ON CONFLICT (id) DO NOTHING;
INSERT INTO regions (id, name, country_id, created_at) VALUES (35, 'Ege', 1, '2025-10-26 20:38:00')
ON CONFLICT (id) DO NOTHING;

-- 3. CITIES
INSERT INTO cities (id, name, region_id, created_at) VALUES (1, 'Antalya', 1, '2025-10-26 15:18:40')
ON CONFLICT (id) DO NOTHING;
INSERT INTO cities (id, name, region_id, created_at) VALUES (6, 'Bodrum', 35, '2025-10-26 20:39:27')
ON CONFLICT (id) DO NOTHING;
INSERT INTO cities (id, name, region_id, created_at) VALUES (7, 'Marmaris', 35, '2025-10-26 20:39:37')
ON CONFLICT (id) DO NOTHING;

-- 4. SUB_REGIONS
INSERT INTO sub_regions (id, name, city_id, created_at) VALUES (1, 'Belek', 1, '2025-10-26 16:01:56')
ON CONFLICT (id) DO NOTHING;
INSERT INTO sub_regions (id, name, city_id, created_at) VALUES (2, 'Side', 1, '2025-10-26 17:21:04')
ON CONFLICT (id) DO NOTHING;
INSERT INTO sub_regions (id, name, city_id, created_at) VALUES (3, 'Alanya', 1, '2025-10-26 20:38:30')
ON CONFLICT (id) DO NOTHING;
INSERT INTO sub_regions (id, name, city_id, created_at) VALUES (4, 'Kemer', 1, '2025-10-26 20:38:37')
ON CONFLICT (id) DO NOTHING;
INSERT INTO sub_regions (id, name, city_id, created_at) VALUES (5, 'Antalya', 1, '2025-10-26 20:38:48')
ON CONFLICT (id) DO NOTHING;
INSERT INTO sub_regions (id, name, city_id, created_at) VALUES (6, 'Finike', 1, '2025-10-26 20:38:54')
ON CONFLICT (id) DO NOTHING;
INSERT INTO sub_regions (id, name, city_id, created_at) VALUES (7, 'Demre', 1, '2025-10-26 20:39:01')
ON CONFLICT (id) DO NOTHING;

-- 5. DEPARTMENTS
INSERT INTO departments (id, name, city_id, created_at) VALUES (2, 'Operasyon', 1, '2025-10-26 17:16:20')
ON CONFLICT (id) DO NOTHING;

-- 6. POSITIONS
INSERT INTO positions (id, name, department_id, created_at) VALUES (2, 'Tour Operasyon S1', 2, '2025-10-26 17:16:43')
ON CONFLICT (id) DO NOTHING;
INSERT INTO positions (id, name, department_id, created_at) VALUES (3, 'Tour Operasyon S2', 2, '2025-10-26 22:16:51')
ON CONFLICT (id) DO NOTHING;
INSERT INTO positions (id, name, department_id, created_at) VALUES (4, 'Tour Operasyon S3', 2, '2025-10-26 22:16:58')
ON CONFLICT (id) DO NOTHING;
INSERT INTO positions (id, name, department_id, created_at) VALUES (5, 'Tour Operasyon S4', 2, '2025-10-26 22:17:04')
ON CONFLICT (id) DO NOTHING;
INSERT INTO positions (id, name, department_id, created_at) VALUES (6, 'Tour Operasyon S5', 2, '2025-10-26 22:17:18')
ON CONFLICT (id) DO NOTHING;

-- 7. MERCHANTS
INSERT INTO merchants (id, name, official_title, sub_region_id, authorized_person, authorized_email, authorized_phone, operasyon_name, operasyon_email, operasyon_phone, location_url, created_at, updated_at) 
VALUES (1, 'Land Of Legends Theme Park', 'Land Of Legends', 1, 'Test Test', 'test@test.com', '5555555555555', 'Test Test', 'test@test.com', '5555555555', 'https://www.google.com/maps?q=36.8818763,30.7823927', '2025-10-26 16:23:56', '2025-10-26 22:58:50')
ON CONFLICT (id) DO NOTHING;

INSERT INTO merchants (id, name, official_title, sub_region_id, authorized_person, authorized_email, authorized_phone, operasyon_name, operasyon_email, operasyon_phone, location_url, created_at, updated_at) 
VALUES (3, 'Tazı Kanyon Sun Global', 'Daban Ogları', 2, 'Test Test', 'test@test.com', '5555555555555', 'Test Test', 'test@test.com', '5555555555', 'https://maps.app.goo.gl/6g7XepwXLEQsdw4s9', '2025-10-26 22:35:32', '2025-10-26 22:59:26')
ON CONFLICT (id) DO NOTHING;

-- 8. COSTS
INSERT INTO costs (id, cost_code, cost_name, created_at) VALUES (18, 'FST-00001', 'Yemek', '2025-10-26 22:26:31')
ON CONFLICT (id) DO NOTHING;

-- 9. TOURS
INSERT INTO tours (id, name, sub_region_id, merchant_id, sejour_tour_code, created_at) 
VALUES (3, 'Land Of Legends Theme Park', 1, 1, 'LOLPAR', '2025-10-26 22:33:54')
ON CONFLICT (id) DO NOTHING;

-- 10. USERS
INSERT INTO users (id, username, email, full_name, language, created_at, updated_at) 
VALUES (1, 'admin', 'admin@company.com', 'System Administrator', 'en', '2025-10-25 16:57:40', '2025-10-25 16:57:40')
ON CONFLICT (id) DO NOTHING;

-- SEQUENCE DEĞERLERİNİ GÜNCELLE
SELECT setval('countries_id_seq', 36, true);
SELECT setval('regions_id_seq', 35, true);
SELECT setval('cities_id_seq', 7, true);
SELECT setval('sub_regions_id_seq', 7, true);
SELECT setval('departments_id_seq', 2, true);
SELECT setval('positions_id_seq', 6, true);
SELECT setval('merchants_id_seq', 3, true);
SELECT setval('costs_id_seq', 18, true);
SELECT setval('tours_id_seq', 3, true);
SELECT setval('users_id_seq', 1, true);

