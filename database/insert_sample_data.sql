-- Sample Data for FST Cost Management Database
-- This script inserts sample countries, regions, cities, sub_regions, departments, positions, and users

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
    (SELECT COUNT(*) FROM users) as users_count;
*/

