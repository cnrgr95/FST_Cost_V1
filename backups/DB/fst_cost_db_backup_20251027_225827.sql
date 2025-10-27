-- FST Cost Database Backup
-- Generated: 2025-10-27 22:58:28
-- Database: fst_cost_db

BEGIN;

-- ==================================================
-- Sequences
-- ==================================================

DROP SEQUENCE IF EXISTS "cities_id_seq" CASCADE;
CREATE SEQUENCE "cities_id_seq" START 8;

DROP SEQUENCE IF EXISTS "contract_regional_prices_id_seq" CASCADE;
CREATE SEQUENCE "contract_regional_prices_id_seq" START 43;

DROP SEQUENCE IF EXISTS "contracts_id_seq" CASCADE;
CREATE SEQUENCE "contracts_id_seq" START 3;

DROP SEQUENCE IF EXISTS "costs_id_seq" CASCADE;
CREATE SEQUENCE "costs_id_seq" START 22;

DROP SEQUENCE IF EXISTS "countries_id_seq" CASCADE;
CREATE SEQUENCE "countries_id_seq" START 37;

DROP SEQUENCE IF EXISTS "currencies_id_seq" CASCADE;
CREATE SEQUENCE "currencies_id_seq" START 5;

DROP SEQUENCE IF EXISTS "departments_id_seq" CASCADE;
CREATE SEQUENCE "departments_id_seq" START 3;

DROP SEQUENCE IF EXISTS "merchants_id_seq" CASCADE;
CREATE SEQUENCE "merchants_id_seq" START 5;

DROP SEQUENCE IF EXISTS "positions_id_seq" CASCADE;
CREATE SEQUENCE "positions_id_seq" START 7;

DROP SEQUENCE IF EXISTS "regions_id_seq" CASCADE;
CREATE SEQUENCE "regions_id_seq" START 36;

DROP SEQUENCE IF EXISTS "sub_regions_id_seq" CASCADE;
CREATE SEQUENCE "sub_regions_id_seq" START 8;

DROP SEQUENCE IF EXISTS "tour_sub_regions_id_seq" CASCADE;
CREATE SEQUENCE "tour_sub_regions_id_seq" START 15;

DROP SEQUENCE IF EXISTS "tours_id_seq" CASCADE;
CREATE SEQUENCE "tours_id_seq" START 5;

DROP SEQUENCE IF EXISTS "users_id_seq" CASCADE;
CREATE SEQUENCE "users_id_seq" START 3;

DROP SEQUENCE IF EXISTS "vehicle_companies_id_seq" CASCADE;
CREATE SEQUENCE "vehicle_companies_id_seq" START 2;

DROP SEQUENCE IF EXISTS "vehicle_contracts_id_seq" CASCADE;
CREATE SEQUENCE "vehicle_contracts_id_seq" START 5;

DROP SEQUENCE IF EXISTS "vehicle_types_id_seq" CASCADE;
CREATE SEQUENCE "vehicle_types_id_seq" START 8;


-- ==================================================
-- Table: cities
-- ==================================================

DROP TABLE IF EXISTS "cities" CASCADE;
CREATE TABLE "cities" (
    "id" integer(32) NOT NULL DEFAULT nextval('cities_id_seq'::regclass),
    "name" character varying(100) NOT NULL,
    "region_id" integer(32) NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone,
    PRIMARY KEY ("id")
);

ALTER TABLE "cities" ALTER COLUMN "id" SET DEFAULT nextval('"cities_id_seq"');

ALTER TABLE "cities" ADD CONSTRAINT cities_region_id_fkey FOREIGN KEY ("region_id") REFERENCES "regions"("id");

-- Data for table: cities (3 rows)
INSERT INTO "cities" ("id", "name", "region_id", "created_at", "updated_at") VALUES ('1', 'Antalya', '1', '2025-10-26 15:18:40.16332', NULL);
INSERT INTO "cities" ("id", "name", "region_id", "created_at", "updated_at") VALUES ('6', 'Bodrum', '35', '2025-10-26 20:39:27.619768', NULL);
INSERT INTO "cities" ("id", "name", "region_id", "created_at", "updated_at") VALUES ('7', 'Marmaris', '35', '2025-10-26 20:39:37.954238', NULL);


-- ==================================================
-- Table: contract_regional_prices
-- ==================================================

DROP TABLE IF EXISTS "contract_regional_prices" CASCADE;
CREATE TABLE "contract_regional_prices" (
    "id" integer(32) NOT NULL DEFAULT nextval('contract_regional_prices_id_seq'::regclass),
    "contract_id" integer(32) NOT NULL,
    "sub_region_id" integer(32) NOT NULL,
    "adult_price" numeric(10,2),
    "adult_currency" character varying(3) DEFAULT 'USD'::character varying,
    "child_price" numeric(10,2),
    "child_currency" character varying(3) DEFAULT 'USD'::character varying,
    "infant_price" numeric(10,2),
    "infant_currency" character varying(3) DEFAULT 'USD'::character varying,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

ALTER TABLE "contract_regional_prices" ALTER COLUMN "id" SET DEFAULT nextval('"contract_regional_prices_id_seq"');

ALTER TABLE "contract_regional_prices" ADD CONSTRAINT contract_regional_prices_contract_id_fkey FOREIGN KEY ("contract_id") REFERENCES "contracts"("id");
ALTER TABLE "contract_regional_prices" ADD CONSTRAINT contract_regional_prices_sub_region_id_fkey FOREIGN KEY ("sub_region_id") REFERENCES "sub_regions"("id");

-- Data for table: contract_regional_prices (7 rows)
INSERT INTO "contract_regional_prices" ("id", "contract_id", "sub_region_id", "adult_price", "adult_currency", "child_price", "child_currency", "infant_price", "infant_currency", "created_at", "updated_at") VALUES ('36', '2', '3', '10.00', 'EUR', '10.00', 'EUR', '10.00', 'EUR', '2025-10-27 18:24:43.517953', '2025-10-27 18:24:43.517953');
INSERT INTO "contract_regional_prices" ("id", "contract_id", "sub_region_id", "adult_price", "adult_currency", "child_price", "child_currency", "infant_price", "infant_currency", "created_at", "updated_at") VALUES ('37', '2', '5', '10.00', 'EUR', '10.00', 'EUR', '10.00', 'EUR', '2025-10-27 18:24:43.518867', '2025-10-27 18:24:43.518867');
INSERT INTO "contract_regional_prices" ("id", "contract_id", "sub_region_id", "adult_price", "adult_currency", "child_price", "child_currency", "infant_price", "infant_currency", "created_at", "updated_at") VALUES ('38', '2', '1', '10.00', 'EUR', '10.00', 'EUR', '10.00', 'EUR', '2025-10-27 18:24:43.519216', '2025-10-27 18:24:43.519216');
INSERT INTO "contract_regional_prices" ("id", "contract_id", "sub_region_id", "adult_price", "adult_currency", "child_price", "child_currency", "infant_price", "infant_currency", "created_at", "updated_at") VALUES ('39', '2', '7', '10.00', 'EUR', '10.00', 'EUR', '10.00', 'EUR', '2025-10-27 18:24:43.51955', '2025-10-27 18:24:43.51955');
INSERT INTO "contract_regional_prices" ("id", "contract_id", "sub_region_id", "adult_price", "adult_currency", "child_price", "child_currency", "infant_price", "infant_currency", "created_at", "updated_at") VALUES ('40', '2', '6', '10.00', 'EUR', '10.00', 'EUR', '10.00', 'EUR', '2025-10-27 18:24:43.519896', '2025-10-27 18:24:43.519896');
INSERT INTO "contract_regional_prices" ("id", "contract_id", "sub_region_id", "adult_price", "adult_currency", "child_price", "child_currency", "infant_price", "infant_currency", "created_at", "updated_at") VALUES ('41', '2', '4', '10.00', 'EUR', '10.00', 'EUR', '10.00', 'EUR', '2025-10-27 18:24:43.520407', '2025-10-27 18:24:43.520407');
INSERT INTO "contract_regional_prices" ("id", "contract_id", "sub_region_id", "adult_price", "adult_currency", "child_price", "child_currency", "infant_price", "infant_currency", "created_at", "updated_at") VALUES ('42', '2', '2', '10.00', 'EUR', '10.00', 'EUR', '10.00', 'EUR', '2025-10-27 18:24:43.520819', '2025-10-27 18:24:43.520819');


-- ==================================================
-- Table: contracts
-- ==================================================

DROP TABLE IF EXISTS "contracts" CASCADE;
CREATE TABLE "contracts" (
    "id" integer(32) NOT NULL DEFAULT nextval('contracts_id_seq'::regclass),
    "sub_region_id" integer(32) NOT NULL,
    "merchant_id" integer(32) NOT NULL,
    "tour_id" integer(32) NOT NULL,
    "vat_included" boolean DEFAULT false,
    "vat_rate" numeric(5,2),
    "adult_age" character varying(50),
    "child_age_range" character varying(50),
    "infant_age_range" character varying(50),
    "kickback_type" character varying(20),
    "kickback_value" numeric(10,2),
    "kickback_per_person" boolean DEFAULT false,
    "kickback_min_persons" integer(32),
    "included_content" text,
    "start_date" date NOT NULL,
    "end_date" date NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "price_type" character varying(20) DEFAULT 'regional'::character varying,
    "contract_currency" character varying(3) DEFAULT 'USD'::character varying,
    "fixed_adult_price" numeric(10,2),
    "fixed_child_price" numeric(10,2),
    "fixed_infant_price" numeric(10,2),
    "kickback_currency" character varying(3),
    "transfer_owner" character varying(50),
    "transfer_price_type" character varying(50),
    "transfer_price" numeric(10,2),
    "transfer_currency" character varying(10),
    "transfer_price_mini" numeric(10,2),
    "transfer_price_midi" numeric(10,2),
    "transfer_price_bus" numeric(10,2),
    "transfer_currency_fixed" character varying(10),
    "is_active" boolean DEFAULT true,
    PRIMARY KEY ("id")
);

ALTER TABLE "contracts" ALTER COLUMN "id" SET DEFAULT nextval('"contracts_id_seq"');

ALTER TABLE "contracts" ADD CONSTRAINT contracts_sub_region_id_fkey FOREIGN KEY ("sub_region_id") REFERENCES "sub_regions"("id");
ALTER TABLE "contracts" ADD CONSTRAINT contracts_merchant_id_fkey FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id");
ALTER TABLE "contracts" ADD CONSTRAINT contracts_tour_id_fkey FOREIGN KEY ("tour_id") REFERENCES "tours"("id");
ALTER TABLE "contracts" ADD CONSTRAINT fk_contracts_sub_region FOREIGN KEY ("sub_region_id") REFERENCES "sub_regions"("id");
ALTER TABLE "contracts" ADD CONSTRAINT fk_contracts_merchant FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id");
ALTER TABLE "contracts" ADD CONSTRAINT fk_contracts_tour FOREIGN KEY ("tour_id") REFERENCES "tours"("id");

-- Data for table: contracts (1 rows)
INSERT INTO "contracts" ("id", "sub_region_id", "merchant_id", "tour_id", "vat_included", "vat_rate", "adult_age", "child_age_range", "infant_age_range", "kickback_type", "kickback_value", "kickback_per_person", "kickback_min_persons", "included_content", "start_date", "end_date", "created_at", "updated_at", "price_type", "contract_currency", "fixed_adult_price", "fixed_child_price", "fixed_infant_price", "kickback_currency", "transfer_owner", "transfer_price_type", "transfer_price", "transfer_currency", "transfer_price_mini", "transfer_price_midi", "transfer_price_bus", "transfer_currency_fixed", "is_active") VALUES ('2', '1', '1', '3', 't', NULL, '+12', '6-11', '0-5', 'fixed', '10.00', 't', '100', 'ALANYA KEMER VE SİDE’DEN; AKSU DOLPHİNARİUM TRANSFER+PAKET PROGRAM (YUNUS + FOK GÖSTERİSİ VE SÜRÜNGENPARK)+YUNUS İLE YÜZME ALAN MİSAFİRLERE PAKET PROGRAM(YUNUS + FOK GÖSTERİSİ VE SÜRÜNGENPARK) ÜCRETSİZDİR.
', '2025-10-27', '2025-10-27', '2025-10-27 17:56:27.855996', '2025-10-27 18:24:43.51504', 'regional', 'EUR', NULL, NULL, NULL, 'EUR', 'agency,supplier', 'fixed', NULL, NULL, NULL, NULL, NULL, NULL, 't');


-- ==================================================
-- Table: costs
-- ==================================================

DROP TABLE IF EXISTS "costs" CASCADE;
CREATE TABLE "costs" (
    "id" integer(32) NOT NULL DEFAULT nextval('costs_id_seq'::regclass),
    "cost_code" character varying(50) NOT NULL,
    "cost_name" character varying(255),
    "country_id" integer(32),
    "region_id" integer(32),
    "city_id" integer(32),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone,
    "is_active" boolean DEFAULT true,
    "valid_from" date DEFAULT CURRENT_DATE,
    PRIMARY KEY ("id")
);

ALTER TABLE "costs" ALTER COLUMN "id" SET DEFAULT nextval('"costs_id_seq"');

ALTER TABLE "costs" ADD CONSTRAINT costs_city_id_fkey FOREIGN KEY ("city_id") REFERENCES "cities"("id");
ALTER TABLE "costs" ADD CONSTRAINT costs_country_id_fkey FOREIGN KEY ("country_id") REFERENCES "countries"("id");
ALTER TABLE "costs" ADD CONSTRAINT costs_region_id_fkey FOREIGN KEY ("region_id") REFERENCES "regions"("id");

-- Data for table: costs (2 rows)
INSERT INTO "costs" ("id", "cost_code", "cost_name", "country_id", "region_id", "city_id", "created_at", "updated_at", "is_active", "valid_from") VALUES ('18', 'FST-00001', 'Yemek', NULL, NULL, NULL, '2025-10-26 22:26:31.569206', '2025-10-27 22:53:04.117331', 'f', '2025-10-27');
INSERT INTO "costs" ("id", "cost_code", "cost_name", "country_id", "region_id", "city_id", "created_at", "updated_at", "is_active", "valid_from") VALUES ('21', 'FST-00001', 'Yemek1', NULL, NULL, NULL, '2025-10-27 21:19:09.43966', '2025-10-27 22:53:04.117331', 't', '2025-10-27');


-- ==================================================
-- Table: countries
-- ==================================================

DROP TABLE IF EXISTS "countries" CASCADE;
CREATE TABLE "countries" (
    "id" integer(32) NOT NULL DEFAULT nextval('countries_id_seq'::regclass),
    "name" character varying(100) NOT NULL,
    "code" character varying(3) DEFAULT NULL::character varying,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone,
    PRIMARY KEY ("id")
);

ALTER TABLE "countries" ALTER COLUMN "id" SET DEFAULT nextval('"countries_id_seq"');

-- Data for table: countries (1 rows)
INSERT INTO "countries" ("id", "name", "code", "created_at", "updated_at") VALUES ('1', 'Turkiye', 'TR', '2025-10-26 15:18:17.775421', NULL);


-- ==================================================
-- Table: currencies
-- ==================================================

DROP TABLE IF EXISTS "currencies" CASCADE;
CREATE TABLE "currencies" (
    "id" integer(32) NOT NULL DEFAULT nextval('currencies_id_seq'::regclass),
    "code" character varying(3) NOT NULL,
    "name" character varying(100) NOT NULL,
    "symbol" character varying(10),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

ALTER TABLE "currencies" ALTER COLUMN "id" SET DEFAULT nextval('"currencies_id_seq"');

-- Data for table: currencies (4 rows)
INSERT INTO "currencies" ("id", "code", "name", "symbol", "is_active", "created_at", "updated_at") VALUES ('1', 'USD', 'US Dollar', '$', 't', '2025-10-27 16:49:36.636258', '2025-10-27 16:49:36.636258');
INSERT INTO "currencies" ("id", "code", "name", "symbol", "is_active", "created_at", "updated_at") VALUES ('2', 'EUR', 'Euro', '€', 't', '2025-10-27 16:49:36.636258', '2025-10-27 16:49:36.636258');
INSERT INTO "currencies" ("id", "code", "name", "symbol", "is_active", "created_at", "updated_at") VALUES ('3', 'TL', 'Turkish Lira', '₺', 't', '2025-10-27 16:49:36.636258', '2025-10-27 16:49:36.636258');
INSERT INTO "currencies" ("id", "code", "name", "symbol", "is_active", "created_at", "updated_at") VALUES ('4', 'GBP', 'British Pound', '£', 't', '2025-10-27 16:49:36.636258', '2025-10-27 16:49:36.636258');


-- ==================================================
-- Table: departments
-- ==================================================

DROP TABLE IF EXISTS "departments" CASCADE;
CREATE TABLE "departments" (
    "id" integer(32) NOT NULL DEFAULT nextval('departments_id_seq'::regclass),
    "name" character varying(100) NOT NULL,
    "city_id" integer(32) NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone,
    PRIMARY KEY ("id")
);

ALTER TABLE "departments" ALTER COLUMN "id" SET DEFAULT nextval('"departments_id_seq"');

ALTER TABLE "departments" ADD CONSTRAINT departments_city_id_fkey FOREIGN KEY ("city_id") REFERENCES "cities"("id");

-- Data for table: departments (1 rows)
INSERT INTO "departments" ("id", "name", "city_id", "created_at", "updated_at") VALUES ('2', 'Operasyon', '1', '2025-10-26 17:16:20.412471', NULL);


-- ==================================================
-- Table: merchants
-- ==================================================

DROP TABLE IF EXISTS "merchants" CASCADE;
CREATE TABLE "merchants" (
    "id" integer(32) NOT NULL DEFAULT nextval('merchants_id_seq'::regclass),
    "name" character varying(100) NOT NULL,
    "official_title" character varying(200),
    "sub_region_id" integer(32) NOT NULL,
    "authorized_person" character varying(100),
    "authorized_email" character varying(100),
    "authorized_phone" character varying(20),
    "operasyon_name" character varying(100),
    "operasyon_email" character varying(100),
    "operasyon_phone" character varying(20),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone,
    "location_url" text,
    PRIMARY KEY ("id")
);

ALTER TABLE "merchants" ALTER COLUMN "id" SET DEFAULT nextval('"merchants_id_seq"');

ALTER TABLE "merchants" ADD CONSTRAINT merchants_sub_region_id_fkey FOREIGN KEY ("sub_region_id") REFERENCES "sub_regions"("id");

-- Data for table: merchants (3 rows)
INSERT INTO "merchants" ("id", "name", "official_title", "sub_region_id", "authorized_person", "authorized_email", "authorized_phone", "operasyon_name", "operasyon_email", "operasyon_phone", "created_at", "updated_at", "location_url") VALUES ('1', 'Land Of Legends Theme Park', 'Land Of Legends', '1', 'Test Test', 'test@test.com', '5555555555555', 'Test Test', 'test@test.com', '5555555555', '2025-10-26 16:23:56.172426', '2025-10-26 22:58:50.011525', 'https://www.google.com/maps?q=36.8818763,30.7823927');
INSERT INTO "merchants" ("id", "name", "official_title", "sub_region_id", "authorized_person", "authorized_email", "authorized_phone", "operasyon_name", "operasyon_email", "operasyon_phone", "created_at", "updated_at", "location_url") VALUES ('3', 'Tazı Kanyon Sun Global', 'Daban Ogları', '2', 'Test Test', 'test@test.com', '5555555555555', 'Test Test', 'test@test.com', '5555555555', '2025-10-26 22:35:32.907371', '2025-10-26 22:59:26.155154', 'https://maps.app.goo.gl/6g7XepwXLEQsdw4s9');
INSERT INTO "merchants" ("id", "name", "official_title", "sub_region_id", "authorized_person", "authorized_email", "authorized_phone", "operasyon_name", "operasyon_email", "operasyon_phone", "created_at", "updated_at", "location_url") VALUES ('4', 'Aquarium Antalya', 'Aquarium Antalya', '5', 'test 1', 'test@test.com', '5855555555555', 'test 1', 'test@test.com', '5855555555555', '2025-10-26 23:55:19.55174', NULL, 'https://www.google.com/maps?q=36.8818763,30.7823927');


-- ==================================================
-- Table: positions
-- ==================================================

DROP TABLE IF EXISTS "positions" CASCADE;
CREATE TABLE "positions" (
    "id" integer(32) NOT NULL DEFAULT nextval('positions_id_seq'::regclass),
    "name" character varying(100) NOT NULL,
    "department_id" integer(32) NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone,
    PRIMARY KEY ("id")
);

ALTER TABLE "positions" ALTER COLUMN "id" SET DEFAULT nextval('"positions_id_seq"');

ALTER TABLE "positions" ADD CONSTRAINT positions_department_id_fkey FOREIGN KEY ("department_id") REFERENCES "departments"("id");

-- Data for table: positions (5 rows)
INSERT INTO "positions" ("id", "name", "department_id", "created_at", "updated_at") VALUES ('2', 'Tour Operasyon S1', '2', '2025-10-26 17:16:43.598174', '2025-10-26 22:16:42.99002');
INSERT INTO "positions" ("id", "name", "department_id", "created_at", "updated_at") VALUES ('3', 'Tour Operasyon S2', '2', '2025-10-26 22:16:51.221272', NULL);
INSERT INTO "positions" ("id", "name", "department_id", "created_at", "updated_at") VALUES ('4', 'Tour Operasyon S3', '2', '2025-10-26 22:16:58.779762', NULL);
INSERT INTO "positions" ("id", "name", "department_id", "created_at", "updated_at") VALUES ('5', 'Tour Operasyon S4', '2', '2025-10-26 22:17:04.758312', NULL);
INSERT INTO "positions" ("id", "name", "department_id", "created_at", "updated_at") VALUES ('6', 'Tour Operasyon S5', '2', '2025-10-26 22:17:18.201419', NULL);


-- ==================================================
-- Table: regions
-- ==================================================

DROP TABLE IF EXISTS "regions" CASCADE;
CREATE TABLE "regions" (
    "id" integer(32) NOT NULL DEFAULT nextval('regions_id_seq'::regclass),
    "name" character varying(100) NOT NULL,
    "country_id" integer(32) NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone,
    PRIMARY KEY ("id")
);

ALTER TABLE "regions" ALTER COLUMN "id" SET DEFAULT nextval('"regions_id_seq"');

ALTER TABLE "regions" ADD CONSTRAINT regions_country_id_fkey FOREIGN KEY ("country_id") REFERENCES "countries"("id");

-- Data for table: regions (2 rows)
INSERT INTO "regions" ("id", "name", "country_id", "created_at", "updated_at") VALUES ('1', 'Akdeniz', '1', '2025-10-26 15:18:29.801624', NULL);
INSERT INTO "regions" ("id", "name", "country_id", "created_at", "updated_at") VALUES ('35', 'Ege', '1', '2025-10-26 20:38:00.894383', NULL);


-- ==================================================
-- Table: sub_regions
-- ==================================================

DROP TABLE IF EXISTS "sub_regions" CASCADE;
CREATE TABLE "sub_regions" (
    "id" integer(32) NOT NULL DEFAULT nextval('sub_regions_id_seq'::regclass),
    "name" character varying(100) NOT NULL,
    "city_id" integer(32) NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone,
    PRIMARY KEY ("id")
);

ALTER TABLE "sub_regions" ALTER COLUMN "id" SET DEFAULT nextval('"sub_regions_id_seq"');

ALTER TABLE "sub_regions" ADD CONSTRAINT sub_regions_city_id_fkey FOREIGN KEY ("city_id") REFERENCES "cities"("id");

-- Data for table: sub_regions (7 rows)
INSERT INTO "sub_regions" ("id", "name", "city_id", "created_at", "updated_at") VALUES ('1', 'Belek', '1', '2025-10-26 16:01:56.70299', NULL);
INSERT INTO "sub_regions" ("id", "name", "city_id", "created_at", "updated_at") VALUES ('2', 'Side', '1', '2025-10-26 17:21:04.860603', NULL);
INSERT INTO "sub_regions" ("id", "name", "city_id", "created_at", "updated_at") VALUES ('3', 'Alanya', '1', '2025-10-26 20:38:30.038802', NULL);
INSERT INTO "sub_regions" ("id", "name", "city_id", "created_at", "updated_at") VALUES ('4', 'Kemer', '1', '2025-10-26 20:38:37.638921', NULL);
INSERT INTO "sub_regions" ("id", "name", "city_id", "created_at", "updated_at") VALUES ('5', 'Antalya', '1', '2025-10-26 20:38:48.003897', NULL);
INSERT INTO "sub_regions" ("id", "name", "city_id", "created_at", "updated_at") VALUES ('6', 'Finike', '1', '2025-10-26 20:38:54.726998', NULL);
INSERT INTO "sub_regions" ("id", "name", "city_id", "created_at", "updated_at") VALUES ('7', 'Demre', '1', '2025-10-26 20:39:01.023127', NULL);


-- ==================================================
-- Table: tour_sub_regions
-- ==================================================

DROP TABLE IF EXISTS "tour_sub_regions" CASCADE;
CREATE TABLE "tour_sub_regions" (
    "id" integer(32) NOT NULL DEFAULT nextval('tour_sub_regions_id_seq'::regclass),
    "tour_id" integer(32) NOT NULL,
    "sub_region_id" integer(32) NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

ALTER TABLE "tour_sub_regions" ALTER COLUMN "id" SET DEFAULT nextval('"tour_sub_regions_id_seq"');

ALTER TABLE "tour_sub_regions" ADD CONSTRAINT tour_sub_regions_tour_id_fkey FOREIGN KEY ("tour_id") REFERENCES "tours"("id");
ALTER TABLE "tour_sub_regions" ADD CONSTRAINT tour_sub_regions_sub_region_id_fkey FOREIGN KEY ("sub_region_id") REFERENCES "sub_regions"("id");

-- Data for table: tour_sub_regions (10 rows)
INSERT INTO "tour_sub_regions" ("id", "tour_id", "sub_region_id", "created_at") VALUES ('5', '3', '3', '2025-10-27 16:56:51.172482');
INSERT INTO "tour_sub_regions" ("id", "tour_id", "sub_region_id", "created_at") VALUES ('6', '3', '5', '2025-10-27 16:56:51.173319');
INSERT INTO "tour_sub_regions" ("id", "tour_id", "sub_region_id", "created_at") VALUES ('7', '3', '1', '2025-10-27 16:56:51.173618');
INSERT INTO "tour_sub_regions" ("id", "tour_id", "sub_region_id", "created_at") VALUES ('8', '3', '7', '2025-10-27 16:56:51.173904');
INSERT INTO "tour_sub_regions" ("id", "tour_id", "sub_region_id", "created_at") VALUES ('9', '3', '6', '2025-10-27 16:56:51.174189');
INSERT INTO "tour_sub_regions" ("id", "tour_id", "sub_region_id", "created_at") VALUES ('10', '3', '4', '2025-10-27 16:56:51.174453');
INSERT INTO "tour_sub_regions" ("id", "tour_id", "sub_region_id", "created_at") VALUES ('11', '3', '2', '2025-10-27 16:56:51.174727');
INSERT INTO "tour_sub_regions" ("id", "tour_id", "sub_region_id", "created_at") VALUES ('12', '4', '3', '2025-10-27 20:05:09.728846');
INSERT INTO "tour_sub_regions" ("id", "tour_id", "sub_region_id", "created_at") VALUES ('13', '4', '5', '2025-10-27 20:05:09.729313');
INSERT INTO "tour_sub_regions" ("id", "tour_id", "sub_region_id", "created_at") VALUES ('14', '4', '1', '2025-10-27 20:05:09.729621');


-- ==================================================
-- Table: tours
-- ==================================================

DROP TABLE IF EXISTS "tours" CASCADE;
CREATE TABLE "tours" (
    "id" integer(32) NOT NULL DEFAULT nextval('tours_id_seq'::regclass),
    "name" character varying(200) NOT NULL,
    "sub_region_id" integer(32) NOT NULL,
    "merchant_id" integer(32) NOT NULL,
    "start_date" date,
    "end_date" date,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone,
    "sejour_tour_code" character varying(50),
    "vehicle_contract_id" integer(32),
    PRIMARY KEY ("id")
);

ALTER TABLE "tours" ALTER COLUMN "id" SET DEFAULT nextval('"tours_id_seq"');

ALTER TABLE "tours" ADD CONSTRAINT tours_merchant_id_fkey FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id");
ALTER TABLE "tours" ADD CONSTRAINT tours_sub_region_id_fkey FOREIGN KEY ("sub_region_id") REFERENCES "sub_regions"("id");
ALTER TABLE "tours" ADD CONSTRAINT tours_vehicle_contract_id_fkey FOREIGN KEY ("vehicle_contract_id") REFERENCES "vehicle_contracts"("id");

-- Data for table: tours (2 rows)
INSERT INTO "tours" ("id", "name", "sub_region_id", "merchant_id", "start_date", "end_date", "created_at", "updated_at", "sejour_tour_code", "vehicle_contract_id") VALUES ('3', 'Land Of Legends Theme Park', '1', '1', NULL, NULL, '2025-10-26 22:33:54.254521', '2025-10-27 20:10:31.551916', 'LOLPAR', '1');
INSERT INTO "tours" ("id", "name", "sub_region_id", "merchant_id", "start_date", "end_date", "created_at", "updated_at", "sejour_tour_code", "vehicle_contract_id") VALUES ('4', 'Caner', '1', '1', NULL, NULL, '2025-10-27 20:05:09.72663', '2025-10-27 20:05:18.867141', 'CANER', '1');


-- ==================================================
-- Table: users
-- ==================================================

DROP TABLE IF EXISTS "users" CASCADE;
CREATE TABLE "users" (
    "id" integer(32) NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    "username" character varying(100) NOT NULL,
    "full_name" character varying(255),
    "department_id" integer(32),
    "city_id" integer(32),
    "email" character varying(255),
    "phone" character varying(50),
    "status" character varying(20) DEFAULT 'active'::character varying,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT nextval('"users_id_seq"');

ALTER TABLE "users" ADD CONSTRAINT users_department_id_fkey FOREIGN KEY ("department_id") REFERENCES "departments"("id");
ALTER TABLE "users" ADD CONSTRAINT users_city_id_fkey FOREIGN KEY ("city_id") REFERENCES "cities"("id");

-- Data for table: users (2 rows)
INSERT INTO "users" ("id", "username", "full_name", "department_id", "city_id", "email", "phone", "status", "created_at", "updated_at") VALUES ('1', 'admin', 'Administrator', '2', '1', 'admin@fst.com', '+90 555 000 0001', 'active', '2025-10-27 00:18:13.741588', '2025-10-27 00:23:57.988783');
INSERT INTO "users" ("id", "username", "full_name", "department_id", "city_id", "email", "phone", "status", "created_at", "updated_at") VALUES ('2', 'user.demo', 'Demo User', '2', '1', 'demo@fst.com', '+90 555 000 0002', 'active', '2025-10-27 00:18:13.741588', '2025-10-27 00:23:34.875804');


-- ==================================================
-- Table: vehicle_companies
-- ==================================================

DROP TABLE IF EXISTS "vehicle_companies" CASCADE;
CREATE TABLE "vehicle_companies" (
    "id" integer(32) NOT NULL DEFAULT nextval('vehicle_companies_id_seq'::regclass),
    "name" character varying(255) NOT NULL,
    "city_id" integer(32) NOT NULL,
    "contact_person" character varying(255),
    "contact_email" character varying(255),
    "contact_phone" character varying(50),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone,
    PRIMARY KEY ("id")
);

ALTER TABLE "vehicle_companies" ALTER COLUMN "id" SET DEFAULT nextval('"vehicle_companies_id_seq"');

ALTER TABLE "vehicle_companies" ADD CONSTRAINT vehicle_companies_city_id_fkey FOREIGN KEY ("city_id") REFERENCES "cities"("id");

-- Data for table: vehicle_companies (1 rows)
INSERT INTO "vehicle_companies" ("id", "name", "city_id", "contact_person", "contact_email", "contact_phone", "created_at", "updated_at") VALUES ('1', 'Sena Tour', '1', 'test', 'test@test.com', '555555555555555', '2025-10-26 23:31:45.403996', '2025-10-26 23:55:57.083642');


-- ==================================================
-- Table: vehicle_contracts
-- ==================================================

DROP TABLE IF EXISTS "vehicle_contracts" CASCADE;
CREATE TABLE "vehicle_contracts" (
    "id" integer(32) NOT NULL DEFAULT nextval('vehicle_contracts_id_seq'::regclass),
    "vehicle_company_id" integer(32) NOT NULL,
    "contract_code" character varying(100) NOT NULL,
    "start_date" date NOT NULL,
    "end_date" date NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "is_active" boolean DEFAULT true,
    PRIMARY KEY ("id")
);

ALTER TABLE "vehicle_contracts" ALTER COLUMN "id" SET DEFAULT nextval('"vehicle_contracts_id_seq"');

ALTER TABLE "vehicle_contracts" ADD CONSTRAINT vehicle_contracts_vehicle_company_id_fkey FOREIGN KEY ("vehicle_company_id") REFERENCES "vehicle_companies"("id");

-- Data for table: vehicle_contracts (2 rows)
INSERT INTO "vehicle_contracts" ("id", "vehicle_company_id", "contract_code", "start_date", "end_date", "created_at", "updated_at", "is_active") VALUES ('1', '1', 'S25Y', '2025-10-27', '2026-12-31', '2025-10-27 18:52:16.980318', '2025-10-27 20:20:40.57622', 'f');
INSERT INTO "vehicle_contracts" ("id", "vehicle_company_id", "contract_code", "start_date", "end_date", "created_at", "updated_at", "is_active") VALUES ('4', '1', 'FST-001', '2025-01-01', '2025-12-31', '2025-10-27 20:22:39.266439', '2025-10-27 20:22:39.266439', 't');


-- ==================================================
-- Table: vehicle_types
-- ==================================================

DROP TABLE IF EXISTS "vehicle_types" CASCADE;
CREATE TABLE "vehicle_types" (
    "id" integer(32) NOT NULL DEFAULT nextval('vehicle_types_id_seq'::regclass),
    "name" character varying(100) NOT NULL,
    "vehicle_company_id" integer(32) NOT NULL,
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone,
    PRIMARY KEY ("id")
);

ALTER TABLE "vehicle_types" ALTER COLUMN "id" SET DEFAULT nextval('"vehicle_types_id_seq"');

ALTER TABLE "vehicle_types" ADD CONSTRAINT vehicle_types_vehicle_company_id_fkey FOREIGN KEY ("vehicle_company_id") REFERENCES "vehicle_companies"("id");

-- Data for table: vehicle_types (7 rows)
INSERT INTO "vehicle_types" ("id", "name", "vehicle_company_id", "created_at", "updated_at") VALUES ('1', 'Mini', '1', '2025-10-26 23:31:54.917652', NULL);
INSERT INTO "vehicle_types" ("id", "name", "vehicle_company_id", "created_at", "updated_at") VALUES ('2', 'Midi', '1', '2025-10-26 23:32:01.320662', NULL);
INSERT INTO "vehicle_types" ("id", "name", "vehicle_company_id", "created_at", "updated_at") VALUES ('3', 'Bus', '1', '2025-10-26 23:32:08.013198', NULL);
INSERT INTO "vehicle_types" ("id", "name", "vehicle_company_id", "created_at", "updated_at") VALUES ('4', 'Vito', '1', '2025-10-26 23:32:15.750468', NULL);
INSERT INTO "vehicle_types" ("id", "name", "vehicle_company_id", "created_at", "updated_at") VALUES ('5', 'Vip Mini', '1', '2025-10-26 23:32:24.623267', NULL);
INSERT INTO "vehicle_types" ("id", "name", "vehicle_company_id", "created_at", "updated_at") VALUES ('6', 'Vip Vito', '1', '2025-10-26 23:32:33.817543', NULL);
INSERT INTO "vehicle_types" ("id", "name", "vehicle_company_id", "created_at", "updated_at") VALUES ('7', 'S25Y', '1', '2025-10-27 18:46:33.663321', NULL);


COMMIT;
