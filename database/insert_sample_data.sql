-- Sample Data for FST Cost Management Database
-- This script inserts sample countries, regions, cities, sub_regions, departments, positions, merchants, and users

-- ============================================
-- SAMPLE COUNTRIES
-- ============================================
INSERT INTO countries (name, code) VALUES 
('Turkey', 'TR'),
('Germany', 'DE'),
('France', 'FR'),
('United Kingdom', 'GB')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- SAMPLE REGIONS
-- ============================================
INSERT INTO regions (name, country_id) VALUES 
-- Turkey Regions
('Marmara', (SELECT id FROM countries WHERE name = 'Turkey')),
('Aegean', (SELECT id FROM countries WHERE name = 'Turkey')),
('Mediterranean', (SELECT id FROM countries WHERE name = 'Turkey')),
('Central Anatolia', (SELECT id FROM countries WHERE name = 'Turkey')),
-- Germany Regions
('Bavaria', (SELECT id FROM countries WHERE name = 'Germany')),
('Berlin', (SELECT id FROM countries WHERE name = 'Germany')),
-- France Regions
('Île-de-France', (SELECT id FROM countries WHERE name = 'France')),
('Provence-Alpes-Côte d''Azur', (SELECT id FROM countries WHERE name = 'France'))
ON CONFLICT (name, country_id) DO NOTHING;

-- ============================================
-- SAMPLE CITIES
-- ============================================
INSERT INTO cities (name, region_id) VALUES 
-- Turkey Cities
('Istanbul', (SELECT id FROM regions WHERE name = 'Marmara' AND country_id = (SELECT id FROM countries WHERE name = 'Turkey'))),
('Bursa', (SELECT id FROM regions WHERE name = 'Marmara' AND country_id = (SELECT id FROM countries WHERE name = 'Turkey'))),
('Izmir', (SELECT id FROM regions WHERE name = 'Aegean' AND country_id = (SELECT id FROM countries WHERE name = 'Turkey'))),
('Ankara', (SELECT id FROM regions WHERE name = 'Central Anatolia' AND country_id = (SELECT id FROM countries WHERE name = 'Turkey'))),
('Antalya', (SELECT id FROM regions WHERE name = 'Mediterranean' AND country_id = (SELECT id FROM countries WHERE name = 'Turkey'))),
-- Germany Cities
('Munich', (SELECT id FROM regions WHERE name = 'Bavaria' AND country_id = (SELECT id FROM countries WHERE name = 'Germany'))),
('Berlin', (SELECT id FROM regions WHERE name = 'Berlin' AND country_id = (SELECT id FROM countries WHERE name = 'Germany'))),
-- France Cities
('Paris', (SELECT id FROM regions WHERE name = 'Île-de-France' AND country_id = (SELECT id FROM countries WHERE name = 'France'))),
('Marseille', (SELECT id FROM regions WHERE name = 'Provence-Alpes-Côte d''Azur' AND country_id = (SELECT id FROM countries WHERE name = 'France')))
ON CONFLICT (name, region_id) DO NOTHING;

-- ============================================
-- SAMPLE DEPARTMENTS
-- ============================================
INSERT INTO departments (name, city_id) VALUES 
-- Istanbul Departments
('IT Department', (SELECT id FROM cities WHERE name = 'Istanbul')),
('Human Resources', (SELECT id FROM cities WHERE name = 'Istanbul')),
('Finance Department', (SELECT id FROM cities WHERE name = 'Istanbul')),
('Operations', (SELECT id FROM cities WHERE name = 'Istanbul')),
('Sales & Marketing', (SELECT id FROM cities WHERE name = 'Istanbul')),
-- Ankara Departments
('IT Department', (SELECT id FROM cities WHERE name = 'Ankara')),
('Human Resources', (SELECT id FROM cities WHERE name = 'Ankara')),
('Finance Department', (SELECT id FROM cities WHERE name = 'Ankara')),
-- Munich Departments
('IT Department', (SELECT id FROM cities WHERE name = 'Munich')),
('Operations', (SELECT id FROM cities WHERE name = 'Munich')),
-- Paris Departments
('Sales & Marketing', (SELECT id FROM cities WHERE name = 'Paris')),
('Finance Department', (SELECT id FROM cities WHERE name = 'Paris'))
ON CONFLICT (name, city_id) DO NOTHING;

-- ============================================
-- SAMPLE SUB REGIONS
-- ============================================
INSERT INTO sub_regions (name, city_id) VALUES 
-- Istanbul Sub Regions
('Sultanahmet', (SELECT id FROM cities WHERE name = 'Istanbul')),
('Taksim', (SELECT id FROM cities WHERE name = 'Istanbul')),
('Kadıköy', (SELECT id FROM cities WHERE name = 'Istanbul')),
('Beşiktaş', (SELECT id FROM cities WHERE name = 'Istanbul')),
('Şişli', (SELECT id FROM cities WHERE name = 'Istanbul')),
-- Ankara Sub Regions
('Çankaya', (SELECT id FROM cities WHERE name = 'Ankara')),
('Kızılay', (SELECT id FROM cities WHERE name = 'Ankara')),
('Ulus', (SELECT id FROM cities WHERE name = 'Ankara')),
('Bahçelievler', (SELECT id FROM cities WHERE name = 'Ankara')),
-- Antalya Sub Regions
('Kaleiçi', (SELECT id FROM cities WHERE name = 'Antalya')),
('Lara', (SELECT id FROM cities WHERE name = 'Antalya')),
('Konyaaltı', (SELECT id FROM cities WHERE name = 'Antalya')),
-- Izmir Sub Regions
('Alsancak', (SELECT id FROM cities WHERE name = 'Izmir')),
('Konak', (SELECT id FROM cities WHERE name = 'Izmir')),
('Bornova', (SELECT id FROM cities WHERE name = 'Izmir')),
-- Munich Sub Regions
('Marienplatz', (SELECT id FROM cities WHERE name = 'Munich')),
('Schwabing', (SELECT id FROM cities WHERE name = 'Munich')),
('Maxvorstadt', (SELECT id FROM cities WHERE name = 'Munich')),
-- Berlin Sub Regions
('Mitte', (SELECT id FROM cities WHERE name = 'Berlin')),
('Prenzlauer Berg', (SELECT id FROM cities WHERE name = 'Berlin')),
('Kreuzberg', (SELECT id FROM cities WHERE name = 'Berlin')),
-- Paris Sub Regions
('Le Marais', (SELECT id FROM cities WHERE name = 'Paris')),
('Montmartre', (SELECT id FROM cities WHERE name = 'Paris')),
('Champs-Élysées', (SELECT id FROM cities WHERE name = 'Paris')),
('Latin Quarter', (SELECT id FROM cities WHERE name = 'Paris')),
-- Marseille Sub Regions
('Vieux-Port', (SELECT id FROM cities WHERE name = 'Marseille')),
('Le Panier', (SELECT id FROM cities WHERE name = 'Marseille'))
ON CONFLICT (name, city_id) DO NOTHING;

-- ============================================
-- SAMPLE MERCHANTS
-- ============================================
INSERT INTO merchants (name, official_title, sub_region_id, authorized_person, authorized_email, authorized_phone, operasyon_name, operasyon_email, operasyon_phone, location_url) VALUES 
-- Istanbul Sultanahmet Merchants
('Grand Bazaar Restaurant', 
 'Grand Bazaar Restaurant Ltd.', 
 (SELECT id FROM sub_regions WHERE name = 'Sultanahmet' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul')),
 'Mehmet Özkan', 
 'mehmet.ozkan@grandbazaar.com', 
 '+90 212 555 1001', 
 'Ayşe Demir', 
 'ayse.demir@grandbazaar.com', 
 '+90 212 555 1002',
 'https://maps.google.com/?q=41.0076,28.9714'),
('Sultanahmet Hotel', 
 'Sultanahmet Hotels Inc.', 
 (SELECT id FROM sub_regions WHERE name = 'Sultanahmet' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul')),
 'Fatma Yılmaz', 
 'fatma.yilmaz@sultanahmet.com', 
 '+90 212 555 1011', 
 'Ali Kaya', 
 'ali.kaya@sultanahmet.com', 
 '+90 212 555 1012',
 'https://maps.google.com/?q=41.0058,28.9784'),
-- Istanbul Taksim Merchants
('Taksim Shopping Center', 
 'Taksim Mall Corporation', 
 (SELECT id FROM sub_regions WHERE name = 'Taksim' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul')),
 'Cemil Şahin', 
 'cemil.sahin@taksimmall.com', 
 '+90 212 555 2001', 
 'Zeynep Aydın', 
 'zeynep.aydin@taksimmall.com', 
 '+90 212 555 2002',
 'https://maps.google.com/?q=41.0370,28.9850'),
('Taksim Restaurant Group', 
 'Taksim Restaurant Group Ltd.', 
 (SELECT id FROM sub_regions WHERE name = 'Taksim' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul')),
 'Burak Çelik', 
 'burak.celik@taksimrest.com', 
 '+90 212 555 2011', 
 'Elif Özdemir', 
 'elif.ozdemir@taksimrest.com', 
 '+90 212 555 2012',
 'https://maps.google.com/?q=41.0375,28.9855'),
-- Istanbul Kadıköy Merchants
('Kadıköy Market', 
 'Kadıköy Market Co.', 
 (SELECT id FROM sub_regions WHERE name = 'Kadıköy' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul')),
 'Selma Arslan', 
 'selma.arslan@kadikoymarket.com', 
 '+90 216 555 3001', 
 'Hasan Yücel', 
 'hasan.yucel@kadikoymarket.com', 
 '+90 216 555 3002',
 'https://maps.google.com/?q=40.9908,29.0244'),
-- Ankara Çankaya Merchants
('Çankaya Business Center', 
 'Çankaya Business Center Ltd.', 
 (SELECT id FROM sub_regions WHERE name = 'Çankaya' AND city_id = (SELECT id FROM cities WHERE name = 'Ankara')),
 'İbrahim Karaca', 
 'ibrahim.karaca@cankaya.com', 
 '+90 312 555 4001', 
 'Serkan Öztürk', 
 'serkan.ozturk@cankaya.com', 
 '+90 312 555 4002',
 'https://maps.google.com/?q=39.9208,32.8541'),
('Ankara Kızılay Cafe', 
 'Ankara Cafes Group', 
 (SELECT id FROM sub_regions WHERE name = 'Kızılay' AND city_id = (SELECT id FROM cities WHERE name = 'Ankara')),
 'Merve Tunç', 
 'merve.tunc@ankara-cafe.com', 
 '+90 312 555 4011', 
 'Can Yıldız', 
 'can.yildiz@ankara-cafe.com', 
 '+90 312 555 4012',
 'https://maps.google.com/?q=39.9217,32.8563'),
-- Antalya Kaleiçi Merchants
('Kaleiçi Boutique Hotel', 
 'Kaleiçi Hotels & Resorts', 
 (SELECT id FROM sub_regions WHERE name = 'Kaleiçi' AND city_id = (SELECT id FROM cities WHERE name = 'Antalya')),
 'Emre Polat', 
 'emre.polat@kaleici-hotels.com', 
 '+90 242 555 5001', 
 'Deniz Aktaş', 
 'deniz.aktas@kaleici-hotels.com', 
 '+90 242 555 5002',
 'https://maps.google.com/?q=36.8847,30.7040'),
('Antalya Marina Restaurant', 
 'Antalya Marina Dining', 
 (SELECT id FROM sub_regions WHERE name = 'Kaleiçi' AND city_id = (SELECT id FROM cities WHERE name = 'Antalya')),
 'Berna Çakır', 
 'berna.cakir@antalyamarina.com', 
 '+90 242 555 5011', 
 'Murat Şen', 
 'murat.sen@antalyamarina.com', 
 '+90 242 555 5012',
 'https://maps.google.com/?q=36.8889,30.7061'),
-- Munich Marienplatz Merchants
('Marienplatz Souvenir Shop', 
 'Bavaria Souvenirs GmbH', 
 (SELECT id FROM sub_regions WHERE name = 'Marienplatz' AND city_id = (SELECT id FROM cities WHERE name = 'Munich')),
 'Hans Müller', 
 'hans.mueller@bavaria-souvenirs.de', 
 '+49 89 555 6001', 
 'Sophie Weber', 
 'sophie.weber@bavaria-souvenirs.de', 
 '+49 89 555 6002',
 'https://maps.google.com/?q=48.1374,11.5755'),
('Munich Beer Garden', 
 'Munich Beer Gardens GmbH', 
 (SELECT id FROM sub_regions WHERE name = 'Marienplatz' AND city_id = (SELECT id FROM cities WHERE name = 'Munich')),
 'Klaus Fischer', 
 'klaus.fischer@munich-beer.de', 
 '+49 89 555 6011', 
 'Anna Schmidt', 
 'anna.schmidt@munich-beer.de', 
 '+49 89 555 6012',
 'https://maps.google.com/?q=48.1351,11.5759'),
-- Berlin Mitte Merchants
('Berlin Mitte Shopping', 
 'Berlin Shopping Center GmbH', 
 (SELECT id FROM sub_regions WHERE name = 'Mitte' AND city_id = (SELECT id FROM cities WHERE name = 'Berlin')),
 'Thomas Wagner', 
 'thomas.wagner@berlin-shopping.de', 
 '+49 30 555 7001', 
 'Laura Becker', 
 'laura.becker@berlin-shopping.de', 
 '+49 30 555 7002',
 'https://maps.google.com/?q=52.5200,13.4050'),
-- Paris Le Marais Merchants
('Le Marais Bistro', 
 'Le Marais Restaurants SARL', 
 (SELECT id FROM sub_regions WHERE name = 'Le Marais' AND city_id = (SELECT id FROM cities WHERE name = 'Paris')),
 'Pierre Dubois', 
 'pierre.dubois@marais-bistro.fr', 
 '+33 1 55 6001', 
 'Marie Bernard', 
 'marie.bernard@marais-bistro.fr', 
 '+33 1 55 6002',
 'https://maps.google.com/?q=48.8566,2.3522'),
('Paris Montmartre Gallery', 
 'Montmartre Art Gallery SARL', 
 (SELECT id FROM sub_regions WHERE name = 'Montmartre' AND city_id = (SELECT id FROM cities WHERE name = 'Paris')),
 'Jean Martin', 
 'jean.martin@montmartre-gallery.fr', 
 '+33 1 55 7001', 
 'Camille Rousseau', 
 'camille.rousseau@montmartre-gallery.fr', 
 '+33 1 55 7002',
 'https://maps.google.com/?q=48.8867,2.3431'),
-- Marseille Vieux-Port Merchants
('Vieux-Port Seafood Restaurant', 
 'Marseille Seafood SARL', 
 (SELECT id FROM sub_regions WHERE name = 'Vieux-Port' AND city_id = (SELECT id FROM cities WHERE name = 'Marseille')),
 'Luc Moreau', 
 'luc.moreau@marseille-seafood.fr', 
 '+33 4 91 8001', 
 'Claire Petit', 
 'claire.petit@marseille-seafood.fr', 
 '+33 4 91 8002',
 'https://maps.google.com/?q=43.2965,5.3698')
ON CONFLICT (name, sub_region_id) DO NOTHING;

-- ============================================
-- SAMPLE POSITIONS
-- ============================================
INSERT INTO positions (name, department_id) VALUES 
-- Istanbul IT Department Positions
('Software Engineer', (SELECT id FROM departments WHERE name = 'IT Department' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul'))),
('Senior Software Engineer', (SELECT id FROM departments WHERE name = 'IT Department' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul'))),
('DevOps Engineer', (SELECT id FROM departments WHERE name = 'IT Department' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul'))),
('IT Manager', (SELECT id FROM departments WHERE name = 'IT Department' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul'))),
-- Istanbul Human Resources Positions
('HR Specialist', (SELECT id FROM departments WHERE name = 'Human Resources' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul'))),
('Recruiter', (SELECT id FROM departments WHERE name = 'Human Resources' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul'))),
('HR Manager', (SELECT id FROM departments WHERE name = 'Human Resources' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul'))),
-- Istanbul Finance Department Positions
('Accountant', (SELECT id FROM departments WHERE name = 'Finance Department' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul'))),
('Senior Accountant', (SELECT id FROM departments WHERE name = 'Finance Department' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul'))),
('Financial Analyst', (SELECT id FROM departments WHERE name = 'Finance Department' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul'))),
('Finance Manager', (SELECT id FROM departments WHERE name = 'Finance Department' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul'))),
-- Istanbul Operations Positions
('Operations Coordinator', (SELECT id FROM departments WHERE name = 'Operations' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul'))),
('Operations Manager', (SELECT id FROM departments WHERE name = 'Operations' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul'))),
-- Istanbul Sales & Marketing Positions
('Sales Representative', (SELECT id FROM departments WHERE name = 'Sales & Marketing' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul'))),
('Marketing Specialist', (SELECT id FROM departments WHERE name = 'Sales & Marketing' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul'))),
('Sales Manager', (SELECT id FROM departments WHERE name = 'Sales & Marketing' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul'))),
-- Ankara IT Department Positions
('Software Developer', (SELECT id FROM departments WHERE name = 'IT Department' AND city_id = (SELECT id FROM cities WHERE name = 'Ankara'))),
('System Administrator', (SELECT id FROM departments WHERE name = 'IT Department' AND city_id = (SELECT id FROM cities WHERE name = 'Ankara'))),
-- Ankara Human Resources Positions
('HR Assistant', (SELECT id FROM departments WHERE name = 'Human Resources' AND city_id = (SELECT id FROM cities WHERE name = 'Ankara'))),
('HR Coordinator', (SELECT id FROM departments WHERE name = 'Human Resources' AND city_id = (SELECT id FROM cities WHERE name = 'Ankara'))),
-- Ankara Finance Department Positions
('Junior Accountant', (SELECT id FROM departments WHERE name = 'Finance Department' AND city_id = (SELECT id FROM cities WHERE name = 'Ankara'))),
('Accounting Clerk', (SELECT id FROM departments WHERE name = 'Finance Department' AND city_id = (SELECT id FROM cities WHERE name = 'Ankara'))),
-- Munich IT Department Positions
('Software Engineer', (SELECT id FROM departments WHERE name = 'IT Department' AND city_id = (SELECT id FROM cities WHERE name = 'Munich'))),
('Technical Lead', (SELECT id FROM departments WHERE name = 'IT Department' AND city_id = (SELECT id FROM cities WHERE name = 'Munich'))),
-- Munich Operations Positions
('Project Coordinator', (SELECT id FROM departments WHERE name = 'Operations' AND city_id = (SELECT id FROM cities WHERE name = 'Munich'))),
('Operations Analyst', (SELECT id FROM departments WHERE name = 'Operations' AND city_id = (SELECT id FROM cities WHERE name = 'Munich'))),
-- Paris Sales & Marketing Positions
('Sales Executive', (SELECT id FROM departments WHERE name = 'Sales & Marketing' AND city_id = (SELECT id FROM cities WHERE name = 'Paris'))),
('Marketing Manager', (SELECT id FROM departments WHERE name = 'Sales & Marketing' AND city_id = (SELECT id FROM cities WHERE name = 'Paris'))),
-- Paris Finance Department Positions
('Financial Controller', (SELECT id FROM departments WHERE name = 'Finance Department' AND city_id = (SELECT id FROM cities WHERE name = 'Paris'))),
('Budget Analyst', (SELECT id FROM departments WHERE name = 'Finance Department' AND city_id = (SELECT id FROM cities WHERE name = 'Paris')))
ON CONFLICT (name, department_id) DO NOTHING;

-- ============================================
-- SAMPLE USERS (Passwordless - LDAP Authentication)
-- ============================================
-- Note: Users have no passwords stored. Authentication will be handled via LDAP.

INSERT INTO users (username, full_name, department_id, city_id, email, phone, status) VALUES 
-- User 1: Admin/IT Manager in Istanbul
('john.doe', 
 'John Doe', 
 (SELECT id FROM departments WHERE name = 'IT Department' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul')),
 (SELECT id FROM cities WHERE name = 'Istanbul'),
 'john.doe@fstcost.com',
 '+90 212 555 0101',
 'active'),

-- User 2: HR Manager in Istanbul
('jane.smith', 
 'Jane Smith', 
 (SELECT id FROM departments WHERE name = 'Human Resources' AND city_id = (SELECT id FROM cities WHERE name = 'Istanbul')),
 (SELECT id FROM cities WHERE name = 'Istanbul'),
 'jane.smith@fstcost.com',
 '+90 212 555 0102',
 'active'),

-- User 3: Finance Manager in Ankara
('ahmet.yilmaz', 
 'Ahmet Yılmaz', 
 (SELECT id FROM departments WHERE name = 'Finance Department' AND city_id = (SELECT id FROM cities WHERE name = 'Ankara')),
 (SELECT id FROM cities WHERE name = 'Ankara'),
 'ahmet.yilmaz@fstcost.com',
 '+90 312 555 0201',
 'active'),

-- User 4: Operations Manager in Munich
('anna.mueller', 
 'Anna Müller', 
 (SELECT id FROM departments WHERE name = 'Operations' AND city_id = (SELECT id FROM cities WHERE name = 'Munich')),
 (SELECT id FROM cities WHERE name = 'Munich'),
 'anna.mueller@fstcost.com',
 '+49 89 555 0301',
 'active')

ON CONFLICT (username) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Uncomment below to verify the data

/*
-- Check all users
SELECT 
    u.id,
    u.username,
    u.full_name,
    u.email,
    u.phone,
    u.status,
    d.name as department,
    c.name as city,
    r.name as region,
    co.name as country
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
LEFT JOIN cities c ON u.city_id = c.id
LEFT JOIN regions r ON c.region_id = r.id
LEFT JOIN countries co ON r.country_id = co.id
ORDER BY u.username;

-- Check sample data counts
SELECT 
    (SELECT COUNT(*) FROM countries) as countries_count,
    (SELECT COUNT(*) FROM regions) as regions_count,
    (SELECT COUNT(*) FROM cities) as cities_count,
    (SELECT COUNT(*) FROM sub_regions) as sub_regions_count,
    (SELECT COUNT(*) FROM departments) as departments_count,
    (SELECT COUNT(*) FROM positions) as positions_count,
    (SELECT COUNT(*) FROM merchants) as merchants_count,
    (SELECT COUNT(*) FROM users) as users_count;
*/

