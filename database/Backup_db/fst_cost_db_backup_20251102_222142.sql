﻿--
-- PostgreSQL database dump
--

\restrict aIfwMXKN80q42Dt6ES1pFNSAA1IGjRfn22ZfFleAz5lZsw3CfezC4dxWURMztnP

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

-- Started on 2025-11-03 01:21:42

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS fst_cost_db;
--
-- TOC entry 5476 (class 1262 OID 35144)
-- Name: fst_cost_db; Type: DATABASE; Schema: -; Owner: -
--

CREATE DATABASE fst_cost_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.UTF-8';


\unrestrict aIfwMXKN80q42Dt6ES1pFNSAA1IGjRfn22ZfFleAz5lZsw3CfezC4dxWURMztnP
\connect fst_cost_db
\restrict aIfwMXKN80q42Dt6ES1pFNSAA1IGjRfn22ZfFleAz5lZsw3CfezC4dxWURMztnP

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 270 (class 1255 OID 35842)
-- Name: generate_cost_code(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.generate_cost_code() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    new_code VARCHAR(50);
    seq_num INTEGER;
BEGIN
    -- Get next sequence number
    SELECT COALESCE(MAX(CAST(SUBSTRING(cost_code FROM 4) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM costs
    WHERE cost_code LIKE 'FST%' AND SUBSTRING(cost_code FROM 4) ~ '^[0-9]+$';
    
    -- Generate code: FST + padded number (e.g., FST00001)
    new_code := 'FST' || LPAD(seq_num::TEXT, 5, '0');
    
    NEW.cost_code := new_code;
    RETURN NEW;
END;
$_$;


--
-- TOC entry 269 (class 1255 OID 35838)
-- Name: update_costs_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_costs_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- TOC entry 268 (class 1255 OID 35145)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 35146)
-- Name: cities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cities (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    region_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 220 (class 1259 OID 35153)
-- Name: cities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5477 (class 0 OID 0)
-- Dependencies: 220
-- Name: cities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cities_id_seq OWNED BY public.cities.id;


--
-- TOC entry 261 (class 1259 OID 35720)
-- Name: cost_general_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cost_general_prices (
    id integer NOT NULL,
    cost_item_id integer NOT NULL,
    amount numeric(15,2) NOT NULL,
    currency_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 260 (class 1259 OID 35719)
-- Name: cost_general_prices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cost_general_prices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5478 (class 0 OID 0)
-- Dependencies: 260
-- Name: cost_general_prices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cost_general_prices_id_seq OWNED BY public.cost_general_prices.id;


--
-- TOC entry 259 (class 1259 OID 35700)
-- Name: cost_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cost_items (
    id integer NOT NULL,
    cost_period_id integer NOT NULL,
    item_type character varying(20) NOT NULL,
    pricing_type character varying(20) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cost_items_item_type_check CHECK (((item_type)::text = ANY ((ARRAY['fixed'::character varying, 'regional'::character varying])::text[]))),
    CONSTRAINT cost_items_pricing_type_check CHECK (((pricing_type)::text = ANY ((ARRAY['general'::character varying, 'person_based'::character varying])::text[])))
);


--
-- TOC entry 258 (class 1259 OID 35699)
-- Name: cost_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cost_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5479 (class 0 OID 0)
-- Dependencies: 258
-- Name: cost_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cost_items_id_seq OWNED BY public.cost_items.id;


--
-- TOC entry 257 (class 1259 OID 35683)
-- Name: cost_periods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cost_periods (
    id integer NOT NULL,
    cost_id integer NOT NULL,
    period_name character varying(255) NOT NULL,
    start_date date,
    end_date date,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 256 (class 1259 OID 35682)
-- Name: cost_periods_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cost_periods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5480 (class 0 OID 0)
-- Dependencies: 256
-- Name: cost_periods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cost_periods_id_seq OWNED BY public.cost_periods.id;


--
-- TOC entry 263 (class 1259 OID 35742)
-- Name: cost_person_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cost_person_prices (
    id integer NOT NULL,
    cost_item_id integer NOT NULL,
    age_group character varying(20) NOT NULL,
    amount numeric(15,2) NOT NULL,
    currency_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cost_person_prices_age_group_check CHECK (((age_group)::text = ANY ((ARRAY['adult'::character varying, 'child'::character varying, 'infant'::character varying])::text[])))
);


--
-- TOC entry 262 (class 1259 OID 35741)
-- Name: cost_person_prices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cost_person_prices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5481 (class 0 OID 0)
-- Dependencies: 262
-- Name: cost_person_prices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cost_person_prices_id_seq OWNED BY public.cost_person_prices.id;


--
-- TOC entry 265 (class 1259 OID 35768)
-- Name: cost_regional_general_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cost_regional_general_prices (
    id integer NOT NULL,
    cost_item_id integer NOT NULL,
    sub_region_id integer NOT NULL,
    amount numeric(15,2) NOT NULL,
    currency_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 264 (class 1259 OID 35767)
-- Name: cost_regional_general_prices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cost_regional_general_prices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5482 (class 0 OID 0)
-- Dependencies: 264
-- Name: cost_regional_general_prices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cost_regional_general_prices_id_seq OWNED BY public.cost_regional_general_prices.id;


--
-- TOC entry 267 (class 1259 OID 35798)
-- Name: cost_regional_person_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cost_regional_person_prices (
    id integer NOT NULL,
    cost_item_id integer NOT NULL,
    sub_region_id integer NOT NULL,
    age_group character varying(20) NOT NULL,
    amount numeric(15,2) NOT NULL,
    currency_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cost_regional_person_prices_age_group_check CHECK (((age_group)::text = ANY ((ARRAY['adult'::character varying, 'child'::character varying, 'infant'::character varying])::text[])))
);


--
-- TOC entry 266 (class 1259 OID 35797)
-- Name: cost_regional_person_prices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cost_regional_person_prices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5483 (class 0 OID 0)
-- Dependencies: 266
-- Name: cost_regional_person_prices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cost_regional_person_prices_id_seq OWNED BY public.cost_regional_person_prices.id;


--
-- TOC entry 255 (class 1259 OID 35654)
-- Name: costs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.costs (
    id integer NOT NULL,
    cost_code character varying(50) NOT NULL,
    name character varying(255) NOT NULL,
    country_id integer,
    region_id integer,
    city_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 254 (class 1259 OID 35653)
-- Name: costs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.costs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5484 (class 0 OID 0)
-- Dependencies: 254
-- Name: costs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.costs_id_seq OWNED BY public.costs.id;


--
-- TOC entry 221 (class 1259 OID 35154)
-- Name: countries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.countries (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    code character varying(10),
    local_currency_code character varying(3),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 222 (class 1259 OID 35161)
-- Name: countries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.countries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5485 (class 0 OID 0)
-- Dependencies: 222
-- Name: countries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.countries_id_seq OWNED BY public.countries.id;


--
-- TOC entry 223 (class 1259 OID 35162)
-- Name: country_currencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.country_currencies (
    id integer NOT NULL,
    country_id integer NOT NULL,
    currency_code character varying(3) NOT NULL,
    unit_name character varying(50),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 224 (class 1259 OID 35171)
-- Name: country_currencies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.country_currencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5486 (class 0 OID 0)
-- Dependencies: 224
-- Name: country_currencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.country_currencies_id_seq OWNED BY public.country_currencies.id;


--
-- TOC entry 225 (class 1259 OID 35172)
-- Name: currencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.currencies (
    id integer NOT NULL,
    code character varying(3) NOT NULL,
    name character varying(255) NOT NULL,
    symbol character varying(10),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 226 (class 1259 OID 35181)
-- Name: currencies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.currencies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5487 (class 0 OID 0)
-- Dependencies: 226
-- Name: currencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.currencies_id_seq OWNED BY public.currencies.id;


--
-- TOC entry 227 (class 1259 OID 35182)
-- Name: departments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.departments (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    city_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 228 (class 1259 OID 35189)
-- Name: departments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.departments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5488 (class 0 OID 0)
-- Dependencies: 228
-- Name: departments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.departments_id_seq OWNED BY public.departments.id;


--
-- TOC entry 229 (class 1259 OID 35190)
-- Name: exchange_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exchange_rates (
    id integer NOT NULL,
    country_id integer NOT NULL,
    currency_code character varying(3) NOT NULL,
    rate_date date NOT NULL,
    end_date date,
    rate numeric(18,6) NOT NULL,
    source character varying(10) DEFAULT 'manual'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT exchange_rates_rate_check CHECK ((rate > (0)::numeric)),
    CONSTRAINT exchange_rates_source_check CHECK (((source)::text = ANY (ARRAY[('manual'::character varying)::text, ('cbrt'::character varying)::text])))
);


--
-- TOC entry 230 (class 1259 OID 35204)
-- Name: exchange_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exchange_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5489 (class 0 OID 0)
-- Dependencies: 230
-- Name: exchange_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exchange_rates_id_seq OWNED BY public.exchange_rates.id;


--
-- TOC entry 231 (class 1259 OID 35205)
-- Name: merchants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.merchants (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    official_title character varying(255),
    sub_region_id integer,
    authorized_person character varying(255),
    authorized_email character varying(255),
    authorized_phone character varying(50),
    operasyon_name character varying(255),
    operasyon_email character varying(255),
    operasyon_phone character varying(50),
    location_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 232 (class 1259 OID 35214)
-- Name: merchants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.merchants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5490 (class 0 OID 0)
-- Dependencies: 232
-- Name: merchants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.merchants_id_seq OWNED BY public.merchants.id;


--
-- TOC entry 233 (class 1259 OID 35215)
-- Name: positions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.positions (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    department_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 234 (class 1259 OID 35222)
-- Name: positions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.positions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5491 (class 0 OID 0)
-- Dependencies: 234
-- Name: positions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.positions_id_seq OWNED BY public.positions.id;


--
-- TOC entry 235 (class 1259 OID 35223)
-- Name: regions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regions (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    country_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 236 (class 1259 OID 35230)
-- Name: regions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.regions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5492 (class 0 OID 0)
-- Dependencies: 236
-- Name: regions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.regions_id_seq OWNED BY public.regions.id;


--
-- TOC entry 237 (class 1259 OID 35231)
-- Name: sub_regions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sub_regions (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    city_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 238 (class 1259 OID 35238)
-- Name: sub_regions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sub_regions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5493 (class 0 OID 0)
-- Dependencies: 238
-- Name: sub_regions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sub_regions_id_seq OWNED BY public.sub_regions.id;


--
-- TOC entry 239 (class 1259 OID 35239)
-- Name: tour_contract_routes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tour_contract_routes (
    id integer NOT NULL,
    tour_id integer NOT NULL,
    sub_region_id integer NOT NULL,
    vehicle_contract_route_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 240 (class 1259 OID 35248)
-- Name: tour_contract_routes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tour_contract_routes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5494 (class 0 OID 0)
-- Dependencies: 240
-- Name: tour_contract_routes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tour_contract_routes_id_seq OWNED BY public.tour_contract_routes.id;


--
-- TOC entry 241 (class 1259 OID 35266)
-- Name: tour_sub_regions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tour_sub_regions (
    tour_id integer NOT NULL,
    sub_region_id integer NOT NULL
);


--
-- TOC entry 242 (class 1259 OID 35271)
-- Name: tours; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tours (
    id integer NOT NULL,
    sejour_tour_code character varying(50),
    name character varying(255) NOT NULL,
    sub_region_id integer,
    merchant_id integer,
    vehicle_contract_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    country_id integer,
    region_id integer,
    city_id integer
);


--
-- TOC entry 243 (class 1259 OID 35278)
-- Name: tours_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tours_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5495 (class 0 OID 0)
-- Dependencies: 243
-- Name: tours_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tours_id_seq OWNED BY public.tours.id;


--
-- TOC entry 244 (class 1259 OID 35279)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    full_name character varying(255),
    department_id integer,
    position_id integer,
    city_id integer,
    email character varying(255),
    phone character varying(50),
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_status_check CHECK (((status)::text = ANY (ARRAY[('active'::character varying)::text, ('inactive'::character varying)::text])))
);


--
-- TOC entry 245 (class 1259 OID 35290)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5496 (class 0 OID 0)
-- Dependencies: 245
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 246 (class 1259 OID 35291)
-- Name: vehicle_companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicle_companies (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    city_id integer,
    contact_person character varying(255),
    contact_email character varying(255),
    contact_phone character varying(50),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 247 (class 1259 OID 35300)
-- Name: vehicle_companies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vehicle_companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5497 (class 0 OID 0)
-- Dependencies: 247
-- Name: vehicle_companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vehicle_companies_id_seq OWNED BY public.vehicle_companies.id;


--
-- TOC entry 248 (class 1259 OID 35301)
-- Name: vehicle_contract_routes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicle_contract_routes (
    id integer NOT NULL,
    vehicle_contract_id integer NOT NULL,
    from_location character varying(255) NOT NULL,
    to_location character varying(255) NOT NULL,
    currency_code character varying(3),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    vehicle_type_prices jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- TOC entry 249 (class 1259 OID 35314)
-- Name: vehicle_contract_routes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vehicle_contract_routes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5498 (class 0 OID 0)
-- Dependencies: 249
-- Name: vehicle_contract_routes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vehicle_contract_routes_id_seq OWNED BY public.vehicle_contract_routes.id;


--
-- TOC entry 250 (class 1259 OID 35315)
-- Name: vehicle_contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicle_contracts (
    id integer NOT NULL,
    vehicle_company_id integer,
    contract_code character varying(50) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 251 (class 1259 OID 35324)
-- Name: vehicle_contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vehicle_contracts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5499 (class 0 OID 0)
-- Dependencies: 251
-- Name: vehicle_contracts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vehicle_contracts_id_seq OWNED BY public.vehicle_contracts.id;


--
-- TOC entry 252 (class 1259 OID 35325)
-- Name: vehicle_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicle_types (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    vehicle_company_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    min_pax integer,
    max_pax integer
);


--
-- TOC entry 253 (class 1259 OID 35332)
-- Name: vehicle_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vehicle_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5500 (class 0 OID 0)
-- Dependencies: 253
-- Name: vehicle_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vehicle_types_id_seq OWNED BY public.vehicle_types.id;


--
-- TOC entry 4978 (class 2604 OID 35333)
-- Name: cities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities ALTER COLUMN id SET DEFAULT nextval('public.cities_id_seq'::regclass);


--
-- TOC entry 5043 (class 2604 OID 35723)
-- Name: cost_general_prices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_general_prices ALTER COLUMN id SET DEFAULT nextval('public.cost_general_prices_id_seq'::regclass);


--
-- TOC entry 5040 (class 2604 OID 35703)
-- Name: cost_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_items ALTER COLUMN id SET DEFAULT nextval('public.cost_items_id_seq'::regclass);


--
-- TOC entry 5037 (class 2604 OID 35686)
-- Name: cost_periods id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_periods ALTER COLUMN id SET DEFAULT nextval('public.cost_periods_id_seq'::regclass);


--
-- TOC entry 5045 (class 2604 OID 35745)
-- Name: cost_person_prices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_person_prices ALTER COLUMN id SET DEFAULT nextval('public.cost_person_prices_id_seq'::regclass);


--
-- TOC entry 5047 (class 2604 OID 35771)
-- Name: cost_regional_general_prices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_regional_general_prices ALTER COLUMN id SET DEFAULT nextval('public.cost_regional_general_prices_id_seq'::regclass);


--
-- TOC entry 5049 (class 2604 OID 35801)
-- Name: cost_regional_person_prices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_regional_person_prices ALTER COLUMN id SET DEFAULT nextval('public.cost_regional_person_prices_id_seq'::regclass);


--
-- TOC entry 5034 (class 2604 OID 35657)
-- Name: costs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costs ALTER COLUMN id SET DEFAULT nextval('public.costs_id_seq'::regclass);


--
-- TOC entry 4981 (class 2604 OID 35334)
-- Name: countries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries ALTER COLUMN id SET DEFAULT nextval('public.countries_id_seq'::regclass);


--
-- TOC entry 4984 (class 2604 OID 35335)
-- Name: country_currencies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.country_currencies ALTER COLUMN id SET DEFAULT nextval('public.country_currencies_id_seq'::regclass);


--
-- TOC entry 4988 (class 2604 OID 35336)
-- Name: currencies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies ALTER COLUMN id SET DEFAULT nextval('public.currencies_id_seq'::regclass);


--
-- TOC entry 4992 (class 2604 OID 35337)
-- Name: departments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments ALTER COLUMN id SET DEFAULT nextval('public.departments_id_seq'::regclass);


--
-- TOC entry 4995 (class 2604 OID 35338)
-- Name: exchange_rates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates ALTER COLUMN id SET DEFAULT nextval('public.exchange_rates_id_seq'::regclass);


--
-- TOC entry 4999 (class 2604 OID 35339)
-- Name: merchants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchants ALTER COLUMN id SET DEFAULT nextval('public.merchants_id_seq'::regclass);


--
-- TOC entry 5002 (class 2604 OID 35340)
-- Name: positions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.positions ALTER COLUMN id SET DEFAULT nextval('public.positions_id_seq'::regclass);


--
-- TOC entry 5005 (class 2604 OID 35341)
-- Name: regions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions ALTER COLUMN id SET DEFAULT nextval('public.regions_id_seq'::regclass);


--
-- TOC entry 5008 (class 2604 OID 35342)
-- Name: sub_regions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_regions ALTER COLUMN id SET DEFAULT nextval('public.sub_regions_id_seq'::regclass);


--
-- TOC entry 5011 (class 2604 OID 35343)
-- Name: tour_contract_routes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tour_contract_routes ALTER COLUMN id SET DEFAULT nextval('public.tour_contract_routes_id_seq'::regclass);


--
-- TOC entry 5014 (class 2604 OID 35345)
-- Name: tours id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tours ALTER COLUMN id SET DEFAULT nextval('public.tours_id_seq'::regclass);


--
-- TOC entry 5017 (class 2604 OID 35346)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5021 (class 2604 OID 35347)
-- Name: vehicle_companies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_companies ALTER COLUMN id SET DEFAULT nextval('public.vehicle_companies_id_seq'::regclass);


--
-- TOC entry 5024 (class 2604 OID 35348)
-- Name: vehicle_contract_routes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_contract_routes ALTER COLUMN id SET DEFAULT nextval('public.vehicle_contract_routes_id_seq'::regclass);


--
-- TOC entry 5028 (class 2604 OID 35349)
-- Name: vehicle_contracts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_contracts ALTER COLUMN id SET DEFAULT nextval('public.vehicle_contracts_id_seq'::regclass);


--
-- TOC entry 5031 (class 2604 OID 35350)
-- Name: vehicle_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_types ALTER COLUMN id SET DEFAULT nextval('public.vehicle_types_id_seq'::regclass);


--
-- TOC entry 5422 (class 0 OID 35146)
-- Dependencies: 219
-- Data for Name: cities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cities (id, name, region_id, created_at, updated_at) FROM stdin;
1	Istanbul	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
2	Bursa	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
3	Izmir	2	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
4	Ankara	4	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
5	Antalya	3	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
6	Munich	5	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
7	Berlin	6	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
8	Paris	7	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
9	Marseille	8	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
10	Ankara	5	2025-11-02 23:37:44.455302	2025-11-02 23:37:44.455302
\.


--
-- TOC entry 5464 (class 0 OID 35720)
-- Dependencies: 261
-- Data for Name: cost_general_prices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cost_general_prices (id, cost_item_id, amount, currency_id, created_at) FROM stdin;
3	4	100.00	3	2025-11-02 23:56:29.288021
8	11	100.00	4	2025-11-03 00:50:38.29299
9	13	100.00	3	2025-11-03 00:50:38.29299
\.


--
-- TOC entry 5462 (class 0 OID 35700)
-- Dependencies: 259
-- Data for Name: cost_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cost_items (id, cost_period_id, item_type, pricing_type, created_at, updated_at) FROM stdin;
4	6	fixed	general	2025-11-02 23:56:29.288021	2025-11-02 23:56:29.288021
11	13	fixed	general	2025-11-03 00:50:38.29299	2025-11-03 00:50:38.29299
12	14	fixed	person_based	2025-11-03 00:50:38.29299	2025-11-03 00:50:38.29299
13	15	fixed	general	2025-11-03 00:50:38.29299	2025-11-03 00:50:38.29299
\.


--
-- TOC entry 5460 (class 0 OID 35683)
-- Dependencies: 257
-- Data for Name: cost_periods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cost_periods (id, cost_id, period_name, start_date, end_date, created_at, updated_at) FROM stdin;
6	2	s21	2025-11-01	2025-11-30	2025-11-02 23:56:29.288021	2025-11-02 23:56:29.288021
13	1	s21s	2026-01-01	2026-01-31	2025-11-03 00:50:38.29299	2025-11-03 00:50:38.29299
14	1	s21	2025-01-01	2025-12-31	2025-11-03 00:50:38.29299	2025-11-03 00:50:38.29299
15	1	Test Period	2024-01-01	2024-12-31	2025-11-03 00:50:38.29299	2025-11-03 00:50:38.29299
\.


--
-- TOC entry 5466 (class 0 OID 35742)
-- Dependencies: 263
-- Data for Name: cost_person_prices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cost_person_prices (id, cost_item_id, age_group, amount, currency_id, created_at) FROM stdin;
10	12	adult	100.00	4	2025-11-03 00:50:38.29299
11	12	child	10.00	4	2025-11-03 00:50:38.29299
12	12	infant	1.00	4	2025-11-03 00:50:38.29299
\.


--
-- TOC entry 5468 (class 0 OID 35768)
-- Dependencies: 265
-- Data for Name: cost_regional_general_prices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cost_regional_general_prices (id, cost_item_id, sub_region_id, amount, currency_id, created_at) FROM stdin;
\.


--
-- TOC entry 5470 (class 0 OID 35798)
-- Dependencies: 267
-- Data for Name: cost_regional_person_prices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cost_regional_person_prices (id, cost_item_id, sub_region_id, age_group, amount, currency_id, created_at) FROM stdin;
\.


--
-- TOC entry 5458 (class 0 OID 35654)
-- Dependencies: 255
-- Data for Name: costs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.costs (id, cost_code, name, country_id, region_id, city_id, created_at, updated_at) FROM stdin;
2	FST00002	testq	1	3	5	2025-11-02 23:56:29.288021	2025-11-02 23:56:29.288021
1	FST00001	test	1	3	5	2025-11-02 19:50:51.993479	2025-11-03 00:50:38.29299
\.


--
-- TOC entry 5424 (class 0 OID 35154)
-- Dependencies: 221
-- Data for Name: countries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.countries (id, name, code, local_currency_code, created_at, updated_at) FROM stdin;
3	France	FR	\N	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
4	United Kingdom	GB	\N	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
1	Turkey	TR	TRY	2025-10-31 19:34:50.327689	2025-10-31 20:06:44.62999
2	Germany	DE	EUR	2025-10-31 19:34:50.327689	2025-11-01 00:02:36.350648
5	Turkeys	tr	\N	2025-11-02 23:39:21.17084	2025-11-02 23:40:14.853116
\.


--
-- TOC entry 5426 (class 0 OID 35162)
-- Dependencies: 223
-- Data for Name: country_currencies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.country_currencies (id, country_id, currency_code, unit_name, is_active, created_at, updated_at) FROM stdin;
1	1	USD	1	t	2025-10-31 19:37:12.093045	2025-10-31 19:37:12.093045
2	1	RUB	1	t	2025-10-31 19:37:17.932557	2025-10-31 19:37:17.932557
3	1	EUR	1	t	2025-10-31 19:37:21.987689	2025-10-31 19:37:21.987689
5	2	RUB	\N	t	2025-11-01 00:02:44.408165	2025-11-01 00:02:44.408165
6	2	TRY	\N	t	2025-11-01 00:02:46.530613	2025-11-01 00:02:46.530613
7	2	USD	\N	t	2025-11-01 00:02:48.263235	2025-11-01 00:02:48.263235
4	2	EUR	\N	f	2025-11-01 00:02:42.204899	2025-11-01 00:02:55.895301
\.


--
-- TOC entry 5428 (class 0 OID 35172)
-- Dependencies: 225
-- Data for Name: currencies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.currencies (id, code, name, symbol, is_active, created_at, updated_at) FROM stdin;
1	USD	US DOLAR	$	t	2025-10-31 19:35:40.349181	2025-10-31 19:35:40.349181
2	RUB	RUS RUBLESI	₽	t	2025-10-31 19:35:59.935993	2025-10-31 19:35:59.935993
3	EUR	EURO	Є	t	2025-10-31 19:36:13.569036	2025-10-31 19:36:13.569036
4	TRY	TURK LIRASI	₺	t	2025-10-31 19:36:48.258185	2025-10-31 19:36:48.258185
5	USS	US DOLAR	$	t	2025-11-02 23:46:47.650083	2025-11-02 23:46:47.650083
\.


--
-- TOC entry 5430 (class 0 OID 35182)
-- Dependencies: 227
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.departments (id, name, city_id, created_at, updated_at) FROM stdin;
1	IT Department	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
2	Human Resources	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
3	Finance Department	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
4	Operations	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
5	Sales & Marketing	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
6	IT Department	4	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
7	Human Resources	4	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
8	Finance Department	4	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
9	IT Department	6	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
10	Operations	6	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
11	Sales & Marketing	8	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
12	Finance Department	8	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
13	Finance Department	7	2025-11-02 23:26:49.326756	2025-11-02 23:26:49.326756
\.


--
-- TOC entry 5432 (class 0 OID 35190)
-- Dependencies: 229
-- Data for Name: exchange_rates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.exchange_rates (id, country_id, currency_code, rate_date, end_date, rate, source, created_at, updated_at) FROM stdin;
1	1	USD	2025-10-01	\N	41.587800	cbrt	2025-10-31 19:37:40.982952	2025-10-31 19:37:40.982952
2	1	USD	2025-10-02	\N	41.603100	cbrt	2025-10-31 19:37:41.403162	2025-10-31 19:37:41.403162
3	1	USD	2025-10-03	\N	41.597400	cbrt	2025-10-31 19:37:41.768369	2025-10-31 19:37:41.768369
4	1	USD	2025-10-04	\N	41.597400	cbrt	2025-10-31 19:37:42.526189	2025-10-31 19:37:42.526189
5	1	USD	2025-10-05	\N	41.597400	cbrt	2025-10-31 19:37:43.645753	2025-10-31 19:37:43.645753
6	1	USD	2025-10-06	\N	41.697500	cbrt	2025-10-31 19:37:44.091062	2025-10-31 19:37:44.091062
7	1	USD	2025-10-07	\N	41.696700	cbrt	2025-10-31 19:37:44.529802	2025-10-31 19:37:44.529802
8	1	USD	2025-10-08	\N	41.708000	cbrt	2025-10-31 19:37:44.94196	2025-10-31 19:37:44.94196
9	1	USD	2025-10-09	\N	41.717100	cbrt	2025-10-31 19:37:45.324122	2025-10-31 19:37:45.324122
10	1	USD	2025-10-10	\N	41.713800	cbrt	2025-10-31 19:37:45.709077	2025-10-31 19:37:45.709077
11	1	USD	2025-10-11	\N	41.713800	cbrt	2025-10-31 19:37:46.558429	2025-10-31 19:37:46.558429
12	1	USD	2025-10-12	\N	41.713800	cbrt	2025-10-31 19:37:47.837495	2025-10-31 19:37:47.837495
13	1	USD	2025-10-13	\N	41.794700	cbrt	2025-10-31 19:37:48.258256	2025-10-31 19:37:48.258256
14	1	USD	2025-10-14	\N	41.824800	cbrt	2025-10-31 19:37:48.711621	2025-10-31 19:37:48.711621
15	1	USD	2025-10-15	\N	41.836400	cbrt	2025-10-31 19:37:49.229613	2025-10-31 19:37:49.229613
16	1	USD	2025-10-16	\N	41.848800	cbrt	2025-10-31 19:37:49.597986	2025-10-31 19:37:49.597986
17	1	USD	2025-10-17	\N	41.860800	cbrt	2025-10-31 19:37:49.968376	2025-10-31 19:37:49.968376
18	1	USD	2025-10-18	\N	41.860800	cbrt	2025-10-31 19:37:50.747482	2025-10-31 19:37:50.747482
19	1	USD	2025-10-19	\N	41.860800	cbrt	2025-10-31 19:37:51.999068	2025-10-31 19:37:51.999068
20	1	USD	2025-10-20	\N	41.952200	cbrt	2025-10-31 19:37:52.407637	2025-10-31 19:37:52.407637
21	1	USD	2025-10-21	\N	41.962600	cbrt	2025-10-31 19:37:52.77767	2025-10-31 19:37:52.77767
22	1	USD	2025-10-22	\N	41.972100	cbrt	2025-10-31 19:37:53.158924	2025-10-31 19:37:53.158924
23	1	USD	2025-10-23	\N	41.979700	cbrt	2025-10-31 19:37:53.522783	2025-10-31 19:37:53.522783
24	1	USD	2025-10-24	\N	41.918000	cbrt	2025-10-31 19:37:53.903035	2025-10-31 19:37:53.903035
25	1	USD	2025-10-25	\N	41.918000	cbrt	2025-10-31 19:37:54.653738	2025-10-31 19:37:54.653738
26	1	USD	2025-10-26	\N	41.918000	cbrt	2025-10-31 19:37:55.725165	2025-10-31 19:37:55.725165
27	1	USD	2025-10-27	\N	41.945300	cbrt	2025-10-31 19:37:56.084747	2025-10-31 19:37:56.084747
32	1	RUB	2025-10-01	\N	0.512340	cbrt	2025-10-31 19:37:59.077	2025-10-31 19:37:59.077
33	1	RUB	2025-10-02	\N	0.515370	cbrt	2025-10-31 19:37:59.452737	2025-10-31 19:37:59.452737
34	1	RUB	2025-10-03	\N	0.511620	cbrt	2025-10-31 19:37:59.811077	2025-10-31 19:37:59.811077
35	1	RUB	2025-10-04	\N	0.511620	cbrt	2025-10-31 19:38:00.52119	2025-10-31 19:38:00.52119
36	1	RUB	2025-10-05	\N	0.511620	cbrt	2025-10-31 19:38:01.596797	2025-10-31 19:38:01.596797
37	1	RUB	2025-10-06	\N	0.505330	cbrt	2025-10-31 19:38:01.959333	2025-10-31 19:38:01.959333
38	1	RUB	2025-10-07	\N	0.510710	cbrt	2025-10-31 19:38:02.317667	2025-10-31 19:38:02.317667
39	1	RUB	2025-10-08	\N	0.513350	cbrt	2025-10-31 19:38:02.674951	2025-10-31 19:38:02.674951
40	1	RUB	2025-10-09	\N	0.515460	cbrt	2025-10-31 19:38:03.034102	2025-10-31 19:38:03.034102
41	1	RUB	2025-10-10	\N	0.516210	cbrt	2025-10-31 19:38:03.38951	2025-10-31 19:38:03.38951
42	1	RUB	2025-10-11	\N	0.516210	cbrt	2025-10-31 19:38:04.109697	2025-10-31 19:38:04.109697
43	1	RUB	2025-10-12	\N	0.516210	cbrt	2025-10-31 19:38:05.177052	2025-10-31 19:38:05.177052
44	1	RUB	2025-10-13	\N	0.519230	cbrt	2025-10-31 19:38:05.536606	2025-10-31 19:38:05.536606
45	1	RUB	2025-10-14	\N	0.525940	cbrt	2025-10-31 19:38:05.895425	2025-10-31 19:38:05.895425
46	1	RUB	2025-10-15	\N	0.532810	cbrt	2025-10-31 19:38:06.253362	2025-10-31 19:38:06.253362
47	1	RUB	2025-10-16	\N	0.533130	cbrt	2025-10-31 19:38:06.60833	2025-10-31 19:38:06.60833
48	1	RUB	2025-10-17	\N	0.519730	cbrt	2025-10-31 19:38:06.968935	2025-10-31 19:38:06.968935
49	1	RUB	2025-10-18	\N	0.519730	cbrt	2025-10-31 19:38:07.686516	2025-10-31 19:38:07.686516
50	1	RUB	2025-10-19	\N	0.519730	cbrt	2025-10-31 19:38:08.771436	2025-10-31 19:38:08.771436
51	1	RUB	2025-10-20	\N	0.520490	cbrt	2025-10-31 19:38:09.131206	2025-10-31 19:38:09.131206
52	1	RUB	2025-10-21	\N	0.520460	cbrt	2025-10-31 19:38:09.495088	2025-10-31 19:38:09.495088
53	1	RUB	2025-10-22	\N	0.516650	cbrt	2025-10-31 19:38:09.913579	2025-10-31 19:38:09.913579
54	1	RUB	2025-10-23	\N	0.518650	cbrt	2025-10-31 19:38:10.269371	2025-10-31 19:38:10.269371
55	1	RUB	2025-10-24	\N	0.519960	cbrt	2025-10-31 19:38:10.6255	2025-10-31 19:38:10.6255
56	1	RUB	2025-10-25	\N	0.519960	cbrt	2025-10-31 19:38:11.346858	2025-10-31 19:38:11.346858
57	1	RUB	2025-10-26	\N	0.519960	cbrt	2025-10-31 19:38:12.42927	2025-10-31 19:38:12.42927
58	1	RUB	2025-10-27	\N	0.530930	cbrt	2025-10-31 19:38:12.788235	2025-10-31 19:38:12.788235
63	1	EUR	2025-10-01	\N	48.838600	cbrt	2025-10-31 19:38:15.747279	2025-10-31 19:38:15.747279
64	1	EUR	2025-10-02	\N	48.886400	cbrt	2025-10-31 19:38:16.111433	2025-10-31 19:38:16.111433
65	1	EUR	2025-10-03	\N	48.808300	cbrt	2025-10-31 19:38:16.477651	2025-10-31 19:38:16.477651
66	1	EUR	2025-10-04	\N	48.808300	cbrt	2025-10-31 19:38:17.197258	2025-10-31 19:38:17.197258
67	1	EUR	2025-10-05	\N	48.808300	cbrt	2025-10-31 19:38:18.274841	2025-10-31 19:38:18.274841
68	1	EUR	2025-10-06	\N	48.667600	cbrt	2025-10-31 19:38:18.631676	2025-10-31 19:38:18.631676
69	1	EUR	2025-10-07	\N	48.668400	cbrt	2025-10-31 19:38:18.997312	2025-10-31 19:38:18.997312
70	1	EUR	2025-10-08	\N	48.475100	cbrt	2025-10-31 19:38:19.35521	2025-10-31 19:38:19.35521
71	1	EUR	2025-10-09	\N	48.457500	cbrt	2025-10-31 19:38:19.714765	2025-10-31 19:38:19.714765
72	1	EUR	2025-10-10	\N	48.274000	cbrt	2025-10-31 19:38:20.077216	2025-10-31 19:38:20.077216
73	1	EUR	2025-10-11	\N	48.274000	cbrt	2025-10-31 19:38:20.791577	2025-10-31 19:38:20.791577
74	1	EUR	2025-10-12	\N	48.274000	cbrt	2025-10-31 19:38:21.869326	2025-10-31 19:38:21.869326
75	1	EUR	2025-10-13	\N	48.443600	cbrt	2025-10-31 19:38:22.225357	2025-10-31 19:38:22.225357
76	1	EUR	2025-10-14	\N	48.334500	cbrt	2025-10-31 19:38:22.589086	2025-10-31 19:38:22.589086
77	1	EUR	2025-10-15	\N	48.659200	cbrt	2025-10-31 19:38:22.947762	2025-10-31 19:38:22.947762
78	1	EUR	2025-10-16	\N	48.776200	cbrt	2025-10-31 19:38:23.305162	2025-10-31 19:38:23.305162
79	1	EUR	2025-10-17	\N	48.973900	cbrt	2025-10-31 19:38:23.667452	2025-10-31 19:38:23.667452
80	1	EUR	2025-10-18	\N	48.973900	cbrt	2025-10-31 19:38:24.384897	2025-10-31 19:38:24.384897
81	1	EUR	2025-10-19	\N	48.973900	cbrt	2025-10-31 19:38:25.455777	2025-10-31 19:38:25.455777
82	1	EUR	2025-10-20	\N	48.913500	cbrt	2025-10-31 19:38:25.816478	2025-10-31 19:38:25.816478
83	1	EUR	2025-10-21	\N	48.769000	cbrt	2025-10-31 19:38:26.17944	2025-10-31 19:38:26.17944
84	1	EUR	2025-10-22	\N	48.668300	cbrt	2025-10-31 19:38:26.537899	2025-10-31 19:38:26.537899
85	1	EUR	2025-10-23	\N	48.667800	cbrt	2025-10-31 19:38:26.896647	2025-10-31 19:38:26.896647
86	1	EUR	2025-10-24	\N	48.681900	cbrt	2025-10-31 19:38:27.256978	2025-10-31 19:38:27.256978
87	1	EUR	2025-10-25	\N	48.681900	cbrt	2025-10-31 19:38:27.972966	2025-10-31 19:38:27.972966
88	1	EUR	2025-10-26	\N	48.681900	cbrt	2025-10-31 19:38:29.055503	2025-10-31 19:38:29.055503
89	1	EUR	2025-10-27	\N	48.796400	cbrt	2025-10-31 19:38:29.413834	2025-10-31 19:38:29.413834
124	1	EUR	2025-10-30	\N	48.745800	cbrt	2025-10-31 23:42:53.668476	2025-10-31 23:42:53.668476
125	1	EUR	2025-10-31	\N	48.549300	cbrt	2025-10-31 23:42:54.032155	2025-10-31 23:42:54.032155
126	1	RUB	2025-10-30	\N	0.525210	cbrt	2025-10-31 23:42:55.167037	2025-10-31 23:42:55.167037
127	1	RUB	2025-10-31	\N	0.522300	cbrt	2025-10-31 23:42:55.530128	2025-10-31 23:42:55.530128
128	1	USD	2025-10-30	\N	41.975500	cbrt	2025-10-31 23:42:56.653924	2025-10-31 23:42:56.653924
129	1	USD	2025-10-31	\N	41.967700	cbrt	2025-10-31 23:42:57.016173	2025-10-31 23:42:57.016173
130	2	RUB	2025-11-01	\N	100.000000	manual	2025-11-01 00:03:15.934801	2025-11-01 00:03:15.934801
131	2	RUB	2025-11-02	\N	100.000000	manual	2025-11-01 00:03:15.937457	2025-11-01 00:03:15.937457
132	2	RUB	2025-11-03	\N	100.000000	manual	2025-11-01 00:03:15.937874	2025-11-01 00:03:15.937874
133	2	RUB	2025-11-04	\N	100.000000	manual	2025-11-01 00:03:15.93848	2025-11-01 00:03:15.93848
134	2	RUB	2025-11-05	\N	100.000000	manual	2025-11-01 00:03:15.938838	2025-11-01 00:03:15.938838
135	2	RUB	2025-11-06	\N	100.000000	manual	2025-11-01 00:03:15.939152	2025-11-01 00:03:15.939152
136	2	RUB	2025-11-07	\N	100.000000	manual	2025-11-01 00:03:15.939478	2025-11-01 00:03:15.939478
137	2	RUB	2025-11-08	\N	100.000000	manual	2025-11-01 00:03:15.939727	2025-11-01 00:03:15.939727
138	2	RUB	2025-11-09	\N	100.000000	manual	2025-11-01 00:03:15.940004	2025-11-01 00:03:15.940004
139	2	TRY	2025-11-01	\N	100.000000	manual	2025-11-01 00:03:21.583928	2025-11-01 00:03:21.583928
140	2	TRY	2025-11-02	\N	100.000000	manual	2025-11-01 00:03:21.589408	2025-11-01 00:03:21.589408
141	2	TRY	2025-11-03	\N	100.000000	manual	2025-11-01 00:03:21.589889	2025-11-01 00:03:21.589889
142	2	TRY	2025-11-04	\N	100.000000	manual	2025-11-01 00:03:21.590263	2025-11-01 00:03:21.590263
143	2	TRY	2025-11-05	\N	100.000000	manual	2025-11-01 00:03:21.590609	2025-11-01 00:03:21.590609
144	2	TRY	2025-11-06	\N	100.000000	manual	2025-11-01 00:03:21.590929	2025-11-01 00:03:21.590929
145	2	TRY	2025-11-07	\N	100.000000	manual	2025-11-01 00:03:21.591263	2025-11-01 00:03:21.591263
146	2	TRY	2025-11-08	\N	100.000000	manual	2025-11-01 00:03:21.591534	2025-11-01 00:03:21.591534
147	2	TRY	2025-11-09	\N	100.000000	manual	2025-11-01 00:03:21.592003	2025-11-01 00:03:21.592003
148	2	USD	2025-11-01	\N	100.000000	manual	2025-11-01 00:03:24.196361	2025-11-01 00:03:24.196361
149	2	USD	2025-11-02	\N	100.000000	manual	2025-11-01 00:03:24.201526	2025-11-01 00:03:24.201526
150	2	USD	2025-11-03	\N	100.000000	manual	2025-11-01 00:03:24.201967	2025-11-01 00:03:24.201967
151	2	USD	2025-11-04	\N	100.000000	manual	2025-11-01 00:03:24.202296	2025-11-01 00:03:24.202296
152	2	USD	2025-11-05	\N	100.000000	manual	2025-11-01 00:03:24.202609	2025-11-01 00:03:24.202609
153	2	USD	2025-11-06	\N	100.000000	manual	2025-11-01 00:03:24.202984	2025-11-01 00:03:24.202984
154	2	USD	2025-11-07	\N	100.000000	manual	2025-11-01 00:03:24.203634	2025-11-01 00:03:24.203634
155	2	USD	2025-11-08	\N	100.000000	manual	2025-11-01 00:03:24.203964	2025-11-01 00:03:24.203964
156	2	USD	2025-11-09	\N	100.000000	manual	2025-11-01 00:03:24.204232	2025-11-01 00:03:24.204232
157	1	RUB	2025-11-01	\N	0.522300	cbrt	2025-11-01 00:13:06.328152	2025-11-01 00:13:06.328152
158	1	USD	2025-11-01	\N	41.967700	cbrt	2025-11-01 00:13:07.1876	2025-11-01 00:13:07.1876
159	1	EUR	2025-11-01	\N	48.549300	cbrt	2025-11-01 00:13:08.102114	2025-11-01 00:13:08.102114
\.


--
-- TOC entry 5434 (class 0 OID 35205)
-- Dependencies: 231
-- Data for Name: merchants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.merchants (id, name, official_title, sub_region_id, authorized_person, authorized_email, authorized_phone, operasyon_name, operasyon_email, operasyon_phone, location_url, created_at, updated_at) FROM stdin;
1	Grand Bazaar Restaurant	Grand Bazaar Restaurant Ltd.	1	Mehmet Özkan	mehmet.ozkan@grandbazaar.com	+90 212 555 1001	Ayşe Demir	ayse.demir@grandbazaar.com	+90 212 555 1002	https://maps.google.com/?q=41.0076,28.9714	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
2	Sultanahmet Hotel	Sultanahmet Hotels Inc.	1	Fatma Yılmaz	fatma.yilmaz@sultanahmet.com	+90 212 555 1011	Ali Kaya	ali.kaya@sultanahmet.com	+90 212 555 1012	https://maps.google.com/?q=41.0058,28.9784	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
3	Taksim Shopping Center	Taksim Mall Corporation	2	Cemil Şahin	cemil.sahin@taksimmall.com	+90 212 555 2001	Zeynep Aydın	zeynep.aydin@taksimmall.com	+90 212 555 2002	https://maps.google.com/?q=41.0370,28.9850	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
4	Taksim Restaurant Group	Taksim Restaurant Group Ltd.	2	Burak Çelik	burak.celik@taksimrest.com	+90 212 555 2011	Elif Özdemir	elif.ozdemir@taksimrest.com	+90 212 555 2012	https://maps.google.com/?q=41.0375,28.9855	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
5	Kadıköy Market	Kadıköy Market Co.	3	Selma Arslan	selma.arslan@kadikoymarket.com	+90 216 555 3001	Hasan Yücel	hasan.yucel@kadikoymarket.com	+90 216 555 3002	https://maps.google.com/?q=40.9908,29.0244	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
6	Çankaya Business Center	Çankaya Business Center Ltd.	6	İbrahim Karaca	ibrahim.karaca@cankaya.com	+90 312 555 4001	Serkan Öztürk	serkan.ozturk@cankaya.com	+90 312 555 4002	https://maps.google.com/?q=39.9208,32.8541	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
7	Ankara Kızılay Cafe	Ankara Cafes Group	7	Merve Tunç	merve.tunc@ankara-cafe.com	+90 312 555 4011	Can Yıldız	can.yildiz@ankara-cafe.com	+90 312 555 4012	https://maps.google.com/?q=39.9217,32.8563	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
8	Kaleiçi Boutique Hotel	Kaleiçi Hotels & Resorts	10	Emre Polat	emre.polat@kaleici-hotels.com	+90 242 555 5001	Deniz Aktaş	deniz.aktas@kaleici-hotels.com	+90 242 555 5002	https://maps.google.com/?q=36.8847,30.7040	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
9	Antalya Marina Restaurant	Antalya Marina Dining	10	Berna Çakır	berna.cakir@antalyamarina.com	+90 242 555 5011	Murat Şen	murat.sen@antalyamarina.com	+90 242 555 5012	https://maps.google.com/?q=36.8889,30.7061	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
10	Marienplatz Souvenir Shop	Bavaria Souvenirs GmbH	16	Hans Müller	hans.mueller@bavaria-souvenirs.de	+49 89 555 6001	Sophie Weber	sophie.weber@bavaria-souvenirs.de	+49 89 555 6002	https://maps.google.com/?q=48.1374,11.5755	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
11	Munich Beer Garden	Munich Beer Gardens GmbH	16	Klaus Fischer	klaus.fischer@munich-beer.de	+49 89 555 6011	Anna Schmidt	anna.schmidt@munich-beer.de	+49 89 555 6012	https://maps.google.com/?q=48.1351,11.5759	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
12	Berlin Mitte Shopping	Berlin Shopping Center GmbH	19	Thomas Wagner	thomas.wagner@berlin-shopping.de	+49 30 555 7001	Laura Becker	laura.becker@berlin-shopping.de	+49 30 555 7002	https://maps.google.com/?q=52.5200,13.4050	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
14	Paris Montmartre Gallery	Montmartre Art Gallery SARL	23	Jean Martin	jean.martin@montmartre-gallery.fr	+33 1 55 7001	Camille Rousseau	camille.rousseau@montmartre-gallery.fr	+33 1 55 7002	https://maps.google.com/?q=48.8867,2.3431	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
15	Vieux-Port Seafood Restaurant	Marseille Seafood SARL	26	Luc Moreau	luc.moreau@marseille-seafood.fr	+33 4 91 8001	Claire Petit	claire.petit@marseille-seafood.fr	+33 4 91 8002	https://maps.google.com/?q=43.2965,5.3698	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
16	Ankara Kızılay Cafe		13								2025-11-02 23:21:37.81366	2025-11-02 23:22:06.278541
\.


--
-- TOC entry 5436 (class 0 OID 35215)
-- Dependencies: 233
-- Data for Name: positions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.positions (id, name, department_id, created_at, updated_at) FROM stdin;
1	Software Engineer	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
2	Senior Software Engineer	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
3	DevOps Engineer	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
4	IT Manager	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
5	HR Specialist	2	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
6	Recruiter	2	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
7	HR Manager	2	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
8	Accountant	3	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
9	Senior Accountant	3	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
10	Financial Analyst	3	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
11	Finance Manager	3	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
12	Operations Coordinator	4	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
13	Operations Manager	4	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
14	Sales Representative	5	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
15	Marketing Specialist	5	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
16	Sales Manager	5	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
17	Software Developer	6	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
18	System Administrator	6	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
19	HR Assistant	7	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
20	HR Coordinator	7	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
21	Junior Accountant	8	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
22	Accounting Clerk	8	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
23	Software Engineer	9	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
24	Technical Lead	9	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
25	Project Coordinator	10	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
26	Operations Analyst	10	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
27	Sales Executive	11	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
28	Marketing Manager	11	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
29	Financial Controller	12	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
30	Budget Analyst	12	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
31	Accountant	8	2025-11-02 23:27:20.87586	2025-11-02 23:27:20.87586
\.


--
-- TOC entry 5438 (class 0 OID 35223)
-- Dependencies: 235
-- Data for Name: regions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.regions (id, name, country_id, created_at, updated_at) FROM stdin;
1	Marmara	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
2	Aegean	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
3	Mediterranean	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
4	Central Anatolia	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
5	Bavaria	2	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
6	Berlin	2	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
7	Île-de-France	3	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
8	Provence-Alpes-Côte d'Azur	3	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
9	Aegeans	1	2025-11-02 23:37:17.125193	2025-11-02 23:37:17.125193
\.


--
-- TOC entry 5440 (class 0 OID 35231)
-- Dependencies: 237
-- Data for Name: sub_regions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sub_regions (id, name, city_id, created_at, updated_at) FROM stdin;
1	Sultanahmet	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
2	Taksim	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
3	Kadıköy	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
4	Beşiktaş	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
5	Şişli	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
6	Çankaya	4	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
7	Kızılay	4	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
8	Ulus	4	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
9	Bahçelievler	4	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
10	Kaleiçi	5	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
11	Lara	5	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
12	Konyaaltı	5	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
13	Alsancak	3	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
14	Konak	3	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
15	Bornova	3	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
16	Marienplatz	6	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
17	Schwabing	6	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
18	Maxvorstadt	6	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
19	Mitte	7	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
20	Prenzlauer Berg	7	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
21	Kreuzberg	7	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
22	Le Marais	8	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
23	Montmartre	8	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
25	Latin Quarter	8	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
26	Vieux-Port	9	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
27	Le Panier	9	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
28	Alsancak	10	2025-11-02 23:38:00.10594	2025-11-02 23:38:00.10594
\.


--
-- TOC entry 5442 (class 0 OID 35239)
-- Dependencies: 239
-- Data for Name: tour_contract_routes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tour_contract_routes (id, tour_id, sub_region_id, vehicle_contract_route_id, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5444 (class 0 OID 35266)
-- Dependencies: 241
-- Data for Name: tour_sub_regions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tour_sub_regions (tour_id, sub_region_id) FROM stdin;
1	10
1	12
1	11
2	10
2	12
2	11
\.


--
-- TOC entry 5445 (class 0 OID 35271)
-- Dependencies: 242
-- Data for Name: tours; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tours (id, sejour_tour_code, name, sub_region_id, merchant_id, vehicle_contract_id, created_at, updated_at, country_id, region_id, city_id) FROM stdin;
1	LOLPAR	Land Of Legends Theme Park	\N	\N	\N	2025-11-02 11:41:31.525089	2025-11-02 19:24:33.210403	1	3	5
2	CANER	Turkey	\N	\N	\N	2025-11-02 12:24:01.446277	2025-11-02 19:24:38.886492	1	3	5
3	LOLPARS	Land Of Legends Theme Park	\N	\N	\N	2025-11-03 00:15:02.210176	2025-11-03 00:15:45.087118	1	3	5
4	LOLPARSA	Land Of Legends Theme Park	\N	\N	\N	2025-11-03 00:16:18.560152	2025-11-03 00:16:18.560152	1	3	5
5	SSSSS	Add Vehicle Company	\N	\N	\N	2025-11-03 00:18:29.899768	2025-11-03 00:18:29.899768	1	1	1
\.


--
-- TOC entry 5447 (class 0 OID 35279)
-- Dependencies: 244
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, full_name, department_id, position_id, city_id, email, phone, status, created_at, updated_at) FROM stdin;
4	anna.mueller	Anna Müller	10	26	6	anna.mueller@fstcost.com	+49 89 555 0301	active	2025-10-31 19:34:50.327689	2025-11-01 21:43:28.871867
2	jane.smith	Jane Smith	2	5	1	jane.smith@fstcost.com	+90 212 555 0102	active	2025-10-31 19:34:50.327689	2025-11-01 21:43:32.858469
1	john.doe	John Doe	1	3	1	john.doe@fstcost.com	+90 212 555 0101	active	2025-10-31 19:34:50.327689	2025-11-03 00:26:10.28872
3	ahmet.yilmaz	Ahmet Yılmaz	8	21	4	ahmet.yilmaz@fstcost.com	+90 312 555 0201	active	2025-10-31 19:34:50.327689	2025-11-03 00:29:06.766277
\.


--
-- TOC entry 5449 (class 0 OID 35291)
-- Dependencies: 246
-- Data for Name: vehicle_companies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicle_companies (id, name, city_id, contact_person, contact_email, contact_phone, created_at, updated_at) FROM stdin;
1	Istanbul Transport Co.	1	Ahmet Demir	ahmet.demir@istanbultransport.com	+90 212 555 9001	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
2	Bosphorus Vehicles	1	Zeynep Kaya	zeynep.kaya@bosphorus.com	+90 212 555 9002	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
3	Marmara Fleet Services	1	Mehmet Şahin	mehmet.sahin@marmara.com	+90 212 555 9003	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
4	Ankara Transport Solutions	4	Can Öztürk	can.ozturk@ankara-transport.com	+90 312 555 9101	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
5	Capital Vehicles Ltd.	4	Ayşe Yıldız	ayse.yildiz@capital-vehicles.com	+90 312 555 9102	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
6	Mediterranean Transport	5	Berk Aktaş	berk.aktas@mediterranean.com	+90 242 555 9201	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
7	Antalya Coast Vehicles	5	Elif Çakır	elif.cakir@coast-vehicles.com	+90 242 555 9202	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
8	Bavaria Transport GmbH	6	Michael Schmidt	michael.schmidt@bavaria-transport.de	+49 89 555 9301	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
9	Munich Fleet Services	6	Lisa Wagner	lisa.wagner@munich-fleet.de	+49 89 555 9302	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
10	Berlin Transport GmbH	7	Stefan Becker	stefan.becker@berlin-transport.de	+49 30 555 9401	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
11	Paris Transport SARL	8	François Dubois	francois.dubois@paris-transport.fr	+33 1 55 9501	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
12	Ile-de-France Vehicles	8	Marie Laurent	marie.laurent@idf-vehicles.fr	+33 1 55 9502	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
13	Provence Transport SARL	9	Jean-Pierre Moreau	jean-pierre.moreau@provence.fr	+33 4 91 9601	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
14	Sena Tour	4	Ali Uzun	test@test.com	555555555555555	2025-10-31 21:50:11.230885	2025-10-31 21:50:11.230885
15	Add Vehicle Company	4				2025-11-02 22:57:28.151216	2025-11-02 22:57:28.151216
\.


--
-- TOC entry 5451 (class 0 OID 35301)
-- Dependencies: 248
-- Data for Name: vehicle_contract_routes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicle_contract_routes (id, vehicle_contract_id, from_location, to_location, currency_code, created_at, updated_at, vehicle_type_prices) FROM stdin;
1	2	ANTALYA	HAVALİMANI	TRY	2025-10-31 21:49:25.84464	2025-10-31 21:49:25.84464	{"2": 1600, "3": 2500, "4": 4100}
2	2	KEMER	HAVALİMANI	TRY	2025-10-31 21:49:25.849597	2025-10-31 21:49:25.849597	{"2": 2600, "3": 4000, "4": 6200}
3	2	KİRİŞ - ÇAMYUVA-TEKİROVA	HAVALİMANI	TRY	2025-10-31 21:49:25.850528	2025-10-31 21:49:25.850528	{"2": 2800, "3": 4280, "4": 6700}
4	2	BELEK	HAVALİMANI	TRY	2025-10-31 21:49:25.851288	2025-10-31 21:49:25.851288	{"2": 2270, "3": 3500, "4": 5600}
5	2	BOĞAZKENT	HAVALİMANI	TRY	2025-10-31 21:49:25.852205	2025-10-31 21:49:25.852205	{"2": 2450, "3": 3850, "4": 6000}
6	2	DENİZYAKA LİKYA WORLD	HAVALİMANI	TRY	2025-10-31 21:49:25.852986	2025-10-31 21:49:25.852986	{"2": 2750, "3": 4100, "4": 6900}
7	2	SİDE	HAVALİMANI	TRY	2025-10-31 21:49:25.853797	2025-10-31 21:49:25.853797	{"2": 2750, "3": 4100, "4": 6900}
8	2	KIZILAĞAÇ - KIZILOT	HAVALİMANI	TRY	2025-10-31 21:49:25.854627	2025-10-31 21:49:25.854627	{"2": 2940, "3": 4350, "4": 7300}
9	2	ALANYA	HAVALİMANI	TRY	2025-10-31 21:49:25.855373	2025-10-31 21:49:25.855373	{"2": 3640, "3": 5500, "4": 8665}
10	2	MAHMUTLAR	HAVALİMANI	TRY	2025-10-31 21:49:25.856073	2025-10-31 21:49:25.856073	{"2": 3825, "3": 5775, "4": 9100}
11	2	ÇIRALI	HAVALİMANI	TRY	2025-10-31 21:49:25.856745	2025-10-31 21:49:25.856745	{"2": 3470, "3": 5400, "4": 8920}
12	2	ADRASAN	HAVALİMANI	TRY	2025-10-31 21:49:25.857428	2025-10-31 21:49:25.857428	{"2": 3840, "3": 5795, "4": 9640}
13	2	KUMLUCA	HAVALİMANI	TRY	2025-10-31 21:49:25.85836	2025-10-31 21:49:25.85836	{"2": 4205, "3": 6360, "4": 10270}
14	2	FİNİKE	HAVALİMANI	TRY	2025-10-31 21:49:25.859232	2025-10-31 21:49:25.859232	{"2": 4885, "3": 7380, "4": 11445}
15	2	DEMRE	HAVALİMANI	TRY	2025-10-31 21:49:25.860018	2025-10-31 21:49:25.860018	{"2": 6235, "3": 9430, "4": 15285}
16	2	KAŞ	HAVALİMANI	TRY	2025-10-31 21:49:25.860791	2025-10-31 21:49:25.860791	{"2": 7440, "3": 11720, "4": 19775}
17	2	FETHİYE	HAVALİMANI	TRY	2025-10-31 21:49:25.861531	2025-10-31 21:49:25.861531	{"2": 8205, "3": 13210, "4": 22220}
18	2	DALAMAN	HAVALİMANI	TRY	2025-10-31 21:49:25.862215	2025-10-31 21:49:25.862215	{"2": 9160, "3": 14665, "4": 24685}
19	2	MARMARİS	HAVALİMANI	TRY	2025-10-31 21:49:25.862894	2025-10-31 21:49:25.862894	{"2": 12790, "3": 20550, "4": 34595}
20	2	BODRUM	HAVALİMANI	TRY	2025-10-31 21:49:25.863718	2025-10-31 21:49:25.863718	{"2": 16455, "3": 26410, "4": 44475}
21	2	GAZİPAŞA	ALANYA	TRY	2025-10-31 21:49:25.864367	2025-10-31 21:49:25.864367	{"2": 3120, "3": 4800, "4": 8000}
22	2	GAZİPAŞA	SİDE	TRY	2025-10-31 21:49:25.865015	2025-10-31 21:49:25.865015	{"2": 3880, "3": 6050, "4": 10100}
23	2	GAZİPAŞA	BELEK	TRY	2025-10-31 21:49:25.865718	2025-10-31 21:49:25.865718	{"2": 4600, "3": 7200, "4": 12100}
24	2	GAZİPAŞA	ANTALYA	TRY	2025-10-31 21:49:25.866579	2025-10-31 21:49:25.866579	{"2": 5350, "3": 8450, "4": 14100}
25	2	GAZİPAŞA	KEMER	TRY	2025-10-31 21:49:25.867323	2025-10-31 21:49:25.867323	{"2": 6550, "3": 10300, "4": 17250}
26	2	MANAVGAT BOT TURU	ANTALYA	TRY	2025-10-31 21:49:25.86803	2025-10-31 21:49:25.86803	{"2": 5850, "3": 8480, "4": 12900}
27	2	MANAVGAT BOT TURU	KEMER	TRY	2025-10-31 21:49:25.868683	2025-10-31 21:49:25.868683	{"2": 6255, "3": 9575, "4": 14940}
28	2	MANAVGAT BOT TURU	BELEK	TRY	2025-10-31 21:49:25.869329	2025-10-31 21:49:25.869329	{"2": 5255, "3": 7740, "4": 12025}
29	2	MANAVGAT BOT TURU	SİDE	TRY	2025-10-31 21:49:25.870115	2025-10-31 21:49:25.870115	{"2": 5310, "3": 7490, "4": 11330}
30	2	MANAVGAT BOT TURU	ALANYA	TRY	2025-10-31 21:49:25.871107	2025-10-31 21:49:25.871107	{"2": 6030, "3": 8695, "4": 13220}
31	2	DISCOVERY PARK TURU	ANTALYA	TRY	2025-10-31 21:49:25.87189	2025-10-31 21:49:25.87189	{"2": 5850, "3": 8480, "4": 12900}
32	2	DISCOVERY PARK TURU	KEMER	TRY	2025-10-31 21:49:25.872678	2025-10-31 21:49:25.872678	{"2": 6255, "3": 9575, "4": 14940}
33	2	DISCOVERY PARK TURU	BELEK	TRY	2025-10-31 21:49:25.873357	2025-10-31 21:49:25.873357	{"2": 4380, "3": 6940, "4": 10780}
34	2	DISCOVERY PARK TURU	SİDE	TRY	2025-10-31 21:49:25.874018	2025-10-31 21:49:25.874018	{"2": 3880, "3": 5540, "4": 8400}
35	2	DISCOVERY PARK TURU	ALANYA	TRY	2025-10-31 21:49:25.874656	2025-10-31 21:49:25.874656	{"2": 5030, "3": 7330, "4": 11175}
36	2	BELEK LAND OF LEGENDS TURU	ANTALYA	TRY	2025-10-31 21:49:25.875296	2025-10-31 21:49:25.875296	{"2": 5360, "3": 7590, "4": 11480}
37	2	BELEK LAND OF LEGENDS TURU	KEMER	TRY	2025-10-31 21:49:25.876005	2025-10-31 21:49:25.876005	{"2": 5845, "3": 8820, "4": 13740}
38	2	BELEK LAND OF LEGENDS TURU	BELEK	TRY	2025-10-31 21:49:25.876681	2025-10-31 21:49:25.876681	{"2": 4815, "3": 6935, "4": 10735}
39	2	BELEK LAND OF LEGENDS TURU	SİDE	TRY	2025-10-31 21:49:25.877371	2025-10-31 21:49:25.877371	{"2": 5520, "3": 7890, "4": 11960}
40	2	BELEK LAND OF LEGENDS TURU	ALANYA	TRY	2025-10-31 21:49:25.878023	2025-10-31 21:49:25.878023	{"2": 6425, "3": 9430, "4": 14375}
41	2	AQUALAND TURU / AKVARYUM TURU	ANTALYA	TRY	2025-10-31 21:49:25.878883	2025-10-31 21:49:25.878883	{"2": 5310, "3": 7490, "4": 11330}
42	2	AQUALAND TURU / AKVARYUM TURU	KEMER	TRY	2025-10-31 21:49:25.879526	2025-10-31 21:49:25.879526	{"2": 5255, "3": 7740, "4": 12025}
43	2	AQUALAND TURU / AKVARYUM TURU	BELEK	TRY	2025-10-31 21:49:25.880182	2025-10-31 21:49:25.880182	{"2": 5255, "3": 7740, "4": 12025}
44	2	AQUALAND TURU / AKVARYUM TURU	SİDE	TRY	2025-10-31 21:49:25.880847	2025-10-31 21:49:25.880847	{"2": 5850, "3": 8480, "4": 12900}
45	2	AQUALAND TURU / AKVARYUM TURU	ALANYA	TRY	2025-10-31 21:49:25.88164	2025-10-31 21:49:25.88164	{"2": 6815, "3": 10155, "4": 15530}
46	2	TÜNEKTEPE TELEFERİK TURU	ANTALYA	TRY	2025-10-31 21:49:25.882321	2025-10-31 21:49:25.882321	{"2": 5410, "3": 7690, "4": 11640}
47	2	TÜNEKTEPE TELEFERİK TURU	KEMER	TRY	2025-10-31 21:49:25.882956	2025-10-31 21:49:25.882956	{"2": 5140, "3": 7525, "4": 11680}
48	2	TÜNEKTEPE TELEFERİK TURU	BELEK	TRY	2025-10-31 21:49:25.883663	2025-10-31 21:49:25.883663	{"2": 5435, "3": 8065, "4": 12535}
49	2	TÜNEKTEPE TELEFERİK TURU	SİDE	TRY	2025-10-31 21:49:25.884301	2025-10-31 21:49:25.884301	{"2": 5845, "3": 8820, "4": 13740}
50	2	TÜNEKTEPE TELEFERİK TURU	ALANYA	TRY	2025-10-31 21:49:25.88493	2025-10-31 21:49:25.88493	{"2": 6995, "3": 10470, "4": 16025}
51	2	ANTALYA YAT TURU SETUR MARİNA	ANTALYA	TRY	2025-10-31 21:49:25.885584	2025-10-31 21:49:25.885584	{"2": 5410, "3": 7690, "4": 11640}
52	2	ANTALYA YAT TURU SETUR MARİNA	KEMER	TRY	2025-10-31 21:49:25.886227	2025-10-31 21:49:25.886227	{"2": 5140, "3": 7525, "4": 11680}
53	2	ANTALYA YAT TURU SETUR MARİNA	BELEK	TRY	2025-10-31 21:49:25.887889	2025-10-31 21:49:25.887889	{"2": 5435, "3": 8065, "4": 12535}
54	2	ANTALYA YAT TURU SETUR MARİNA	SİDE	TRY	2025-10-31 21:49:25.888726	2025-10-31 21:49:25.888726	{"2": 5845, "3": 8820, "4": 13740}
55	2	ANTALYA YAT TURU SETUR MARİNA	ALANYA	TRY	2025-10-31 21:49:25.889421	2025-10-31 21:49:25.889421	{"2": 6995, "3": 10470, "4": 16025}
56	2	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	ANTALYA	TRY	2025-10-31 21:49:25.890075	2025-10-31 21:49:25.890075	{"2": 5410, "3": 7690, "4": 11640}
57	2	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	KEMER	TRY	2025-10-31 21:49:25.890741	2025-10-31 21:49:25.890741	{"2": 5140, "3": 7525, "4": 11680}
58	2	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	BELEK	TRY	2025-10-31 21:49:25.891456	2025-10-31 21:49:25.891456	{"2": 5435, "3": 8065, "4": 12535}
59	2	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	SİDE	TRY	2025-10-31 21:49:25.892176	2025-10-31 21:49:25.892176	{"2": 6120, "3": 8980, "4": 13690}
60	2	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	ALANYA	TRY	2025-10-31 21:49:25.892859	2025-10-31 21:49:25.892859	{"2": 6995, "3": 10470, "4": 16025}
61	2	ANTALYA ŞEHİR TURU	ANTALYA	TRY	2025-10-31 21:49:25.893555	2025-10-31 21:49:25.893555	{"2": 5520, "3": 7890, "4": 11960}
62	2	ANTALYA ŞEHİR TURU	KEMER	TRY	2025-10-31 21:49:25.894211	2025-10-31 21:49:25.894211	{"2": 5785, "3": 8710, "4": 13565}
63	2	ANTALYA ŞEHİR TURU	BELEK	TRY	2025-10-31 21:49:25.894854	2025-10-31 21:49:25.894854	{"2": 5550, "3": 8280, "4": 12880}
64	2	ANTALYA ŞEHİR TURU	SİDE	TRY	2025-10-31 21:49:25.895492	2025-10-31 21:49:25.895492	{"2": 6220, "3": 9170, "4": 14000}
65	2	ANTALYA ŞEHİR TURU	ALANYA	TRY	2025-10-31 21:49:25.8963	2025-10-31 21:49:25.8963	{"2": 7275, "3": 10985, "4": 16855}
66	2	ALANYA ŞEHİR TURU	SİDE	TRY	2025-10-31 21:49:25.896986	2025-10-31 21:49:25.896986	{"2": 5950, "3": 8680, "4": 13220}
67	2	ALANYA ŞEHİR TURU	ALANYA	TRY	2025-10-31 21:49:25.897626	2025-10-31 21:49:25.897626	{"2": 5795, "3": 8285, "4": 12560}
68	2	ALARAHAN PİKNİK TURU	SİDE	TRY	2025-10-31 21:49:25.898257	2025-10-31 21:49:25.898257	{"2": 5850, "3": 8480, "4": 12900}
69	2	ALARAHAN PİKNİK TURU	ALANYA	TRY	2025-10-31 21:49:25.8989	2025-10-31 21:49:25.8989	{"2": 5795, "3": 8285, "4": 12560}
70	2	ALANYA BOT TURU	SİDE	TRY	2025-10-31 21:49:25.899664	2025-10-31 21:49:25.899664	{"2": 5670, "3": 8495, "4": 13225}
71	2	ALANYA BOT TURU	ALANYA	TRY	2025-10-31 21:49:25.900571	2025-10-31 21:49:25.900571	{"2": 5795, "3": 8285, "4": 12560}
72	2	WATER PLANET	SİDE	TRY	2025-10-31 21:49:25.901205	2025-10-31 21:49:25.901205	{"2": 5850, "3": 8480, "4": 12900}
73	2	WATER PLANET	ALANYA	TRY	2025-10-31 21:49:25.901839	2025-10-31 21:49:25.901839	{"2": 5745, "3": 8180, "4": 12390}
74	2	SEA ALANYA DOLPHIN TURU	ANTALYA	TRY	2025-10-31 21:49:25.902477	2025-10-31 21:49:25.902477	{"2": 6140, "3": 9360, "4": 14595}
75	2	SEA ALANYA DOLPHIN TURU	KEMER	TRY	2025-10-31 21:49:25.903172	2025-10-31 21:49:25.903172	{"2": 7020, "3": 10975, "4": 17170}
76	2	SEA ALANYA DOLPHIN TURU	BELEK	TRY	2025-10-31 21:49:25.904001	2025-10-31 21:49:25.904001	{"2": 5845, "3": 8820, "4": 13740}
77	2	SEA ALANYA DOLPHIN TURU	SİDE	TRY	2025-10-31 21:49:25.904687	2025-10-31 21:49:25.904687	{"2": 4890, "3": 7180, "4": 10950}
78	2	SEA ALANYA DOLPHIN TURU	ALANYA	TRY	2025-10-31 21:49:25.905415	2025-10-31 21:49:25.905415	{"2": 4360, "3": 6345, "4": 9650}
79	2	SEA ALANYA TAM GÜN	ANTALYA	TRY	2025-10-31 21:49:25.90608	2025-10-31 21:49:25.90608	{"2": 6390, "3": 9470, "4": 14480}
80	2	SEA ALANYA TAM GÜN	KEMER	TRY	2025-10-31 21:49:25.906716	2025-10-31 21:49:25.906716	{"2": 7020, "3": 10975, "4": 17170}
81	2	SEA ALANYA TAM GÜN	BELEK	TRY	2025-10-31 21:49:25.907401	2025-10-31 21:49:25.907401	{"2": 5845, "3": 8820, "4": 13740}
82	2	SEA ALANYA TAM GÜN	SİDE	TRY	2025-10-31 21:49:25.908059	2025-10-31 21:49:25.908059	{"2": 5550, "3": 8280, "4": 12880}
83	2	SEA ALANYA TAM GÜN	ALANYA	TRY	2025-10-31 21:49:25.908692	2025-10-31 21:49:25.908692	{"2": 5860, "3": 8390, "4": 12715}
84	2	SİDE ŞEHİR TURU	SİDE	TRY	2025-10-31 21:49:25.909361	2025-10-31 21:49:25.909361	{"2": 5520, "3": 7890, "4": 11960}
85	2	SİDE ŞEHİR TURU	ALANYA	TRY	2025-10-31 21:49:25.909992	2025-10-31 21:49:25.909992	{"2": 6250, "3": 9115, "4": 13880}
1067	5	ANTALYA	HAVALİMANI	TRY	2025-10-31 23:44:18.692465	2025-10-31 23:44:18.692465	{"10": 1600, "11": 2500, "12": 4100}
86	2	BEŞKONAK TURU	ANTALYA	TRY	2025-10-31 21:49:25.910638	2025-10-31 21:49:25.912583	{"2": 5845, "3": 8820, "4": 13740}
87	2	BEŞKONAK TURU	KEMER	TRY	2025-10-31 21:49:25.91129	2025-10-31 21:49:25.9132	{"2": 6435, "3": 9900, "4": 15455}
88	2	BEŞKONAK TURU	BELEK	TRY	2025-10-31 21:49:25.911938	2025-10-31 21:49:25.913802	{"2": 5550, "3": 8280, "4": 12880}
92	2	BEŞKONAK TURU	SİDE	TRY	2025-10-31 21:49:25.914417	2025-10-31 21:49:25.914417	{"2": 6060, "3": 8880, "4": 13530}
93	2	BEŞKONAK TURU	ALANYA	TRY	2025-10-31 21:49:25.915045	2025-10-31 21:49:25.915045	{"2": 6880, "3": 10260, "4": 15700}
94	2	TAZI KANYONU TURU	ANTALYA	TRY	2025-10-31 21:49:25.915715	2025-10-31 21:49:25.915715	{"2": 6140, "3": 9360, "4": 14595}
95	2	TAZI KANYONU TURU	KEMER	TRY	2025-10-31 21:49:25.916346	2025-10-31 21:49:25.916346	{"2": 6725, "3": 10435, "4": 16310}
96	2	TAZI KANYONU TURU	BELEK	TRY	2025-10-31 21:49:25.916978	2025-10-31 21:49:25.916978	{"2": 5490, "3": 8175, "4": 12710}
97	2	TAZI KANYONU TURU	SİDE	TRY	2025-10-31 21:49:25.917611	2025-10-31 21:49:25.917611	{"2": 6140, "3": 9360, "4": 14595}
98	2	TAZI KANYONU TURU	ALANYA	TRY	2025-10-31 21:49:25.918242	2025-10-31 21:49:25.918242	{"2": 7160, "3": 10775, "4": 16530}
99	2	ASPENDOS KONSER TURU	ANTALYA	TRY	2025-10-31 21:49:25.918872	2025-10-31 21:49:25.918872	{"2": 4090, "3": 5940, "4": 9030}
100	2	ASPENDOS KONSER TURU	KEMER	TRY	2025-10-31 21:49:25.919505	2025-10-31 21:49:25.919505	{"2": 5845, "3": 8820, "4": 13740}
101	2	ASPENDOS KONSER TURU	BELEK	TRY	2025-10-31 21:49:25.920238	2025-10-31 21:49:25.920238	{"2": 2660, "3": 3925, "4": 6095}
1068	5	KEMER	HAVALİMANI	TRY	2025-10-31 23:44:18.702487	2025-10-31 23:44:18.702487	{"10": 2600, "11": 4000, "12": 6200}
1069	5	KİRİŞ - ÇAMYUVA-TEKİROVA	HAVALİMANI	TRY	2025-10-31 23:44:18.703255	2025-10-31 23:44:18.703255	{"10": 2800, "11": 4280, "12": 6700}
102	2	ASPENDOS KONSER TURU	SİDE	TRY	2025-10-31 21:49:25.920916	2025-10-31 21:49:25.920916	{"2": 3980, "3": 5740, "4": 8720}
103	2	ASPENDOS KONSER TURU	ALANYA	TRY	2025-10-31 21:49:25.921619	2025-10-31 21:49:25.921619	{"2": 6365, "3": 9325, "4": 14205}
104	2	OYMAPINAR PİKNİK TURU	ANTALYA	TRY	2025-10-31 21:49:25.922264	2025-10-31 21:49:25.922264	{"2": 5950, "3": 8680, "4": 13225}
105	2	OYMAPINAR PİKNİK TURU	KEMER	TRY	2025-10-31 21:49:25.922914	2025-10-31 21:49:25.922914	{"2": 6435, "3": 9900, "4": 15455}
106	2	OYMAPINAR PİKNİK TURU	BELEK	TRY	2025-10-31 21:49:25.923549	2025-10-31 21:49:25.923549	{"2": 5375, "3": 7960, "4": 12365}
107	2	OYMAPINAR PİKNİK TURU	SİDE	TRY	2025-10-31 21:49:25.924201	2025-10-31 21:49:25.924201	{"2": 5310, "3": 7490, "4": 11330}
108	2	OYMAPINAR PİKNİK TURU	ALANYA	TRY	2025-10-31 21:49:25.924828	2025-10-31 21:49:25.924828	{"2": 6250, "3": 9115, "4": 13880}
109	2	KARACAÖREN PİKNİK TURU	ANTALYA	TRY	2025-10-31 21:49:25.925479	2025-10-31 21:49:25.925479	{"2": 5850, "3": 8480, "4": 12900}
110	2	KARACAÖREN PİKNİK TURU	KEMER	TRY	2025-10-31 21:49:25.926257	2025-10-31 21:49:25.926257	{"2": 6140, "3": 9360, "4": 14595}
111	2	KARACAÖREN PİKNİK TURU	BELEK	TRY	2025-10-31 21:49:25.926907	2025-10-31 21:49:25.926907	{"2": 5610, "3": 8390, "4": 13050}
112	2	KARACAÖREN PİKNİK TURU	SİDE	TRY	2025-10-31 21:49:25.927565	2025-10-31 21:49:25.927565	{"2": 6080, "3": 9250, "4": 14425}
113	2	KARACAÖREN PİKNİK TURU	ALANYA	TRY	2025-10-31 21:49:25.928304	2025-10-31 21:49:25.928304	{"2": 7275, "3": 10985, "4": 16855}
114	2	DEMRE KEKOVA TURU	ANTALYA	TRY	2025-10-31 21:49:25.928946	2025-10-31 21:49:25.928946	{"2": 6725, "3": 10435, "4": 16310}
115	2	DEMRE KEKOVA TURU	KEMER	TRY	2025-10-31 21:49:25.929599	2025-10-31 21:49:25.929599	{"2": 6140, "3": 9360, "4": 14595}
116	2	DEMRE KEKOVA TURU	BELEK	TRY	2025-10-31 21:49:25.930234	2025-10-31 21:49:25.930234	{"2": 7020, "3": 10975, "4": 17170}
117	2	DEMRE KEKOVA TURU	SİDE	TRY	2025-10-31 21:49:25.930899	2025-10-31 21:49:25.930899	{"2": 7435, "3": 11730, "4": 18370}
118	2	DEMRE KEKOVA TURU	ALANYA	TRY	2025-10-31 21:49:25.931552	2025-10-31 21:49:25.931552	{"2": 8695, "3": 13590, "4": 21000}
119	2	PAMUKKALE 1 GÜN	ANTALYA	TRY	2025-10-31 21:49:25.932191	2025-10-31 21:49:25.932191	{"2": 8500, "3": 13000, "4": 21500}
120	2	PAMUKKALE 1 GÜN	KEMER	TRY	2025-10-31 21:49:25.932819	2025-10-31 21:49:25.932819	{"2": 9190, "3": 14065, "4": 23345}
121	2	PAMUKKALE 1 GÜN	BELEK	TRY	2025-10-31 21:49:25.933452	2025-10-31 21:49:25.933452	{"2": 9190, "3": 14065, "4": 23345}
122	2	PAMUKKALE 1 GÜN	SİDE	TRY	2025-10-31 21:49:25.934077	2025-10-31 21:49:25.934077	{"2": 8490, "3": 13670, "4": 21455}
123	2	PAMUKKALE 1 GÜN	ALANYA	TRY	2025-10-31 21:49:25.934705	2025-10-31 21:49:25.934705	{"2": 9255, "3": 15070, "4": 23685}
124	2	PAMUKKALE SALDA TURU	ANTALYA	TRY	2025-10-31 21:49:25.935335	2025-10-31 21:49:25.935335	{"2": 9500, "3": 15000, "4": 24750}
125	2	PAMUKKALE SALDA TURU	KEMER	TRY	2025-10-31 21:49:25.936021	2025-10-31 21:49:25.936021	{"2": 10315, "3": 15940, "4": 25780}
126	2	PAMUKKALE SALDA TURU	BELEK	TRY	2025-10-31 21:49:25.936822	2025-10-31 21:49:25.936822	{"2": 10315, "3": 15940, "4": 25780}
127	2	PAMUKKALE SALDA TURU	SİDE	TRY	2025-10-31 21:49:25.937745	2025-10-31 21:49:25.937745	{"2": 8785, "3": 14210, "4": 22315}
128	2	PAMUKKALE SALDA TURU	ALANYA	TRY	2025-10-31 21:49:25.938628	2025-10-31 21:49:25.938628	{"2": 9550, "3": 15610, "4": 24540}
129	2	PAMUKKALE 2 GÜN	ANTALYA	TRY	2025-10-31 21:49:25.939317	2025-10-31 21:49:25.939317	{"2": 12570, "3": 19255, "4": 30050}
130	2	PAMUKKALE 2 GÜN	KEMER	TRY	2025-10-31 21:49:25.939969	2025-10-31 21:49:25.939969	{"2": 13040, "3": 20120, "4": 31420}
131	2	PAMUKKALE 2 GÜN	BELEK	TRY	2025-10-31 21:49:25.940613	2025-10-31 21:49:25.940613	{"2": 12690, "3": 19475, "4": 30390}
132	2	PAMUKKALE 2 GÜN	SİDE	TRY	2025-10-31 21:49:25.941345	2025-10-31 21:49:25.941345	{"2": 13280, "3": 20550, "4": 32105}
133	2	PAMUKKALE 2 GÜN	ALANYA	TRY	2025-10-31 21:49:25.942011	2025-10-31 21:49:25.942011	{"2": 15110, "3": 23005, "4": 35365}
134	2	KAPADOKYA 2 GÜN	ANTALYA	TRY	2025-10-31 21:49:25.942649	2025-10-31 21:49:25.942649	{"2": 19000, "3": 29000, "4": 46000}
135	2	KAPADOKYA 2 GÜN	KEMER	TRY	2025-10-31 21:49:25.943581	2025-10-31 21:49:25.943581	{"2": 17215, "3": 27775, "4": 43595}
136	2	KAPADOKYA 2 GÜN	BELEK	TRY	2025-10-31 21:49:25.944217	2025-10-31 21:49:25.944217	{"2": 16100, "3": 25725, "4": 40340}
137	2	KAPADOKYA 2 GÜN	SİDE	TRY	2025-10-31 21:49:25.944847	2025-10-31 21:49:25.944847	{"2": 15805, "3": 25185, "4": 39480}
138	2	KAPADOKYA 2 GÜN	ALANYA	TRY	2025-10-31 21:49:25.945488	2025-10-31 21:49:25.945488	{"2": 16100, "3": 25725, "4": 40340}
139	2	EFES PAMUKKALE 2 GÜN	ANTALYA	TRY	2025-10-31 21:49:25.94614	2025-10-31 21:49:25.94614	{"2": 18000, "3": 27000, "4": 45000}
140	2	EFES PAMUKKALE 2 GÜN	KEMER	TRY	2025-10-31 21:49:25.94689	2025-10-31 21:49:25.94689	{"2": 18750, "3": 28125, "4": 48750}
141	2	EFES PAMUKKALE 2 GÜN	BELEK	TRY	2025-10-31 21:49:25.947525	2025-10-31 21:49:25.947525	{"2": 17815, "3": 26250, "4": 44065}
142	2	EFES PAMUKKALE 2 GÜN	SİDE	TRY	2025-10-31 21:49:25.948157	2025-10-31 21:49:25.948157	{"2": 16980, "3": 27340, "4": 42910}
143	2	EFES PAMUKKALE 2 GÜN	ALANYA	TRY	2025-10-31 21:49:25.948786	2025-10-31 21:49:25.948786	{"2": 19080, "3": 30285, "4": 46935}
144	2	DEMRE PAMUKKALE TURU 2 GÜN	ANTALYA	TRY	2025-10-31 21:49:25.949417	2025-10-31 21:49:25.949417	{"2": 16000, "3": 21910, "4": 39000}
145	2	DEMRE PAMUKKALE TURU 2 GÜN	KEMER	TRY	2025-10-31 21:49:25.950055	2025-10-31 21:49:25.950055	{"2": 15220, "3": 24110, "4": 37765}
146	2	DEMRE PAMUKKALE TURU 2 GÜN	BELEK	TRY	2025-10-31 21:49:25.950683	2025-10-31 21:49:25.950683	{"2": 14630, "3": 23030, "4": 36050}
147	2	DEMRE PAMUKKALE TURU 2 GÜN	SİDE	TRY	2025-10-31 21:49:25.951349	2025-10-31 21:49:25.951349	{"2": 15220, "3": 24110, "4": 37765}
148	2	DEMRE PAMUKKALE TURU 2 GÜN	ALANYA	TRY	2025-10-31 21:49:25.951977	2025-10-31 21:49:25.951977	{"2": 16100, "3": 25725, "4": 40340}
149	2	KAŞ TURU	ANTALYA	TRY	2025-10-31 21:49:25.95261	2025-10-31 21:49:25.95261	{"2": 7610, "3": 12055, "4": 18885}
150	2	KAŞ TURU	KEMER	TRY	2025-10-31 21:49:25.953293	2025-10-31 21:49:25.953293	{"2": 6550, "3": 10115, "4": 15795}
151	2	KEMER ŞEHİR TURU	ANTALYA	TRY	2025-10-31 21:49:25.954042	2025-10-31 21:49:25.954042	{"2": 6020, "3": 9145, "4": 14250}
152	2	KEMER ŞEHİR TURU	KEMER	TRY	2025-10-31 21:49:25.954725	2025-10-31 21:49:25.954725	{"2": 5255, "3": 7740, "4": 12025}
153	2	KEMER ŞEHİR TURU	BELEK	TRY	2025-10-31 21:49:25.955519	2025-10-31 21:49:25.955519	{"2": 6200, "3": 9465, "4": 14765}
154	2	KEMER ŞEHİR TURU	SİDE	TRY	2025-10-31 21:49:25.956182	2025-10-31 21:49:25.956182	{"2": 6725, "3": 10435, "4": 16310}
155	2	KEMER ŞEHİR TURU	ALANYA	TRY	2025-10-31 21:49:25.956815	2025-10-31 21:49:25.956815	{"2": 8010, "3": 12340, "4": 19005}
156	2	ADRASAN SULUADA TURU	ANTALYA	TRY	2025-10-31 21:49:25.957466	2025-10-31 21:49:25.957466	{"2": 6020, "3": 9145, "4": 14250}
157	2	ADRASAN SULUADA TURU	KEMER	TRY	2025-10-31 21:49:25.958116	2025-10-31 21:49:25.958116	{"2": 5435, "3": 8065, "4": 12535}
158	2	ADRASAN SULUADA TURU	BELEK	TRY	2025-10-31 21:49:25.958746	2025-10-31 21:49:25.958746	{"2": 6255, "3": 9575, "4": 14940}
159	2	ADRASAN SULUADA TURU	SİDE	TRY	2025-10-31 21:49:25.959411	2025-10-31 21:49:25.959411	{"2": 6725, "3": 10435, "4": 16310}
160	2	ADRASAN SULUADA TURU	ALANYA	TRY	2025-10-31 21:49:25.960048	2025-10-31 21:49:25.960048	{"2": 8130, "3": 12550, "4": 19330}
161	2	KEMER BOT TURU	ANTALYA	TRY	2025-10-31 21:49:25.960681	2025-10-31 21:49:25.960681	{"2": 5435, "3": 8065, "4": 12535}
162	2	KEMER BOT TURU	KEMER	TRY	2025-10-31 21:49:25.961311	2025-10-31 21:49:25.961311	{"2": 4965, "3": 7205, "4": 11165}
163	2	KEMER BOT TURU	BELEK	TRY	2025-10-31 21:49:25.961984	2025-10-31 21:49:25.961984	{"2": 5725, "3": 8605, "4": 13395}
164	2	KEMER BOT TURU	SİDE	TRY	2025-10-31 21:49:25.962625	2025-10-31 21:49:25.962625	{"2": 6140, "3": 9360, "4": 14595}
165	2	KEMER BOT TURU	ALANYA	TRY	2025-10-31 21:49:25.963252	2025-10-31 21:49:25.963252	{"2": 7560, "3": 11510, "4": 17685}
166	2	GÖYNÜK DİNOPARK TURU	ANTALYA	TRY	2025-10-31 21:49:25.963891	2025-10-31 21:49:25.963891	{"2": 5630, "3": 8080, "4": 12270}
167	2	GÖYNÜK DİNOPARK TURU	KEMER	TRY	2025-10-31 21:49:25.964519	2025-10-31 21:49:25.964519	{"2": 4965, "3": 7205, "4": 11165}
168	2	GÖYNÜK DİNOPARK TURU	BELEK	TRY	2025-10-31 21:49:25.965148	2025-10-31 21:49:25.965148	{"2": 5610, "3": 8390, "4": 13050}
169	2	TAHTALI TURU	ANTALYA	TRY	2025-10-31 21:49:25.965815	2025-10-31 21:49:25.965815	{"2": 5845, "3": 8820, "4": 13740}
170	2	TAHTALI TURU	KEMER	TRY	2025-10-31 21:49:25.966452	2025-10-31 21:49:25.966452	{"2": 5080, "3": 7420, "4": 11510}
171	2	TAHTALI TURU	BELEK	TRY	2025-10-31 21:49:25.967082	2025-10-31 21:49:25.967082	{"2": 5965, "3": 9035, "4": 14080}
172	2	TAHTALI TURU	SİDE	TRY	2025-10-31 21:49:25.967718	2025-10-31 21:49:25.967718	{"2": 6490, "3": 10005, "4": 15625}
173	2	TAHTALI TURU	ALANYA	TRY	2025-10-31 21:49:25.968348	2025-10-31 21:49:25.968348	{"2": 7780, "3": 11920, "4": 18345}
174	2	TAHTALI + AKVARYUM TURU	ANTALYA	TRY	2025-10-31 21:49:25.969022	2025-10-31 21:49:25.969022	{"2": 6120, "3": 9500, "4": 15000}
175	2	TAHTALI + AKVARYUM TURU	KEMER	TRY	2025-10-31 21:49:25.969661	2025-10-31 21:49:25.969661	{"2": 5670, "3": 8495, "4": 13225}
176	2	TAHTALI + AKVARYUM TURU	BELEK	TRY	2025-10-31 21:49:25.970378	2025-10-31 21:49:25.970378	{"2": 5965, "3": 9035, "4": 14080}
177	2	TAHTALI + AKVARYUM TURU	SİDE	TRY	2025-10-31 21:49:25.97118	2025-10-31 21:49:25.97118	{"2": 6490, "3": 10005, "4": 15625}
178	2	TAHTALI + AKVARYUM TURU	ALANYA	TRY	2025-10-31 21:49:25.972071	2025-10-31 21:49:25.972071	{"2": 7780, "3": 11920, "4": 18345}
179	2	ULUPINAR OLİMPOS PHASELİS TURU	ANTALYA	TRY	2025-10-31 21:49:25.972761	2025-10-31 21:49:25.972761	{"2": 6280, "3": 9270, "4": 14160}
180	2	ULUPINAR OLİMPOS PHASELİS TURU	KEMER	TRY	2025-10-31 21:49:25.973399	2025-10-31 21:49:25.973399	{"2": 5435, "3": 8065, "4": 12535}
181	2	ULUPINAR OLİMPOS PHASELİS TURU	BELEK	TRY	2025-10-31 21:49:25.974043	2025-10-31 21:49:25.974043	{"2": 6200, "3": 9465, "4": 14765}
182	2	ULUPINAR OLİMPOS PHASELİS TURU	SİDE	TRY	2025-10-31 21:49:25.9748	2025-10-31 21:49:25.9748	{"2": 6725, "3": 10435, "4": 16310}
183	2	ULUPINAR OLİMPOS PHASELİS TURU	ALANYA	TRY	2025-10-31 21:49:25.975477	2025-10-31 21:49:25.975477	{"2": 8010, "3": 12340, "4": 19005}
184	2	PERGE ANTALYA TURU	ANTALYA	TRY	2025-10-31 21:49:25.976157	2025-10-31 21:49:25.976157	{"2": 5630, "3": 8080, "4": 12270}
185	2	PERGE ANTALYA TURU	KEMER	TRY	2025-10-31 21:49:25.976815	2025-10-31 21:49:25.976815	{"2": 6020, "3": 9145, "4": 14250}
186	2	PERGE ANTALYA TURU	BELEK	TRY	2025-10-31 21:49:25.977498	2025-10-31 21:49:25.977498	{"2": 5550, "3": 8280, "4": 12880}
187	2	PERGE ANTALYA TURU	SİDE	TRY	2025-10-31 21:49:25.978162	2025-10-31 21:49:25.978162	{"2": 5965, "3": 9035, "4": 14080}
188	2	PERGE ANTALYA TURU	ALANYA	TRY	2025-10-31 21:49:25.978798	2025-10-31 21:49:25.978798	{"2": 6725, "3": 10435, "4": 16310}
189	2	PERGE ASPENDOS SİDE	ANTALYA	TRY	2025-10-31 21:49:25.979432	2025-10-31 21:49:25.979432	{"2": 5725, "3": 8605, "4": 13395}
190	2	PERGE ASPENDOS SİDE	KEMER	TRY	2025-10-31 21:49:25.980074	2025-10-31 21:49:25.980074	{"2": 6375, "3": 9790, "4": 15280}
191	2	PERGE ASPENDOS SİDE	BELEK	TRY	2025-10-31 21:49:25.980745	2025-10-31 21:49:25.980745	{"2": 5435, "3": 8065, "4": 12535}
192	2	PERGE ASPENDOS SİDE	SİDE	TRY	2025-10-31 21:49:25.981378	2025-10-31 21:49:25.981378	{"2": 5845, "3": 8820, "4": 13740}
193	2	PERGE ASPENDOS SİDE	ALANYA	TRY	2025-10-31 21:49:25.98201	2025-10-31 21:49:25.98201	{"2": 6670, "3": 10330, "4": 16140}
194	2	ANTALYA AKŞAM YEMEK TURU	ANTALYA	TRY	2025-10-31 21:49:25.982668	2025-10-31 21:49:25.982668	{"2": 3970, "3": 5760, "4": 8930}
195	2	ANTALYA AKŞAM YEMEK TURU	KEMER	TRY	2025-10-31 21:49:25.983325	2025-10-31 21:49:25.983325	{"2": 5255, "3": 7740, "4": 12025}
196	2	ANTALYA AKŞAM YEMEK TURU	BELEK	TRY	2025-10-31 21:49:25.984201	2025-10-31 21:49:25.984201	{"2": 4205, "3": 6195, "4": 9620}
197	2	ANTALYA AKŞAM YEMEK TURU	SİDE	TRY	2025-10-31 21:49:25.984851	2025-10-31 21:49:25.984851	{"2": 5550, "3": 8280, "4": 12880}
198	2	ANTALYA AKŞAM YEMEK TURU	ALANYA	TRY	2025-10-31 21:49:25.985496	2025-10-31 21:49:25.985496	{"2": 6140, "3": 9360, "4": 14595}
199	2	KEMER	KEMER	TRY	2025-10-31 21:49:25.986137	2025-10-31 21:49:25.986137	{"2": 1800, "3": 2665, "4": 4075}
200	2	KEMER	ANTALYA	TRY	2025-10-31 21:49:25.986813	2025-10-31 21:49:25.986813	{"2": 2510, "3": 3895, "4": 5950}
201	2	KEMER	BELEK	TRY	2025-10-31 21:49:25.987466	2025-10-31 21:49:25.987466	{"2": 4150, "3": 6470, "4": 9890}
202	2	KEMER	SİDE	TRY	2025-10-31 21:49:25.98811	2025-10-31 21:49:25.98811	{"2": 5480, "3": 8665, "4": 13375}
203	2	KEMER	ALANYA	TRY	2025-10-31 21:49:25.988797	2025-10-31 21:49:25.988797	{"2": 7570, "3": 12085, "4": 18610}
204	2	ANTALYA	ANTALYA	TRY	2025-10-31 21:49:25.989475	2025-10-31 21:49:25.989475	{"2": 1800, "3": 2665, "4": 4075}
205	2	ANTALYA	BELEK	TRY	2025-10-31 21:49:25.990252	2025-10-31 21:49:25.990252	{"2": 2160, "3": 3275, "4": 4915}
206	2	ANTALYA	SİDE	TRY	2025-10-31 21:49:25.990913	2025-10-31 21:49:25.990913	{"2": 3115, "3": 4870, "4": 7360}
207	2	ANTALYA	ALANYA	TRY	2025-10-31 21:49:25.99156	2025-10-31 21:49:25.99156	{"2": 4355, "3": 6865, "4": 10565}
208	2	BELEK	BELEK	TRY	2025-10-31 21:49:25.992291	2025-10-31 21:49:25.992291	{"2": 1800, "3": 2665, "4": 4075}
209	2	BELEK	SİDE	TRY	2025-10-31 21:49:25.992945	2025-10-31 21:49:25.992945	{"2": 2420, "3": 3700, "4": 5650}
210	2	BELEK	ALANYA	TRY	2025-10-31 21:49:25.993581	2025-10-31 21:49:25.993581	{"2": 3985, "3": 6255, "4": 9505}
211	2	SİDE	SİDE	TRY	2025-10-31 21:49:25.994212	2025-10-31 21:49:25.994212	{"2": 1800, "3": 2665, "4": 4075}
212	2	SİDE	ALANYA	TRY	2025-10-31 21:49:25.994841	2025-10-31 21:49:25.994841	{"2": 3115, "3": 4870, "4": 7360}
213	2	BÖLGE İÇİ ARA TRANSFER	ARA TRANSFER	TRY	2025-10-31 21:49:25.995503	2025-10-31 21:49:25.995503	{"2": 1800, "3": 2665, "4": 4075}
214	15	ANTALYA	HAVALİMANI	USD	2025-10-31 21:53:04.596655	2025-10-31 21:53:04.596655	{"35": 1600, "36": 1600, "37": 2500, "38": 4100, "39": 4100}
215	15	KEMER	HAVALİMANI	USD	2025-10-31 21:53:04.610934	2025-10-31 21:53:04.610934	{"35": 2600, "36": 2600, "37": 4000, "38": 6200, "39": 6200}
216	15	KİRİŞ - ÇAMYUVA-TEKİROVA	HAVALİMANI	USD	2025-10-31 21:53:04.611735	2025-10-31 21:53:04.611735	{"35": 2800, "36": 2800, "37": 4280, "38": 6700, "39": 6700}
217	15	BELEK	HAVALİMANI	USD	2025-10-31 21:53:04.612464	2025-10-31 21:53:04.612464	{"35": 2270, "36": 2270, "37": 3500, "38": 5600, "39": 5600}
218	15	BOĞAZKENT	HAVALİMANI	USD	2025-10-31 21:53:04.613346	2025-10-31 21:53:04.613346	{"35": 2450, "36": 2450, "37": 3850, "38": 6000, "39": 6000}
219	15	DENİZYAKA LİKYA WORLD	HAVALİMANI	USD	2025-10-31 21:53:04.614219	2025-10-31 21:53:04.614219	{"35": 2750, "36": 2750, "37": 4100, "38": 6900, "39": 6900}
220	15	SİDE	HAVALİMANI	USD	2025-10-31 21:53:04.61501	2025-10-31 21:53:04.61501	{"35": 2750, "36": 2750, "37": 4100, "38": 6900, "39": 6900}
221	15	KIZILAĞAÇ - KIZILOT	HAVALİMANI	USD	2025-10-31 21:53:04.615668	2025-10-31 21:53:04.615668	{"35": 2940, "36": 2940, "37": 4350, "38": 7300, "39": 7300}
222	15	ALANYA	HAVALİMANI	USD	2025-10-31 21:53:04.616314	2025-10-31 21:53:04.616314	{"35": 3640, "36": 3640, "37": 5500, "38": 8665, "39": 8665}
223	15	MAHMUTLAR	HAVALİMANI	USD	2025-10-31 21:53:04.616962	2025-10-31 21:53:04.616962	{"35": 3825, "36": 3825, "37": 5775, "38": 9100, "39": 9100}
224	15	ÇIRALI	HAVALİMANI	USD	2025-10-31 21:53:04.617605	2025-10-31 21:53:04.617605	{"35": 3470, "36": 3470, "37": 5400, "38": 8920, "39": 8920}
1070	5	BELEK	HAVALİMANI	TRY	2025-10-31 23:44:18.704012	2025-10-31 23:44:18.704012	{"10": 2270, "11": 3500, "12": 5600}
226	15	KUMLUCA	HAVALİMANI	USD	2025-10-31 21:53:04.619438	2025-10-31 21:53:04.619438	{"35": 4205, "36": 4205, "37": 6360, "38": 10270, "39": 10270}
227	15	FİNİKE	HAVALİMANI	USD	2025-10-31 21:53:04.620485	2025-10-31 21:53:04.620485	{"35": 4885, "36": 4885, "37": 7380, "38": 11445, "39": 11445}
228	15	DEMRE	HAVALİMANI	USD	2025-10-31 21:53:04.621236	2025-10-31 21:53:04.621236	{"35": 6235, "36": 6235, "37": 9430, "38": 15285, "39": 15285}
229	15	KAŞ	HAVALİMANI	USD	2025-10-31 21:53:04.621892	2025-10-31 21:53:04.621892	{"35": 7440, "36": 7440, "37": 11720, "38": 19775, "39": 19775}
230	15	FETHİYE	HAVALİMANI	USD	2025-10-31 21:53:04.622531	2025-10-31 21:53:04.622531	{"35": 8205, "36": 8205, "37": 13210, "38": 22220, "39": 22220}
231	15	DALAMAN	HAVALİMANI	USD	2025-10-31 21:53:04.623209	2025-10-31 21:53:04.623209	{"35": 9160, "36": 9160, "37": 14665, "38": 24685, "39": 24685}
232	15	MARMARİS	HAVALİMANI	USD	2025-10-31 21:53:04.623957	2025-10-31 21:53:04.623957	{"35": 12790, "36": 12790, "37": 20550, "38": 34595, "39": 34595}
233	15	BODRUM	HAVALİMANI	USD	2025-10-31 21:53:04.624656	2025-10-31 21:53:04.624656	{"35": 16455, "36": 16455, "37": 26410, "38": 44475, "39": 44475}
234	15	GAZİPAŞA	ALANYA	USD	2025-10-31 21:53:04.625333	2025-10-31 21:53:04.625333	{"35": 3120, "36": 3120, "37": 4800, "38": 8000, "39": 8000}
235	15	GAZİPAŞA	SİDE	USD	2025-10-31 21:53:04.626022	2025-10-31 21:53:04.626022	{"35": 3880, "36": 3880, "37": 6050, "38": 10100, "39": 10100}
236	15	GAZİPAŞA	BELEK	USD	2025-10-31 21:53:04.626668	2025-10-31 21:53:04.626668	{"35": 4600, "36": 4600, "37": 7200, "38": 12100, "39": 12100}
237	15	GAZİPAŞA	ANTALYA	USD	2025-10-31 21:53:04.627475	2025-10-31 21:53:04.627475	{"35": 5350, "36": 5350, "37": 8450, "38": 14100, "39": 14100}
238	15	GAZİPAŞA	KEMER	USD	2025-10-31 21:53:04.628118	2025-10-31 21:53:04.628118	{"35": 6550, "36": 6550, "37": 10300, "38": 17250, "39": 17250}
239	15	MANAVGAT BOT TURU	ANTALYA	USD	2025-10-31 21:53:04.628758	2025-10-31 21:53:04.628758	{"35": 5850, "36": 5850, "37": 8480, "38": 12900, "39": 12900}
240	15	MANAVGAT BOT TURU	KEMER	USD	2025-10-31 21:53:04.629415	2025-10-31 21:53:04.629415	{"35": 6255, "36": 6255, "37": 9575, "38": 14940, "39": 14940}
241	15	MANAVGAT BOT TURU	BELEK	USD	2025-10-31 21:53:04.630142	2025-10-31 21:53:04.630142	{"35": 5255, "36": 5255, "37": 7740, "38": 12025, "39": 12025}
242	15	MANAVGAT BOT TURU	SİDE	USD	2025-10-31 21:53:04.630809	2025-10-31 21:53:04.630809	{"35": 5310, "36": 5310, "37": 7490, "38": 11330, "39": 11330}
243	15	MANAVGAT BOT TURU	ALANYA	USD	2025-10-31 21:53:04.631496	2025-10-31 21:53:04.631496	{"35": 6030, "36": 6030, "37": 8695, "38": 13220, "39": 13220}
244	15	DISCOVERY PARK TURU	ANTALYA	USD	2025-10-31 21:53:04.63214	2025-10-31 21:53:04.63214	{"35": 5850, "36": 5850, "37": 8480, "38": 12900, "39": 12900}
245	15	DISCOVERY PARK TURU	KEMER	USD	2025-10-31 21:53:04.632778	2025-10-31 21:53:04.632778	{"35": 6255, "36": 6255, "37": 9575, "38": 14940, "39": 14940}
246	15	DISCOVERY PARK TURU	BELEK	USD	2025-10-31 21:53:04.633477	2025-10-31 21:53:04.633477	{"35": 4380, "36": 4380, "37": 6940, "38": 10780, "39": 10780}
247	15	DISCOVERY PARK TURU	SİDE	USD	2025-10-31 21:53:04.63418	2025-10-31 21:53:04.63418	{"35": 3880, "36": 3880, "37": 5540, "38": 8400, "39": 8400}
248	15	DISCOVERY PARK TURU	ALANYA	USD	2025-10-31 21:53:04.635224	2025-10-31 21:53:04.635224	{"35": 5030, "36": 5030, "37": 7330, "38": 11175, "39": 11175}
249	15	BELEK LAND OF LEGENDS TURU	ANTALYA	USD	2025-10-31 21:53:04.635996	2025-10-31 21:53:04.635996	{"35": 5360, "36": 5360, "37": 7590, "38": 11480, "39": 11480}
250	15	BELEK LAND OF LEGENDS TURU	KEMER	USD	2025-10-31 21:53:04.636754	2025-10-31 21:53:04.636754	{"35": 5845, "36": 5845, "37": 8820, "38": 13740, "39": 13740}
251	15	BELEK LAND OF LEGENDS TURU	BELEK	USD	2025-10-31 21:53:04.637498	2025-10-31 21:53:04.637498	{"35": 4815, "36": 4815, "37": 6935, "38": 10735, "39": 10735}
252	15	BELEK LAND OF LEGENDS TURU	SİDE	USD	2025-10-31 21:53:04.638201	2025-10-31 21:53:04.638201	{"35": 5520, "36": 5520, "37": 7890, "38": 11960, "39": 11960}
253	15	BELEK LAND OF LEGENDS TURU	ALANYA	USD	2025-10-31 21:53:04.638887	2025-10-31 21:53:04.638887	{"35": 6425, "36": 6425, "37": 9430, "38": 14375, "39": 14375}
254	15	AQUALAND TURU / AKVARYUM TURU	ANTALYA	USD	2025-10-31 21:53:04.639561	2025-10-31 21:53:04.639561	{"35": 5310, "36": 5310, "37": 7490, "38": 11330, "39": 11330}
255	15	AQUALAND TURU / AKVARYUM TURU	KEMER	USD	2025-10-31 21:53:04.64023	2025-10-31 21:53:04.64023	{"35": 5255, "36": 5255, "37": 7740, "38": 12025, "39": 12025}
256	15	AQUALAND TURU / AKVARYUM TURU	BELEK	USD	2025-10-31 21:53:04.640881	2025-10-31 21:53:04.640881	{"35": 5255, "36": 5255, "37": 7740, "38": 12025, "39": 12025}
257	15	AQUALAND TURU / AKVARYUM TURU	SİDE	USD	2025-10-31 21:53:04.641612	2025-10-31 21:53:04.641612	{"35": 5850, "36": 5850, "37": 8480, "38": 12900, "39": 12900}
258	15	AQUALAND TURU / AKVARYUM TURU	ALANYA	USD	2025-10-31 21:53:04.642416	2025-10-31 21:53:04.642416	{"35": 6815, "36": 6815, "37": 10155, "38": 15530, "39": 15530}
259	15	TÜNEKTEPE TELEFERİK TURU	ANTALYA	USD	2025-10-31 21:53:04.643079	2025-10-31 21:53:04.643079	{"35": 5410, "36": 5410, "37": 7690, "38": 11640, "39": 11640}
260	15	TÜNEKTEPE TELEFERİK TURU	KEMER	USD	2025-10-31 21:53:04.643717	2025-10-31 21:53:04.643717	{"35": 5140, "36": 5140, "37": 7525, "38": 11680, "39": 11680}
261	15	TÜNEKTEPE TELEFERİK TURU	BELEK	USD	2025-10-31 21:53:04.644356	2025-10-31 21:53:04.644356	{"35": 5435, "36": 5435, "37": 8065, "38": 12535, "39": 12535}
262	15	TÜNEKTEPE TELEFERİK TURU	SİDE	USD	2025-10-31 21:53:04.644996	2025-10-31 21:53:04.644996	{"35": 5845, "36": 5845, "37": 8820, "38": 13740, "39": 13740}
263	15	TÜNEKTEPE TELEFERİK TURU	ALANYA	USD	2025-10-31 21:53:04.645632	2025-10-31 21:53:04.645632	{"35": 6995, "36": 6995, "37": 10470, "38": 16025, "39": 16025}
264	15	ANTALYA YAT TURU SETUR MARİNA	ANTALYA	USD	2025-10-31 21:53:04.646268	2025-10-31 21:53:04.646268	{"35": 5410, "36": 5410, "37": 7690, "38": 11640, "39": 11640}
265	15	ANTALYA YAT TURU SETUR MARİNA	KEMER	USD	2025-10-31 21:53:04.64692	2025-10-31 21:53:04.64692	{"35": 5140, "36": 5140, "37": 7525, "38": 11680, "39": 11680}
266	15	ANTALYA YAT TURU SETUR MARİNA	BELEK	USD	2025-10-31 21:53:04.647626	2025-10-31 21:53:04.647626	{"35": 5435, "36": 5435, "37": 8065, "38": 12535, "39": 12535}
267	15	ANTALYA YAT TURU SETUR MARİNA	SİDE	USD	2025-10-31 21:53:04.648274	2025-10-31 21:53:04.648274	{"35": 5845, "36": 5845, "37": 8820, "38": 13740, "39": 13740}
268	15	ANTALYA YAT TURU SETUR MARİNA	ALANYA	USD	2025-10-31 21:53:04.64892	2025-10-31 21:53:04.64892	{"35": 6995, "36": 6995, "37": 10470, "38": 16025, "39": 16025}
269	15	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	ANTALYA	USD	2025-10-31 21:53:04.649553	2025-10-31 21:53:04.649553	{"35": 5410, "36": 5410, "37": 7690, "38": 11640, "39": 11640}
270	15	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	KEMER	USD	2025-10-31 21:53:04.650194	2025-10-31 21:53:04.650194	{"35": 5140, "36": 5140, "37": 7525, "38": 11680, "39": 11680}
271	15	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	BELEK	USD	2025-10-31 21:53:04.650832	2025-10-31 21:53:04.650832	{"35": 5435, "36": 5435, "37": 8065, "38": 12535, "39": 12535}
272	15	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	SİDE	USD	2025-10-31 21:53:04.651737	2025-10-31 21:53:04.651737	{"35": 6120, "36": 6120, "37": 8980, "38": 13690, "39": 13690}
273	15	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	ALANYA	USD	2025-10-31 21:53:04.652513	2025-10-31 21:53:04.652513	{"35": 6995, "36": 6995, "37": 10470, "38": 16025, "39": 16025}
274	15	ANTALYA ŞEHİR TURU	ANTALYA	USD	2025-10-31 21:53:04.653302	2025-10-31 21:53:04.653302	{"35": 5520, "36": 5520, "37": 7890, "38": 11960, "39": 11960}
275	15	ANTALYA ŞEHİR TURU	KEMER	USD	2025-10-31 21:53:04.654298	2025-10-31 21:53:04.654298	{"35": 5785, "36": 5785, "37": 8710, "38": 13565, "39": 13565}
276	15	ANTALYA ŞEHİR TURU	BELEK	USD	2025-10-31 21:53:04.655064	2025-10-31 21:53:04.655064	{"35": 5550, "36": 5550, "37": 8280, "38": 12880, "39": 12880}
277	15	ANTALYA ŞEHİR TURU	SİDE	USD	2025-10-31 21:53:04.655725	2025-10-31 21:53:04.655725	{"35": 6220, "36": 6220, "37": 9170, "38": 14000, "39": 14000}
278	15	ANTALYA ŞEHİR TURU	ALANYA	USD	2025-10-31 21:53:04.656394	2025-10-31 21:53:04.656394	{"35": 7275, "36": 7275, "37": 10985, "38": 16855, "39": 16855}
279	15	ALANYA ŞEHİR TURU	SİDE	USD	2025-10-31 21:53:04.657034	2025-10-31 21:53:04.657034	{"35": 5950, "36": 5950, "37": 8680, "38": 13220, "39": 13220}
280	15	ALANYA ŞEHİR TURU	ALANYA	USD	2025-10-31 21:53:04.657697	2025-10-31 21:53:04.657697	{"35": 5795, "36": 5795, "37": 8285, "38": 12560, "39": 12560}
281	15	ALARAHAN PİKNİK TURU	SİDE	USD	2025-10-31 21:53:04.658399	2025-10-31 21:53:04.658399	{"35": 5850, "36": 5850, "37": 8480, "38": 12900, "39": 12900}
282	15	ALARAHAN PİKNİK TURU	ALANYA	USD	2025-10-31 21:53:04.659061	2025-10-31 21:53:04.659061	{"35": 5795, "36": 5795, "37": 8285, "38": 12560, "39": 12560}
283	15	ALANYA BOT TURU	SİDE	USD	2025-10-31 21:53:04.659771	2025-10-31 21:53:04.659771	{"35": 5670, "36": 5670, "37": 8495, "38": 13225, "39": 13225}
284	15	ALANYA BOT TURU	ALANYA	USD	2025-10-31 21:53:04.660442	2025-10-31 21:53:04.660442	{"35": 5795, "36": 5795, "37": 8285, "38": 12560, "39": 12560}
285	15	WATER PLANET	SİDE	USD	2025-10-31 21:53:04.661081	2025-10-31 21:53:04.661081	{"35": 5850, "36": 5850, "37": 8480, "38": 12900, "39": 12900}
286	15	WATER PLANET	ALANYA	USD	2025-10-31 21:53:04.661718	2025-10-31 21:53:04.661718	{"35": 5745, "36": 5745, "37": 8180, "38": 12390, "39": 12390}
287	15	SEA ALANYA DOLPHIN TURU	ANTALYA	USD	2025-10-31 21:53:04.662445	2025-10-31 21:53:04.662445	{"35": 6140, "36": 6140, "37": 9360, "38": 14595, "39": 14595}
288	15	SEA ALANYA DOLPHIN TURU	KEMER	USD	2025-10-31 21:53:04.663081	2025-10-31 21:53:04.663081	{"35": 7020, "36": 7020, "37": 10975, "38": 17170, "39": 17170}
289	15	SEA ALANYA DOLPHIN TURU	BELEK	USD	2025-10-31 21:53:04.663738	2025-10-31 21:53:04.663738	{"35": 5845, "36": 5845, "37": 8820, "38": 13740, "39": 13740}
290	15	SEA ALANYA DOLPHIN TURU	SİDE	USD	2025-10-31 21:53:04.664377	2025-10-31 21:53:04.664377	{"35": 4890, "36": 4890, "37": 7180, "38": 10950, "39": 10950}
291	15	SEA ALANYA DOLPHIN TURU	ALANYA	USD	2025-10-31 21:53:04.665017	2025-10-31 21:53:04.665017	{"35": 4360, "36": 4360, "37": 6345, "38": 9650, "39": 9650}
292	15	SEA ALANYA TAM GÜN	ANTALYA	USD	2025-10-31 21:53:04.665684	2025-10-31 21:53:04.665684	{"35": 6390, "36": 6390, "37": 9470, "38": 14480, "39": 14480}
293	15	SEA ALANYA TAM GÜN	KEMER	USD	2025-10-31 21:53:04.666376	2025-10-31 21:53:04.666376	{"35": 7020, "36": 7020, "37": 10975, "38": 17170, "39": 17170}
294	15	SEA ALANYA TAM GÜN	BELEK	USD	2025-10-31 21:53:04.667039	2025-10-31 21:53:04.667039	{"35": 5845, "36": 5845, "37": 8820, "38": 13740, "39": 13740}
295	15	SEA ALANYA TAM GÜN	SİDE	USD	2025-10-31 21:53:04.667684	2025-10-31 21:53:04.667684	{"35": 5550, "36": 5550, "37": 8280, "38": 12880, "39": 12880}
296	15	SEA ALANYA TAM GÜN	ALANYA	USD	2025-10-31 21:53:04.668375	2025-10-31 21:53:04.668375	{"35": 5860, "36": 5860, "37": 8390, "38": 12715, "39": 12715}
297	15	SİDE ŞEHİR TURU	SİDE	USD	2025-10-31 21:53:04.669142	2025-10-31 21:53:04.669142	{"35": 5520, "36": 5520, "37": 7890, "38": 11960, "39": 11960}
298	15	SİDE ŞEHİR TURU	ALANYA	USD	2025-10-31 21:53:04.669907	2025-10-31 21:53:04.669907	{"35": 6250, "36": 6250, "37": 9115, "38": 13880, "39": 13880}
299	15	BEŞKONAK TURU	ANTALYA	USD	2025-10-31 21:53:04.670562	2025-10-31 21:53:04.672595	{"35": 5845, "36": 5845, "37": 8820, "38": 13740, "39": 13740}
300	15	BEŞKONAK TURU	KEMER	USD	2025-10-31 21:53:04.671217	2025-10-31 21:53:04.673215	{"35": 6435, "36": 6435, "37": 9900, "38": 15455, "39": 15455}
301	15	BEŞKONAK TURU	BELEK	USD	2025-10-31 21:53:04.671959	2025-10-31 21:53:04.673823	{"35": 5550, "36": 5550, "37": 8280, "38": 12880, "39": 12880}
305	15	BEŞKONAK TURU	SİDE	USD	2025-10-31 21:53:04.674461	2025-10-31 21:53:04.674461	{"35": 6060, "36": 6060, "37": 8880, "38": 13530, "39": 13530}
306	15	BEŞKONAK TURU	ALANYA	USD	2025-10-31 21:53:04.675102	2025-10-31 21:53:04.675102	{"35": 6880, "36": 6880, "37": 10260, "38": 15700, "39": 15700}
307	15	TAZI KANYONU TURU	ANTALYA	USD	2025-10-31 21:53:04.675762	2025-10-31 21:53:04.675762	{"35": 6140, "36": 6140, "37": 9360, "38": 14595, "39": 14595}
308	15	TAZI KANYONU TURU	KEMER	USD	2025-10-31 21:53:04.676395	2025-10-31 21:53:04.676395	{"35": 6725, "36": 6725, "37": 10435, "38": 16310, "39": 16310}
309	15	TAZI KANYONU TURU	BELEK	USD	2025-10-31 21:53:04.677032	2025-10-31 21:53:04.677032	{"35": 5490, "36": 5490, "37": 8175, "38": 12710, "39": 12710}
310	15	TAZI KANYONU TURU	SİDE	USD	2025-10-31 21:53:04.677676	2025-10-31 21:53:04.677676	{"35": 6140, "36": 6140, "37": 9360, "38": 14595, "39": 14595}
311	15	TAZI KANYONU TURU	ALANYA	USD	2025-10-31 21:53:04.678311	2025-10-31 21:53:04.678311	{"35": 7160, "36": 7160, "37": 10775, "38": 16530, "39": 16530}
312	15	ASPENDOS KONSER TURU	ANTALYA	USD	2025-10-31 21:53:04.679	2025-10-31 21:53:04.679	{"35": 4090, "36": 4090, "37": 5940, "38": 9030, "39": 9030}
313	15	ASPENDOS KONSER TURU	KEMER	USD	2025-10-31 21:53:04.679634	2025-10-31 21:53:04.679634	{"35": 5845, "36": 5845, "37": 8820, "38": 13740, "39": 13740}
314	15	ASPENDOS KONSER TURU	BELEK	USD	2025-10-31 21:53:04.68028	2025-10-31 21:53:04.68028	{"35": 2660, "36": 2660, "37": 3925, "38": 6095, "39": 6095}
315	15	ASPENDOS KONSER TURU	SİDE	USD	2025-10-31 21:53:04.680931	2025-10-31 21:53:04.680931	{"35": 3980, "36": 3980, "37": 5740, "38": 8720, "39": 8720}
316	15	ASPENDOS KONSER TURU	ALANYA	USD	2025-10-31 21:53:04.681564	2025-10-31 21:53:04.681564	{"35": 6365, "36": 6365, "37": 9325, "38": 14205, "39": 14205}
317	15	OYMAPINAR PİKNİK TURU	ANTALYA	USD	2025-10-31 21:53:04.682203	2025-10-31 21:53:04.682203	{"35": 5950, "36": 5950, "37": 8680, "38": 13225, "39": 13225}
318	15	OYMAPINAR PİKNİK TURU	KEMER	USD	2025-10-31 21:53:04.682838	2025-10-31 21:53:04.682838	{"35": 6435, "36": 6435, "37": 9900, "38": 15455, "39": 15455}
319	15	OYMAPINAR PİKNİK TURU	BELEK	USD	2025-10-31 21:53:04.683528	2025-10-31 21:53:04.683528	{"35": 5375, "36": 5375, "37": 7960, "38": 12365, "39": 12365}
320	15	OYMAPINAR PİKNİK TURU	SİDE	USD	2025-10-31 21:53:04.684172	2025-10-31 21:53:04.684172	{"35": 5310, "36": 5310, "37": 7490, "38": 11330, "39": 11330}
321	15	OYMAPINAR PİKNİK TURU	ALANYA	USD	2025-10-31 21:53:04.684815	2025-10-31 21:53:04.684815	{"35": 6250, "36": 6250, "37": 9115, "38": 13880, "39": 13880}
322	15	KARACAÖREN PİKNİK TURU	ANTALYA	USD	2025-10-31 21:53:04.68553	2025-10-31 21:53:04.68553	{"35": 5850, "36": 5850, "37": 8480, "38": 12900, "39": 12900}
323	15	KARACAÖREN PİKNİK TURU	KEMER	USD	2025-10-31 21:53:04.686587	2025-10-31 21:53:04.686587	{"35": 6140, "36": 6140, "37": 9360, "38": 14595, "39": 14595}
324	15	KARACAÖREN PİKNİK TURU	BELEK	USD	2025-10-31 21:53:04.687734	2025-10-31 21:53:04.687734	{"35": 5610, "36": 5610, "37": 8390, "38": 13050, "39": 13050}
325	15	KARACAÖREN PİKNİK TURU	SİDE	USD	2025-10-31 21:53:04.688456	2025-10-31 21:53:04.688456	{"35": 6080, "36": 6080, "37": 9250, "38": 14425, "39": 14425}
457	6	MANAVGAT BOT TURU	ALANYA	TRY	2025-10-31 22:27:17.822369	2025-10-31 22:27:59.138418	{"13": 13220, "14": 8695}
458	6	DISCOVERY PARK TURU	ANTALYA	TRY	2025-10-31 22:27:17.823107	2025-10-31 22:27:59.139665	{"13": 12900, "14": 8480}
460	6	DISCOVERY PARK TURU	BELEK	TRY	2025-10-31 22:27:17.825169	2025-10-31 22:27:59.1414	{"13": 10780, "14": 6940}
461	6	DISCOVERY PARK TURU	SİDE	TRY	2025-10-31 22:27:17.825894	2025-10-31 22:27:59.142113	{"13": 8400, "14": 5540}
326	15	KARACAÖREN PİKNİK TURU	ALANYA	USD	2025-10-31 21:53:04.689127	2025-10-31 21:53:04.689127	{"35": 7275, "36": 7275, "37": 10985, "38": 16855, "39": 16855}
327	15	DEMRE KEKOVA TURU	ANTALYA	USD	2025-10-31 21:53:04.689819	2025-10-31 21:53:04.689819	{"35": 6725, "36": 6725, "37": 10435, "38": 16310, "39": 16310}
328	15	DEMRE KEKOVA TURU	KEMER	USD	2025-10-31 21:53:04.690486	2025-10-31 21:53:04.690486	{"35": 6140, "36": 6140, "37": 9360, "38": 14595, "39": 14595}
329	15	DEMRE KEKOVA TURU	BELEK	USD	2025-10-31 21:53:04.691126	2025-10-31 21:53:04.691126	{"35": 7020, "36": 7020, "37": 10975, "38": 17170, "39": 17170}
330	15	DEMRE KEKOVA TURU	SİDE	USD	2025-10-31 21:53:04.691763	2025-10-31 21:53:04.691763	{"35": 7435, "36": 7435, "37": 11730, "38": 18370, "39": 18370}
331	15	DEMRE KEKOVA TURU	ALANYA	USD	2025-10-31 21:53:04.692433	2025-10-31 21:53:04.692433	{"35": 8695, "36": 8695, "37": 13590, "38": 21000, "39": 21000}
332	15	PAMUKKALE 1 GÜN	ANTALYA	USD	2025-10-31 21:53:04.69307	2025-10-31 21:53:04.69307	{"35": 8500, "36": 8500, "37": 13000, "38": 21500, "39": 21500}
333	15	PAMUKKALE 1 GÜN	KEMER	USD	2025-10-31 21:53:04.693718	2025-10-31 21:53:04.693718	{"35": 9190, "36": 9190, "37": 14065, "38": 23345, "39": 23345}
334	15	PAMUKKALE 1 GÜN	BELEK	USD	2025-10-31 21:53:04.69436	2025-10-31 21:53:04.69436	{"35": 9190, "36": 9190, "37": 14065, "38": 23345, "39": 23345}
335	15	PAMUKKALE 1 GÜN	SİDE	USD	2025-10-31 21:53:04.695028	2025-10-31 21:53:04.695028	{"35": 8490, "36": 8490, "37": 13670, "38": 21455, "39": 21455}
336	15	PAMUKKALE 1 GÜN	ALANYA	USD	2025-10-31 21:53:04.695671	2025-10-31 21:53:04.695671	{"35": 9255, "36": 9255, "37": 15070, "38": 23685, "39": 23685}
337	15	PAMUKKALE SALDA TURU	ANTALYA	USD	2025-10-31 21:53:04.696313	2025-10-31 21:53:04.696313	{"35": 9500, "36": 9500, "37": 15000, "38": 24750, "39": 24750}
338	15	PAMUKKALE SALDA TURU	KEMER	USD	2025-10-31 21:53:04.69695	2025-10-31 21:53:04.69695	{"35": 10315, "36": 10315, "37": 15940, "38": 25780, "39": 25780}
339	15	PAMUKKALE SALDA TURU	BELEK	USD	2025-10-31 21:53:04.697584	2025-10-31 21:53:04.697584	{"35": 10315, "36": 10315, "37": 15940, "38": 25780, "39": 25780}
340	15	PAMUKKALE SALDA TURU	SİDE	USD	2025-10-31 21:53:04.698219	2025-10-31 21:53:04.698219	{"35": 8785, "36": 8785, "37": 14210, "38": 22315, "39": 22315}
341	15	PAMUKKALE SALDA TURU	ALANYA	USD	2025-10-31 21:53:04.69889	2025-10-31 21:53:04.69889	{"35": 9550, "36": 9550, "37": 15610, "38": 24540, "39": 24540}
342	15	PAMUKKALE 2 GÜN	ANTALYA	USD	2025-10-31 21:53:04.699525	2025-10-31 21:53:04.699525	{"35": 12570, "36": 12570, "37": 19255, "38": 30050, "39": 30050}
343	15	PAMUKKALE 2 GÜN	KEMER	USD	2025-10-31 21:53:04.700174	2025-10-31 21:53:04.700174	{"35": 13040, "36": 13040, "37": 20120, "38": 31420, "39": 31420}
344	15	PAMUKKALE 2 GÜN	BELEK	USD	2025-10-31 21:53:04.700822	2025-10-31 21:53:04.700822	{"35": 12690, "36": 12690, "37": 19475, "38": 30390, "39": 30390}
345	15	PAMUKKALE 2 GÜN	SİDE	USD	2025-10-31 21:53:04.701581	2025-10-31 21:53:04.701581	{"35": 13280, "36": 13280, "37": 20550, "38": 32105, "39": 32105}
346	15	PAMUKKALE 2 GÜN	ALANYA	USD	2025-10-31 21:53:04.702422	2025-10-31 21:53:04.702422	{"35": 15110, "36": 15110, "37": 23005, "38": 35365, "39": 35365}
347	15	KAPADOKYA 2 GÜN	ANTALYA	USD	2025-10-31 21:53:04.703153	2025-10-31 21:53:04.703153	{"35": 19000, "36": 19000, "37": 29000, "38": 46000, "39": 46000}
348	15	KAPADOKYA 2 GÜN	KEMER	USD	2025-10-31 21:53:04.703945	2025-10-31 21:53:04.703945	{"35": 17215, "36": 17215, "37": 27775, "38": 43595, "39": 43595}
349	15	KAPADOKYA 2 GÜN	BELEK	USD	2025-10-31 21:53:04.704661	2025-10-31 21:53:04.704661	{"35": 16100, "36": 16100, "37": 25725, "38": 40340, "39": 40340}
350	15	KAPADOKYA 2 GÜN	SİDE	USD	2025-10-31 21:53:04.705405	2025-10-31 21:53:04.705405	{"35": 15805, "36": 15805, "37": 25185, "38": 39480, "39": 39480}
351	15	KAPADOKYA 2 GÜN	ALANYA	USD	2025-10-31 21:53:04.70606	2025-10-31 21:53:04.70606	{"35": 16100, "36": 16100, "37": 25725, "38": 40340, "39": 40340}
352	15	EFES PAMUKKALE 2 GÜN	ANTALYA	USD	2025-10-31 21:53:04.706715	2025-10-31 21:53:04.706715	{"35": 18000, "36": 18000, "37": 27000, "38": 45000, "39": 45000}
353	15	EFES PAMUKKALE 2 GÜN	KEMER	USD	2025-10-31 21:53:04.707352	2025-10-31 21:53:04.707352	{"35": 18750, "36": 18750, "37": 28125, "38": 48750, "39": 48750}
354	15	EFES PAMUKKALE 2 GÜN	BELEK	USD	2025-10-31 21:53:04.707995	2025-10-31 21:53:04.707995	{"35": 17815, "36": 17815, "37": 26250, "38": 44065, "39": 44065}
355	15	EFES PAMUKKALE 2 GÜN	SİDE	USD	2025-10-31 21:53:04.708631	2025-10-31 21:53:04.708631	{"35": 16980, "36": 16980, "37": 27340, "38": 42910, "39": 42910}
356	15	EFES PAMUKKALE 2 GÜN	ALANYA	USD	2025-10-31 21:53:04.709269	2025-10-31 21:53:04.709269	{"35": 19080, "36": 19080, "37": 30285, "38": 46935, "39": 46935}
357	15	DEMRE PAMUKKALE TURU 2 GÜN	ANTALYA	USD	2025-10-31 21:53:04.709908	2025-10-31 21:53:04.709908	{"35": 16000, "36": 16000, "37": 21910, "38": 39000, "39": 39000}
358	15	DEMRE PAMUKKALE TURU 2 GÜN	KEMER	USD	2025-10-31 21:53:04.710567	2025-10-31 21:53:04.710567	{"35": 15220, "36": 15220, "37": 24110, "38": 37765, "39": 37765}
359	15	DEMRE PAMUKKALE TURU 2 GÜN	BELEK	USD	2025-10-31 21:53:04.711248	2025-10-31 21:53:04.711248	{"35": 14630, "36": 14630, "37": 23030, "38": 36050, "39": 36050}
360	15	DEMRE PAMUKKALE TURU 2 GÜN	SİDE	USD	2025-10-31 21:53:04.711885	2025-10-31 21:53:04.711885	{"35": 15220, "36": 15220, "37": 24110, "38": 37765, "39": 37765}
361	15	DEMRE PAMUKKALE TURU 2 GÜN	ALANYA	USD	2025-10-31 21:53:04.712529	2025-10-31 21:53:04.712529	{"35": 16100, "36": 16100, "37": 25725, "38": 40340, "39": 40340}
362	15	KAŞ TURU	ANTALYA	USD	2025-10-31 21:53:04.715719	2025-10-31 21:53:04.715719	{"35": 7610, "36": 7610, "37": 12055, "38": 18885, "39": 18885}
363	15	KAŞ TURU	KEMER	USD	2025-10-31 21:53:04.716387	2025-10-31 21:53:04.716387	{"35": 6550, "36": 6550, "37": 10115, "38": 15795, "39": 15795}
1071	5	BOĞAZKENT	HAVALİMANI	TRY	2025-10-31 23:44:18.704925	2025-10-31 23:44:18.704925	{"10": 2450, "11": 3850, "12": 6000}
364	15	KEMER ŞEHİR TURU	ANTALYA	USD	2025-10-31 21:53:04.71708	2025-10-31 21:53:04.71708	{"35": 6020, "36": 6020, "37": 9145, "38": 14250, "39": 14250}
365	15	KEMER ŞEHİR TURU	KEMER	USD	2025-10-31 21:53:04.717784	2025-10-31 21:53:04.717784	{"35": 5255, "36": 5255, "37": 7740, "38": 12025, "39": 12025}
366	15	KEMER ŞEHİR TURU	BELEK	USD	2025-10-31 21:53:04.718472	2025-10-31 21:53:04.718472	{"35": 6200, "36": 6200, "37": 9465, "38": 14765, "39": 14765}
367	15	KEMER ŞEHİR TURU	SİDE	USD	2025-10-31 21:53:04.719214	2025-10-31 21:53:04.719214	{"35": 6725, "36": 6725, "37": 10435, "38": 16310, "39": 16310}
368	15	KEMER ŞEHİR TURU	ALANYA	USD	2025-10-31 21:53:04.71997	2025-10-31 21:53:04.71997	{"35": 8010, "36": 8010, "37": 12340, "38": 19005, "39": 19005}
369	15	ADRASAN SULUADA TURU	ANTALYA	USD	2025-10-31 21:53:04.720896	2025-10-31 21:53:04.720896	{"35": 6020, "36": 6020, "37": 9145, "38": 14250, "39": 14250}
370	15	ADRASAN SULUADA TURU	KEMER	USD	2025-10-31 21:53:04.721649	2025-10-31 21:53:04.721649	{"35": 5435, "36": 5435, "37": 8065, "38": 12535, "39": 12535}
371	15	ADRASAN SULUADA TURU	BELEK	USD	2025-10-31 21:53:04.72232	2025-10-31 21:53:04.72232	{"35": 6255, "36": 6255, "37": 9575, "38": 14940, "39": 14940}
372	15	ADRASAN SULUADA TURU	SİDE	USD	2025-10-31 21:53:04.722961	2025-10-31 21:53:04.722961	{"35": 6725, "36": 6725, "37": 10435, "38": 16310, "39": 16310}
1072	5	DENİZYAKA LİKYA WORLD	HAVALİMANI	TRY	2025-10-31 23:44:18.705904	2025-10-31 23:44:18.705904	{"10": 2750, "11": 4100, "12": 6900}
374	15	KEMER BOT TURU	ANTALYA	USD	2025-10-31 21:53:04.724255	2025-10-31 21:53:04.724255	{"35": 5435, "36": 5435, "37": 8065, "38": 12535, "39": 12535}
375	15	KEMER BOT TURU	KEMER	USD	2025-10-31 21:53:04.724901	2025-10-31 21:53:04.724901	{"35": 4965, "36": 4965, "37": 7205, "38": 11165, "39": 11165}
376	15	KEMER BOT TURU	BELEK	USD	2025-10-31 21:53:04.72554	2025-10-31 21:53:04.72554	{"35": 5725, "36": 5725, "37": 8605, "38": 13395, "39": 13395}
377	15	KEMER BOT TURU	SİDE	USD	2025-10-31 21:53:04.726177	2025-10-31 21:53:04.726177	{"35": 6140, "36": 6140, "37": 9360, "38": 14595, "39": 14595}
378	15	KEMER BOT TURU	ALANYA	USD	2025-10-31 21:53:04.726863	2025-10-31 21:53:04.726863	{"35": 7560, "36": 7560, "37": 11510, "38": 17685, "39": 17685}
379	15	GÖYNÜK DİNOPARK TURU	ANTALYA	USD	2025-10-31 21:53:04.727721	2025-10-31 21:53:04.727721	{"35": 5630, "36": 5630, "37": 8080, "38": 12270, "39": 12270}
380	15	GÖYNÜK DİNOPARK TURU	KEMER	USD	2025-10-31 21:53:04.728415	2025-10-31 21:53:04.728415	{"35": 4965, "36": 4965, "37": 7205, "38": 11165, "39": 11165}
381	15	GÖYNÜK DİNOPARK TURU	BELEK	USD	2025-10-31 21:53:04.729245	2025-10-31 21:53:04.729245	{"35": 5610, "36": 5610, "37": 8390, "38": 13050, "39": 13050}
382	15	TAHTALI TURU	ANTALYA	USD	2025-10-31 21:53:04.729892	2025-10-31 21:53:04.729892	{"35": 5845, "36": 5845, "37": 8820, "38": 13740, "39": 13740}
383	15	TAHTALI TURU	KEMER	USD	2025-10-31 21:53:04.730539	2025-10-31 21:53:04.730539	{"35": 5080, "36": 5080, "37": 7420, "38": 11510, "39": 11510}
384	15	TAHTALI TURU	BELEK	USD	2025-10-31 21:53:04.731185	2025-10-31 21:53:04.731185	{"35": 5965, "36": 5965, "37": 9035, "38": 14080, "39": 14080}
385	15	TAHTALI TURU	SİDE	USD	2025-10-31 21:53:04.731817	2025-10-31 21:53:04.731817	{"35": 6490, "36": 6490, "37": 10005, "38": 15625, "39": 15625}
386	15	TAHTALI TURU	ALANYA	USD	2025-10-31 21:53:04.732478	2025-10-31 21:53:04.732478	{"35": 7780, "36": 7780, "37": 11920, "38": 18345, "39": 18345}
387	15	TAHTALI + AKVARYUM TURU	ANTALYA	USD	2025-10-31 21:53:04.733123	2025-10-31 21:53:04.733123	{"35": 6120, "36": 6120, "37": 9500, "38": 15000, "39": 15000}
388	15	TAHTALI + AKVARYUM TURU	KEMER	USD	2025-10-31 21:53:04.733764	2025-10-31 21:53:04.733764	{"35": 5670, "36": 5670, "37": 8495, "38": 13225, "39": 13225}
389	15	TAHTALI + AKVARYUM TURU	BELEK	USD	2025-10-31 21:53:04.734446	2025-10-31 21:53:04.734446	{"35": 5965, "36": 5965, "37": 9035, "38": 14080, "39": 14080}
390	15	TAHTALI + AKVARYUM TURU	SİDE	USD	2025-10-31 21:53:04.735148	2025-10-31 21:53:04.735148	{"35": 6490, "36": 6490, "37": 10005, "38": 15625, "39": 15625}
391	15	TAHTALI + AKVARYUM TURU	ALANYA	USD	2025-10-31 21:53:04.736092	2025-10-31 21:53:04.736092	{"35": 7780, "36": 7780, "37": 11920, "38": 18345, "39": 18345}
392	15	ULUPINAR OLİMPOS PHASELİS TURU	ANTALYA	USD	2025-10-31 21:53:04.736991	2025-10-31 21:53:04.736991	{"35": 6280, "36": 6280, "37": 9270, "38": 14160, "39": 14160}
393	15	ULUPINAR OLİMPOS PHASELİS TURU	KEMER	USD	2025-10-31 21:53:04.737822	2025-10-31 21:53:04.737822	{"35": 5435, "36": 5435, "37": 8065, "38": 12535, "39": 12535}
394	15	ULUPINAR OLİMPOS PHASELİS TURU	BELEK	USD	2025-10-31 21:53:04.738494	2025-10-31 21:53:04.738494	{"35": 6200, "36": 6200, "37": 9465, "38": 14765, "39": 14765}
395	15	ULUPINAR OLİMPOS PHASELİS TURU	SİDE	USD	2025-10-31 21:53:04.739131	2025-10-31 21:53:04.739131	{"35": 6725, "36": 6725, "37": 10435, "38": 16310, "39": 16310}
396	15	ULUPINAR OLİMPOS PHASELİS TURU	ALANYA	USD	2025-10-31 21:53:04.739776	2025-10-31 21:53:04.739776	{"35": 8010, "36": 8010, "37": 12340, "38": 19005, "39": 19005}
397	15	PERGE ANTALYA TURU	ANTALYA	USD	2025-10-31 21:53:04.740413	2025-10-31 21:53:04.740413	{"35": 5630, "36": 5630, "37": 8080, "38": 12270, "39": 12270}
398	15	PERGE ANTALYA TURU	KEMER	USD	2025-10-31 21:53:04.741117	2025-10-31 21:53:04.741117	{"35": 6020, "36": 6020, "37": 9145, "38": 14250, "39": 14250}
399	15	PERGE ANTALYA TURU	BELEK	USD	2025-10-31 21:53:04.741796	2025-10-31 21:53:04.741796	{"35": 5550, "36": 5550, "37": 8280, "38": 12880, "39": 12880}
400	15	PERGE ANTALYA TURU	SİDE	USD	2025-10-31 21:53:04.74244	2025-10-31 21:53:04.74244	{"35": 5965, "36": 5965, "37": 9035, "38": 14080, "39": 14080}
401	15	PERGE ANTALYA TURU	ALANYA	USD	2025-10-31 21:53:04.74308	2025-10-31 21:53:04.74308	{"35": 6725, "36": 6725, "37": 10435, "38": 16310, "39": 16310}
402	15	PERGE ASPENDOS SİDE	ANTALYA	USD	2025-10-31 21:53:04.743738	2025-10-31 21:53:04.743738	{"35": 5725, "36": 5725, "37": 8605, "38": 13395, "39": 13395}
403	15	PERGE ASPENDOS SİDE	KEMER	USD	2025-10-31 21:53:04.744391	2025-10-31 21:53:04.744391	{"35": 6375, "36": 6375, "37": 9790, "38": 15280, "39": 15280}
404	15	PERGE ASPENDOS SİDE	BELEK	USD	2025-10-31 21:53:04.745058	2025-10-31 21:53:04.745058	{"35": 5435, "36": 5435, "37": 8065, "38": 12535, "39": 12535}
405	15	PERGE ASPENDOS SİDE	SİDE	USD	2025-10-31 21:53:04.745728	2025-10-31 21:53:04.745728	{"35": 5845, "36": 5845, "37": 8820, "38": 13740, "39": 13740}
406	15	PERGE ASPENDOS SİDE	ALANYA	USD	2025-10-31 21:53:04.746368	2025-10-31 21:53:04.746368	{"35": 6670, "36": 6670, "37": 10330, "38": 16140, "39": 16140}
407	15	ANTALYA AKŞAM YEMEK TURU	ANTALYA	USD	2025-10-31 21:53:04.747011	2025-10-31 21:53:04.747011	{"35": 3970, "36": 3970, "37": 5760, "38": 8930, "39": 8930}
408	15	ANTALYA AKŞAM YEMEK TURU	KEMER	USD	2025-10-31 21:53:04.747707	2025-10-31 21:53:04.747707	{"35": 5255, "36": 5255, "37": 7740, "38": 12025, "39": 12025}
409	15	ANTALYA AKŞAM YEMEK TURU	BELEK	USD	2025-10-31 21:53:04.748349	2025-10-31 21:53:04.748349	{"35": 4205, "36": 4205, "37": 6195, "38": 9620, "39": 9620}
410	15	ANTALYA AKŞAM YEMEK TURU	SİDE	USD	2025-10-31 21:53:04.748987	2025-10-31 21:53:04.748987	{"35": 5550, "36": 5550, "37": 8280, "38": 12880, "39": 12880}
411	15	ANTALYA AKŞAM YEMEK TURU	ALANYA	USD	2025-10-31 21:53:04.749623	2025-10-31 21:53:04.749623	{"35": 6140, "36": 6140, "37": 9360, "38": 14595, "39": 14595}
412	15	KEMER	KEMER	USD	2025-10-31 21:53:04.750262	2025-10-31 21:53:04.750262	{"35": 1800, "36": 1800, "37": 2665, "38": 4075, "39": 4075}
413	15	KEMER	ANTALYA	USD	2025-10-31 21:53:04.754335	2025-10-31 21:53:04.754335	{"35": 2510, "36": 2510, "37": 3895, "38": 5950, "39": 5950}
414	15	KEMER	BELEK	USD	2025-10-31 21:53:04.755169	2025-10-31 21:53:04.755169	{"35": 4150, "36": 4150, "37": 6470, "38": 9890, "39": 9890}
415	15	KEMER	SİDE	USD	2025-10-31 21:53:04.755855	2025-10-31 21:53:04.755855	{"35": 5480, "36": 5480, "37": 8665, "38": 13375, "39": 13375}
416	15	KEMER	ALANYA	USD	2025-10-31 21:53:04.756496	2025-10-31 21:53:04.756496	{"35": 7570, "36": 7570, "37": 12085, "38": 18610, "39": 18610}
417	15	ANTALYA	ANTALYA	USD	2025-10-31 21:53:04.757136	2025-10-31 21:53:04.757136	{"35": 1800, "36": 1800, "37": 2665, "38": 4075, "39": 4075}
418	15	ANTALYA	BELEK	USD	2025-10-31 21:53:04.757774	2025-10-31 21:53:04.757774	{"35": 2160, "36": 2160, "37": 3275, "38": 4915, "39": 4915}
419	15	ANTALYA	SİDE	USD	2025-10-31 21:53:04.758437	2025-10-31 21:53:04.758437	{"35": 3115, "36": 3115, "37": 4870, "38": 7360, "39": 7360}
420	15	ANTALYA	ALANYA	USD	2025-10-31 21:53:04.759074	2025-10-31 21:53:04.759074	{"35": 4355, "36": 4355, "37": 6865, "38": 10565, "39": 10565}
421	15	BELEK	BELEK	USD	2025-10-31 21:53:04.759997	2025-10-31 21:53:04.759997	{"35": 1800, "36": 1800, "37": 2665, "38": 4075, "39": 4075}
422	15	BELEK	SİDE	USD	2025-10-31 21:53:04.760635	2025-10-31 21:53:04.760635	{"35": 2420, "36": 2420, "37": 3700, "38": 5650, "39": 5650}
423	15	BELEK	ALANYA	USD	2025-10-31 21:53:04.76127	2025-10-31 21:53:04.76127	{"35": 3985, "36": 3985, "37": 6255, "38": 9505, "39": 9505}
424	15	SİDE	SİDE	USD	2025-10-31 21:53:04.76191	2025-10-31 21:53:04.76191	{"35": 1800, "36": 1800, "37": 2665, "38": 4075, "39": 4075}
425	15	SİDE	ALANYA	USD	2025-10-31 21:53:04.762622	2025-10-31 21:53:04.762622	{"35": 3115, "36": 3115, "37": 4870, "38": 7360, "39": 7360}
426	15	BÖLGE İÇİ ARA TRANSFER	ARA TRANSFER	USD	2025-10-31 21:53:04.763276	2025-10-31 21:53:04.763276	{"35": 1800, "36": 1800, "37": 2665, "38": 4075, "39": 4075}
373	15	ADRASAN SULUADA TURU	ALANYA	USD	2025-10-31 21:53:04.723599	2025-10-31 22:14:49.402863	{"35": 81301, "36": 8130, "37": 12550, "38": 19330, "39": 19330}
427	15	ADRASAN	HAVALİMANI	TRY	2025-10-31 22:18:22.499808	2025-10-31 22:18:22.499808	{"35": 1000, "36": 100, "37": 10, "38": 1, "39": 1}
430	6	KİRİŞ - ÇAMYUVA-TEKİROVA	HAVALİMANI	TRY	2025-10-31 22:27:17.802338	2025-10-31 22:27:59.11921	{"13": 6700, "14": 4280}
431	6	BELEK	HAVALİMANI	TRY	2025-10-31 22:27:17.803073	2025-10-31 22:27:59.120171	{"13": 5600, "14": 3500}
432	6	BOĞAZKENT	HAVALİMANI	TRY	2025-10-31 22:27:17.803806	2025-10-31 22:27:59.120931	{"13": 6000, "14": 3850}
433	6	DENİZYAKA LİKYA WORLD	HAVALİMANI	TRY	2025-10-31 22:27:17.804531	2025-10-31 22:27:59.121585	{"13": 6900, "14": 4100}
434	6	SİDE	HAVALİMANI	TRY	2025-10-31 22:27:17.805424	2025-10-31 22:27:59.122355	{"13": 6900, "14": 4100}
436	6	ALANYA	HAVALİMANI	TRY	2025-10-31 22:27:17.807582	2025-10-31 22:27:59.12413	{"13": 8665, "14": 5500}
437	6	MAHMUTLAR	HAVALİMANI	TRY	2025-10-31 22:27:17.808552	2025-10-31 22:27:59.124874	{"13": 9100, "14": 5775}
438	6	ÇIRALI	HAVALİMANI	TRY	2025-10-31 22:27:17.809326	2025-10-31 22:27:59.125768	{"13": 8920, "14": 5400}
439	6	ADRASAN	HAVALİMANI	TRY	2025-10-31 22:27:17.810057	2025-10-31 22:27:59.126581	{"13": 9640, "14": 5795}
440	6	KUMLUCA	HAVALİMANI	TRY	2025-10-31 22:27:17.810815	2025-10-31 22:27:59.127213	{"13": 10270, "14": 6360}
441	6	FİNİKE	HAVALİMANI	TRY	2025-10-31 22:27:17.811478	2025-10-31 22:27:59.127853	{"13": 11445, "14": 7380}
442	6	DEMRE	HAVALİMANI	TRY	2025-10-31 22:27:17.812124	2025-10-31 22:27:59.128485	{"13": 15285, "14": 9430}
444	6	FETHİYE	HAVALİMANI	TRY	2025-10-31 22:27:17.813421	2025-10-31 22:27:59.130083	{"13": 22220, "14": 13210}
445	6	DALAMAN	HAVALİMANI	TRY	2025-10-31 22:27:17.814064	2025-10-31 22:27:59.130719	{"13": 24685, "14": 14665}
446	6	MARMARİS	HAVALİMANI	TRY	2025-10-31 22:27:17.814714	2025-10-31 22:27:59.131348	{"13": 34595, "14": 20550}
447	6	BODRUM	HAVALİMANI	TRY	2025-10-31 22:27:17.815411	2025-10-31 22:27:59.131975	{"13": 44475, "14": 26410}
448	6	GAZİPAŞA	ALANYA	TRY	2025-10-31 22:27:17.816154	2025-10-31 22:27:59.132643	{"13": 8000, "14": 4800}
449	6	GAZİPAŞA	SİDE	TRY	2025-10-31 22:27:17.816837	2025-10-31 22:27:59.133323	{"13": 10100, "14": 6050}
451	6	GAZİPAŞA	ANTALYA	TRY	2025-10-31 22:27:17.818126	2025-10-31 22:27:59.134614	{"13": 14100, "14": 8450}
452	6	GAZİPAŞA	KEMER	TRY	2025-10-31 22:27:17.818767	2025-10-31 22:27:59.135236	{"13": 17250, "14": 10300}
453	6	MANAVGAT BOT TURU	ANTALYA	TRY	2025-10-31 22:27:17.819411	2025-10-31 22:27:59.135854	{"13": 12900, "14": 8480}
454	6	MANAVGAT BOT TURU	KEMER	TRY	2025-10-31 22:27:17.820089	2025-10-31 22:27:59.136474	{"13": 14940, "14": 9575}
1073	5	SİDE	HAVALİMANI	TRY	2025-10-31 23:44:18.706667	2025-10-31 23:44:18.706667	{"10": 2750, "11": 4100, "12": 6900}
463	6	BELEK LAND OF LEGENDS TURU	ANTALYA	TRY	2025-10-31 22:27:17.827401	2025-10-31 22:27:59.143425	{"13": 11480, "14": 7590}
464	6	BELEK LAND OF LEGENDS TURU	KEMER	TRY	2025-10-31 22:27:17.828188	2025-10-31 22:27:59.144103	{"13": 13740, "14": 8820}
466	6	BELEK LAND OF LEGENDS TURU	SİDE	TRY	2025-10-31 22:27:17.829506	2025-10-31 22:27:59.145356	{"13": 11960, "14": 7890}
467	6	BELEK LAND OF LEGENDS TURU	ALANYA	TRY	2025-10-31 22:27:17.830158	2025-10-31 22:27:59.145989	{"13": 14375, "14": 9430}
468	6	AQUALAND TURU / AKVARYUM TURU	ANTALYA	TRY	2025-10-31 22:27:17.830824	2025-10-31 22:27:59.146622	{"13": 11330, "14": 7490}
469	6	AQUALAND TURU / AKVARYUM TURU	KEMER	TRY	2025-10-31 22:27:17.831677	2025-10-31 22:27:59.147262	{"13": 12025, "14": 7740}
470	6	AQUALAND TURU / AKVARYUM TURU	BELEK	TRY	2025-10-31 22:27:17.832331	2025-10-31 22:27:59.147892	{"13": 12025, "14": 7740}
471	6	AQUALAND TURU / AKVARYUM TURU	SİDE	TRY	2025-10-31 22:27:17.833001	2025-10-31 22:27:59.148585	{"13": 12900, "14": 8480}
473	6	TÜNEKTEPE TELEFERİK TURU	ANTALYA	TRY	2025-10-31 22:27:17.834308	2025-10-31 22:27:59.149863	{"13": 11640, "14": 7690}
474	6	TÜNEKTEPE TELEFERİK TURU	KEMER	TRY	2025-10-31 22:27:17.834941	2025-10-31 22:27:59.150491	{"13": 11680, "14": 7525}
475	6	TÜNEKTEPE TELEFERİK TURU	BELEK	TRY	2025-10-31 22:27:17.835579	2025-10-31 22:27:59.151112	{"13": 12535, "14": 8065}
476	6	TÜNEKTEPE TELEFERİK TURU	SİDE	TRY	2025-10-31 22:27:17.83622	2025-10-31 22:27:59.151733	{"13": 13740, "14": 8820}
477	6	TÜNEKTEPE TELEFERİK TURU	ALANYA	TRY	2025-10-31 22:27:17.836861	2025-10-31 22:27:59.152358	{"13": 16025, "14": 10470}
478	6	ANTALYA YAT TURU SETUR MARİNA	ANTALYA	TRY	2025-10-31 22:27:17.837502	2025-10-31 22:27:59.152983	{"13": 11640, "14": 7690}
479	6	ANTALYA YAT TURU SETUR MARİNA	KEMER	TRY	2025-10-31 22:27:17.838149	2025-10-31 22:27:59.153609	{"13": 11680, "14": 7525}
481	6	ANTALYA YAT TURU SETUR MARİNA	SİDE	TRY	2025-10-31 22:27:17.83973	2025-10-31 22:27:59.155069	{"13": 13740, "14": 8820}
482	6	ANTALYA YAT TURU SETUR MARİNA	ALANYA	TRY	2025-10-31 22:27:17.840521	2025-10-31 22:27:59.155789	{"13": 16025, "14": 10470}
483	6	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	ANTALYA	TRY	2025-10-31 22:27:17.841303	2025-10-31 22:27:59.156597	{"13": 11640, "14": 7690}
484	6	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	KEMER	TRY	2025-10-31 22:27:17.842068	2025-10-31 22:27:59.157365	{"13": 11680, "14": 7525}
485	6	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	BELEK	TRY	2025-10-31 22:27:17.842795	2025-10-31 22:27:59.158133	{"13": 12535, "14": 8065}
486	6	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	SİDE	TRY	2025-10-31 22:27:17.843443	2025-10-31 22:27:59.158801	{"13": 13690, "14": 8980}
488	6	ANTALYA ŞEHİR TURU	ANTALYA	TRY	2025-10-31 22:27:17.844722	2025-10-31 22:27:59.160216	{"13": 11960, "14": 7890}
489	6	ANTALYA ŞEHİR TURU	KEMER	TRY	2025-10-31 22:27:17.845361	2025-10-31 22:27:59.160861	{"13": 13565, "14": 8710}
490	6	ANTALYA ŞEHİR TURU	BELEK	TRY	2025-10-31 22:27:17.845997	2025-10-31 22:27:59.161747	{"13": 12880, "14": 8280}
491	6	ANTALYA ŞEHİR TURU	SİDE	TRY	2025-10-31 22:27:17.846682	2025-10-31 22:27:59.162418	{"13": 14000, "14": 9170}
492	6	ANTALYA ŞEHİR TURU	ALANYA	TRY	2025-10-31 22:27:17.847343	2025-10-31 22:27:59.16313	{"13": 16855, "14": 10985}
493	6	ALANYA ŞEHİR TURU	SİDE	TRY	2025-10-31 22:27:17.84798	2025-10-31 22:27:59.163782	{"13": 13220, "14": 8680}
494	6	ALANYA ŞEHİR TURU	ALANYA	TRY	2025-10-31 22:27:17.84864	2025-10-31 22:27:59.164403	{"13": 12560, "14": 8285}
495	6	ALARAHAN PİKNİK TURU	SİDE	TRY	2025-10-31 22:27:17.849323	2025-10-31 22:27:59.16502	{"13": 12900, "14": 8480}
496	6	ALARAHAN PİKNİK TURU	ALANYA	TRY	2025-10-31 22:27:17.84997	2025-10-31 22:27:59.165664	{"13": 12560, "14": 8285}
498	6	ALANYA BOT TURU	ALANYA	TRY	2025-10-31 22:27:17.851237	2025-10-31 22:27:59.166903	{"13": 12560, "14": 8285}
499	6	WATER PLANET	SİDE	TRY	2025-10-31 22:27:17.851898	2025-10-31 22:27:59.167521	{"13": 12900, "14": 8480}
500	6	WATER PLANET	ALANYA	TRY	2025-10-31 22:27:17.852541	2025-10-31 22:27:59.168145	{"13": 12390, "14": 8180}
501	6	SEA ALANYA DOLPHIN TURU	ANTALYA	TRY	2025-10-31 22:27:17.853444	2025-10-31 22:27:59.168759	{"13": 14595, "14": 9360}
502	6	SEA ALANYA DOLPHIN TURU	KEMER	TRY	2025-10-31 22:27:17.854078	2025-10-31 22:27:59.169383	{"13": 17170, "14": 10975}
503	6	SEA ALANYA DOLPHIN TURU	BELEK	TRY	2025-10-31 22:27:17.85471	2025-10-31 22:27:59.170128	{"13": 13740, "14": 8820}
505	6	SEA ALANYA DOLPHIN TURU	ALANYA	TRY	2025-10-31 22:27:17.856122	2025-10-31 22:27:59.171514	{"13": 9650, "14": 6345}
506	6	SEA ALANYA TAM GÜN	ANTALYA	TRY	2025-10-31 22:27:17.857105	2025-10-31 22:27:59.172294	{"13": 14480, "14": 9470}
507	6	SEA ALANYA TAM GÜN	KEMER	TRY	2025-10-31 22:27:17.857848	2025-10-31 22:27:59.173094	{"13": 17170, "14": 10975}
508	6	SEA ALANYA TAM GÜN	BELEK	TRY	2025-10-31 22:27:17.858532	2025-10-31 22:27:59.173975	{"13": 13740, "14": 8820}
509	6	SEA ALANYA TAM GÜN	SİDE	TRY	2025-10-31 22:27:17.859175	2025-10-31 22:27:59.17477	{"13": 12880, "14": 8280}
510	6	SEA ALANYA TAM GÜN	ALANYA	TRY	2025-10-31 22:27:17.859869	2025-10-31 22:27:59.175493	{"13": 12715, "14": 8390}
512	6	SİDE ŞEHİR TURU	ALANYA	TRY	2025-10-31 22:27:17.861269	2025-10-31 22:27:59.176801	{"13": 13880, "14": 9115}
513	6	BEŞKONAK TURU	ANTALYA	TRY	2025-10-31 22:27:17.861908	2025-10-31 22:27:59.179741	{"13": 13740, "14": 8820}
514	6	BEŞKONAK TURU	KEMER	TRY	2025-10-31 22:27:17.862593	2025-10-31 22:27:59.180388	{"13": 15455, "14": 9900}
515	6	BEŞKONAK TURU	BELEK	TRY	2025-10-31 22:27:17.863241	2025-10-31 22:27:59.181024	{"13": 12880, "14": 8280}
519	6	BEŞKONAK TURU	SİDE	TRY	2025-10-31 22:27:17.865982	2025-10-31 22:27:59.181793	{"13": 13530, "14": 8880}
520	6	BEŞKONAK TURU	ALANYA	TRY	2025-10-31 22:27:17.866655	2025-10-31 22:27:59.182471	{"13": 15700, "14": 10260}
522	6	TAZI KANYONU TURU	KEMER	TRY	2025-10-31 22:27:17.86793	2025-10-31 22:27:59.188643	{"13": 16310, "14": 10435}
523	6	TAZI KANYONU TURU	BELEK	TRY	2025-10-31 22:27:17.868589	2025-10-31 22:27:59.189563	{"13": 12710, "14": 8175}
524	6	TAZI KANYONU TURU	SİDE	TRY	2025-10-31 22:27:17.869224	2025-10-31 22:27:59.19033	{"13": 14595, "14": 9360}
526	6	ASPENDOS KONSER TURU	ANTALYA	TRY	2025-10-31 22:27:17.870585	2025-10-31 22:27:59.191798	{"13": 9030, "14": 5940}
527	6	ASPENDOS KONSER TURU	KEMER	TRY	2025-10-31 22:27:17.871218	2025-10-31 22:27:59.192512	{"13": 13740, "14": 8820}
528	6	ASPENDOS KONSER TURU	BELEK	TRY	2025-10-31 22:27:17.871854	2025-10-31 22:27:59.193158	{"13": 6095, "14": 3925}
529	6	ASPENDOS KONSER TURU	SİDE	TRY	2025-10-31 22:27:17.872619	2025-10-31 22:27:59.193854	{"13": 8720, "14": 5740}
531	6	OYMAPINAR PİKNİK TURU	ANTALYA	TRY	2025-10-31 22:27:17.874515	2025-10-31 22:27:59.195185	{"13": 13225, "14": 8680}
532	6	OYMAPINAR PİKNİK TURU	KEMER	TRY	2025-10-31 22:27:17.875294	2025-10-31 22:27:59.195819	{"13": 15455, "14": 9900}
533	6	OYMAPINAR PİKNİK TURU	BELEK	TRY	2025-10-31 22:27:17.876183	2025-10-31 22:27:59.196441	{"13": 12365, "14": 7960}
534	6	OYMAPINAR PİKNİK TURU	SİDE	TRY	2025-10-31 22:27:17.876847	2025-10-31 22:27:59.197084	{"13": 11330, "14": 7490}
535	6	OYMAPINAR PİKNİK TURU	ALANYA	TRY	2025-10-31 22:27:17.87749	2025-10-31 22:27:59.19774	{"13": 13880, "14": 9115}
537	6	KARACAÖREN PİKNİK TURU	KEMER	TRY	2025-10-31 22:27:17.878809	2025-10-31 22:27:59.198986	{"13": 14595, "14": 9360}
538	6	KARACAÖREN PİKNİK TURU	BELEK	TRY	2025-10-31 22:27:17.879466	2025-10-31 22:27:59.199682	{"13": 13050, "14": 8390}
539	6	KARACAÖREN PİKNİK TURU	SİDE	TRY	2025-10-31 22:27:17.880128	2025-10-31 22:27:59.200335	{"13": 14425, "14": 9250}
540	6	KARACAÖREN PİKNİK TURU	ALANYA	TRY	2025-10-31 22:27:17.880798	2025-10-31 22:27:59.200964	{"13": 16855, "14": 10985}
541	6	DEMRE KEKOVA TURU	ANTALYA	TRY	2025-10-31 22:27:17.881448	2025-10-31 22:27:59.201586	{"13": 16310, "14": 10435}
542	6	DEMRE KEKOVA TURU	KEMER	TRY	2025-10-31 22:27:17.88209	2025-10-31 22:27:59.202318	{"13": 14595, "14": 9360}
543	6	DEMRE KEKOVA TURU	BELEK	TRY	2025-10-31 22:27:17.882738	2025-10-31 22:27:59.202943	{"13": 17170, "14": 10975}
545	6	DEMRE KEKOVA TURU	ALANYA	TRY	2025-10-31 22:27:17.884079	2025-10-31 22:27:59.204226	{"13": 21000, "14": 13590}
546	6	PAMUKKALE 1 GÜN	ANTALYA	TRY	2025-10-31 22:27:17.884732	2025-10-31 22:27:59.2049	{"13": 21500, "14": 13000}
547	6	PAMUKKALE 1 GÜN	KEMER	TRY	2025-10-31 22:27:17.885367	2025-10-31 22:27:59.20563	{"13": 23345, "14": 14065}
549	6	PAMUKKALE 1 GÜN	SİDE	TRY	2025-10-31 22:27:17.886636	2025-10-31 22:27:59.207137	{"13": 21455, "14": 13670}
550	6	PAMUKKALE 1 GÜN	ALANYA	TRY	2025-10-31 22:27:17.887274	2025-10-31 22:27:59.207855	{"13": 23685, "14": 15070}
551	6	PAMUKKALE SALDA TURU	ANTALYA	TRY	2025-10-31 22:27:17.887906	2025-10-31 22:27:59.208575	{"13": 24750, "14": 15000}
553	6	PAMUKKALE SALDA TURU	BELEK	TRY	2025-10-31 22:27:17.8894	2025-10-31 22:27:59.20997	{"13": 25780, "14": 15940}
554	6	PAMUKKALE SALDA TURU	SİDE	TRY	2025-10-31 22:27:17.890239	2025-10-31 22:27:59.210638	{"13": 22315, "14": 14210}
555	6	PAMUKKALE SALDA TURU	ALANYA	TRY	2025-10-31 22:27:17.891141	2025-10-31 22:27:59.211264	{"13": 24540, "14": 15610}
556	6	PAMUKKALE 2 GÜN	ANTALYA	TRY	2025-10-31 22:27:17.891894	2025-10-31 22:27:59.211889	{"13": 30050, "14": 19255}
557	6	PAMUKKALE 2 GÜN	KEMER	TRY	2025-10-31 22:27:17.892621	2025-10-31 22:27:59.212514	{"13": 31420, "14": 20120}
558	6	PAMUKKALE 2 GÜN	BELEK	TRY	2025-10-31 22:27:17.893282	2025-10-31 22:27:59.213137	{"13": 30390, "14": 19475}
560	6	PAMUKKALE 2 GÜN	ALANYA	TRY	2025-10-31 22:27:17.894558	2025-10-31 22:27:59.214378	{"13": 35365, "14": 23005}
561	6	KAPADOKYA 2 GÜN	ANTALYA	TRY	2025-10-31 22:27:17.895213	2025-10-31 22:27:59.215082	{"13": 46000, "14": 29000}
562	6	KAPADOKYA 2 GÜN	KEMER	TRY	2025-10-31 22:27:17.89585	2025-10-31 22:27:59.215701	{"13": 43595, "14": 27775}
563	6	KAPADOKYA 2 GÜN	BELEK	TRY	2025-10-31 22:27:17.896541	2025-10-31 22:27:59.21632	{"13": 40340, "14": 25725}
564	6	KAPADOKYA 2 GÜN	SİDE	TRY	2025-10-31 22:27:17.897177	2025-10-31 22:27:59.216942	{"13": 39480, "14": 25185}
565	6	KAPADOKYA 2 GÜN	ALANYA	TRY	2025-10-31 22:27:17.897815	2025-10-31 22:27:59.2176	{"13": 40340, "14": 25725}
567	6	EFES PAMUKKALE 2 GÜN	KEMER	TRY	2025-10-31 22:27:17.899129	2025-10-31 22:27:59.219132	{"13": 48750, "14": 28125}
568	6	EFES PAMUKKALE 2 GÜN	BELEK	TRY	2025-10-31 22:27:17.899784	2025-10-31 22:27:59.219836	{"13": 44065, "14": 26250}
569	6	EFES PAMUKKALE 2 GÜN	SİDE	TRY	2025-10-31 22:27:17.90049	2025-10-31 22:27:59.220482	{"13": 42910, "14": 27340}
570	6	EFES PAMUKKALE 2 GÜN	ALANYA	TRY	2025-10-31 22:27:17.901123	2025-10-31 22:27:59.221107	{"13": 46935, "14": 30285}
571	6	DEMRE PAMUKKALE TURU 2 GÜN	ANTALYA	TRY	2025-10-31 22:27:17.901778	2025-10-31 22:27:59.221754	{"13": 39000, "14": 21910}
572	6	DEMRE PAMUKKALE TURU 2 GÜN	KEMER	TRY	2025-10-31 22:27:17.902472	2025-10-31 22:27:59.222554	{"13": 37765, "14": 24110}
574	6	DEMRE PAMUKKALE TURU 2 GÜN	SİDE	TRY	2025-10-31 22:27:17.903798	2025-10-31 22:27:59.22437	{"13": 37765, "14": 24110}
575	6	DEMRE PAMUKKALE TURU 2 GÜN	ALANYA	TRY	2025-10-31 22:27:17.9045	2025-10-31 22:27:59.225224	{"13": 40340, "14": 25725}
576	6	KAŞ TURU	ANTALYA	TRY	2025-10-31 22:27:17.905146	2025-10-31 22:27:59.22593	{"13": 18885, "14": 12055}
577	6	KAŞ TURU	KEMER	TRY	2025-10-31 22:27:17.905845	2025-10-31 22:27:59.226596	{"13": 15795, "14": 10115}
578	6	KEMER ŞEHİR TURU	ANTALYA	TRY	2025-10-31 22:27:17.906842	2025-10-31 22:27:59.227303	{"13": 14250, "14": 9145}
580	6	KEMER ŞEHİR TURU	BELEK	TRY	2025-10-31 22:27:17.908471	2025-10-31 22:27:59.228678	{"13": 14765, "14": 9465}
581	6	KEMER ŞEHİR TURU	SİDE	TRY	2025-10-31 22:27:17.909207	2025-10-31 22:27:59.229365	{"13": 16310, "14": 10435}
583	6	ADRASAN SULUADA TURU	ANTALYA	TRY	2025-10-31 22:27:17.910645	2025-10-31 22:27:59.23063	{"13": 14250, "14": 9145}
584	6	ADRASAN SULUADA TURU	KEMER	TRY	2025-10-31 22:27:17.911476	2025-10-31 22:27:59.231304	{"13": 12535, "14": 8065}
585	6	ADRASAN SULUADA TURU	BELEK	TRY	2025-10-31 22:27:17.912148	2025-10-31 22:27:59.231959	{"13": 14940, "14": 9575}
586	6	ADRASAN SULUADA TURU	SİDE	TRY	2025-10-31 22:27:17.912835	2025-10-31 22:27:59.232579	{"13": 16310, "14": 10435}
587	6	ADRASAN SULUADA TURU	ALANYA	TRY	2025-10-31 22:27:17.913482	2025-10-31 22:27:59.233197	{"13": 19330, "14": 12550}
588	6	KEMER BOT TURU	ANTALYA	TRY	2025-10-31 22:27:17.91412	2025-10-31 22:27:59.233866	{"13": 12535, "14": 8065}
1074	5	KIZILAĞAÇ - KIZILOT	HAVALİMANI	TRY	2025-10-31 23:44:18.707518	2025-10-31 23:44:18.707518	{"10": 2940, "11": 4350, "12": 7300}
428	6	ANTALYA	HAVALİMANI	TRY	2025-10-31 22:27:17.799239	2025-10-31 22:27:59.110052	{"13": 4100, "14": 2500}
429	6	KEMER	HAVALİMANI	TRY	2025-10-31 22:27:17.801593	2025-10-31 22:27:59.113949	{"13": 6200, "14": 4000}
435	6	KIZILAĞAÇ - KIZILOT	HAVALİMANI	TRY	2025-10-31 22:27:17.80639	2025-10-31 22:27:59.123359	{"13": 7300, "14": 4350}
455	6	MANAVGAT BOT TURU	BELEK	TRY	2025-10-31 22:27:17.820735	2025-10-31 22:27:59.137093	{"13": 12025, "14": 7740}
456	6	MANAVGAT BOT TURU	SİDE	TRY	2025-10-31 22:27:17.821546	2025-10-31 22:27:59.137733	{"13": 11330, "14": 7490}
459	6	DISCOVERY PARK TURU	KEMER	TRY	2025-10-31 22:27:17.824291	2025-10-31 22:27:59.140503	{"13": 14940, "14": 9575}
462	6	DISCOVERY PARK TURU	ALANYA	TRY	2025-10-31 22:27:17.826545	2025-10-31 22:27:59.142789	{"13": 11175, "14": 7330}
548	6	PAMUKKALE 1 GÜN	BELEK	TRY	2025-10-31 22:27:17.885998	2025-10-31 22:27:59.206406	{"13": 23345, "14": 14065}
579	6	KEMER ŞEHİR TURU	KEMER	TRY	2025-10-31 22:27:17.907639	2025-10-31 22:27:59.228031	{"13": 12025, "14": 7740}
589	6	KEMER BOT TURU	KEMER	TRY	2025-10-31 22:27:17.914782	2025-10-31 22:27:59.234485	{"13": 11165, "14": 7205}
590	6	KEMER BOT TURU	BELEK	TRY	2025-10-31 22:27:17.915456	2025-10-31 22:27:59.235116	{"13": 13395, "14": 8605}
591	6	KEMER BOT TURU	SİDE	TRY	2025-10-31 22:27:17.916326	2025-10-31 22:27:59.235782	{"13": 14595, "14": 9360}
592	6	KEMER BOT TURU	ALANYA	TRY	2025-10-31 22:27:17.916963	2025-10-31 22:27:59.236484	{"13": 17685, "14": 11510}
594	6	GÖYNÜK DİNOPARK TURU	KEMER	TRY	2025-10-31 22:27:17.918289	2025-10-31 22:27:59.237777	{"13": 11165, "14": 7205}
595	6	GÖYNÜK DİNOPARK TURU	BELEK	TRY	2025-10-31 22:27:17.918924	2025-10-31 22:27:59.238426	{"13": 13050, "14": 8390}
596	6	TAHTALI TURU	ANTALYA	TRY	2025-10-31 22:27:17.919564	2025-10-31 22:27:59.239181	{"13": 13740, "14": 8820}
597	6	TAHTALI TURU	KEMER	TRY	2025-10-31 22:27:17.920207	2025-10-31 22:27:59.24004	{"13": 11510, "14": 7420}
598	6	TAHTALI TURU	BELEK	TRY	2025-10-31 22:27:17.920862	2025-10-31 22:27:59.240923	{"13": 14080, "14": 9035}
599	6	TAHTALI TURU	SİDE	TRY	2025-10-31 22:27:17.921519	2025-10-31 22:27:59.24169	{"13": 15625, "14": 10005}
600	6	TAHTALI TURU	ALANYA	TRY	2025-10-31 22:27:17.922186	2025-10-31 22:27:59.242465	{"13": 18345, "14": 11920}
602	6	TAHTALI + AKVARYUM TURU	KEMER	TRY	2025-10-31 22:27:17.923812	2025-10-31 22:27:59.243796	{"13": 13225, "14": 8495}
603	6	TAHTALI + AKVARYUM TURU	BELEK	TRY	2025-10-31 22:27:17.924561	2025-10-31 22:27:59.244437	{"13": 14080, "14": 9035}
604	6	TAHTALI + AKVARYUM TURU	SİDE	TRY	2025-10-31 22:27:17.925325	2025-10-31 22:27:59.245057	{"13": 15625, "14": 10005}
605	6	TAHTALI + AKVARYUM TURU	ALANYA	TRY	2025-10-31 22:27:17.926015	2025-10-31 22:27:59.245682	{"13": 18345, "14": 11920}
606	6	ULUPINAR OLİMPOS PHASELİS TURU	ANTALYA	TRY	2025-10-31 22:27:17.926654	2025-10-31 22:27:59.2463	{"13": 14160, "14": 9270}
608	6	ULUPINAR OLİMPOS PHASELİS TURU	BELEK	TRY	2025-10-31 22:27:17.927937	2025-10-31 22:27:59.24759	{"13": 14765, "14": 9465}
609	6	ULUPINAR OLİMPOS PHASELİS TURU	SİDE	TRY	2025-10-31 22:27:17.928603	2025-10-31 22:27:59.24821	{"13": 16310, "14": 10435}
610	6	ULUPINAR OLİMPOS PHASELİS TURU	ALANYA	TRY	2025-10-31 22:27:17.929278	2025-10-31 22:27:59.248827	{"13": 19005, "14": 12340}
611	6	PERGE ANTALYA TURU	ANTALYA	TRY	2025-10-31 22:27:17.929926	2025-10-31 22:27:59.249467	{"13": 12270, "14": 8080}
612	6	PERGE ANTALYA TURU	KEMER	TRY	2025-10-31 22:27:17.93059	2025-10-31 22:27:59.250092	{"13": 14250, "14": 9145}
613	6	PERGE ANTALYA TURU	BELEK	TRY	2025-10-31 22:27:17.931224	2025-10-31 22:27:59.250747	{"13": 12880, "14": 8280}
614	6	PERGE ANTALYA TURU	SİDE	TRY	2025-10-31 22:27:17.931872	2025-10-31 22:27:59.251432	{"13": 14080, "14": 9035}
615	6	PERGE ANTALYA TURU	ALANYA	TRY	2025-10-31 22:27:17.93252	2025-10-31 22:27:59.252075	{"13": 16310, "14": 10435}
617	6	PERGE ASPENDOS SİDE	KEMER	TRY	2025-10-31 22:27:17.933854	2025-10-31 22:27:59.253366	{"13": 15280, "14": 9790}
618	6	PERGE ASPENDOS SİDE	BELEK	TRY	2025-10-31 22:27:17.934489	2025-10-31 22:27:59.25402	{"13": 12535, "14": 8065}
619	6	PERGE ASPENDOS SİDE	SİDE	TRY	2025-10-31 22:27:17.93512	2025-10-31 22:27:59.254648	{"13": 13740, "14": 8820}
620	6	PERGE ASPENDOS SİDE	ALANYA	TRY	2025-10-31 22:27:17.935754	2025-10-31 22:27:59.255271	{"13": 16140, "14": 10330}
621	6	ANTALYA AKŞAM YEMEK TURU	ANTALYA	TRY	2025-10-31 22:27:17.936413	2025-10-31 22:27:59.256321	{"13": 8930, "14": 5760}
622	6	ANTALYA AKŞAM YEMEK TURU	KEMER	TRY	2025-10-31 22:27:17.937048	2025-10-31 22:27:59.257142	{"13": 12025, "14": 7740}
624	6	ANTALYA AKŞAM YEMEK TURU	SİDE	TRY	2025-10-31 22:27:17.938604	2025-10-31 22:27:59.258677	{"13": 12880, "14": 8280}
625	6	ANTALYA AKŞAM YEMEK TURU	ALANYA	TRY	2025-10-31 22:27:17.939341	2025-10-31 22:27:59.259425	{"13": 14595, "14": 9360}
626	6	KEMER	KEMER	TRY	2025-10-31 22:27:17.940461	2025-10-31 22:27:59.260067	{"13": 4075, "14": 2665}
627	6	KEMER	ANTALYA	TRY	2025-10-31 22:27:17.94127	2025-10-31 22:27:59.260722	{"13": 5950, "14": 3895}
628	6	KEMER	BELEK	TRY	2025-10-31 22:27:17.941976	2025-10-31 22:27:59.261342	{"13": 9890, "14": 6470}
629	6	KEMER	SİDE	TRY	2025-10-31 22:27:17.942712	2025-10-31 22:27:59.262019	{"13": 13375, "14": 8665}
630	6	KEMER	ALANYA	TRY	2025-10-31 22:27:17.943376	2025-10-31 22:27:59.262645	{"13": 18610, "14": 12085}
632	6	ANTALYA	BELEK	TRY	2025-10-31 22:27:17.944712	2025-10-31 22:27:59.263891	{"13": 4915, "14": 3275}
633	6	ANTALYA	SİDE	TRY	2025-10-31 22:27:17.945349	2025-10-31 22:27:59.264544	{"13": 7360, "14": 4870}
634	6	ANTALYA	ALANYA	TRY	2025-10-31 22:27:17.945984	2025-10-31 22:27:59.265187	{"13": 10565, "14": 6865}
635	6	BELEK	BELEK	TRY	2025-10-31 22:27:17.946623	2025-10-31 22:27:59.265811	{"13": 4075, "14": 2665}
636	6	BELEK	SİDE	TRY	2025-10-31 22:27:17.947259	2025-10-31 22:27:59.266428	{"13": 5650, "14": 3700}
637	6	BELEK	ALANYA	TRY	2025-10-31 22:27:17.9479	2025-10-31 22:27:59.267069	{"13": 9505, "14": 6255}
639	6	SİDE	ALANYA	TRY	2025-10-31 22:27:17.949232	2025-10-31 22:27:59.268559	{"13": 7360, "14": 4870}
640	6	BÖLGE İÇİ ARA TRANSFER	ARA TRANSFER	TRY	2025-10-31 22:27:17.949886	2025-10-31 22:27:59.269184	{"13": 4075, "14": 2665}
443	6	KAŞ	HAVALİMANI	TRY	2025-10-31 22:27:17.812784	2025-10-31 22:27:59.129116	{"13": 19775, "14": 11720}
450	6	GAZİPAŞA	BELEK	TRY	2025-10-31 22:27:17.817477	2025-10-31 22:27:59.133987	{"13": 12100, "14": 7200}
465	6	BELEK LAND OF LEGENDS TURU	BELEK	TRY	2025-10-31 22:27:17.828854	2025-10-31 22:27:59.144731	{"13": 10735, "14": 6935}
472	6	AQUALAND TURU / AKVARYUM TURU	ALANYA	TRY	2025-10-31 22:27:17.833636	2025-10-31 22:27:59.149218	{"13": 15530, "14": 10155}
480	6	ANTALYA YAT TURU SETUR MARİNA	BELEK	TRY	2025-10-31 22:27:17.838804	2025-10-31 22:27:59.154388	{"13": 12535, "14": 8065}
487	6	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	ALANYA	TRY	2025-10-31 22:27:17.844082	2025-10-31 22:27:59.159549	{"13": 16025, "14": 10470}
497	6	ALANYA BOT TURU	SİDE	TRY	2025-10-31 22:27:17.850605	2025-10-31 22:27:59.166283	{"13": 13225, "14": 8495}
504	6	SEA ALANYA DOLPHIN TURU	SİDE	TRY	2025-10-31 22:27:17.855352	2025-10-31 22:27:59.170832	{"13": 10950, "14": 7180}
511	6	SİDE ŞEHİR TURU	SİDE	TRY	2025-10-31 22:27:17.860619	2025-10-31 22:27:59.176174	{"13": 11960, "14": 7890}
521	6	TAZI KANYONU TURU	ANTALYA	TRY	2025-10-31 22:27:17.867295	2025-10-31 22:27:59.187896	{"13": 14595, "14": 9360}
525	6	TAZI KANYONU TURU	ALANYA	TRY	2025-10-31 22:27:17.869886	2025-10-31 22:27:59.191058	{"13": 16530, "14": 10775}
530	6	ASPENDOS KONSER TURU	ALANYA	TRY	2025-10-31 22:27:17.873646	2025-10-31 22:27:59.19452	{"13": 14205, "14": 9325}
536	6	KARACAÖREN PİKNİK TURU	ANTALYA	TRY	2025-10-31 22:27:17.878141	2025-10-31 22:27:59.198363	{"13": 12900, "14": 8480}
544	6	DEMRE KEKOVA TURU	SİDE	TRY	2025-10-31 22:27:17.883442	2025-10-31 22:27:59.203572	{"13": 18370, "14": 11730}
552	6	PAMUKKALE SALDA TURU	KEMER	TRY	2025-10-31 22:27:17.888575	2025-10-31 22:27:59.209282	{"13": 25780, "14": 15940}
559	6	PAMUKKALE 2 GÜN	SİDE	TRY	2025-10-31 22:27:17.893922	2025-10-31 22:27:59.213756	{"13": 32105, "14": 20550}
566	6	EFES PAMUKKALE 2 GÜN	ANTALYA	TRY	2025-10-31 22:27:17.89846	2025-10-31 22:27:59.218428	{"13": 45000, "14": 27000}
573	6	DEMRE PAMUKKALE TURU 2 GÜN	BELEK	TRY	2025-10-31 22:27:17.903121	2025-10-31 22:27:59.223425	{"13": 36050, "14": 23030}
582	6	KEMER ŞEHİR TURU	ALANYA	TRY	2025-10-31 22:27:17.9099	2025-10-31 22:27:59.230007	{"13": 19005, "14": 12340}
593	6	GÖYNÜK DİNOPARK TURU	ANTALYA	TRY	2025-10-31 22:27:17.917644	2025-10-31 22:27:59.237131	{"13": 12270, "14": 8080}
601	6	TAHTALI + AKVARYUM TURU	ANTALYA	TRY	2025-10-31 22:27:17.923061	2025-10-31 22:27:59.24315	{"13": 15000, "14": 9500}
607	6	ULUPINAR OLİMPOS PHASELİS TURU	KEMER	TRY	2025-10-31 22:27:17.92729	2025-10-31 22:27:59.246971	{"13": 12535, "14": 8065}
616	6	PERGE ASPENDOS SİDE	ANTALYA	TRY	2025-10-31 22:27:17.93316	2025-10-31 22:27:59.252706	{"13": 13395, "14": 8605}
623	6	ANTALYA AKŞAM YEMEK TURU	BELEK	TRY	2025-10-31 22:27:17.937717	2025-10-31 22:27:59.257922	{"13": 9620, "14": 6195}
631	6	ANTALYA	ANTALYA	TRY	2025-10-31 22:27:17.94402	2025-10-31 22:27:59.263265	{"13": 4075, "14": 2665}
638	6	SİDE	SİDE	TRY	2025-10-31 22:27:17.948585	2025-10-31 22:27:59.267706	{"13": 4075, "14": 2665}
1075	5	ALANYA	HAVALİMANI	TRY	2025-10-31 23:44:18.708179	2025-10-31 23:44:18.708179	{"10": 3640, "11": 5500, "12": 8665}
1076	5	MAHMUTLAR	HAVALİMANI	TRY	2025-10-31 23:44:18.708961	2025-10-31 23:44:18.708961	{"10": 3825, "11": 5775, "12": 9100}
1077	5	ÇIRALI	HAVALİMANI	TRY	2025-10-31 23:44:18.709668	2025-10-31 23:44:18.709668	{"10": 3470, "11": 5400, "12": 8920}
1078	5	ADRASAN	HAVALİMANI	TRY	2025-10-31 23:44:18.710322	2025-10-31 23:44:18.710322	{"10": 3840, "11": 5795, "12": 9640}
1079	5	KUMLUCA	HAVALİMANI	TRY	2025-10-31 23:44:18.710961	2025-10-31 23:44:18.710961	{"10": 4205, "11": 6360, "12": 10270}
1080	5	FİNİKE	HAVALİMANI	TRY	2025-10-31 23:44:18.711606	2025-10-31 23:44:18.711606	{"10": 4885, "11": 7380, "12": 11445}
1081	5	DEMRE	HAVALİMANI	TRY	2025-10-31 23:44:18.712249	2025-10-31 23:44:18.712249	{"10": 6235, "11": 9430, "12": 15285}
1082	5	KAŞ	HAVALİMANI	TRY	2025-10-31 23:44:18.712888	2025-10-31 23:44:18.712888	{"10": 7440, "11": 11720, "12": 19775}
1083	5	FETHİYE	HAVALİMANI	TRY	2025-10-31 23:44:18.713537	2025-10-31 23:44:18.713537	{"10": 8205, "11": 13210, "12": 22220}
1084	5	DALAMAN	HAVALİMANI	TRY	2025-10-31 23:44:18.714226	2025-10-31 23:44:18.714226	{"10": 9160, "11": 14665, "12": 24685}
1085	5	MARMARİS	HAVALİMANI	TRY	2025-10-31 23:44:18.714889	2025-10-31 23:44:18.714889	{"10": 12790, "11": 20550, "12": 34595}
1086	5	BODRUM	HAVALİMANI	TRY	2025-10-31 23:44:18.715527	2025-10-31 23:44:18.715527	{"10": 16455, "11": 26410, "12": 44475}
1087	5	GAZİPAŞA	ALANYA	TRY	2025-10-31 23:44:18.716169	2025-10-31 23:44:18.716169	{"10": 3120, "11": 4800, "12": 8000}
1088	5	GAZİPAŞA	SİDE	TRY	2025-10-31 23:44:18.717063	2025-10-31 23:44:18.717063	{"10": 3880, "11": 6050, "12": 10100}
1089	5	GAZİPAŞA	BELEK	TRY	2025-10-31 23:44:18.717705	2025-10-31 23:44:18.717705	{"10": 4600, "11": 7200, "12": 12100}
1090	5	GAZİPAŞA	ANTALYA	TRY	2025-10-31 23:44:18.718344	2025-10-31 23:44:18.718344	{"10": 5350, "11": 8450, "12": 14100}
1091	5	GAZİPAŞA	KEMER	TRY	2025-10-31 23:44:18.718976	2025-10-31 23:44:18.718976	{"10": 6550, "11": 10300, "12": 17250}
1092	5	MANAVGAT BOT TURU	ANTALYA	TRY	2025-10-31 23:44:18.719624	2025-10-31 23:44:18.719624	{"10": 5850, "11": 8480, "12": 12900}
1093	5	MANAVGAT BOT TURU	KEMER	TRY	2025-10-31 23:44:18.720259	2025-10-31 23:44:18.720259	{"10": 6255, "11": 9575, "12": 14940}
1094	5	MANAVGAT BOT TURU	BELEK	TRY	2025-10-31 23:44:18.72091	2025-10-31 23:44:18.72091	{"10": 5255, "11": 7740, "12": 12025}
1095	5	MANAVGAT BOT TURU	SİDE	TRY	2025-10-31 23:44:18.721589	2025-10-31 23:44:18.721589	{"10": 5310, "11": 7490, "12": 11330}
1096	5	MANAVGAT BOT TURU	ALANYA	TRY	2025-10-31 23:44:18.722254	2025-10-31 23:44:18.722254	{"10": 6030, "11": 8695, "12": 13220}
1097	5	DISCOVERY PARK TURU	ANTALYA	TRY	2025-10-31 23:44:18.722897	2025-10-31 23:44:18.722897	{"10": 5850, "11": 8480, "12": 12900}
1098	5	DISCOVERY PARK TURU	KEMER	TRY	2025-10-31 23:44:18.723561	2025-10-31 23:44:18.723561	{"10": 6255, "11": 9575, "12": 14940}
1099	5	DISCOVERY PARK TURU	BELEK	TRY	2025-10-31 23:44:18.72422	2025-10-31 23:44:18.72422	{"10": 4380, "11": 6940, "12": 10780}
1100	5	DISCOVERY PARK TURU	SİDE	TRY	2025-10-31 23:44:18.724934	2025-10-31 23:44:18.724934	{"10": 3880, "11": 5540, "12": 8400}
1101	5	DISCOVERY PARK TURU	ALANYA	TRY	2025-10-31 23:44:18.725578	2025-10-31 23:44:18.725578	{"10": 5030, "11": 7330, "12": 11175}
1102	5	BELEK LAND OF LEGENDS TURU	ANTALYA	TRY	2025-10-31 23:44:18.726424	2025-10-31 23:44:18.726424	{"10": 5360, "11": 7590, "12": 11480}
1103	5	BELEK LAND OF LEGENDS TURU	KEMER	TRY	2025-10-31 23:44:18.727064	2025-10-31 23:44:18.727064	{"10": 5845, "11": 8820, "12": 13740}
1104	5	BELEK LAND OF LEGENDS TURU	BELEK	TRY	2025-10-31 23:44:18.727826	2025-10-31 23:44:18.727826	{"10": 4815, "11": 6935, "12": 10735}
1105	5	BELEK LAND OF LEGENDS TURU	SİDE	TRY	2025-10-31 23:44:18.728513	2025-10-31 23:44:18.728513	{"10": 5520, "11": 7890, "12": 11960}
1106	5	BELEK LAND OF LEGENDS TURU	ALANYA	TRY	2025-10-31 23:44:18.729154	2025-10-31 23:44:18.729154	{"10": 6425, "11": 9430, "12": 14375}
1107	5	AQUALAND TURU / AKVARYUM TURU	ANTALYA	TRY	2025-10-31 23:44:18.729817	2025-10-31 23:44:18.729817	{"10": 5310, "11": 7490, "12": 11330}
1108	5	AQUALAND TURU / AKVARYUM TURU	KEMER	TRY	2025-10-31 23:44:18.73047	2025-10-31 23:44:18.73047	{"10": 5255, "11": 7740, "12": 12025}
1109	5	AQUALAND TURU / AKVARYUM TURU	BELEK	TRY	2025-10-31 23:44:18.731127	2025-10-31 23:44:18.731127	{"10": 5255, "11": 7740, "12": 12025}
1110	5	AQUALAND TURU / AKVARYUM TURU	SİDE	TRY	2025-10-31 23:44:18.731777	2025-10-31 23:44:18.731777	{"10": 5850, "11": 8480, "12": 12900}
1111	5	AQUALAND TURU / AKVARYUM TURU	ALANYA	TRY	2025-10-31 23:44:18.732436	2025-10-31 23:44:18.732436	{"10": 6815, "11": 10155, "12": 15530}
1112	5	TÜNEKTEPE TELEFERİK TURU	ANTALYA	TRY	2025-10-31 23:44:18.733078	2025-10-31 23:44:18.733078	{"10": 5410, "11": 7690, "12": 11640}
1113	5	TÜNEKTEPE TELEFERİK TURU	KEMER	TRY	2025-10-31 23:44:18.733709	2025-10-31 23:44:18.733709	{"10": 5140, "11": 7525, "12": 11680}
1114	5	TÜNEKTEPE TELEFERİK TURU	BELEK	TRY	2025-10-31 23:44:18.734342	2025-10-31 23:44:18.734342	{"10": 5435, "11": 8065, "12": 12535}
1115	5	TÜNEKTEPE TELEFERİK TURU	SİDE	TRY	2025-10-31 23:44:18.734972	2025-10-31 23:44:18.734972	{"10": 5845, "11": 8820, "12": 13740}
1116	5	TÜNEKTEPE TELEFERİK TURU	ALANYA	TRY	2025-10-31 23:44:18.735643	2025-10-31 23:44:18.735643	{"10": 6995, "11": 10470, "12": 16025}
1117	5	ANTALYA YAT TURU SETUR MARİNA	ANTALYA	TRY	2025-10-31 23:44:18.736281	2025-10-31 23:44:18.736281	{"10": 5410, "11": 7690, "12": 11640}
1118	5	ANTALYA YAT TURU SETUR MARİNA	KEMER	TRY	2025-10-31 23:44:18.736923	2025-10-31 23:44:18.736923	{"10": 5140, "11": 7525, "12": 11680}
1119	5	ANTALYA YAT TURU SETUR MARİNA	BELEK	TRY	2025-10-31 23:44:18.737572	2025-10-31 23:44:18.737572	{"10": 5435, "11": 8065, "12": 12535}
1120	5	ANTALYA YAT TURU SETUR MARİNA	SİDE	TRY	2025-10-31 23:44:18.73821	2025-10-31 23:44:18.73821	{"10": 5845, "11": 8820, "12": 13740}
1121	5	ANTALYA YAT TURU SETUR MARİNA	ALANYA	TRY	2025-10-31 23:44:18.738865	2025-10-31 23:44:18.738865	{"10": 6995, "11": 10470, "12": 16025}
1122	5	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	ANTALYA	TRY	2025-10-31 23:44:18.739526	2025-10-31 23:44:18.739526	{"10": 5410, "11": 7690, "12": 11640}
1123	5	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	KEMER	TRY	2025-10-31 23:44:18.740184	2025-10-31 23:44:18.740184	{"10": 5140, "11": 7525, "12": 11680}
1124	5	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	BELEK	TRY	2025-10-31 23:44:18.740878	2025-10-31 23:44:18.740878	{"10": 5435, "11": 8065, "12": 12535}
1125	5	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	SİDE	TRY	2025-10-31 23:44:18.741522	2025-10-31 23:44:18.741522	{"10": 6120, "11": 8980, "12": 13690}
1126	5	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	ALANYA	TRY	2025-10-31 23:44:18.742168	2025-10-31 23:44:18.742168	{"10": 6995, "11": 10470, "12": 16025}
1127	5	ANTALYA ŞEHİR TURU	ANTALYA	TRY	2025-10-31 23:44:18.742814	2025-10-31 23:44:18.742814	{"10": 5520, "11": 7890, "12": 11960}
1128	5	ANTALYA ŞEHİR TURU	KEMER	TRY	2025-10-31 23:44:18.74345	2025-10-31 23:44:18.74345	{"10": 5785, "11": 8710, "12": 13565}
1129	5	ANTALYA ŞEHİR TURU	BELEK	TRY	2025-10-31 23:44:18.744091	2025-10-31 23:44:18.744091	{"10": 5550, "11": 8280, "12": 12880}
1130	5	ANTALYA ŞEHİR TURU	SİDE	TRY	2025-10-31 23:44:18.744725	2025-10-31 23:44:18.744725	{"10": 6220, "11": 9170, "12": 14000}
1131	5	ANTALYA ŞEHİR TURU	ALANYA	TRY	2025-10-31 23:44:18.745357	2025-10-31 23:44:18.745357	{"10": 7275, "11": 10985, "12": 16855}
1132	5	ALANYA ŞEHİR TURU	SİDE	TRY	2025-10-31 23:44:18.745994	2025-10-31 23:44:18.745994	{"10": 5950, "11": 8680, "12": 13220}
1133	5	ALANYA ŞEHİR TURU	ALANYA	TRY	2025-10-31 23:44:18.746637	2025-10-31 23:44:18.746637	{"10": 5795, "11": 8285, "12": 12560}
1134	5	ALARAHAN PİKNİK TURU	SİDE	TRY	2025-10-31 23:44:18.74729	2025-10-31 23:44:18.74729	{"10": 5850, "11": 8480, "12": 12900}
1135	5	ALARAHAN PİKNİK TURU	ALANYA	TRY	2025-10-31 23:44:18.747925	2025-10-31 23:44:18.747925	{"10": 5795, "11": 8285, "12": 12560}
1136	5	ALANYA BOT TURU	SİDE	TRY	2025-10-31 23:44:18.748602	2025-10-31 23:44:18.748602	{"10": 5670, "11": 8495, "12": 13225}
1137	5	ALANYA BOT TURU	ALANYA	TRY	2025-10-31 23:44:18.749252	2025-10-31 23:44:18.749252	{"10": 5795, "11": 8285, "12": 12560}
1138	5	WATER PLANET	SİDE	TRY	2025-10-31 23:44:18.749902	2025-10-31 23:44:18.749902	{"10": 5850, "11": 8480, "12": 12900}
1139	5	WATER PLANET	ALANYA	TRY	2025-10-31 23:44:18.750533	2025-10-31 23:44:18.750533	{"10": 5745, "11": 8180, "12": 12390}
1140	5	SEA ALANYA DOLPHIN TURU	ANTALYA	TRY	2025-10-31 23:44:18.751163	2025-10-31 23:44:18.751163	{"10": 6140, "11": 9360, "12": 14595}
1141	5	SEA ALANYA DOLPHIN TURU	KEMER	TRY	2025-10-31 23:44:18.751804	2025-10-31 23:44:18.751804	{"10": 7020, "11": 10975, "12": 17170}
1142	5	SEA ALANYA DOLPHIN TURU	BELEK	TRY	2025-10-31 23:44:18.752437	2025-10-31 23:44:18.752437	{"10": 5845, "11": 8820, "12": 13740}
1143	5	SEA ALANYA DOLPHIN TURU	SİDE	TRY	2025-10-31 23:44:18.753298	2025-10-31 23:44:18.753298	{"10": 4890, "11": 7180, "12": 10950}
1144	5	SEA ALANYA DOLPHIN TURU	ALANYA	TRY	2025-10-31 23:44:18.753953	2025-10-31 23:44:18.753953	{"10": 4360, "11": 6345, "12": 9650}
1145	5	SEA ALANYA TAM GÜN	ANTALYA	TRY	2025-10-31 23:44:18.75461	2025-10-31 23:44:18.75461	{"10": 6390, "11": 9470, "12": 14480}
1146	5	SEA ALANYA TAM GÜN	KEMER	TRY	2025-10-31 23:44:18.755251	2025-10-31 23:44:18.755251	{"10": 7020, "11": 10975, "12": 17170}
1147	5	SEA ALANYA TAM GÜN	BELEK	TRY	2025-10-31 23:44:18.755898	2025-10-31 23:44:18.755898	{"10": 5845, "11": 8820, "12": 13740}
1148	5	SEA ALANYA TAM GÜN	SİDE	TRY	2025-10-31 23:44:18.756567	2025-10-31 23:44:18.756567	{"10": 5550, "11": 8280, "12": 12880}
1149	5	SEA ALANYA TAM GÜN	ALANYA	TRY	2025-10-31 23:44:18.75737	2025-10-31 23:44:18.75737	{"10": 5860, "11": 8390, "12": 12715}
1706	13	ANTALYA	HAVALİMANI	TRY	2025-11-02 10:43:34.813921	2025-11-02 10:43:34.813921	{"31": 2500, "32": 1600}
1150	5	SİDE ŞEHİR TURU	SİDE	TRY	2025-10-31 23:44:18.758249	2025-10-31 23:44:18.758249	{"10": 5520, "11": 7890, "12": 11960}
1151	5	SİDE ŞEHİR TURU	ALANYA	TRY	2025-10-31 23:44:18.758948	2025-10-31 23:44:18.758948	{"10": 6250, "11": 9115, "12": 13880}
1152	5	BEŞKONAK TURU	ANTALYA	TRY	2025-10-31 23:44:18.759584	2025-10-31 23:44:18.761578	{"10": 5845, "11": 8820, "12": 13740}
1153	5	BEŞKONAK TURU	KEMER	TRY	2025-10-31 23:44:18.760301	2025-10-31 23:44:18.762212	{"10": 6435, "11": 9900, "12": 15455}
1154	5	BEŞKONAK TURU	BELEK	TRY	2025-10-31 23:44:18.760942	2025-10-31 23:44:18.762845	{"10": 5550, "11": 8280, "12": 12880}
1158	5	BEŞKONAK TURU	SİDE	TRY	2025-10-31 23:44:18.7635	2025-10-31 23:44:18.7635	{"10": 6060, "11": 8880, "12": 13530}
1159	5	BEŞKONAK TURU	ALANYA	TRY	2025-10-31 23:44:18.764145	2025-10-31 23:44:18.764145	{"10": 6880, "11": 10260, "12": 15700}
1160	5	TAZI KANYONU TURU	ANTALYA	TRY	2025-10-31 23:44:18.76478	2025-10-31 23:44:18.76478	{"10": 6140, "11": 9360, "12": 14595}
1161	5	TAZI KANYONU TURU	KEMER	TRY	2025-10-31 23:44:18.765419	2025-10-31 23:44:18.765419	{"10": 6725, "11": 10435, "12": 16310}
1162	5	TAZI KANYONU TURU	BELEK	TRY	2025-10-31 23:44:18.766118	2025-10-31 23:44:18.766118	{"10": 5490, "11": 8175, "12": 12710}
1163	5	TAZI KANYONU TURU	SİDE	TRY	2025-10-31 23:44:18.76679	2025-10-31 23:44:18.76679	{"10": 6140, "11": 9360, "12": 14595}
1164	5	TAZI KANYONU TURU	ALANYA	TRY	2025-10-31 23:44:18.767429	2025-10-31 23:44:18.767429	{"10": 7160, "11": 10775, "12": 16530}
1165	5	ASPENDOS KONSER TURU	ANTALYA	TRY	2025-10-31 23:44:18.768068	2025-10-31 23:44:18.768068	{"10": 4090, "11": 5940, "12": 9030}
1166	5	ASPENDOS KONSER TURU	KEMER	TRY	2025-10-31 23:44:18.768747	2025-10-31 23:44:18.768747	{"10": 5845, "11": 8820, "12": 13740}
1167	5	ASPENDOS KONSER TURU	BELEK	TRY	2025-10-31 23:44:18.769382	2025-10-31 23:44:18.769382	{"10": 2660, "11": 3925, "12": 6095}
1168	5	ASPENDOS KONSER TURU	SİDE	TRY	2025-10-31 23:44:18.770039	2025-10-31 23:44:18.770039	{"10": 3980, "11": 5740, "12": 8720}
1169	5	ASPENDOS KONSER TURU	ALANYA	TRY	2025-10-31 23:44:18.77067	2025-10-31 23:44:18.77067	{"10": 6365, "11": 9325, "12": 14205}
1170	5	OYMAPINAR PİKNİK TURU	ANTALYA	TRY	2025-10-31 23:44:18.771302	2025-10-31 23:44:18.771302	{"10": 5950, "11": 8680, "12": 13225}
1171	5	OYMAPINAR PİKNİK TURU	KEMER	TRY	2025-10-31 23:44:18.771988	2025-10-31 23:44:18.771988	{"10": 6435, "11": 9900, "12": 15455}
1172	5	OYMAPINAR PİKNİK TURU	BELEK	TRY	2025-10-31 23:44:18.772816	2025-10-31 23:44:18.772816	{"10": 5375, "11": 7960, "12": 12365}
1173	5	OYMAPINAR PİKNİK TURU	SİDE	TRY	2025-10-31 23:44:18.773462	2025-10-31 23:44:18.773462	{"10": 5310, "11": 7490, "12": 11330}
1174	5	OYMAPINAR PİKNİK TURU	ALANYA	TRY	2025-10-31 23:44:18.774106	2025-10-31 23:44:18.774106	{"10": 6250, "11": 9115, "12": 13880}
1175	5	KARACAÖREN PİKNİK TURU	ANTALYA	TRY	2025-10-31 23:44:18.774743	2025-10-31 23:44:18.774743	{"10": 5850, "11": 8480, "12": 12900}
1176	5	KARACAÖREN PİKNİK TURU	KEMER	TRY	2025-10-31 23:44:18.775411	2025-10-31 23:44:18.775411	{"10": 6140, "11": 9360, "12": 14595}
1177	5	KARACAÖREN PİKNİK TURU	BELEK	TRY	2025-10-31 23:44:18.776063	2025-10-31 23:44:18.776063	{"10": 5610, "11": 8390, "12": 13050}
1178	5	KARACAÖREN PİKNİK TURU	SİDE	TRY	2025-10-31 23:44:18.776702	2025-10-31 23:44:18.776702	{"10": 6080, "11": 9250, "12": 14425}
1179	5	KARACAÖREN PİKNİK TURU	ALANYA	TRY	2025-10-31 23:44:18.777334	2025-10-31 23:44:18.777334	{"10": 7275, "11": 10985, "12": 16855}
1180	5	DEMRE KEKOVA TURU	ANTALYA	TRY	2025-10-31 23:44:18.778042	2025-10-31 23:44:18.778042	{"10": 6725, "11": 10435, "12": 16310}
1181	5	DEMRE KEKOVA TURU	KEMER	TRY	2025-10-31 23:44:18.779453	2025-10-31 23:44:18.779453	{"10": 6140, "11": 9360, "12": 14595}
1182	5	DEMRE KEKOVA TURU	BELEK	TRY	2025-10-31 23:44:18.780097	2025-10-31 23:44:18.780097	{"10": 7020, "11": 10975, "12": 17170}
1183	5	DEMRE KEKOVA TURU	SİDE	TRY	2025-10-31 23:44:18.780732	2025-10-31 23:44:18.780732	{"10": 7435, "11": 11730, "12": 18370}
1184	5	DEMRE KEKOVA TURU	ALANYA	TRY	2025-10-31 23:44:18.781368	2025-10-31 23:44:18.781368	{"10": 8695, "11": 13590, "12": 21000}
1185	5	PAMUKKALE 1 GÜN	ANTALYA	TRY	2025-10-31 23:44:18.782007	2025-10-31 23:44:18.782007	{"10": 8500, "11": 13000, "12": 21500}
1186	5	PAMUKKALE 1 GÜN	KEMER	TRY	2025-10-31 23:44:18.782639	2025-10-31 23:44:18.782639	{"10": 9190, "11": 14065, "12": 23345}
1187	5	PAMUKKALE 1 GÜN	BELEK	TRY	2025-10-31 23:44:18.783272	2025-10-31 23:44:18.783272	{"10": 9190, "11": 14065, "12": 23345}
1188	5	PAMUKKALE 1 GÜN	SİDE	TRY	2025-10-31 23:44:18.783931	2025-10-31 23:44:18.783931	{"10": 8490, "11": 13670, "12": 21455}
1189	5	PAMUKKALE 1 GÜN	ALANYA	TRY	2025-10-31 23:44:18.784564	2025-10-31 23:44:18.784564	{"10": 9255, "11": 15070, "12": 23685}
1190	5	PAMUKKALE SALDA TURU	ANTALYA	TRY	2025-10-31 23:44:18.785196	2025-10-31 23:44:18.785196	{"10": 9500, "11": 15000, "12": 24750}
1191	5	PAMUKKALE SALDA TURU	KEMER	TRY	2025-10-31 23:44:18.785852	2025-10-31 23:44:18.785852	{"10": 10315, "11": 15940, "12": 25780}
1192	5	PAMUKKALE SALDA TURU	BELEK	TRY	2025-10-31 23:44:18.78651	2025-10-31 23:44:18.78651	{"10": 10315, "11": 15940, "12": 25780}
1193	5	PAMUKKALE SALDA TURU	SİDE	TRY	2025-10-31 23:44:18.787146	2025-10-31 23:44:18.787146	{"10": 8785, "11": 14210, "12": 22315}
1194	5	PAMUKKALE SALDA TURU	ALANYA	TRY	2025-10-31 23:44:18.787857	2025-10-31 23:44:18.787857	{"10": 9550, "11": 15610, "12": 24540}
1195	5	PAMUKKALE 2 GÜN	ANTALYA	TRY	2025-10-31 23:44:18.788506	2025-10-31 23:44:18.788506	{"10": 12570, "11": 19255, "12": 30050}
1196	5	PAMUKKALE 2 GÜN	KEMER	TRY	2025-10-31 23:44:18.789145	2025-10-31 23:44:18.789145	{"10": 13040, "11": 20120, "12": 31420}
1197	5	PAMUKKALE 2 GÜN	BELEK	TRY	2025-10-31 23:44:18.789782	2025-10-31 23:44:18.789782	{"10": 12690, "11": 19475, "12": 30390}
1198	5	PAMUKKALE 2 GÜN	SİDE	TRY	2025-10-31 23:44:18.790413	2025-10-31 23:44:18.790413	{"10": 13280, "11": 20550, "12": 32105}
1199	5	PAMUKKALE 2 GÜN	ALANYA	TRY	2025-10-31 23:44:18.791045	2025-10-31 23:44:18.791045	{"10": 15110, "11": 23005, "12": 35365}
1200	5	KAPADOKYA 2 GÜN	ANTALYA	TRY	2025-10-31 23:44:18.791682	2025-10-31 23:44:18.791682	{"10": 19000, "11": 29000, "12": 46000}
1201	5	KAPADOKYA 2 GÜN	KEMER	TRY	2025-10-31 23:44:18.792315	2025-10-31 23:44:18.792315	{"10": 17215, "11": 27775, "12": 43595}
1202	5	KAPADOKYA 2 GÜN	BELEK	TRY	2025-10-31 23:44:18.793156	2025-10-31 23:44:18.793156	{"10": 16100, "11": 25725, "12": 40340}
1203	5	KAPADOKYA 2 GÜN	SİDE	TRY	2025-10-31 23:44:18.79384	2025-10-31 23:44:18.79384	{"10": 15805, "11": 25185, "12": 39480}
1204	5	KAPADOKYA 2 GÜN	ALANYA	TRY	2025-10-31 23:44:18.794473	2025-10-31 23:44:18.794473	{"10": 16100, "11": 25725, "12": 40340}
1707	13	KEMER	HAVALİMANI	TRY	2025-11-02 10:43:34.832555	2025-11-02 10:43:34.832555	{"31": 4000, "32": 2600}
1205	5	EFES PAMUKKALE 2 GÜN	ANTALYA	TRY	2025-10-31 23:44:18.795105	2025-10-31 23:44:18.795105	{"10": 18000, "11": 27000, "12": 45000}
1206	5	EFES PAMUKKALE 2 GÜN	KEMER	TRY	2025-10-31 23:44:18.795751	2025-10-31 23:44:18.795751	{"10": 18750, "11": 28125, "12": 48750}
1207	5	EFES PAMUKKALE 2 GÜN	BELEK	TRY	2025-10-31 23:44:18.796384	2025-10-31 23:44:18.796384	{"10": 17815, "11": 26250, "12": 44065}
1208	5	EFES PAMUKKALE 2 GÜN	SİDE	TRY	2025-10-31 23:44:18.797015	2025-10-31 23:44:18.797015	{"10": 16980, "11": 27340, "12": 42910}
1209	5	EFES PAMUKKALE 2 GÜN	ALANYA	TRY	2025-10-31 23:44:18.797651	2025-10-31 23:44:18.797651	{"10": 19080, "11": 30285, "12": 46935}
1210	5	DEMRE PAMUKKALE TURU 2 GÜN	ANTALYA	TRY	2025-10-31 23:44:18.79851	2025-10-31 23:44:18.79851	{"10": 16000, "11": 21910, "12": 39000}
1211	5	DEMRE PAMUKKALE TURU 2 GÜN	KEMER	TRY	2025-10-31 23:44:18.799158	2025-10-31 23:44:18.799158	{"10": 15220, "11": 24110, "12": 37765}
1212	5	DEMRE PAMUKKALE TURU 2 GÜN	BELEK	TRY	2025-10-31 23:44:18.799798	2025-10-31 23:44:18.799798	{"10": 14630, "11": 23030, "12": 36050}
1213	5	DEMRE PAMUKKALE TURU 2 GÜN	SİDE	TRY	2025-10-31 23:44:18.80043	2025-10-31 23:44:18.80043	{"10": 15220, "11": 24110, "12": 37765}
1214	5	DEMRE PAMUKKALE TURU 2 GÜN	ALANYA	TRY	2025-10-31 23:44:18.801084	2025-10-31 23:44:18.801084	{"10": 16100, "11": 25725, "12": 40340}
1215	5	KAŞ TURU	ANTALYA	TRY	2025-10-31 23:44:18.801724	2025-10-31 23:44:18.801724	{"10": 7610, "11": 12055, "12": 18885}
1216	5	KAŞ TURU	KEMER	TRY	2025-10-31 23:44:18.802378	2025-10-31 23:44:18.802378	{"10": 6550, "11": 10115, "12": 15795}
1217	5	KEMER ŞEHİR TURU	ANTALYA	TRY	2025-10-31 23:44:18.803054	2025-10-31 23:44:18.803054	{"10": 6020, "11": 9145, "12": 14250}
1218	5	KEMER ŞEHİR TURU	KEMER	TRY	2025-10-31 23:44:18.803695	2025-10-31 23:44:18.803695	{"10": 5255, "11": 7740, "12": 12025}
1219	5	KEMER ŞEHİR TURU	BELEK	TRY	2025-10-31 23:44:18.804335	2025-10-31 23:44:18.804335	{"10": 6200, "11": 9465, "12": 14765}
1220	5	KEMER ŞEHİR TURU	SİDE	TRY	2025-10-31 23:44:18.804984	2025-10-31 23:44:18.804984	{"10": 6725, "11": 10435, "12": 16310}
1221	5	KEMER ŞEHİR TURU	ALANYA	TRY	2025-10-31 23:44:18.80562	2025-10-31 23:44:18.80562	{"10": 8010, "11": 12340, "12": 19005}
1222	5	ADRASAN SULUADA TURU	ANTALYA	TRY	2025-10-31 23:44:18.806428	2025-10-31 23:44:18.806428	{"10": 6020, "11": 9145, "12": 14250}
1223	5	ADRASAN SULUADA TURU	KEMER	TRY	2025-10-31 23:44:18.807097	2025-10-31 23:44:18.807097	{"10": 5435, "11": 8065, "12": 12535}
1224	5	ADRASAN SULUADA TURU	BELEK	TRY	2025-10-31 23:44:18.807905	2025-10-31 23:44:18.807905	{"10": 6255, "11": 9575, "12": 14940}
1225	5	ADRASAN SULUADA TURU	SİDE	TRY	2025-10-31 23:44:18.80865	2025-10-31 23:44:18.80865	{"10": 6725, "11": 10435, "12": 16310}
1226	5	ADRASAN SULUADA TURU	ALANYA	TRY	2025-10-31 23:44:18.80936	2025-10-31 23:44:18.80936	{"10": 8130, "11": 12550, "12": 19330}
1227	5	KEMER BOT TURU	ANTALYA	TRY	2025-10-31 23:44:18.810016	2025-10-31 23:44:18.810016	{"10": 5435, "11": 8065, "12": 12535}
1228	5	KEMER BOT TURU	KEMER	TRY	2025-10-31 23:44:18.810657	2025-10-31 23:44:18.810657	{"10": 4965, "11": 7205, "12": 11165}
1229	5	KEMER BOT TURU	BELEK	TRY	2025-10-31 23:44:18.811291	2025-10-31 23:44:18.811291	{"10": 5725, "11": 8605, "12": 13395}
1230	5	KEMER BOT TURU	SİDE	TRY	2025-10-31 23:44:18.811927	2025-10-31 23:44:18.811927	{"10": 6140, "11": 9360, "12": 14595}
1231	5	KEMER BOT TURU	ALANYA	TRY	2025-10-31 23:44:18.812559	2025-10-31 23:44:18.812559	{"10": 7560, "11": 11510, "12": 17685}
1232	5	GÖYNÜK DİNOPARK TURU	ANTALYA	TRY	2025-10-31 23:44:18.813206	2025-10-31 23:44:18.813206	{"10": 5630, "11": 8080, "12": 12270}
1233	5	GÖYNÜK DİNOPARK TURU	KEMER	TRY	2025-10-31 23:44:18.813875	2025-10-31 23:44:18.813875	{"10": 4965, "11": 7205, "12": 11165}
1234	5	GÖYNÜK DİNOPARK TURU	BELEK	TRY	2025-10-31 23:44:18.814508	2025-10-31 23:44:18.814508	{"10": 5610, "11": 8390, "12": 13050}
1235	5	TAHTALI TURU	ANTALYA	TRY	2025-10-31 23:44:18.815158	2025-10-31 23:44:18.815158	{"10": 5845, "11": 8820, "12": 13740}
1236	5	TAHTALI TURU	KEMER	TRY	2025-10-31 23:44:18.815797	2025-10-31 23:44:18.815797	{"10": 5080, "11": 7420, "12": 11510}
1237	5	TAHTALI TURU	BELEK	TRY	2025-10-31 23:44:18.816503	2025-10-31 23:44:18.816503	{"10": 5965, "11": 9035, "12": 14080}
1238	5	TAHTALI TURU	SİDE	TRY	2025-10-31 23:44:18.817133	2025-10-31 23:44:18.817133	{"10": 6490, "11": 10005, "12": 15625}
1239	5	TAHTALI TURU	ALANYA	TRY	2025-10-31 23:44:18.817823	2025-10-31 23:44:18.817823	{"10": 7780, "11": 11920, "12": 18345}
1240	5	TAHTALI + AKVARYUM TURU	ANTALYA	TRY	2025-10-31 23:44:18.818481	2025-10-31 23:44:18.818481	{"10": 6120, "11": 9500, "12": 15000}
1241	5	TAHTALI + AKVARYUM TURU	KEMER	TRY	2025-10-31 23:44:18.819136	2025-10-31 23:44:18.819136	{"10": 5670, "11": 8495, "12": 13225}
1242	5	TAHTALI + AKVARYUM TURU	BELEK	TRY	2025-10-31 23:44:18.819782	2025-10-31 23:44:18.819782	{"10": 5965, "11": 9035, "12": 14080}
1243	5	TAHTALI + AKVARYUM TURU	SİDE	TRY	2025-10-31 23:44:18.820626	2025-10-31 23:44:18.820626	{"10": 6490, "11": 10005, "12": 15625}
1244	5	TAHTALI + AKVARYUM TURU	ALANYA	TRY	2025-10-31 23:44:18.821265	2025-10-31 23:44:18.821265	{"10": 7780, "11": 11920, "12": 18345}
1245	5	ULUPINAR OLİMPOS PHASELİS TURU	ANTALYA	TRY	2025-10-31 23:44:18.821947	2025-10-31 23:44:18.821947	{"10": 6280, "11": 9270, "12": 14160}
1246	5	ULUPINAR OLİMPOS PHASELİS TURU	KEMER	TRY	2025-10-31 23:44:18.822581	2025-10-31 23:44:18.822581	{"10": 5435, "11": 8065, "12": 12535}
1247	5	ULUPINAR OLİMPOS PHASELİS TURU	BELEK	TRY	2025-10-31 23:44:18.823225	2025-10-31 23:44:18.823225	{"10": 6200, "11": 9465, "12": 14765}
1248	5	ULUPINAR OLİMPOS PHASELİS TURU	SİDE	TRY	2025-10-31 23:44:18.823899	2025-10-31 23:44:18.823899	{"10": 6725, "11": 10435, "12": 16310}
1249	5	ULUPINAR OLİMPOS PHASELİS TURU	ALANYA	TRY	2025-10-31 23:44:18.824532	2025-10-31 23:44:18.824532	{"10": 8010, "11": 12340, "12": 19005}
1250	5	PERGE ANTALYA TURU	ANTALYA	TRY	2025-10-31 23:44:18.825163	2025-10-31 23:44:18.825163	{"10": 5630, "11": 8080, "12": 12270}
1251	5	PERGE ANTALYA TURU	KEMER	TRY	2025-10-31 23:44:18.825801	2025-10-31 23:44:18.825801	{"10": 6020, "11": 9145, "12": 14250}
1252	5	PERGE ANTALYA TURU	BELEK	TRY	2025-10-31 23:44:18.826433	2025-10-31 23:44:18.826433	{"10": 5550, "11": 8280, "12": 12880}
1253	5	PERGE ANTALYA TURU	SİDE	TRY	2025-10-31 23:44:18.827164	2025-10-31 23:44:18.827164	{"10": 5965, "11": 9035, "12": 14080}
1254	5	PERGE ANTALYA TURU	ALANYA	TRY	2025-10-31 23:44:18.827808	2025-10-31 23:44:18.827808	{"10": 6725, "11": 10435, "12": 16310}
1255	5	PERGE ASPENDOS SİDE	ANTALYA	TRY	2025-10-31 23:44:18.828443	2025-10-31 23:44:18.828443	{"10": 5725, "11": 8605, "12": 13395}
1256	5	PERGE ASPENDOS SİDE	KEMER	TRY	2025-10-31 23:44:18.829098	2025-10-31 23:44:18.829098	{"10": 6375, "11": 9790, "12": 15280}
1257	5	PERGE ASPENDOS SİDE	BELEK	TRY	2025-10-31 23:44:18.829738	2025-10-31 23:44:18.829738	{"10": 5435, "11": 8065, "12": 12535}
1258	5	PERGE ASPENDOS SİDE	SİDE	TRY	2025-10-31 23:44:18.830373	2025-10-31 23:44:18.830373	{"10": 5845, "11": 8820, "12": 13740}
1259	5	PERGE ASPENDOS SİDE	ALANYA	TRY	2025-10-31 23:44:18.831018	2025-10-31 23:44:18.831018	{"10": 6670, "11": 10330, "12": 16140}
1260	5	ANTALYA AKŞAM YEMEK TURU	ANTALYA	TRY	2025-10-31 23:44:18.831684	2025-10-31 23:44:18.831684	{"10": 3970, "11": 5760, "12": 8930}
1261	5	ANTALYA AKŞAM YEMEK TURU	KEMER	TRY	2025-10-31 23:44:18.832317	2025-10-31 23:44:18.832317	{"10": 5255, "11": 7740, "12": 12025}
1262	5	ANTALYA AKŞAM YEMEK TURU	BELEK	TRY	2025-10-31 23:44:18.832986	2025-10-31 23:44:18.832986	{"10": 4205, "11": 6195, "12": 9620}
1263	5	ANTALYA AKŞAM YEMEK TURU	SİDE	TRY	2025-10-31 23:44:18.833765	2025-10-31 23:44:18.833765	{"10": 5550, "11": 8280, "12": 12880}
1264	5	ANTALYA AKŞAM YEMEK TURU	ALANYA	TRY	2025-10-31 23:44:18.834439	2025-10-31 23:44:18.834439	{"10": 6140, "11": 9360, "12": 14595}
1265	5	KEMER	KEMER	TRY	2025-10-31 23:44:18.835079	2025-10-31 23:44:18.835079	{"10": 1800, "11": 2665, "12": 4075}
1266	5	KEMER	ANTALYA	TRY	2025-10-31 23:44:18.835753	2025-10-31 23:44:18.835753	{"10": 2510, "11": 3895, "12": 5950}
1267	5	KEMER	BELEK	TRY	2025-10-31 23:44:18.836391	2025-10-31 23:44:18.836391	{"10": 4150, "11": 6470, "12": 9890}
1268	5	KEMER	SİDE	TRY	2025-10-31 23:44:18.837046	2025-10-31 23:44:18.837046	{"10": 5480, "11": 8665, "12": 13375}
1269	5	KEMER	ALANYA	TRY	2025-10-31 23:44:18.837708	2025-10-31 23:44:18.837708	{"10": 7570, "11": 12085, "12": 18610}
1270	5	ANTALYA	ANTALYA	TRY	2025-10-31 23:44:18.838344	2025-10-31 23:44:18.838344	{"10": 1800, "11": 2665, "12": 4075}
1271	5	ANTALYA	BELEK	TRY	2025-10-31 23:44:18.839002	2025-10-31 23:44:18.839002	{"10": 2160, "11": 3275, "12": 4915}
1272	5	ANTALYA	SİDE	TRY	2025-10-31 23:44:18.839663	2025-10-31 23:44:18.839663	{"10": 3115, "11": 4870, "12": 7360}
1273	5	ANTALYA	ALANYA	TRY	2025-10-31 23:44:18.840297	2025-10-31 23:44:18.840297	{"10": 4355, "11": 6865, "12": 10565}
1274	5	BELEK	BELEK	TRY	2025-10-31 23:44:18.840948	2025-10-31 23:44:18.840948	{"10": 1800, "11": 2665, "12": 4075}
1275	5	BELEK	SİDE	TRY	2025-10-31 23:44:18.841584	2025-10-31 23:44:18.841584	{"10": 2420, "11": 3700, "12": 5650}
1276	5	BELEK	ALANYA	TRY	2025-10-31 23:44:18.842225	2025-10-31 23:44:18.842225	{"10": 3985, "11": 6255, "12": 9505}
1277	5	SİDE	SİDE	TRY	2025-10-31 23:44:18.842859	2025-10-31 23:44:18.842859	{"10": 1800, "11": 2665, "12": 4075}
1278	5	SİDE	ALANYA	TRY	2025-10-31 23:44:18.843524	2025-10-31 23:44:18.843524	{"10": 3115, "11": 4870, "12": 7360}
1279	5	BÖLGE İÇİ ARA TRANSFER	ARA TRANSFER	TRY	2025-10-31 23:44:18.844174	2025-10-31 23:44:18.844174	{"10": 1800, "11": 2665, "12": 4075}
1280	12	ANTALYA	HAVALİMANI	TRY	2025-11-01 00:04:10.325191	2025-11-01 00:04:10.325191	{"28": 2500, "29": 4100, "30": 1600}
1281	12	KEMER	HAVALİMANI	TRY	2025-11-01 00:04:10.327581	2025-11-01 00:04:10.327581	{"28": 4000, "29": 6200, "30": 2600}
1282	12	KİRİŞ - ÇAMYUVA-TEKİROVA	HAVALİMANI	TRY	2025-11-01 00:04:10.328318	2025-11-01 00:04:10.328318	{"28": 4280, "29": 6700, "30": 2800}
1283	12	BELEK	HAVALİMANI	TRY	2025-11-01 00:04:10.329047	2025-11-01 00:04:10.329047	{"28": 3500, "29": 5600, "30": 2270}
1284	12	BOĞAZKENT	HAVALİMANI	TRY	2025-11-01 00:04:10.329767	2025-11-01 00:04:10.329767	{"28": 3850, "29": 6000, "30": 2450}
1285	12	DENİZYAKA LİKYA WORLD	HAVALİMANI	TRY	2025-11-01 00:04:10.330506	2025-11-01 00:04:10.330506	{"28": 4100, "29": 6900, "30": 2750}
1286	12	SİDE	HAVALİMANI	TRY	2025-11-01 00:04:10.331487	2025-11-01 00:04:10.331487	{"28": 4100, "29": 6900, "30": 2750}
1287	12	KIZILAĞAÇ - KIZILOT	HAVALİMANI	TRY	2025-11-01 00:04:10.332175	2025-11-01 00:04:10.332175	{"28": 4350, "29": 7300, "30": 2940}
1288	12	ALANYA	HAVALİMANI	TRY	2025-11-01 00:04:10.332821	2025-11-01 00:04:10.332821	{"28": 5500, "29": 8665, "30": 3640}
1289	12	MAHMUTLAR	HAVALİMANI	TRY	2025-11-01 00:04:10.333455	2025-11-01 00:04:10.333455	{"28": 5775, "29": 9100, "30": 3825}
1290	12	ÇIRALI	HAVALİMANI	TRY	2025-11-01 00:04:10.334134	2025-11-01 00:04:10.334134	{"28": 5400, "29": 8920, "30": 3470}
1291	12	ADRASAN	HAVALİMANI	TRY	2025-11-01 00:04:10.334781	2025-11-01 00:04:10.334781	{"28": 5795, "29": 9640, "30": 3840}
1292	12	KUMLUCA	HAVALİMANI	TRY	2025-11-01 00:04:10.335422	2025-11-01 00:04:10.335422	{"28": 6360, "29": 10270, "30": 4205}
1293	12	FİNİKE	HAVALİMANI	TRY	2025-11-01 00:04:10.336082	2025-11-01 00:04:10.336082	{"28": 7380, "29": 11445, "30": 4885}
1294	12	DEMRE	HAVALİMANI	TRY	2025-11-01 00:04:10.336725	2025-11-01 00:04:10.336725	{"28": 9430, "29": 15285, "30": 6235}
1295	12	KAŞ	HAVALİMANI	TRY	2025-11-01 00:04:10.337363	2025-11-01 00:04:10.337363	{"28": 11720, "29": 19775, "30": 7440}
1296	12	FETHİYE	HAVALİMANI	TRY	2025-11-01 00:04:10.338005	2025-11-01 00:04:10.338005	{"28": 13210, "29": 22220, "30": 8205}
1297	12	DALAMAN	HAVALİMANI	TRY	2025-11-01 00:04:10.338646	2025-11-01 00:04:10.338646	{"28": 14665, "29": 24685, "30": 9160}
1298	12	MARMARİS	HAVALİMANI	TRY	2025-11-01 00:04:10.339314	2025-11-01 00:04:10.339314	{"28": 20550, "29": 34595, "30": 12790}
1299	12	BODRUM	HAVALİMANI	TRY	2025-11-01 00:04:10.339988	2025-11-01 00:04:10.339988	{"28": 26410, "29": 44475, "30": 16455}
1300	12	GAZİPAŞA	ALANYA	TRY	2025-11-01 00:04:10.34062	2025-11-01 00:04:10.34062	{"28": 4800, "29": 8000, "30": 3120}
1301	12	GAZİPAŞA	SİDE	TRY	2025-11-01 00:04:10.341256	2025-11-01 00:04:10.341256	{"28": 6050, "29": 10100, "30": 3880}
1302	12	GAZİPAŞA	BELEK	TRY	2025-11-01 00:04:10.341893	2025-11-01 00:04:10.341893	{"28": 7200, "29": 12100, "30": 4600}
1303	12	GAZİPAŞA	ANTALYA	TRY	2025-11-01 00:04:10.342531	2025-11-01 00:04:10.342531	{"28": 8450, "29": 14100, "30": 5350}
1304	12	GAZİPAŞA	KEMER	TRY	2025-11-01 00:04:10.343185	2025-11-01 00:04:10.343185	{"28": 10300, "29": 17250, "30": 6550}
1305	12	MANAVGAT BOT TURU	ANTALYA	TRY	2025-11-01 00:04:10.343886	2025-11-01 00:04:10.343886	{"28": 8480, "29": 12900, "30": 5850}
1306	12	MANAVGAT BOT TURU	KEMER	TRY	2025-11-01 00:04:10.344533	2025-11-01 00:04:10.344533	{"28": 9575, "29": 14940, "30": 6255}
1307	12	MANAVGAT BOT TURU	BELEK	TRY	2025-11-01 00:04:10.345169	2025-11-01 00:04:10.345169	{"28": 7740, "29": 12025, "30": 5255}
1308	12	MANAVGAT BOT TURU	SİDE	TRY	2025-11-01 00:04:10.346148	2025-11-01 00:04:10.346148	{"28": 7490, "29": 11330, "30": 5310}
1309	12	MANAVGAT BOT TURU	ALANYA	TRY	2025-11-01 00:04:10.3468	2025-11-01 00:04:10.3468	{"28": 8695, "29": 13220, "30": 6030}
1310	12	DISCOVERY PARK TURU	ANTALYA	TRY	2025-11-01 00:04:10.347511	2025-11-01 00:04:10.347511	{"28": 8480, "29": 12900, "30": 5850}
1311	12	DISCOVERY PARK TURU	KEMER	TRY	2025-11-01 00:04:10.348162	2025-11-01 00:04:10.348162	{"28": 9575, "29": 14940, "30": 6255}
1312	12	DISCOVERY PARK TURU	BELEK	TRY	2025-11-01 00:04:10.348804	2025-11-01 00:04:10.348804	{"28": 6940, "29": 10780, "30": 4380}
1313	12	DISCOVERY PARK TURU	SİDE	TRY	2025-11-01 00:04:10.349494	2025-11-01 00:04:10.349494	{"28": 5540, "29": 8400, "30": 3880}
1314	12	DISCOVERY PARK TURU	ALANYA	TRY	2025-11-01 00:04:10.350134	2025-11-01 00:04:10.350134	{"28": 7330, "29": 11175, "30": 5030}
1315	12	BELEK LAND OF LEGENDS TURU	ANTALYA	TRY	2025-11-01 00:04:10.350775	2025-11-01 00:04:10.350775	{"28": 7590, "29": 11480, "30": 5360}
1316	12	BELEK LAND OF LEGENDS TURU	KEMER	TRY	2025-11-01 00:04:10.351411	2025-11-01 00:04:10.351411	{"28": 8820, "29": 13740, "30": 5845}
1317	12	BELEK LAND OF LEGENDS TURU	BELEK	TRY	2025-11-01 00:04:10.352043	2025-11-01 00:04:10.352043	{"28": 6935, "29": 10735, "30": 4815}
1318	12	BELEK LAND OF LEGENDS TURU	SİDE	TRY	2025-11-01 00:04:10.352689	2025-11-01 00:04:10.352689	{"28": 7890, "29": 11960, "30": 5520}
1319	12	BELEK LAND OF LEGENDS TURU	ALANYA	TRY	2025-11-01 00:04:10.353337	2025-11-01 00:04:10.353337	{"28": 9430, "29": 14375, "30": 6425}
1320	12	AQUALAND TURU / AKVARYUM TURU	ANTALYA	TRY	2025-11-01 00:04:10.353972	2025-11-01 00:04:10.353972	{"28": 7490, "29": 11330, "30": 5310}
1321	12	AQUALAND TURU / AKVARYUM TURU	KEMER	TRY	2025-11-01 00:04:10.354605	2025-11-01 00:04:10.354605	{"28": 7740, "29": 12025, "30": 5255}
1322	12	AQUALAND TURU / AKVARYUM TURU	BELEK	TRY	2025-11-01 00:04:10.355257	2025-11-01 00:04:10.355257	{"28": 7740, "29": 12025, "30": 5255}
1323	12	AQUALAND TURU / AKVARYUM TURU	SİDE	TRY	2025-11-01 00:04:10.356051	2025-11-01 00:04:10.356051	{"28": 8480, "29": 12900, "30": 5850}
1324	12	AQUALAND TURU / AKVARYUM TURU	ALANYA	TRY	2025-11-01 00:04:10.356708	2025-11-01 00:04:10.356708	{"28": 10155, "29": 15530, "30": 6815}
1325	12	TÜNEKTEPE TELEFERİK TURU	ANTALYA	TRY	2025-11-01 00:04:10.357346	2025-11-01 00:04:10.357346	{"28": 7690, "29": 11640, "30": 5410}
1326	12	TÜNEKTEPE TELEFERİK TURU	KEMER	TRY	2025-11-01 00:04:10.357977	2025-11-01 00:04:10.357977	{"28": 7525, "29": 11680, "30": 5140}
1327	12	TÜNEKTEPE TELEFERİK TURU	BELEK	TRY	2025-11-01 00:04:10.358603	2025-11-01 00:04:10.358603	{"28": 8065, "29": 12535, "30": 5435}
1328	12	TÜNEKTEPE TELEFERİK TURU	SİDE	TRY	2025-11-01 00:04:10.359235	2025-11-01 00:04:10.359235	{"28": 8820, "29": 13740, "30": 5845}
1329	12	TÜNEKTEPE TELEFERİK TURU	ALANYA	TRY	2025-11-01 00:04:10.359867	2025-11-01 00:04:10.359867	{"28": 10470, "29": 16025, "30": 6995}
1330	12	ANTALYA YAT TURU SETUR MARİNA	ANTALYA	TRY	2025-11-01 00:04:10.360495	2025-11-01 00:04:10.360495	{"28": 7690, "29": 11640, "30": 5410}
1331	12	ANTALYA YAT TURU SETUR MARİNA	KEMER	TRY	2025-11-01 00:04:10.361126	2025-11-01 00:04:10.361126	{"28": 7525, "29": 11680, "30": 5140}
1332	12	ANTALYA YAT TURU SETUR MARİNA	BELEK	TRY	2025-11-01 00:04:10.36176	2025-11-01 00:04:10.36176	{"28": 8065, "29": 12535, "30": 5435}
1333	12	ANTALYA YAT TURU SETUR MARİNA	SİDE	TRY	2025-11-01 00:04:10.362638	2025-11-01 00:04:10.362638	{"28": 8820, "29": 13740, "30": 5845}
1334	12	ANTALYA YAT TURU SETUR MARİNA	ALANYA	TRY	2025-11-01 00:04:10.363324	2025-11-01 00:04:10.363324	{"28": 10470, "29": 16025, "30": 6995}
1335	12	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	ANTALYA	TRY	2025-11-01 00:04:10.363955	2025-11-01 00:04:10.363955	{"28": 7690, "29": 11640, "30": 5410}
1336	12	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	KEMER	TRY	2025-11-01 00:04:10.364583	2025-11-01 00:04:10.364583	{"28": 7525, "29": 11680, "30": 5140}
1337	12	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	BELEK	TRY	2025-11-01 00:04:10.36522	2025-11-01 00:04:10.36522	{"28": 8065, "29": 12535, "30": 5435}
1338	12	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	SİDE	TRY	2025-11-01 00:04:10.365869	2025-11-01 00:04:10.365869	{"28": 8980, "29": 13690, "30": 6120}
1339	12	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	ALANYA	TRY	2025-11-01 00:04:10.366509	2025-11-01 00:04:10.366509	{"28": 10470, "29": 16025, "30": 6995}
1340	12	ANTALYA ŞEHİR TURU	ANTALYA	TRY	2025-11-01 00:04:10.367147	2025-11-01 00:04:10.367147	{"28": 7890, "29": 11960, "30": 5520}
1341	12	ANTALYA ŞEHİR TURU	KEMER	TRY	2025-11-01 00:04:10.367775	2025-11-01 00:04:10.367775	{"28": 8710, "29": 13565, "30": 5785}
1342	12	ANTALYA ŞEHİR TURU	BELEK	TRY	2025-11-01 00:04:10.368425	2025-11-01 00:04:10.368425	{"28": 8280, "29": 12880, "30": 5550}
1343	12	ANTALYA ŞEHİR TURU	SİDE	TRY	2025-11-01 00:04:10.369219	2025-11-01 00:04:10.369219	{"28": 9170, "29": 14000, "30": 6220}
1344	12	ANTALYA ŞEHİR TURU	ALANYA	TRY	2025-11-01 00:04:10.369921	2025-11-01 00:04:10.369921	{"28": 10985, "29": 16855, "30": 7275}
1345	12	ALANYA ŞEHİR TURU	SİDE	TRY	2025-11-01 00:04:10.370587	2025-11-01 00:04:10.370587	{"28": 8680, "29": 13220, "30": 5950}
1346	12	ALANYA ŞEHİR TURU	ALANYA	TRY	2025-11-01 00:04:10.371217	2025-11-01 00:04:10.371217	{"28": 8285, "29": 12560, "30": 5795}
1347	12	ALARAHAN PİKNİK TURU	SİDE	TRY	2025-11-01 00:04:10.371844	2025-11-01 00:04:10.371844	{"28": 8480, "29": 12900, "30": 5850}
1348	12	ALARAHAN PİKNİK TURU	ALANYA	TRY	2025-11-01 00:04:10.372472	2025-11-01 00:04:10.372472	{"28": 8285, "29": 12560, "30": 5795}
1349	12	ALANYA BOT TURU	SİDE	TRY	2025-11-01 00:04:10.373119	2025-11-01 00:04:10.373119	{"28": 8495, "29": 13225, "30": 5670}
1350	12	ALANYA BOT TURU	ALANYA	TRY	2025-11-01 00:04:10.373765	2025-11-01 00:04:10.373765	{"28": 8285, "29": 12560, "30": 5795}
1351	12	WATER PLANET	SİDE	TRY	2025-11-01 00:04:10.374403	2025-11-01 00:04:10.374403	{"28": 8480, "29": 12900, "30": 5850}
1352	12	WATER PLANET	ALANYA	TRY	2025-11-01 00:04:10.375064	2025-11-01 00:04:10.375064	{"28": 8180, "29": 12390, "30": 5745}
1353	12	SEA ALANYA DOLPHIN TURU	ANTALYA	TRY	2025-11-01 00:04:10.375695	2025-11-01 00:04:10.375695	{"28": 9360, "29": 14595, "30": 6140}
1354	12	SEA ALANYA DOLPHIN TURU	KEMER	TRY	2025-11-01 00:04:10.3764	2025-11-01 00:04:10.3764	{"28": 10975, "29": 17170, "30": 7020}
1355	12	SEA ALANYA DOLPHIN TURU	BELEK	TRY	2025-11-01 00:04:10.377035	2025-11-01 00:04:10.377035	{"28": 8820, "29": 13740, "30": 5845}
1356	12	SEA ALANYA DOLPHIN TURU	SİDE	TRY	2025-11-01 00:04:10.377689	2025-11-01 00:04:10.377689	{"28": 7180, "29": 10950, "30": 4890}
1357	12	SEA ALANYA DOLPHIN TURU	ALANYA	TRY	2025-11-01 00:04:10.378372	2025-11-01 00:04:10.378372	{"28": 6345, "29": 9650, "30": 4360}
1358	12	SEA ALANYA TAM GÜN	ANTALYA	TRY	2025-11-01 00:04:10.379014	2025-11-01 00:04:10.379014	{"28": 9470, "29": 14480, "30": 6390}
1359	12	SEA ALANYA TAM GÜN	KEMER	TRY	2025-11-01 00:04:10.379653	2025-11-01 00:04:10.379653	{"28": 10975, "29": 17170, "30": 7020}
1360	12	SEA ALANYA TAM GÜN	BELEK	TRY	2025-11-01 00:04:10.380281	2025-11-01 00:04:10.380281	{"28": 8820, "29": 13740, "30": 5845}
1361	12	SEA ALANYA TAM GÜN	SİDE	TRY	2025-11-01 00:04:10.380932	2025-11-01 00:04:10.380932	{"28": 8280, "29": 12880, "30": 5550}
1362	12	SEA ALANYA TAM GÜN	ALANYA	TRY	2025-11-01 00:04:10.381577	2025-11-01 00:04:10.381577	{"28": 8390, "29": 12715, "30": 5860}
1363	12	SİDE ŞEHİR TURU	SİDE	TRY	2025-11-01 00:04:10.382212	2025-11-01 00:04:10.382212	{"28": 7890, "29": 11960, "30": 5520}
1364	12	SİDE ŞEHİR TURU	ALANYA	TRY	2025-11-01 00:04:10.383083	2025-11-01 00:04:10.383083	{"28": 9115, "29": 13880, "30": 6250}
1365	12	BEŞKONAK TURU	ANTALYA	TRY	2025-11-01 00:04:10.383721	2025-11-01 00:04:10.385649	{"28": 8820, "29": 13740, "30": 5845}
1366	12	BEŞKONAK TURU	KEMER	TRY	2025-11-01 00:04:10.384351	2025-11-01 00:04:10.386282	{"28": 9900, "29": 15455, "30": 6435}
1367	12	BEŞKONAK TURU	BELEK	TRY	2025-11-01 00:04:10.384995	2025-11-01 00:04:10.386891	{"28": 8280, "29": 12880, "30": 5550}
1371	12	BEŞKONAK TURU	SİDE	TRY	2025-11-01 00:04:10.387512	2025-11-01 00:04:10.387512	{"28": 8880, "29": 13530, "30": 6060}
1372	12	BEŞKONAK TURU	ALANYA	TRY	2025-11-01 00:04:10.388146	2025-11-01 00:04:10.388146	{"28": 10260, "29": 15700, "30": 6880}
1373	12	TAZI KANYONU TURU	ANTALYA	TRY	2025-11-01 00:04:10.388778	2025-11-01 00:04:10.388778	{"28": 9360, "29": 14595, "30": 6140}
1374	12	TAZI KANYONU TURU	KEMER	TRY	2025-11-01 00:04:10.389408	2025-11-01 00:04:10.389408	{"28": 10435, "29": 16310, "30": 6725}
1375	12	TAZI KANYONU TURU	BELEK	TRY	2025-11-01 00:04:10.390035	2025-11-01 00:04:10.390035	{"28": 8175, "29": 12710, "30": 5490}
1376	12	TAZI KANYONU TURU	SİDE	TRY	2025-11-01 00:04:10.390711	2025-11-01 00:04:10.390711	{"28": 9360, "29": 14595, "30": 6140}
1377	12	TAZI KANYONU TURU	ALANYA	TRY	2025-11-01 00:04:10.391357	2025-11-01 00:04:10.391357	{"28": 10775, "29": 16530, "30": 7160}
1378	12	ASPENDOS KONSER TURU	ANTALYA	TRY	2025-11-01 00:04:10.391991	2025-11-01 00:04:10.391991	{"28": 5940, "29": 9030, "30": 4090}
1379	12	ASPENDOS KONSER TURU	KEMER	TRY	2025-11-01 00:04:10.392651	2025-11-01 00:04:10.392651	{"28": 8820, "29": 13740, "30": 5845}
1380	12	ASPENDOS KONSER TURU	BELEK	TRY	2025-11-01 00:04:10.393281	2025-11-01 00:04:10.393281	{"28": 3925, "29": 6095, "30": 2660}
1381	12	ASPENDOS KONSER TURU	SİDE	TRY	2025-11-01 00:04:10.393909	2025-11-01 00:04:10.393909	{"28": 5740, "29": 8720, "30": 3980}
1382	12	ASPENDOS KONSER TURU	ALANYA	TRY	2025-11-01 00:04:10.394628	2025-11-01 00:04:10.394628	{"28": 9325, "29": 14205, "30": 6365}
1383	12	OYMAPINAR PİKNİK TURU	ANTALYA	TRY	2025-11-01 00:04:10.395298	2025-11-01 00:04:10.395298	{"28": 8680, "29": 13225, "30": 5950}
1384	12	OYMAPINAR PİKNİK TURU	KEMER	TRY	2025-11-01 00:04:10.395936	2025-11-01 00:04:10.395936	{"28": 9900, "29": 15455, "30": 6435}
1385	12	OYMAPINAR PİKNİK TURU	BELEK	TRY	2025-11-01 00:04:10.396715	2025-11-01 00:04:10.396715	{"28": 7960, "29": 12365, "30": 5375}
1386	12	OYMAPINAR PİKNİK TURU	SİDE	TRY	2025-11-01 00:04:10.39735	2025-11-01 00:04:10.39735	{"28": 7490, "29": 11330, "30": 5310}
1387	12	OYMAPINAR PİKNİK TURU	ALANYA	TRY	2025-11-01 00:04:10.397982	2025-11-01 00:04:10.397982	{"28": 9115, "29": 13880, "30": 6250}
1388	12	KARACAÖREN PİKNİK TURU	ANTALYA	TRY	2025-11-01 00:04:10.39865	2025-11-01 00:04:10.39865	{"28": 8480, "29": 12900, "30": 5850}
1389	12	KARACAÖREN PİKNİK TURU	KEMER	TRY	2025-11-01 00:04:10.39928	2025-11-01 00:04:10.39928	{"28": 9360, "29": 14595, "30": 6140}
1390	12	KARACAÖREN PİKNİK TURU	BELEK	TRY	2025-11-01 00:04:10.399911	2025-11-01 00:04:10.399911	{"28": 8390, "29": 13050, "30": 5610}
1391	12	KARACAÖREN PİKNİK TURU	SİDE	TRY	2025-11-01 00:04:10.400559	2025-11-01 00:04:10.400559	{"28": 9250, "29": 14425, "30": 6080}
1392	12	KARACAÖREN PİKNİK TURU	ALANYA	TRY	2025-11-01 00:04:10.401205	2025-11-01 00:04:10.401205	{"28": 10985, "29": 16855, "30": 7275}
1393	12	DEMRE KEKOVA TURU	ANTALYA	TRY	2025-11-01 00:04:10.401836	2025-11-01 00:04:10.401836	{"28": 10435, "29": 16310, "30": 6725}
1394	12	DEMRE KEKOVA TURU	KEMER	TRY	2025-11-01 00:04:10.402474	2025-11-01 00:04:10.402474	{"28": 9360, "29": 14595, "30": 6140}
1395	12	DEMRE KEKOVA TURU	BELEK	TRY	2025-11-01 00:04:10.40313	2025-11-01 00:04:10.40313	{"28": 10975, "29": 17170, "30": 7020}
1396	12	DEMRE KEKOVA TURU	SİDE	TRY	2025-11-01 00:04:10.403764	2025-11-01 00:04:10.403764	{"28": 11730, "29": 18370, "30": 7435}
1397	12	DEMRE KEKOVA TURU	ALANYA	TRY	2025-11-01 00:04:10.404394	2025-11-01 00:04:10.404394	{"28": 13590, "29": 21000, "30": 8695}
1398	12	PAMUKKALE 1 GÜN	ANTALYA	TRY	2025-11-01 00:04:10.405063	2025-11-01 00:04:10.405063	{"28": 13000, "29": 21500, "30": 8500}
1399	12	PAMUKKALE 1 GÜN	KEMER	TRY	2025-11-01 00:04:10.405696	2025-11-01 00:04:10.405696	{"28": 14065, "29": 23345, "30": 9190}
1400	12	PAMUKKALE 1 GÜN	BELEK	TRY	2025-11-01 00:04:10.406324	2025-11-01 00:04:10.406324	{"28": 14065, "29": 23345, "30": 9190}
1401	12	PAMUKKALE 1 GÜN	SİDE	TRY	2025-11-01 00:04:10.406988	2025-11-01 00:04:10.406988	{"28": 13670, "29": 21455, "30": 8490}
1402	12	PAMUKKALE 1 GÜN	ALANYA	TRY	2025-11-01 00:04:10.407649	2025-11-01 00:04:10.407649	{"28": 15070, "29": 23685, "30": 9255}
1403	12	PAMUKKALE SALDA TURU	ANTALYA	TRY	2025-11-01 00:04:10.408281	2025-11-01 00:04:10.408281	{"28": 15000, "29": 24750, "30": 9500}
1404	12	PAMUKKALE SALDA TURU	KEMER	TRY	2025-11-01 00:04:10.408909	2025-11-01 00:04:10.408909	{"28": 15940, "29": 25780, "30": 10315}
1405	12	PAMUKKALE SALDA TURU	BELEK	TRY	2025-11-01 00:04:10.409605	2025-11-01 00:04:10.409605	{"28": 15940, "29": 25780, "30": 10315}
1406	12	PAMUKKALE SALDA TURU	SİDE	TRY	2025-11-01 00:04:10.410272	2025-11-01 00:04:10.410272	{"28": 14210, "29": 22315, "30": 8785}
1407	12	PAMUKKALE SALDA TURU	ALANYA	TRY	2025-11-01 00:04:10.41091	2025-11-01 00:04:10.41091	{"28": 15610, "29": 24540, "30": 9550}
1408	12	PAMUKKALE 2 GÜN	ANTALYA	TRY	2025-11-01 00:04:10.411547	2025-11-01 00:04:10.411547	{"28": 19255, "29": 30050, "30": 12570}
1409	12	PAMUKKALE 2 GÜN	KEMER	TRY	2025-11-01 00:04:10.412177	2025-11-01 00:04:10.412177	{"28": 20120, "29": 31420, "30": 13040}
1410	12	PAMUKKALE 2 GÜN	BELEK	TRY	2025-11-01 00:04:10.412888	2025-11-01 00:04:10.412888	{"28": 19475, "29": 30390, "30": 12690}
1411	12	PAMUKKALE 2 GÜN	SİDE	TRY	2025-11-01 00:04:10.413543	2025-11-01 00:04:10.413543	{"28": 20550, "29": 32105, "30": 13280}
1412	12	PAMUKKALE 2 GÜN	ALANYA	TRY	2025-11-01 00:04:10.414176	2025-11-01 00:04:10.414176	{"28": 23005, "29": 35365, "30": 15110}
1413	12	KAPADOKYA 2 GÜN	ANTALYA	TRY	2025-11-01 00:04:10.414822	2025-11-01 00:04:10.414822	{"28": 29000, "29": 46000, "30": 19000}
1414	12	KAPADOKYA 2 GÜN	KEMER	TRY	2025-11-01 00:04:10.415486	2025-11-01 00:04:10.415486	{"28": 27775, "29": 43595, "30": 17215}
1791	13	BEŞKONAK TURU	ANTALYA	TRY	2025-11-02 10:43:34.98984	2025-11-02 10:43:34.996087	{"31": 8820, "32": 5845}
1415	12	KAPADOKYA 2 GÜN	BELEK	TRY	2025-11-01 00:04:10.416125	2025-11-01 00:04:10.416125	{"28": 25725, "29": 40340, "30": 16100}
1416	12	KAPADOKYA 2 GÜN	SİDE	TRY	2025-11-01 00:04:10.41676	2025-11-01 00:04:10.41676	{"28": 25185, "29": 39480, "30": 15805}
1417	12	KAPADOKYA 2 GÜN	ALANYA	TRY	2025-11-01 00:04:10.417397	2025-11-01 00:04:10.417397	{"28": 25725, "29": 40340, "30": 16100}
1418	12	EFES PAMUKKALE 2 GÜN	ANTALYA	TRY	2025-11-01 00:04:10.418035	2025-11-01 00:04:10.418035	{"28": 27000, "29": 45000, "30": 18000}
1419	12	EFES PAMUKKALE 2 GÜN	KEMER	TRY	2025-11-01 00:04:10.418706	2025-11-01 00:04:10.418706	{"28": 28125, "29": 48750, "30": 18750}
1420	12	EFES PAMUKKALE 2 GÜN	BELEK	TRY	2025-11-01 00:04:10.419344	2025-11-01 00:04:10.419344	{"28": 26250, "29": 44065, "30": 17815}
1421	12	EFES PAMUKKALE 2 GÜN	SİDE	TRY	2025-11-01 00:04:10.419982	2025-11-01 00:04:10.419982	{"28": 27340, "29": 42910, "30": 16980}
1422	12	EFES PAMUKKALE 2 GÜN	ALANYA	TRY	2025-11-01 00:04:10.420625	2025-11-01 00:04:10.420625	{"28": 30285, "29": 46935, "30": 19080}
1423	12	DEMRE PAMUKKALE TURU 2 GÜN	ANTALYA	TRY	2025-11-01 00:04:10.421463	2025-11-01 00:04:10.421463	{"28": 21910, "29": 39000, "30": 16000}
1424	12	DEMRE PAMUKKALE TURU 2 GÜN	KEMER	TRY	2025-11-01 00:04:10.422096	2025-11-01 00:04:10.422096	{"28": 24110, "29": 37765, "30": 15220}
1425	12	DEMRE PAMUKKALE TURU 2 GÜN	BELEK	TRY	2025-11-01 00:04:10.422742	2025-11-01 00:04:10.422742	{"28": 23030, "29": 36050, "30": 14630}
1426	12	DEMRE PAMUKKALE TURU 2 GÜN	SİDE	TRY	2025-11-01 00:04:10.423374	2025-11-01 00:04:10.423374	{"28": 24110, "29": 37765, "30": 15220}
1427	12	DEMRE PAMUKKALE TURU 2 GÜN	ALANYA	TRY	2025-11-01 00:04:10.424003	2025-11-01 00:04:10.424003	{"28": 25725, "29": 40340, "30": 16100}
1428	12	KAŞ TURU	ANTALYA	TRY	2025-11-01 00:04:10.424672	2025-11-01 00:04:10.424672	{"28": 12055, "29": 18885, "30": 7610}
1429	12	KAŞ TURU	KEMER	TRY	2025-11-01 00:04:10.42531	2025-11-01 00:04:10.42531	{"28": 10115, "29": 15795, "30": 6550}
1430	12	KEMER ŞEHİR TURU	ANTALYA	TRY	2025-11-01 00:04:10.425948	2025-11-01 00:04:10.425948	{"28": 9145, "29": 14250, "30": 6020}
1431	12	KEMER ŞEHİR TURU	KEMER	TRY	2025-11-01 00:04:10.426629	2025-11-01 00:04:10.426629	{"28": 7740, "29": 12025, "30": 5255}
1432	12	KEMER ŞEHİR TURU	BELEK	TRY	2025-11-01 00:04:10.427276	2025-11-01 00:04:10.427276	{"28": 9465, "29": 14765, "30": 6200}
1433	12	KEMER ŞEHİR TURU	SİDE	TRY	2025-11-01 00:04:10.427918	2025-11-01 00:04:10.427918	{"28": 10435, "29": 16310, "30": 6725}
1434	12	KEMER ŞEHİR TURU	ALANYA	TRY	2025-11-01 00:04:10.42856	2025-11-01 00:04:10.42856	{"28": 12340, "29": 19005, "30": 8010}
1435	12	ADRASAN SULUADA TURU	ANTALYA	TRY	2025-11-01 00:04:10.429193	2025-11-01 00:04:10.429193	{"28": 9145, "29": 14250, "30": 6020}
1436	12	ADRASAN SULUADA TURU	KEMER	TRY	2025-11-01 00:04:10.429826	2025-11-01 00:04:10.429826	{"28": 8065, "29": 12535, "30": 5435}
1437	12	ADRASAN SULUADA TURU	BELEK	TRY	2025-11-01 00:04:10.430493	2025-11-01 00:04:10.430493	{"28": 9575, "29": 14940, "30": 6255}
1438	12	ADRASAN SULUADA TURU	SİDE	TRY	2025-11-01 00:04:10.431142	2025-11-01 00:04:10.431142	{"28": 10435, "29": 16310, "30": 6725}
1439	12	ADRASAN SULUADA TURU	ALANYA	TRY	2025-11-01 00:04:10.431774	2025-11-01 00:04:10.431774	{"28": 12550, "29": 19330, "30": 8130}
1440	12	KEMER BOT TURU	ANTALYA	TRY	2025-11-01 00:04:10.432403	2025-11-01 00:04:10.432403	{"28": 8065, "29": 12535, "30": 5435}
1441	12	KEMER BOT TURU	KEMER	TRY	2025-11-01 00:04:10.433074	2025-11-01 00:04:10.433074	{"28": 7205, "29": 11165, "30": 4965}
1442	12	KEMER BOT TURU	BELEK	TRY	2025-11-01 00:04:10.433711	2025-11-01 00:04:10.433711	{"28": 8605, "29": 13395, "30": 5725}
1443	12	KEMER BOT TURU	SİDE	TRY	2025-11-01 00:04:10.43434	2025-11-01 00:04:10.43434	{"28": 9360, "29": 14595, "30": 6140}
1444	12	KEMER BOT TURU	ALANYA	TRY	2025-11-01 00:04:10.434979	2025-11-01 00:04:10.434979	{"28": 11510, "29": 17685, "30": 7560}
1445	12	GÖYNÜK DİNOPARK TURU	ANTALYA	TRY	2025-11-01 00:04:10.43562	2025-11-01 00:04:10.43562	{"28": 8080, "29": 12270, "30": 5630}
1446	12	GÖYNÜK DİNOPARK TURU	KEMER	TRY	2025-11-01 00:04:10.436355	2025-11-01 00:04:10.436355	{"28": 7205, "29": 11165, "30": 4965}
1447	12	GÖYNÜK DİNOPARK TURU	BELEK	TRY	2025-11-01 00:04:10.437029	2025-11-01 00:04:10.437029	{"28": 8390, "29": 13050, "30": 5610}
1448	12	TAHTALI TURU	ANTALYA	TRY	2025-11-01 00:04:10.437683	2025-11-01 00:04:10.437683	{"28": 8820, "29": 13740, "30": 5845}
1449	12	TAHTALI TURU	KEMER	TRY	2025-11-01 00:04:10.438315	2025-11-01 00:04:10.438315	{"28": 7420, "29": 11510, "30": 5080}
1450	12	TAHTALI TURU	BELEK	TRY	2025-11-01 00:04:10.438975	2025-11-01 00:04:10.438975	{"28": 9035, "29": 14080, "30": 5965}
1451	12	TAHTALI TURU	SİDE	TRY	2025-11-01 00:04:10.439604	2025-11-01 00:04:10.439604	{"28": 10005, "29": 15625, "30": 6490}
1452	12	TAHTALI TURU	ALANYA	TRY	2025-11-01 00:04:10.440264	2025-11-01 00:04:10.440264	{"28": 11920, "29": 18345, "30": 7780}
1453	12	TAHTALI + AKVARYUM TURU	ANTALYA	TRY	2025-11-01 00:04:10.440905	2025-11-01 00:04:10.440905	{"28": 9500, "29": 15000, "30": 6120}
1454	12	TAHTALI + AKVARYUM TURU	KEMER	TRY	2025-11-01 00:04:10.441552	2025-11-01 00:04:10.441552	{"28": 8495, "29": 13225, "30": 5670}
1455	12	TAHTALI + AKVARYUM TURU	BELEK	TRY	2025-11-01 00:04:10.442185	2025-11-01 00:04:10.442185	{"28": 9035, "29": 14080, "30": 5965}
1456	12	TAHTALI + AKVARYUM TURU	SİDE	TRY	2025-11-01 00:04:10.442817	2025-11-01 00:04:10.442817	{"28": 10005, "29": 15625, "30": 6490}
1457	12	TAHTALI + AKVARYUM TURU	ALANYA	TRY	2025-11-01 00:04:10.443452	2025-11-01 00:04:10.443452	{"28": 11920, "29": 18345, "30": 7780}
1458	12	ULUPINAR OLİMPOS PHASELİS TURU	ANTALYA	TRY	2025-11-01 00:04:10.444094	2025-11-01 00:04:10.444094	{"28": 9270, "29": 14160, "30": 6280}
1459	12	ULUPINAR OLİMPOS PHASELİS TURU	KEMER	TRY	2025-11-01 00:04:10.444783	2025-11-01 00:04:10.444783	{"28": 8065, "29": 12535, "30": 5435}
1460	12	ULUPINAR OLİMPOS PHASELİS TURU	BELEK	TRY	2025-11-01 00:04:10.445455	2025-11-01 00:04:10.445455	{"28": 9465, "29": 14765, "30": 6200}
1461	12	ULUPINAR OLİMPOS PHASELİS TURU	SİDE	TRY	2025-11-01 00:04:10.446083	2025-11-01 00:04:10.446083	{"28": 10435, "29": 16310, "30": 6725}
1462	12	ULUPINAR OLİMPOS PHASELİS TURU	ALANYA	TRY	2025-11-01 00:04:10.446742	2025-11-01 00:04:10.446742	{"28": 12340, "29": 19005, "30": 8010}
1463	12	PERGE ANTALYA TURU	ANTALYA	TRY	2025-11-01 00:04:10.447374	2025-11-01 00:04:10.447374	{"28": 8080, "29": 12270, "30": 5630}
1464	12	PERGE ANTALYA TURU	KEMER	TRY	2025-11-01 00:04:10.448021	2025-11-01 00:04:10.448021	{"28": 9145, "29": 14250, "30": 6020}
1465	12	PERGE ANTALYA TURU	BELEK	TRY	2025-11-01 00:04:10.448649	2025-11-01 00:04:10.448649	{"28": 8280, "29": 12880, "30": 5550}
1466	12	PERGE ANTALYA TURU	SİDE	TRY	2025-11-01 00:04:10.449279	2025-11-01 00:04:10.449279	{"28": 9035, "29": 14080, "30": 5965}
1467	12	PERGE ANTALYA TURU	ALANYA	TRY	2025-11-01 00:04:10.449905	2025-11-01 00:04:10.449905	{"28": 10435, "29": 16310, "30": 6725}
1468	12	PERGE ASPENDOS SİDE	ANTALYA	TRY	2025-11-01 00:04:10.450531	2025-11-01 00:04:10.450531	{"28": 8605, "29": 13395, "30": 5725}
1469	12	PERGE ASPENDOS SİDE	KEMER	TRY	2025-11-01 00:04:10.451164	2025-11-01 00:04:10.451164	{"28": 9790, "29": 15280, "30": 6375}
1470	12	PERGE ASPENDOS SİDE	BELEK	TRY	2025-11-01 00:04:10.451802	2025-11-01 00:04:10.451802	{"28": 8065, "29": 12535, "30": 5435}
1471	12	PERGE ASPENDOS SİDE	SİDE	TRY	2025-11-01 00:04:10.452449	2025-11-01 00:04:10.452449	{"28": 8820, "29": 13740, "30": 5845}
1472	12	PERGE ASPENDOS SİDE	ALANYA	TRY	2025-11-01 00:04:10.453109	2025-11-01 00:04:10.453109	{"28": 10330, "29": 16140, "30": 6670}
1473	12	ANTALYA AKŞAM YEMEK TURU	ANTALYA	TRY	2025-11-01 00:04:10.453905	2025-11-01 00:04:10.453905	{"28": 5760, "29": 8930, "30": 3970}
1474	12	ANTALYA AKŞAM YEMEK TURU	KEMER	TRY	2025-11-01 00:04:10.454556	2025-11-01 00:04:10.454556	{"28": 7740, "29": 12025, "30": 5255}
1475	12	ANTALYA AKŞAM YEMEK TURU	BELEK	TRY	2025-11-01 00:04:10.455226	2025-11-01 00:04:10.455226	{"28": 6195, "29": 9620, "30": 4205}
1476	12	ANTALYA AKŞAM YEMEK TURU	SİDE	TRY	2025-11-01 00:04:10.455913	2025-11-01 00:04:10.455913	{"28": 8280, "29": 12880, "30": 5550}
1477	12	ANTALYA AKŞAM YEMEK TURU	ALANYA	TRY	2025-11-01 00:04:10.456547	2025-11-01 00:04:10.456547	{"28": 9360, "29": 14595, "30": 6140}
1478	12	KEMER	KEMER	TRY	2025-11-01 00:04:10.457181	2025-11-01 00:04:10.457181	{"28": 2665, "29": 4075, "30": 1800}
1479	12	KEMER	ANTALYA	TRY	2025-11-01 00:04:10.457815	2025-11-01 00:04:10.457815	{"28": 3895, "29": 5950, "30": 2510}
1480	12	KEMER	BELEK	TRY	2025-11-01 00:04:10.458449	2025-11-01 00:04:10.458449	{"28": 6470, "29": 9890, "30": 4150}
1481	12	KEMER	SİDE	TRY	2025-11-01 00:04:10.459079	2025-11-01 00:04:10.459079	{"28": 8665, "29": 13375, "30": 5480}
1482	12	KEMER	ALANYA	TRY	2025-11-01 00:04:10.459713	2025-11-01 00:04:10.459713	{"28": 12085, "29": 18610, "30": 7570}
1483	12	ANTALYA	ANTALYA	TRY	2025-11-01 00:04:10.460363	2025-11-01 00:04:10.460363	{"28": 2665, "29": 4075, "30": 1800}
1484	12	ANTALYA	BELEK	TRY	2025-11-01 00:04:10.461045	2025-11-01 00:04:10.461045	{"28": 3275, "29": 4915, "30": 2160}
1485	12	ANTALYA	SİDE	TRY	2025-11-01 00:04:10.46188	2025-11-01 00:04:10.46188	{"28": 4870, "29": 7360, "30": 3115}
1486	12	ANTALYA	ALANYA	TRY	2025-11-01 00:04:10.462549	2025-11-01 00:04:10.462549	{"28": 6865, "29": 10565, "30": 4355}
1487	12	BELEK	BELEK	TRY	2025-11-01 00:04:10.463205	2025-11-01 00:04:10.463205	{"28": 2665, "29": 4075, "30": 1800}
1488	12	BELEK	SİDE	TRY	2025-11-01 00:04:10.463836	2025-11-01 00:04:10.463836	{"28": 3700, "29": 5650, "30": 2420}
1489	12	BELEK	ALANYA	TRY	2025-11-01 00:04:10.464465	2025-11-01 00:04:10.464465	{"28": 6255, "29": 9505, "30": 3985}
1490	12	SİDE	SİDE	TRY	2025-11-01 00:04:10.465095	2025-11-01 00:04:10.465095	{"28": 2665, "29": 4075, "30": 1800}
1491	12	SİDE	ALANYA	TRY	2025-11-01 00:04:10.465731	2025-11-01 00:04:10.465731	{"28": 4870, "29": 7360, "30": 3115}
1492	12	BÖLGE İÇİ ARA TRANSFER	ARA TRANSFER	TRY	2025-11-01 00:04:10.466362	2025-11-01 00:04:10.466362	{"28": 2665, "29": 4075, "30": 1800}
1708	13	KİRİŞ - ÇAMYUVA-TEKİROVA	HAVALİMANI	TRY	2025-11-02 10:43:34.847963	2025-11-02 10:43:34.847963	{"31": 4280, "32": 2800}
1709	13	BELEK	HAVALİMANI	TRY	2025-11-02 10:43:34.852469	2025-11-02 10:43:34.852469	{"31": 3500, "32": 2270}
1710	13	BOĞAZKENT	HAVALİMANI	TRY	2025-11-02 10:43:34.857255	2025-11-02 10:43:34.857255	{"31": 3850, "32": 2450}
1711	13	DENİZYAKA LİKYA WORLD	HAVALİMANI	TRY	2025-11-02 10:43:34.858983	2025-11-02 10:43:34.858983	{"31": 4100, "32": 2750}
1712	13	SİDE	HAVALİMANI	TRY	2025-11-02 10:43:34.860285	2025-11-02 10:43:34.860285	{"31": 4100, "32": 2750}
1713	13	KIZILAĞAÇ - KIZILOT	HAVALİMANI	TRY	2025-11-02 10:43:34.86179	2025-11-02 10:43:34.86179	{"31": 4350, "32": 2940}
1714	13	ALANYA	HAVALİMANI	TRY	2025-11-02 10:43:34.863081	2025-11-02 10:43:34.863081	{"31": 5500, "32": 3640}
1715	13	MAHMUTLAR	HAVALİMANI	TRY	2025-11-02 10:43:34.86455	2025-11-02 10:43:34.86455	{"31": 5775, "32": 3825}
1716	13	ÇIRALI	HAVALİMANI	TRY	2025-11-02 10:43:34.865902	2025-11-02 10:43:34.865902	{"31": 5400, "32": 3470}
1717	13	ADRASAN	HAVALİMANI	TRY	2025-11-02 10:43:34.867338	2025-11-02 10:43:34.867338	{"31": 5795, "32": 3840}
1718	13	KUMLUCA	HAVALİMANI	TRY	2025-11-02 10:43:34.868659	2025-11-02 10:43:34.868659	{"31": 6360, "32": 4205}
1719	13	FİNİKE	HAVALİMANI	TRY	2025-11-02 10:43:34.869894	2025-11-02 10:43:34.869894	{"31": 7380, "32": 4885}
1720	13	DEMRE	HAVALİMANI	TRY	2025-11-02 10:43:34.87127	2025-11-02 10:43:34.87127	{"31": 9430, "32": 6235}
1721	13	KAŞ	HAVALİMANI	TRY	2025-11-02 10:43:34.872932	2025-11-02 10:43:34.872932	{"31": 11720, "32": 7440}
1722	13	FETHİYE	HAVALİMANI	TRY	2025-11-02 10:43:34.874339	2025-11-02 10:43:34.874339	{"31": 13210, "32": 8205}
1723	13	DALAMAN	HAVALİMANI	TRY	2025-11-02 10:43:34.875819	2025-11-02 10:43:34.875819	{"31": 14665, "32": 9160}
1724	13	MARMARİS	HAVALİMANI	TRY	2025-11-02 10:43:34.877069	2025-11-02 10:43:34.877069	{"31": 20550, "32": 12790}
1725	13	BODRUM	HAVALİMANI	TRY	2025-11-02 10:43:34.878436	2025-11-02 10:43:34.878436	{"31": 26410, "32": 16455}
1726	13	GAZİPAŞA	ALANYA	TRY	2025-11-02 10:43:34.879732	2025-11-02 10:43:34.879732	{"31": 4800, "32": 3120}
1727	13	GAZİPAŞA	SİDE	TRY	2025-11-02 10:43:34.882142	2025-11-02 10:43:34.882142	{"31": 6050, "32": 3880}
1728	13	GAZİPAŞA	BELEK	TRY	2025-11-02 10:43:34.883397	2025-11-02 10:43:34.883397	{"31": 7200, "32": 4600}
1729	13	GAZİPAŞA	ANTALYA	TRY	2025-11-02 10:43:34.884647	2025-11-02 10:43:34.884647	{"31": 8450, "32": 5350}
1730	13	GAZİPAŞA	KEMER	TRY	2025-11-02 10:43:34.886122	2025-11-02 10:43:34.886122	{"31": 10300, "32": 6550}
1731	13	MANAVGAT BOT TURU	ANTALYA	TRY	2025-11-02 10:43:34.887649	2025-11-02 10:43:34.887649	{"31": 8480, "32": 5850}
1732	13	MANAVGAT BOT TURU	KEMER	TRY	2025-11-02 10:43:34.88924	2025-11-02 10:43:34.88924	{"31": 9575, "32": 6255}
1733	13	MANAVGAT BOT TURU	BELEK	TRY	2025-11-02 10:43:34.890699	2025-11-02 10:43:34.890699	{"31": 7740, "32": 5255}
1734	13	MANAVGAT BOT TURU	SİDE	TRY	2025-11-02 10:43:34.891963	2025-11-02 10:43:34.891963	{"31": 7490, "32": 5310}
1735	13	MANAVGAT BOT TURU	ALANYA	TRY	2025-11-02 10:43:34.893346	2025-11-02 10:43:34.893346	{"31": 8695, "32": 6030}
1736	13	DISCOVERY PARK TURU	ANTALYA	TRY	2025-11-02 10:43:34.894626	2025-11-02 10:43:34.894626	{"31": 8480, "32": 5850}
1737	13	DISCOVERY PARK TURU	KEMER	TRY	2025-11-02 10:43:34.896022	2025-11-02 10:43:34.896022	{"31": 9575, "32": 6255}
1738	13	DISCOVERY PARK TURU	BELEK	TRY	2025-11-02 10:43:34.897397	2025-11-02 10:43:34.897397	{"31": 6940, "32": 4380}
1739	13	DISCOVERY PARK TURU	SİDE	TRY	2025-11-02 10:43:34.899048	2025-11-02 10:43:34.899048	{"31": 5540, "32": 3880}
1493	16	ANTALYA	HAVALİMANI	TRY	2025-11-02 10:42:17.586983	2025-11-02 10:42:17.586983	{"37": 1600, "38": 4100, "39": 2500}
1494	16	KEMER	HAVALİMANI	TRY	2025-11-02 10:42:17.613664	2025-11-02 10:42:17.613664	{"37": 2600, "38": 6200, "39": 4000}
1495	16	KİRİŞ - ÇAMYUVA-TEKİROVA	HAVALİMANI	TRY	2025-11-02 10:42:17.621985	2025-11-02 10:42:17.621985	{"37": 2800, "38": 6700, "39": 4280}
1496	16	BELEK	HAVALİMANI	TRY	2025-11-02 10:42:17.627311	2025-11-02 10:42:17.627311	{"37": 2270, "38": 5600, "39": 3500}
1497	16	BOĞAZKENT	HAVALİMANI	TRY	2025-11-02 10:42:17.633092	2025-11-02 10:42:17.633092	{"37": 2450, "38": 6000, "39": 3850}
1498	16	DENİZYAKA LİKYA WORLD	HAVALİMANI	TRY	2025-11-02 10:42:17.634594	2025-11-02 10:42:17.634594	{"37": 2750, "38": 6900, "39": 4100}
1499	16	SİDE	HAVALİMANI	TRY	2025-11-02 10:42:17.635982	2025-11-02 10:42:17.635982	{"37": 2750, "38": 6900, "39": 4100}
1500	16	KIZILAĞAÇ - KIZILOT	HAVALİMANI	TRY	2025-11-02 10:42:17.637194	2025-11-02 10:42:17.637194	{"37": 2940, "38": 7300, "39": 4350}
1501	16	ALANYA	HAVALİMANI	TRY	2025-11-02 10:42:17.638561	2025-11-02 10:42:17.638561	{"37": 3640, "38": 8665, "39": 5500}
1502	16	MAHMUTLAR	HAVALİMANI	TRY	2025-11-02 10:42:17.639627	2025-11-02 10:42:17.639627	{"37": 3825, "38": 9100, "39": 5775}
1503	16	ÇIRALI	HAVALİMANI	TRY	2025-11-02 10:42:17.640928	2025-11-02 10:42:17.640928	{"37": 3470, "38": 8920, "39": 5400}
1504	16	ADRASAN	HAVALİMANI	TRY	2025-11-02 10:42:17.642572	2025-11-02 10:42:17.642572	{"37": 3840, "38": 9640, "39": 5795}
1505	16	KUMLUCA	HAVALİMANI	TRY	2025-11-02 10:42:17.64392	2025-11-02 10:42:17.64392	{"37": 4205, "38": 10270, "39": 6360}
1506	16	FİNİKE	HAVALİMANI	TRY	2025-11-02 10:42:17.64518	2025-11-02 10:42:17.64518	{"37": 4885, "38": 11445, "39": 7380}
1507	16	DEMRE	HAVALİMANI	TRY	2025-11-02 10:42:17.646614	2025-11-02 10:42:17.646614	{"37": 6235, "38": 15285, "39": 9430}
1508	16	KAŞ	HAVALİMANI	TRY	2025-11-02 10:42:17.647878	2025-11-02 10:42:17.647878	{"37": 7440, "38": 19775, "39": 11720}
1509	16	FETHİYE	HAVALİMANI	TRY	2025-11-02 10:42:17.64918	2025-11-02 10:42:17.64918	{"37": 8205, "38": 22220, "39": 13210}
1510	16	DALAMAN	HAVALİMANI	TRY	2025-11-02 10:42:17.650636	2025-11-02 10:42:17.650636	{"37": 9160, "38": 24685, "39": 14665}
1511	16	MARMARİS	HAVALİMANI	TRY	2025-11-02 10:42:17.652363	2025-11-02 10:42:17.652363	{"37": 12790, "38": 34595, "39": 20550}
1512	16	BODRUM	HAVALİMANI	TRY	2025-11-02 10:42:17.653794	2025-11-02 10:42:17.653794	{"37": 16455, "38": 44475, "39": 26410}
1513	16	GAZİPAŞA	ALANYA	TRY	2025-11-02 10:42:17.656233	2025-11-02 10:42:17.656233	{"37": 3120, "38": 8000, "39": 4800}
1514	16	GAZİPAŞA	SİDE	TRY	2025-11-02 10:42:17.657984	2025-11-02 10:42:17.657984	{"37": 3880, "38": 10100, "39": 6050}
1515	16	GAZİPAŞA	BELEK	TRY	2025-11-02 10:42:17.659376	2025-11-02 10:42:17.659376	{"37": 4600, "38": 12100, "39": 7200}
1516	16	GAZİPAŞA	ANTALYA	TRY	2025-11-02 10:42:17.661777	2025-11-02 10:42:17.661777	{"37": 5350, "38": 14100, "39": 8450}
1517	16	GAZİPAŞA	KEMER	TRY	2025-11-02 10:42:17.663039	2025-11-02 10:42:17.663039	{"37": 6550, "38": 17250, "39": 10300}
1518	16	MANAVGAT BOT TURU	ANTALYA	TRY	2025-11-02 10:42:17.664541	2025-11-02 10:42:17.664541	{"37": 5850, "38": 12900, "39": 8480}
1519	16	MANAVGAT BOT TURU	KEMER	TRY	2025-11-02 10:42:17.665789	2025-11-02 10:42:17.665789	{"37": 6255, "38": 14940, "39": 9575}
1520	16	MANAVGAT BOT TURU	BELEK	TRY	2025-11-02 10:42:17.667248	2025-11-02 10:42:17.667248	{"37": 5255, "38": 12025, "39": 7740}
1521	16	MANAVGAT BOT TURU	SİDE	TRY	2025-11-02 10:42:17.668539	2025-11-02 10:42:17.668539	{"37": 5310, "38": 11330, "39": 7490}
1522	16	MANAVGAT BOT TURU	ALANYA	TRY	2025-11-02 10:42:17.676116	2025-11-02 10:42:17.676116	{"37": 6030, "38": 13220, "39": 8695}
1523	16	DISCOVERY PARK TURU	ANTALYA	TRY	2025-11-02 10:42:17.677323	2025-11-02 10:42:17.677323	{"37": 5850, "38": 12900, "39": 8480}
1524	16	DISCOVERY PARK TURU	KEMER	TRY	2025-11-02 10:42:17.678879	2025-11-02 10:42:17.678879	{"37": 6255, "38": 14940, "39": 9575}
1525	16	DISCOVERY PARK TURU	BELEK	TRY	2025-11-02 10:42:17.680091	2025-11-02 10:42:17.680091	{"37": 4380, "38": 10780, "39": 6940}
1526	16	DISCOVERY PARK TURU	SİDE	TRY	2025-11-02 10:42:17.688437	2025-11-02 10:42:17.688437	{"37": 3880, "38": 8400, "39": 5540}
1527	16	DISCOVERY PARK TURU	ALANYA	TRY	2025-11-02 10:42:17.689597	2025-11-02 10:42:17.689597	{"37": 5030, "38": 11175, "39": 7330}
1528	16	BELEK LAND OF LEGENDS TURU	ANTALYA	TRY	2025-11-02 10:42:17.691825	2025-11-02 10:42:17.691825	{"37": 5360, "38": 11480, "39": 7590}
1529	16	BELEK LAND OF LEGENDS TURU	KEMER	TRY	2025-11-02 10:42:17.700053	2025-11-02 10:42:17.700053	{"37": 5845, "38": 13740, "39": 8820}
1530	16	BELEK LAND OF LEGENDS TURU	BELEK	TRY	2025-11-02 10:42:17.703214	2025-11-02 10:42:17.703214	{"37": 4815, "38": 10735, "39": 6935}
1531	16	BELEK LAND OF LEGENDS TURU	SİDE	TRY	2025-11-02 10:42:17.70565	2025-11-02 10:42:17.70565	{"37": 5520, "38": 11960, "39": 7890}
1532	16	BELEK LAND OF LEGENDS TURU	ALANYA	TRY	2025-11-02 10:42:17.707747	2025-11-02 10:42:17.707747	{"37": 6425, "38": 14375, "39": 9430}
1533	16	AQUALAND TURU / AKVARYUM TURU	ANTALYA	TRY	2025-11-02 10:42:17.70926	2025-11-02 10:42:17.70926	{"37": 5310, "38": 11330, "39": 7490}
1534	16	AQUALAND TURU / AKVARYUM TURU	KEMER	TRY	2025-11-02 10:42:17.710652	2025-11-02 10:42:17.710652	{"37": 5255, "38": 12025, "39": 7740}
1535	16	AQUALAND TURU / AKVARYUM TURU	BELEK	TRY	2025-11-02 10:42:17.712152	2025-11-02 10:42:17.712152	{"37": 5255, "38": 12025, "39": 7740}
1536	16	AQUALAND TURU / AKVARYUM TURU	SİDE	TRY	2025-11-02 10:42:17.713531	2025-11-02 10:42:17.713531	{"37": 5850, "38": 12900, "39": 8480}
1537	16	AQUALAND TURU / AKVARYUM TURU	ALANYA	TRY	2025-11-02 10:42:17.714998	2025-11-02 10:42:17.714998	{"37": 6815, "38": 15530, "39": 10155}
1538	16	TÜNEKTEPE TELEFERİK TURU	ANTALYA	TRY	2025-11-02 10:42:17.716306	2025-11-02 10:42:17.716306	{"37": 5410, "38": 11640, "39": 7690}
1539	16	TÜNEKTEPE TELEFERİK TURU	KEMER	TRY	2025-11-02 10:42:17.719194	2025-11-02 10:42:17.719194	{"37": 5140, "38": 11680, "39": 7525}
1540	16	TÜNEKTEPE TELEFERİK TURU	BELEK	TRY	2025-11-02 10:42:17.729312	2025-11-02 10:42:17.729312	{"37": 5435, "38": 12535, "39": 8065}
1541	16	TÜNEKTEPE TELEFERİK TURU	SİDE	TRY	2025-11-02 10:42:17.735529	2025-11-02 10:42:17.735529	{"37": 5845, "38": 13740, "39": 8820}
1542	16	TÜNEKTEPE TELEFERİK TURU	ALANYA	TRY	2025-11-02 10:42:17.74702	2025-11-02 10:42:17.74702	{"37": 6995, "38": 16025, "39": 10470}
1543	16	ANTALYA YAT TURU SETUR MARİNA	ANTALYA	TRY	2025-11-02 10:42:17.756689	2025-11-02 10:42:17.756689	{"37": 5410, "38": 11640, "39": 7690}
1544	16	ANTALYA YAT TURU SETUR MARİNA	KEMER	TRY	2025-11-02 10:42:17.761006	2025-11-02 10:42:17.761006	{"37": 5140, "38": 11680, "39": 7525}
1545	16	ANTALYA YAT TURU SETUR MARİNA	BELEK	TRY	2025-11-02 10:42:17.764893	2025-11-02 10:42:17.764893	{"37": 5435, "38": 12535, "39": 8065}
1546	16	ANTALYA YAT TURU SETUR MARİNA	SİDE	TRY	2025-11-02 10:42:17.768993	2025-11-02 10:42:17.768993	{"37": 5845, "38": 13740, "39": 8820}
1547	16	ANTALYA YAT TURU SETUR MARİNA	ALANYA	TRY	2025-11-02 10:42:17.773229	2025-11-02 10:42:17.773229	{"37": 6995, "38": 16025, "39": 10470}
1548	16	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	ANTALYA	TRY	2025-11-02 10:42:17.776537	2025-11-02 10:42:17.776537	{"37": 5410, "38": 11640, "39": 7690}
1549	16	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	KEMER	TRY	2025-11-02 10:42:17.781045	2025-11-02 10:42:17.781045	{"37": 5140, "38": 11680, "39": 7525}
1550	16	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	BELEK	TRY	2025-11-02 10:42:17.787147	2025-11-02 10:42:17.787147	{"37": 5435, "38": 12535, "39": 8065}
1551	16	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	SİDE	TRY	2025-11-02 10:42:17.790378	2025-11-02 10:42:17.790378	{"37": 6120, "38": 13690, "39": 8980}
1552	16	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	ALANYA	TRY	2025-11-02 10:42:17.793192	2025-11-02 10:42:17.793192	{"37": 6995, "38": 16025, "39": 10470}
1553	16	ANTALYA ŞEHİR TURU	ANTALYA	TRY	2025-11-02 10:42:17.795574	2025-11-02 10:42:17.795574	{"37": 5520, "38": 11960, "39": 7890}
1554	16	ANTALYA ŞEHİR TURU	KEMER	TRY	2025-11-02 10:42:17.798057	2025-11-02 10:42:17.798057	{"37": 5785, "38": 13565, "39": 8710}
1555	16	ANTALYA ŞEHİR TURU	BELEK	TRY	2025-11-02 10:42:17.800575	2025-11-02 10:42:17.800575	{"37": 5550, "38": 12880, "39": 8280}
1556	16	ANTALYA ŞEHİR TURU	SİDE	TRY	2025-11-02 10:42:17.803307	2025-11-02 10:42:17.803307	{"37": 6220, "38": 14000, "39": 9170}
1557	16	ANTALYA ŞEHİR TURU	ALANYA	TRY	2025-11-02 10:42:17.806143	2025-11-02 10:42:17.806143	{"37": 7275, "38": 16855, "39": 10985}
1558	16	ALANYA ŞEHİR TURU	SİDE	TRY	2025-11-02 10:42:17.809056	2025-11-02 10:42:17.809056	{"37": 5950, "38": 13220, "39": 8680}
1559	16	ALANYA ŞEHİR TURU	ALANYA	TRY	2025-11-02 10:42:17.811584	2025-11-02 10:42:17.811584	{"37": 5795, "38": 12560, "39": 8285}
1560	16	ALARAHAN PİKNİK TURU	SİDE	TRY	2025-11-02 10:42:17.813922	2025-11-02 10:42:17.813922	{"37": 5850, "38": 12900, "39": 8480}
1561	16	ALARAHAN PİKNİK TURU	ALANYA	TRY	2025-11-02 10:42:17.81754	2025-11-02 10:42:17.81754	{"37": 5795, "38": 12560, "39": 8285}
1562	16	ALANYA BOT TURU	SİDE	TRY	2025-11-02 10:42:17.822676	2025-11-02 10:42:17.822676	{"37": 5670, "38": 13225, "39": 8495}
1563	16	ALANYA BOT TURU	ALANYA	TRY	2025-11-02 10:42:17.827663	2025-11-02 10:42:17.827663	{"37": 5795, "38": 12560, "39": 8285}
1564	16	WATER PLANET	SİDE	TRY	2025-11-02 10:42:17.830339	2025-11-02 10:42:17.830339	{"37": 5850, "38": 12900, "39": 8480}
1565	16	WATER PLANET	ALANYA	TRY	2025-11-02 10:42:17.833379	2025-11-02 10:42:17.833379	{"37": 5745, "38": 12390, "39": 8180}
1566	16	SEA ALANYA DOLPHIN TURU	ANTALYA	TRY	2025-11-02 10:42:17.835931	2025-11-02 10:42:17.835931	{"37": 6140, "38": 14595, "39": 9360}
1567	16	SEA ALANYA DOLPHIN TURU	KEMER	TRY	2025-11-02 10:42:17.838461	2025-11-02 10:42:17.838461	{"37": 7020, "38": 17170, "39": 10975}
1568	16	SEA ALANYA DOLPHIN TURU	BELEK	TRY	2025-11-02 10:42:17.841696	2025-11-02 10:42:17.841696	{"37": 5845, "38": 13740, "39": 8820}
1569	16	SEA ALANYA DOLPHIN TURU	SİDE	TRY	2025-11-02 10:42:17.844515	2025-11-02 10:42:17.844515	{"37": 4890, "38": 10950, "39": 7180}
1570	16	SEA ALANYA DOLPHIN TURU	ALANYA	TRY	2025-11-02 10:42:17.847267	2025-11-02 10:42:17.847267	{"37": 4360, "38": 9650, "39": 6345}
1571	16	SEA ALANYA TAM GÜN	ANTALYA	TRY	2025-11-02 10:42:17.850491	2025-11-02 10:42:17.850491	{"37": 6390, "38": 14480, "39": 9470}
1572	16	SEA ALANYA TAM GÜN	KEMER	TRY	2025-11-02 10:42:17.853391	2025-11-02 10:42:17.853391	{"37": 7020, "38": 17170, "39": 10975}
1573	16	SEA ALANYA TAM GÜN	BELEK	TRY	2025-11-02 10:42:17.856218	2025-11-02 10:42:17.856218	{"37": 5845, "38": 13740, "39": 8820}
1574	16	SEA ALANYA TAM GÜN	SİDE	TRY	2025-11-02 10:42:17.859227	2025-11-02 10:42:17.859227	{"37": 5550, "38": 12880, "39": 8280}
1575	16	SEA ALANYA TAM GÜN	ALANYA	TRY	2025-11-02 10:42:17.862042	2025-11-02 10:42:17.862042	{"37": 5860, "38": 12715, "39": 8390}
1576	16	SİDE ŞEHİR TURU	SİDE	TRY	2025-11-02 10:42:17.864831	2025-11-02 10:42:17.864831	{"37": 5520, "38": 11960, "39": 7890}
1577	16	SİDE ŞEHİR TURU	ALANYA	TRY	2025-11-02 10:42:17.867376	2025-11-02 10:42:17.867376	{"37": 6250, "38": 13880, "39": 9115}
1740	13	DISCOVERY PARK TURU	ALANYA	TRY	2025-11-02 10:43:34.900454	2025-11-02 10:43:34.900454	{"31": 7330, "32": 5030}
1578	16	BEŞKONAK TURU	ANTALYA	TRY	2025-11-02 10:42:17.871629	2025-11-02 10:42:17.882346	{"37": 5845, "38": 13740, "39": 8820}
1579	16	BEŞKONAK TURU	KEMER	TRY	2025-11-02 10:42:17.875182	2025-11-02 10:42:17.897243	{"37": 6435, "38": 15455, "39": 9900}
1580	16	BEŞKONAK TURU	BELEK	TRY	2025-11-02 10:42:17.878134	2025-11-02 10:42:17.899606	{"37": 5550, "38": 12880, "39": 8280}
1584	16	BEŞKONAK TURU	SİDE	TRY	2025-11-02 10:42:17.902625	2025-11-02 10:42:17.902625	{"37": 6060, "38": 13530, "39": 8880}
1585	16	BEŞKONAK TURU	ALANYA	TRY	2025-11-02 10:42:17.905422	2025-11-02 10:42:17.905422	{"37": 6880, "38": 15700, "39": 10260}
1586	16	TAZI KANYONU TURU	ANTALYA	TRY	2025-11-02 10:42:17.907438	2025-11-02 10:42:17.907438	{"37": 6140, "38": 14595, "39": 9360}
1587	16	TAZI KANYONU TURU	KEMER	TRY	2025-11-02 10:42:17.909736	2025-11-02 10:42:17.909736	{"37": 6725, "38": 16310, "39": 10435}
1588	16	TAZI KANYONU TURU	BELEK	TRY	2025-11-02 10:42:17.912029	2025-11-02 10:42:17.912029	{"37": 5490, "38": 12710, "39": 8175}
1589	16	TAZI KANYONU TURU	SİDE	TRY	2025-11-02 10:42:17.914206	2025-11-02 10:42:17.914206	{"37": 6140, "38": 14595, "39": 9360}
1590	16	TAZI KANYONU TURU	ALANYA	TRY	2025-11-02 10:42:17.916787	2025-11-02 10:42:17.916787	{"37": 7160, "38": 16530, "39": 10775}
1591	16	ASPENDOS KONSER TURU	ANTALYA	TRY	2025-11-02 10:42:17.919111	2025-11-02 10:42:17.919111	{"37": 4090, "38": 9030, "39": 5940}
1592	16	ASPENDOS KONSER TURU	KEMER	TRY	2025-11-02 10:42:17.921066	2025-11-02 10:42:17.921066	{"37": 5845, "38": 13740, "39": 8820}
1593	16	ASPENDOS KONSER TURU	BELEK	TRY	2025-11-02 10:42:17.923027	2025-11-02 10:42:17.923027	{"37": 2660, "38": 6095, "39": 3925}
1594	16	ASPENDOS KONSER TURU	SİDE	TRY	2025-11-02 10:42:17.924883	2025-11-02 10:42:17.924883	{"37": 3980, "38": 8720, "39": 5740}
1741	13	BELEK LAND OF LEGENDS TURU	ANTALYA	TRY	2025-11-02 10:43:34.90332	2025-11-02 10:43:34.90332	{"31": 7590, "32": 5360}
1742	13	BELEK LAND OF LEGENDS TURU	KEMER	TRY	2025-11-02 10:43:34.904886	2025-11-02 10:43:34.904886	{"31": 8820, "32": 5845}
1743	13	BELEK LAND OF LEGENDS TURU	BELEK	TRY	2025-11-02 10:43:34.908896	2025-11-02 10:43:34.908896	{"31": 6935, "32": 4815}
1595	16	ASPENDOS KONSER TURU	ALANYA	TRY	2025-11-02 10:42:17.926938	2025-11-02 10:42:17.926938	{"37": 6365, "38": 14205, "39": 9325}
1596	16	OYMAPINAR PİKNİK TURU	ANTALYA	TRY	2025-11-02 10:42:17.928889	2025-11-02 10:42:17.928889	{"37": 5950, "38": 13225, "39": 8680}
1597	16	OYMAPINAR PİKNİK TURU	KEMER	TRY	2025-11-02 10:42:17.930768	2025-11-02 10:42:17.930768	{"37": 6435, "38": 15455, "39": 9900}
1598	16	OYMAPINAR PİKNİK TURU	BELEK	TRY	2025-11-02 10:42:17.932809	2025-11-02 10:42:17.932809	{"37": 5375, "38": 12365, "39": 7960}
1599	16	OYMAPINAR PİKNİK TURU	SİDE	TRY	2025-11-02 10:42:17.934853	2025-11-02 10:42:17.934853	{"37": 5310, "38": 11330, "39": 7490}
1600	16	OYMAPINAR PİKNİK TURU	ALANYA	TRY	2025-11-02 10:42:17.936824	2025-11-02 10:42:17.936824	{"37": 6250, "38": 13880, "39": 9115}
1601	16	KARACAÖREN PİKNİK TURU	ANTALYA	TRY	2025-11-02 10:42:17.93891	2025-11-02 10:42:17.93891	{"37": 5850, "38": 12900, "39": 8480}
1602	16	KARACAÖREN PİKNİK TURU	KEMER	TRY	2025-11-02 10:42:17.939965	2025-11-02 10:42:17.939965	{"37": 6140, "38": 14595, "39": 9360}
1603	16	KARACAÖREN PİKNİK TURU	BELEK	TRY	2025-11-02 10:42:17.941925	2025-11-02 10:42:17.941925	{"37": 5610, "38": 13050, "39": 8390}
1604	16	KARACAÖREN PİKNİK TURU	SİDE	TRY	2025-11-02 10:42:17.943519	2025-11-02 10:42:17.943519	{"37": 6080, "38": 14425, "39": 9250}
1605	16	KARACAÖREN PİKNİK TURU	ALANYA	TRY	2025-11-02 10:42:17.946368	2025-11-02 10:42:17.946368	{"37": 7275, "38": 16855, "39": 10985}
1606	16	DEMRE KEKOVA TURU	ANTALYA	TRY	2025-11-02 10:42:17.950118	2025-11-02 10:42:17.950118	{"37": 6725, "38": 16310, "39": 10435}
1607	16	DEMRE KEKOVA TURU	KEMER	TRY	2025-11-02 10:42:17.95181	2025-11-02 10:42:17.95181	{"37": 6140, "38": 14595, "39": 9360}
1608	16	DEMRE KEKOVA TURU	BELEK	TRY	2025-11-02 10:42:17.954482	2025-11-02 10:42:17.954482	{"37": 7020, "38": 17170, "39": 10975}
1609	16	DEMRE KEKOVA TURU	SİDE	TRY	2025-11-02 10:42:17.957405	2025-11-02 10:42:17.957405	{"37": 7435, "38": 18370, "39": 11730}
1610	16	DEMRE KEKOVA TURU	ALANYA	TRY	2025-11-02 10:42:17.960041	2025-11-02 10:42:17.960041	{"37": 8695, "38": 21000, "39": 13590}
1611	16	PAMUKKALE 1 GÜN	ANTALYA	TRY	2025-11-02 10:42:17.961628	2025-11-02 10:42:17.961628	{"37": 8500, "38": 21500, "39": 13000}
1612	16	PAMUKKALE 1 GÜN	KEMER	TRY	2025-11-02 10:42:17.963529	2025-11-02 10:42:17.963529	{"37": 9190, "38": 23345, "39": 14065}
1613	16	PAMUKKALE 1 GÜN	BELEK	TRY	2025-11-02 10:42:17.965076	2025-11-02 10:42:17.965076	{"37": 9190, "38": 23345, "39": 14065}
1614	16	PAMUKKALE 1 GÜN	SİDE	TRY	2025-11-02 10:42:17.968661	2025-11-02 10:42:17.968661	{"37": 8490, "38": 21455, "39": 13670}
1615	16	PAMUKKALE 1 GÜN	ALANYA	TRY	2025-11-02 10:42:17.971532	2025-11-02 10:42:17.971532	{"37": 9255, "38": 23685, "39": 15070}
1616	16	PAMUKKALE SALDA TURU	ANTALYA	TRY	2025-11-02 10:42:17.974026	2025-11-02 10:42:17.974026	{"37": 9500, "38": 24750, "39": 15000}
1617	16	PAMUKKALE SALDA TURU	KEMER	TRY	2025-11-02 10:42:17.978026	2025-11-02 10:42:17.978026	{"37": 10315, "38": 25780, "39": 15940}
1618	16	PAMUKKALE SALDA TURU	BELEK	TRY	2025-11-02 10:42:17.979992	2025-11-02 10:42:17.979992	{"37": 10315, "38": 25780, "39": 15940}
1619	16	PAMUKKALE SALDA TURU	SİDE	TRY	2025-11-02 10:42:17.981938	2025-11-02 10:42:17.981938	{"37": 8785, "38": 22315, "39": 14210}
1620	16	PAMUKKALE SALDA TURU	ALANYA	TRY	2025-11-02 10:42:17.984624	2025-11-02 10:42:17.984624	{"37": 9550, "38": 24540, "39": 15610}
1621	16	PAMUKKALE 2 GÜN	ANTALYA	TRY	2025-11-02 10:42:17.988066	2025-11-02 10:42:17.988066	{"37": 12570, "38": 30050, "39": 19255}
1622	16	PAMUKKALE 2 GÜN	KEMER	TRY	2025-11-02 10:42:17.992369	2025-11-02 10:42:17.992369	{"37": 13040, "38": 31420, "39": 20120}
1623	16	PAMUKKALE 2 GÜN	BELEK	TRY	2025-11-02 10:42:17.995844	2025-11-02 10:42:17.995844	{"37": 12690, "38": 30390, "39": 19475}
1624	16	PAMUKKALE 2 GÜN	SİDE	TRY	2025-11-02 10:42:17.998704	2025-11-02 10:42:17.998704	{"37": 13280, "38": 32105, "39": 20550}
1625	16	PAMUKKALE 2 GÜN	ALANYA	TRY	2025-11-02 10:42:18.001155	2025-11-02 10:42:18.001155	{"37": 15110, "38": 35365, "39": 23005}
1626	16	KAPADOKYA 2 GÜN	ANTALYA	TRY	2025-11-02 10:42:18.00409	2025-11-02 10:42:18.00409	{"37": 19000, "38": 46000, "39": 29000}
1627	16	KAPADOKYA 2 GÜN	KEMER	TRY	2025-11-02 10:42:18.006849	2025-11-02 10:42:18.006849	{"37": 17215, "38": 43595, "39": 27775}
1628	16	KAPADOKYA 2 GÜN	BELEK	TRY	2025-11-02 10:42:18.009654	2025-11-02 10:42:18.009654	{"37": 16100, "38": 40340, "39": 25725}
1629	16	KAPADOKYA 2 GÜN	SİDE	TRY	2025-11-02 10:42:18.012359	2025-11-02 10:42:18.012359	{"37": 15805, "38": 39480, "39": 25185}
1630	16	KAPADOKYA 2 GÜN	ALANYA	TRY	2025-11-02 10:42:18.014871	2025-11-02 10:42:18.014871	{"37": 16100, "38": 40340, "39": 25725}
1631	16	EFES PAMUKKALE 2 GÜN	ANTALYA	TRY	2025-11-02 10:42:18.017495	2025-11-02 10:42:18.017495	{"37": 18000, "38": 45000, "39": 27000}
1632	16	EFES PAMUKKALE 2 GÜN	KEMER	TRY	2025-11-02 10:42:18.020995	2025-11-02 10:42:18.020995	{"37": 18750, "38": 48750, "39": 28125}
1633	16	EFES PAMUKKALE 2 GÜN	BELEK	TRY	2025-11-02 10:42:18.023875	2025-11-02 10:42:18.023875	{"37": 17815, "38": 44065, "39": 26250}
1634	16	EFES PAMUKKALE 2 GÜN	SİDE	TRY	2025-11-02 10:42:18.025845	2025-11-02 10:42:18.025845	{"37": 16980, "38": 42910, "39": 27340}
1635	16	EFES PAMUKKALE 2 GÜN	ALANYA	TRY	2025-11-02 10:42:18.027767	2025-11-02 10:42:18.027767	{"37": 19080, "38": 46935, "39": 30285}
1636	16	DEMRE PAMUKKALE TURU 2 GÜN	ANTALYA	TRY	2025-11-02 10:42:18.030448	2025-11-02 10:42:18.030448	{"37": 16000, "38": 39000, "39": 21910}
1637	16	DEMRE PAMUKKALE TURU 2 GÜN	KEMER	TRY	2025-11-02 10:42:18.033175	2025-11-02 10:42:18.033175	{"37": 15220, "38": 37765, "39": 24110}
1638	16	DEMRE PAMUKKALE TURU 2 GÜN	BELEK	TRY	2025-11-02 10:42:18.034928	2025-11-02 10:42:18.034928	{"37": 14630, "38": 36050, "39": 23030}
1639	16	DEMRE PAMUKKALE TURU 2 GÜN	SİDE	TRY	2025-11-02 10:42:18.037061	2025-11-02 10:42:18.037061	{"37": 15220, "38": 37765, "39": 24110}
1640	16	DEMRE PAMUKKALE TURU 2 GÜN	ALANYA	TRY	2025-11-02 10:42:18.03961	2025-11-02 10:42:18.03961	{"37": 16100, "38": 40340, "39": 25725}
1641	16	KAŞ TURU	ANTALYA	TRY	2025-11-02 10:42:18.042091	2025-11-02 10:42:18.042091	{"37": 7610, "38": 18885, "39": 12055}
1642	16	KAŞ TURU	KEMER	TRY	2025-11-02 10:42:18.045046	2025-11-02 10:42:18.045046	{"37": 6550, "38": 15795, "39": 10115}
1643	16	KEMER ŞEHİR TURU	ANTALYA	TRY	2025-11-02 10:42:18.047551	2025-11-02 10:42:18.047551	{"37": 6020, "38": 14250, "39": 9145}
1644	16	KEMER ŞEHİR TURU	KEMER	TRY	2025-11-02 10:42:18.050045	2025-11-02 10:42:18.050045	{"37": 5255, "38": 12025, "39": 7740}
1645	16	KEMER ŞEHİR TURU	BELEK	TRY	2025-11-02 10:42:18.053658	2025-11-02 10:42:18.053658	{"37": 6200, "38": 14765, "39": 9465}
1646	16	KEMER ŞEHİR TURU	SİDE	TRY	2025-11-02 10:42:18.056422	2025-11-02 10:42:18.056422	{"37": 6725, "38": 16310, "39": 10435}
1647	16	KEMER ŞEHİR TURU	ALANYA	TRY	2025-11-02 10:42:18.062179	2025-11-02 10:42:18.062179	{"37": 8010, "38": 19005, "39": 12340}
1648	16	ADRASAN SULUADA TURU	ANTALYA	TRY	2025-11-02 10:42:18.069329	2025-11-02 10:42:18.069329	{"37": 6020, "38": 14250, "39": 9145}
1649	16	ADRASAN SULUADA TURU	KEMER	TRY	2025-11-02 10:42:18.072334	2025-11-02 10:42:18.072334	{"37": 5435, "38": 12535, "39": 8065}
1650	16	ADRASAN SULUADA TURU	BELEK	TRY	2025-11-02 10:42:18.074868	2025-11-02 10:42:18.074868	{"37": 6255, "38": 14940, "39": 9575}
1651	16	ADRASAN SULUADA TURU	SİDE	TRY	2025-11-02 10:42:18.076926	2025-11-02 10:42:18.076926	{"37": 6725, "38": 16310, "39": 10435}
1652	16	ADRASAN SULUADA TURU	ALANYA	TRY	2025-11-02 10:42:18.079021	2025-11-02 10:42:18.079021	{"37": 8130, "38": 19330, "39": 12550}
1653	16	KEMER BOT TURU	ANTALYA	TRY	2025-11-02 10:42:18.081905	2025-11-02 10:42:18.081905	{"37": 5435, "38": 12535, "39": 8065}
1654	16	KEMER BOT TURU	KEMER	TRY	2025-11-02 10:42:18.083173	2025-11-02 10:42:18.083173	{"37": 4965, "38": 11165, "39": 7205}
1655	16	KEMER BOT TURU	BELEK	TRY	2025-11-02 10:42:18.09001	2025-11-02 10:42:18.09001	{"37": 5725, "38": 13395, "39": 8605}
1656	16	KEMER BOT TURU	SİDE	TRY	2025-11-02 10:42:18.094088	2025-11-02 10:42:18.094088	{"37": 6140, "38": 14595, "39": 9360}
1657	16	KEMER BOT TURU	ALANYA	TRY	2025-11-02 10:42:18.095401	2025-11-02 10:42:18.095401	{"37": 7560, "38": 17685, "39": 11510}
1658	16	GÖYNÜK DİNOPARK TURU	ANTALYA	TRY	2025-11-02 10:42:18.097067	2025-11-02 10:42:18.097067	{"37": 5630, "38": 12270, "39": 8080}
1659	16	GÖYNÜK DİNOPARK TURU	KEMER	TRY	2025-11-02 10:42:18.098318	2025-11-02 10:42:18.098318	{"37": 4965, "38": 11165, "39": 7205}
1660	16	GÖYNÜK DİNOPARK TURU	BELEK	TRY	2025-11-02 10:42:18.100805	2025-11-02 10:42:18.100805	{"37": 5610, "38": 13050, "39": 8390}
1661	16	TAHTALI TURU	ANTALYA	TRY	2025-11-02 10:42:18.102736	2025-11-02 10:42:18.102736	{"37": 5845, "38": 13740, "39": 8820}
1662	16	TAHTALI TURU	KEMER	TRY	2025-11-02 10:42:18.10489	2025-11-02 10:42:18.10489	{"37": 5080, "38": 11510, "39": 7420}
1663	16	TAHTALI TURU	BELEK	TRY	2025-11-02 10:42:18.107662	2025-11-02 10:42:18.107662	{"37": 5965, "38": 14080, "39": 9035}
1664	16	TAHTALI TURU	SİDE	TRY	2025-11-02 10:42:18.11021	2025-11-02 10:42:18.11021	{"37": 6490, "38": 15625, "39": 10005}
1665	16	TAHTALI TURU	ALANYA	TRY	2025-11-02 10:42:18.11166	2025-11-02 10:42:18.11166	{"37": 7780, "38": 18345, "39": 11920}
1666	16	TAHTALI + AKVARYUM TURU	ANTALYA	TRY	2025-11-02 10:42:18.113608	2025-11-02 10:42:18.113608	{"37": 6120, "38": 15000, "39": 9500}
1667	16	TAHTALI + AKVARYUM TURU	KEMER	TRY	2025-11-02 10:42:18.116239	2025-11-02 10:42:18.116239	{"37": 5670, "38": 13225, "39": 8495}
1668	16	TAHTALI + AKVARYUM TURU	BELEK	TRY	2025-11-02 10:42:18.118638	2025-11-02 10:42:18.118638	{"37": 5965, "38": 14080, "39": 9035}
1669	16	TAHTALI + AKVARYUM TURU	SİDE	TRY	2025-11-02 10:42:18.12086	2025-11-02 10:42:18.12086	{"37": 6490, "38": 15625, "39": 10005}
1670	16	TAHTALI + AKVARYUM TURU	ALANYA	TRY	2025-11-02 10:42:18.122959	2025-11-02 10:42:18.122959	{"37": 7780, "38": 18345, "39": 11920}
1671	16	ULUPINAR OLİMPOS PHASELİS TURU	ANTALYA	TRY	2025-11-02 10:42:18.125254	2025-11-02 10:42:18.125254	{"37": 6280, "38": 14160, "39": 9270}
1672	16	ULUPINAR OLİMPOS PHASELİS TURU	KEMER	TRY	2025-11-02 10:42:18.126695	2025-11-02 10:42:18.126695	{"37": 5435, "38": 12535, "39": 8065}
1673	16	ULUPINAR OLİMPOS PHASELİS TURU	BELEK	TRY	2025-11-02 10:42:18.128831	2025-11-02 10:42:18.128831	{"37": 6200, "38": 14765, "39": 9465}
1674	16	ULUPINAR OLİMPOS PHASELİS TURU	SİDE	TRY	2025-11-02 10:42:18.130687	2025-11-02 10:42:18.130687	{"37": 6725, "38": 16310, "39": 10435}
1675	16	ULUPINAR OLİMPOS PHASELİS TURU	ALANYA	TRY	2025-11-02 10:42:18.132106	2025-11-02 10:42:18.132106	{"37": 8010, "38": 19005, "39": 12340}
1676	16	PERGE ANTALYA TURU	ANTALYA	TRY	2025-11-02 10:42:18.1343	2025-11-02 10:42:18.1343	{"37": 5630, "38": 12270, "39": 8080}
1677	16	PERGE ANTALYA TURU	KEMER	TRY	2025-11-02 10:42:18.136309	2025-11-02 10:42:18.136309	{"37": 6020, "38": 14250, "39": 9145}
1678	16	PERGE ANTALYA TURU	BELEK	TRY	2025-11-02 10:42:18.138528	2025-11-02 10:42:18.138528	{"37": 5550, "38": 12880, "39": 8280}
1679	16	PERGE ANTALYA TURU	SİDE	TRY	2025-11-02 10:42:18.139894	2025-11-02 10:42:18.139894	{"37": 5965, "38": 14080, "39": 9035}
1680	16	PERGE ANTALYA TURU	ALANYA	TRY	2025-11-02 10:42:18.141411	2025-11-02 10:42:18.141411	{"37": 6725, "38": 16310, "39": 10435}
1681	16	PERGE ASPENDOS SİDE	ANTALYA	TRY	2025-11-02 10:42:18.142791	2025-11-02 10:42:18.142791	{"37": 5725, "38": 13395, "39": 8605}
1682	16	PERGE ASPENDOS SİDE	KEMER	TRY	2025-11-02 10:42:18.144269	2025-11-02 10:42:18.144269	{"37": 6375, "38": 15280, "39": 9790}
1683	16	PERGE ASPENDOS SİDE	BELEK	TRY	2025-11-02 10:42:18.145497	2025-11-02 10:42:18.145497	{"37": 5435, "38": 12535, "39": 8065}
1684	16	PERGE ASPENDOS SİDE	SİDE	TRY	2025-11-02 10:42:18.146733	2025-11-02 10:42:18.146733	{"37": 5845, "38": 13740, "39": 8820}
1685	16	PERGE ASPENDOS SİDE	ALANYA	TRY	2025-11-02 10:42:18.147991	2025-11-02 10:42:18.147991	{"37": 6670, "38": 16140, "39": 10330}
1686	16	ANTALYA AKŞAM YEMEK TURU	ANTALYA	TRY	2025-11-02 10:42:18.149578	2025-11-02 10:42:18.149578	{"37": 3970, "38": 8930, "39": 5760}
1687	16	ANTALYA AKŞAM YEMEK TURU	KEMER	TRY	2025-11-02 10:42:18.150859	2025-11-02 10:42:18.150859	{"37": 5255, "38": 12025, "39": 7740}
1688	16	ANTALYA AKŞAM YEMEK TURU	BELEK	TRY	2025-11-02 10:42:18.152168	2025-11-02 10:42:18.152168	{"37": 4205, "38": 9620, "39": 6195}
1689	16	ANTALYA AKŞAM YEMEK TURU	SİDE	TRY	2025-11-02 10:42:18.153414	2025-11-02 10:42:18.153414	{"37": 5550, "38": 12880, "39": 8280}
1690	16	ANTALYA AKŞAM YEMEK TURU	ALANYA	TRY	2025-11-02 10:42:18.154659	2025-11-02 10:42:18.154659	{"37": 6140, "38": 14595, "39": 9360}
1691	16	KEMER	KEMER	TRY	2025-11-02 10:42:18.156	2025-11-02 10:42:18.156	{"37": 1800, "38": 4075, "39": 2665}
1692	16	KEMER	ANTALYA	TRY	2025-11-02 10:42:18.158036	2025-11-02 10:42:18.158036	{"37": 2510, "38": 5950, "39": 3895}
1693	16	KEMER	BELEK	TRY	2025-11-02 10:42:18.159486	2025-11-02 10:42:18.159486	{"37": 4150, "38": 9890, "39": 6470}
1694	16	KEMER	SİDE	TRY	2025-11-02 10:42:18.161104	2025-11-02 10:42:18.161104	{"37": 5480, "38": 13375, "39": 8665}
1695	16	KEMER	ALANYA	TRY	2025-11-02 10:42:18.162819	2025-11-02 10:42:18.162819	{"37": 7570, "38": 18610, "39": 12085}
1696	16	ANTALYA	ANTALYA	TRY	2025-11-02 10:42:18.164907	2025-11-02 10:42:18.164907	{"37": 1800, "38": 4075, "39": 2665}
1697	16	ANTALYA	BELEK	TRY	2025-11-02 10:42:18.167265	2025-11-02 10:42:18.167265	{"37": 2160, "38": 4915, "39": 3275}
1698	16	ANTALYA	SİDE	TRY	2025-11-02 10:42:18.169111	2025-11-02 10:42:18.169111	{"37": 3115, "38": 7360, "39": 4870}
1699	16	ANTALYA	ALANYA	TRY	2025-11-02 10:42:18.177068	2025-11-02 10:42:18.177068	{"37": 4355, "38": 10565, "39": 6865}
1700	16	BELEK	BELEK	TRY	2025-11-02 10:42:18.178457	2025-11-02 10:42:18.178457	{"37": 1800, "38": 4075, "39": 2665}
1701	16	BELEK	SİDE	TRY	2025-11-02 10:42:18.180043	2025-11-02 10:42:18.180043	{"37": 2420, "38": 5650, "39": 3700}
1702	16	BELEK	ALANYA	TRY	2025-11-02 10:42:18.18138	2025-11-02 10:42:18.18138	{"37": 3985, "38": 9505, "39": 6255}
1703	16	SİDE	SİDE	TRY	2025-11-02 10:42:18.18291	2025-11-02 10:42:18.18291	{"37": 1800, "38": 4075, "39": 2665}
1704	16	SİDE	ALANYA	TRY	2025-11-02 10:42:18.184325	2025-11-02 10:42:18.184325	{"37": 3115, "38": 7360, "39": 4870}
1705	16	BÖLGE İÇİ ARA TRANSFER	ARA TRANSFER	TRY	2025-11-02 10:42:18.186835	2025-11-02 10:42:18.186835	{"37": 1800, "38": 4075, "39": 2665}
1744	13	BELEK LAND OF LEGENDS TURU	SİDE	TRY	2025-11-02 10:43:34.910431	2025-11-02 10:43:34.910431	{"31": 7890, "32": 5520}
1745	13	BELEK LAND OF LEGENDS TURU	ALANYA	TRY	2025-11-02 10:43:34.911964	2025-11-02 10:43:34.911964	{"31": 9430, "32": 6425}
1746	13	AQUALAND TURU / AKVARYUM TURU	ANTALYA	TRY	2025-11-02 10:43:34.913258	2025-11-02 10:43:34.913258	{"31": 7490, "32": 5310}
1747	13	AQUALAND TURU / AKVARYUM TURU	KEMER	TRY	2025-11-02 10:43:34.91508	2025-11-02 10:43:34.91508	{"31": 7740, "32": 5255}
1748	13	AQUALAND TURU / AKVARYUM TURU	BELEK	TRY	2025-11-02 10:43:34.916393	2025-11-02 10:43:34.916393	{"31": 7740, "32": 5255}
1749	13	AQUALAND TURU / AKVARYUM TURU	SİDE	TRY	2025-11-02 10:43:34.918065	2025-11-02 10:43:34.918065	{"31": 8480, "32": 5850}
1750	13	AQUALAND TURU / AKVARYUM TURU	ALANYA	TRY	2025-11-02 10:43:34.91947	2025-11-02 10:43:34.91947	{"31": 10155, "32": 6815}
1751	13	TÜNEKTEPE TELEFERİK TURU	ANTALYA	TRY	2025-11-02 10:43:34.920763	2025-11-02 10:43:34.920763	{"31": 7690, "32": 5410}
1752	13	TÜNEKTEPE TELEFERİK TURU	KEMER	TRY	2025-11-02 10:43:34.922185	2025-11-02 10:43:34.922185	{"31": 7525, "32": 5140}
1753	13	TÜNEKTEPE TELEFERİK TURU	BELEK	TRY	2025-11-02 10:43:34.92387	2025-11-02 10:43:34.92387	{"31": 8065, "32": 5435}
1754	13	TÜNEKTEPE TELEFERİK TURU	SİDE	TRY	2025-11-02 10:43:34.925134	2025-11-02 10:43:34.925134	{"31": 8820, "32": 5845}
1755	13	TÜNEKTEPE TELEFERİK TURU	ALANYA	TRY	2025-11-02 10:43:34.926705	2025-11-02 10:43:34.926705	{"31": 10470, "32": 6995}
1756	13	ANTALYA YAT TURU SETUR MARİNA	ANTALYA	TRY	2025-11-02 10:43:34.928129	2025-11-02 10:43:34.928129	{"31": 7690, "32": 5410}
1757	13	ANTALYA YAT TURU SETUR MARİNA	KEMER	TRY	2025-11-02 10:43:34.929552	2025-11-02 10:43:34.929552	{"31": 7525, "32": 5140}
1758	13	ANTALYA YAT TURU SETUR MARİNA	BELEK	TRY	2025-11-02 10:43:34.930796	2025-11-02 10:43:34.930796	{"31": 8065, "32": 5435}
1759	13	ANTALYA YAT TURU SETUR MARİNA	SİDE	TRY	2025-11-02 10:43:34.932813	2025-11-02 10:43:34.932813	{"31": 8820, "32": 5845}
1760	13	ANTALYA YAT TURU SETUR MARİNA	ALANYA	TRY	2025-11-02 10:43:34.935054	2025-11-02 10:43:34.935054	{"31": 10470, "32": 6995}
1761	13	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	ANTALYA	TRY	2025-11-02 10:43:34.937549	2025-11-02 10:43:34.937549	{"31": 7690, "32": 5410}
1762	13	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	KEMER	TRY	2025-11-02 10:43:34.938908	2025-11-02 10:43:34.938908	{"31": 7525, "32": 5140}
1763	13	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	BELEK	TRY	2025-11-02 10:43:34.940259	2025-11-02 10:43:34.940259	{"31": 8065, "32": 5435}
1764	13	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	SİDE	TRY	2025-11-02 10:43:34.941684	2025-11-02 10:43:34.941684	{"31": 8980, "32": 6120}
1765	13	ANTALYA MACERA PARK TURU / HAYVANAT BAHÇESİ TURU	ALANYA	TRY	2025-11-02 10:43:34.943252	2025-11-02 10:43:34.943252	{"31": 10470, "32": 6995}
1766	13	ANTALYA ŞEHİR TURU	ANTALYA	TRY	2025-11-02 10:43:34.944845	2025-11-02 10:43:34.944845	{"31": 7890, "32": 5520}
1767	13	ANTALYA ŞEHİR TURU	KEMER	TRY	2025-11-02 10:43:34.946136	2025-11-02 10:43:34.946136	{"31": 8710, "32": 5785}
1768	13	ANTALYA ŞEHİR TURU	BELEK	TRY	2025-11-02 10:43:34.947497	2025-11-02 10:43:34.947497	{"31": 8280, "32": 5550}
1769	13	ANTALYA ŞEHİR TURU	SİDE	TRY	2025-11-02 10:43:34.949921	2025-11-02 10:43:34.949921	{"31": 9170, "32": 6220}
1770	13	ANTALYA ŞEHİR TURU	ALANYA	TRY	2025-11-02 10:43:34.951417	2025-11-02 10:43:34.951417	{"31": 10985, "32": 7275}
1771	13	ALANYA ŞEHİR TURU	SİDE	TRY	2025-11-02 10:43:34.952999	2025-11-02 10:43:34.952999	{"31": 8680, "32": 5950}
1772	13	ALANYA ŞEHİR TURU	ALANYA	TRY	2025-11-02 10:43:34.954526	2025-11-02 10:43:34.954526	{"31": 8285, "32": 5795}
1773	13	ALARAHAN PİKNİK TURU	SİDE	TRY	2025-11-02 10:43:34.956089	2025-11-02 10:43:34.956089	{"31": 8480, "32": 5850}
1774	13	ALARAHAN PİKNİK TURU	ALANYA	TRY	2025-11-02 10:43:34.958206	2025-11-02 10:43:34.958206	{"31": 8285, "32": 5795}
1775	13	ALANYA BOT TURU	SİDE	TRY	2025-11-02 10:43:34.959616	2025-11-02 10:43:34.959616	{"31": 8495, "32": 5670}
1776	13	ALANYA BOT TURU	ALANYA	TRY	2025-11-02 10:43:34.961925	2025-11-02 10:43:34.961925	{"31": 8285, "32": 5795}
1777	13	WATER PLANET	SİDE	TRY	2025-11-02 10:43:34.963373	2025-11-02 10:43:34.963373	{"31": 8480, "32": 5850}
1778	13	WATER PLANET	ALANYA	TRY	2025-11-02 10:43:34.965754	2025-11-02 10:43:34.965754	{"31": 8180, "32": 5745}
1779	13	SEA ALANYA DOLPHIN TURU	ANTALYA	TRY	2025-11-02 10:43:34.967627	2025-11-02 10:43:34.967627	{"31": 9360, "32": 6140}
1780	13	SEA ALANYA DOLPHIN TURU	KEMER	TRY	2025-11-02 10:43:34.969234	2025-11-02 10:43:34.969234	{"31": 10975, "32": 7020}
1781	13	SEA ALANYA DOLPHIN TURU	BELEK	TRY	2025-11-02 10:43:34.971398	2025-11-02 10:43:34.971398	{"31": 8820, "32": 5845}
1782	13	SEA ALANYA DOLPHIN TURU	SİDE	TRY	2025-11-02 10:43:34.973354	2025-11-02 10:43:34.973354	{"31": 7180, "32": 4890}
1783	13	SEA ALANYA DOLPHIN TURU	ALANYA	TRY	2025-11-02 10:43:34.975408	2025-11-02 10:43:34.975408	{"31": 6345, "32": 4360}
1784	13	SEA ALANYA TAM GÜN	ANTALYA	TRY	2025-11-02 10:43:34.977185	2025-11-02 10:43:34.977185	{"31": 9470, "32": 6390}
1785	13	SEA ALANYA TAM GÜN	KEMER	TRY	2025-11-02 10:43:34.978635	2025-11-02 10:43:34.978635	{"31": 10975, "32": 7020}
1786	13	SEA ALANYA TAM GÜN	BELEK	TRY	2025-11-02 10:43:34.980437	2025-11-02 10:43:34.980437	{"31": 8820, "32": 5845}
1787	13	SEA ALANYA TAM GÜN	SİDE	TRY	2025-11-02 10:43:34.982214	2025-11-02 10:43:34.982214	{"31": 8280, "32": 5550}
1788	13	SEA ALANYA TAM GÜN	ALANYA	TRY	2025-11-02 10:43:34.98436	2025-11-02 10:43:34.98436	{"31": 8390, "32": 5860}
1789	13	SİDE ŞEHİR TURU	SİDE	TRY	2025-11-02 10:43:34.986502	2025-11-02 10:43:34.986502	{"31": 7890, "32": 5520}
1790	13	SİDE ŞEHİR TURU	ALANYA	TRY	2025-11-02 10:43:34.988371	2025-11-02 10:43:34.988371	{"31": 9115, "32": 6250}
1792	13	BEŞKONAK TURU	KEMER	TRY	2025-11-02 10:43:34.992029	2025-11-02 10:43:35.002947	{"31": 9900, "32": 6435}
1793	13	BEŞKONAK TURU	BELEK	TRY	2025-11-02 10:43:34.994219	2025-11-02 10:43:35.004814	{"31": 8280, "32": 5550}
1797	13	BEŞKONAK TURU	SİDE	TRY	2025-11-02 10:43:35.006296	2025-11-02 10:43:35.006296	{"31": 8880, "32": 6060}
1798	13	BEŞKONAK TURU	ALANYA	TRY	2025-11-02 10:43:35.010996	2025-11-02 10:43:35.010996	{"31": 10260, "32": 6880}
1799	13	TAZI KANYONU TURU	ANTALYA	TRY	2025-11-02 10:43:35.01288	2025-11-02 10:43:35.01288	{"31": 9360, "32": 6140}
1800	13	TAZI KANYONU TURU	KEMER	TRY	2025-11-02 10:43:35.015052	2025-11-02 10:43:35.015052	{"31": 10435, "32": 6725}
1801	13	TAZI KANYONU TURU	BELEK	TRY	2025-11-02 10:43:35.017009	2025-11-02 10:43:35.017009	{"31": 8175, "32": 5490}
1802	13	TAZI KANYONU TURU	SİDE	TRY	2025-11-02 10:43:35.018745	2025-11-02 10:43:35.018745	{"31": 9360, "32": 6140}
1803	13	TAZI KANYONU TURU	ALANYA	TRY	2025-11-02 10:43:35.020675	2025-11-02 10:43:35.020675	{"31": 10775, "32": 7160}
1804	13	ASPENDOS KONSER TURU	ANTALYA	TRY	2025-11-02 10:43:35.022298	2025-11-02 10:43:35.022298	{"31": 5940, "32": 4090}
1805	13	ASPENDOS KONSER TURU	KEMER	TRY	2025-11-02 10:43:35.02364	2025-11-02 10:43:35.02364	{"31": 8820, "32": 5845}
1806	13	ASPENDOS KONSER TURU	BELEK	TRY	2025-11-02 10:43:35.025238	2025-11-02 10:43:35.025238	{"31": 3925, "32": 2660}
1807	13	ASPENDOS KONSER TURU	SİDE	TRY	2025-11-02 10:43:35.026685	2025-11-02 10:43:35.026685	{"31": 5740, "32": 3980}
1808	13	ASPENDOS KONSER TURU	ALANYA	TRY	2025-11-02 10:43:35.028076	2025-11-02 10:43:35.028076	{"31": 9325, "32": 6365}
1809	13	OYMAPINAR PİKNİK TURU	ANTALYA	TRY	2025-11-02 10:43:35.029474	2025-11-02 10:43:35.029474	{"31": 8680, "32": 5950}
1810	13	OYMAPINAR PİKNİK TURU	KEMER	TRY	2025-11-02 10:43:35.030941	2025-11-02 10:43:35.030941	{"31": 9900, "32": 6435}
1811	13	OYMAPINAR PİKNİK TURU	BELEK	TRY	2025-11-02 10:43:35.032325	2025-11-02 10:43:35.032325	{"31": 7960, "32": 5375}
1812	13	OYMAPINAR PİKNİK TURU	SİDE	TRY	2025-11-02 10:43:35.033858	2025-11-02 10:43:35.033858	{"31": 7490, "32": 5310}
1813	13	OYMAPINAR PİKNİK TURU	ALANYA	TRY	2025-11-02 10:43:35.035886	2025-11-02 10:43:35.035886	{"31": 9115, "32": 6250}
1814	13	KARACAÖREN PİKNİK TURU	ANTALYA	TRY	2025-11-02 10:43:35.037449	2025-11-02 10:43:35.037449	{"31": 8480, "32": 5850}
1815	13	KARACAÖREN PİKNİK TURU	KEMER	TRY	2025-11-02 10:43:35.039533	2025-11-02 10:43:35.039533	{"31": 9360, "32": 6140}
1816	13	KARACAÖREN PİKNİK TURU	BELEK	TRY	2025-11-02 10:43:35.04133	2025-11-02 10:43:35.04133	{"31": 8390, "32": 5610}
1817	13	KARACAÖREN PİKNİK TURU	SİDE	TRY	2025-11-02 10:43:35.042765	2025-11-02 10:43:35.042765	{"31": 9250, "32": 6080}
1818	13	KARACAÖREN PİKNİK TURU	ALANYA	TRY	2025-11-02 10:43:35.044292	2025-11-02 10:43:35.044292	{"31": 10985, "32": 7275}
1819	13	DEMRE KEKOVA TURU	ANTALYA	TRY	2025-11-02 10:43:35.045865	2025-11-02 10:43:35.045865	{"31": 10435, "32": 6725}
1820	13	DEMRE KEKOVA TURU	KEMER	TRY	2025-11-02 10:43:35.047342	2025-11-02 10:43:35.047342	{"31": 9360, "32": 6140}
1821	13	DEMRE KEKOVA TURU	BELEK	TRY	2025-11-02 10:43:35.048766	2025-11-02 10:43:35.048766	{"31": 10975, "32": 7020}
1822	13	DEMRE KEKOVA TURU	SİDE	TRY	2025-11-02 10:43:35.051272	2025-11-02 10:43:35.051272	{"31": 11730, "32": 7435}
1823	13	DEMRE KEKOVA TURU	ALANYA	TRY	2025-11-02 10:43:35.054504	2025-11-02 10:43:35.054504	{"31": 13590, "32": 8695}
1824	13	PAMUKKALE 1 GÜN	ANTALYA	TRY	2025-11-02 10:43:35.05851	2025-11-02 10:43:35.05851	{"31": 13000, "32": 8500}
1825	13	PAMUKKALE 1 GÜN	KEMER	TRY	2025-11-02 10:43:35.060572	2025-11-02 10:43:35.060572	{"31": 14065, "32": 9190}
1826	13	PAMUKKALE 1 GÜN	BELEK	TRY	2025-11-02 10:43:35.062304	2025-11-02 10:43:35.062304	{"31": 14065, "32": 9190}
1827	13	PAMUKKALE 1 GÜN	SİDE	TRY	2025-11-02 10:43:35.063846	2025-11-02 10:43:35.063846	{"31": 13670, "32": 8490}
1828	13	PAMUKKALE 1 GÜN	ALANYA	TRY	2025-11-02 10:43:35.066352	2025-11-02 10:43:35.066352	{"31": 15070, "32": 9255}
1829	13	PAMUKKALE SALDA TURU	ANTALYA	TRY	2025-11-02 10:43:35.071347	2025-11-02 10:43:35.071347	{"31": 15000, "32": 9500}
1830	13	PAMUKKALE SALDA TURU	KEMER	TRY	2025-11-02 10:43:35.07398	2025-11-02 10:43:35.07398	{"31": 15940, "32": 10315}
1831	13	PAMUKKALE SALDA TURU	BELEK	TRY	2025-11-02 10:43:35.076367	2025-11-02 10:43:35.076367	{"31": 15940, "32": 10315}
1832	13	PAMUKKALE SALDA TURU	SİDE	TRY	2025-11-02 10:43:35.078161	2025-11-02 10:43:35.078161	{"31": 14210, "32": 8785}
1833	13	PAMUKKALE SALDA TURU	ALANYA	TRY	2025-11-02 10:43:35.080102	2025-11-02 10:43:35.080102	{"31": 15610, "32": 9550}
1834	13	PAMUKKALE 2 GÜN	ANTALYA	TRY	2025-11-02 10:43:35.082304	2025-11-02 10:43:35.082304	{"31": 19255, "32": 12570}
1835	13	PAMUKKALE 2 GÜN	KEMER	TRY	2025-11-02 10:43:35.084003	2025-11-02 10:43:35.084003	{"31": 20120, "32": 13040}
1836	13	PAMUKKALE 2 GÜN	BELEK	TRY	2025-11-02 10:43:35.086336	2025-11-02 10:43:35.086336	{"31": 19475, "32": 12690}
1837	13	PAMUKKALE 2 GÜN	SİDE	TRY	2025-11-02 10:43:35.08852	2025-11-02 10:43:35.08852	{"31": 20550, "32": 13280}
1838	13	PAMUKKALE 2 GÜN	ALANYA	TRY	2025-11-02 10:43:35.090495	2025-11-02 10:43:35.090495	{"31": 23005, "32": 15110}
1839	13	KAPADOKYA 2 GÜN	ANTALYA	TRY	2025-11-02 10:43:35.092274	2025-11-02 10:43:35.092274	{"31": 29000, "32": 19000}
1840	13	KAPADOKYA 2 GÜN	KEMER	TRY	2025-11-02 10:43:35.093956	2025-11-02 10:43:35.093956	{"31": 27775, "32": 17215}
1841	13	KAPADOKYA 2 GÜN	BELEK	TRY	2025-11-02 10:43:35.095684	2025-11-02 10:43:35.095684	{"31": 25725, "32": 16100}
1842	13	KAPADOKYA 2 GÜN	SİDE	TRY	2025-11-02 10:43:35.097567	2025-11-02 10:43:35.097567	{"31": 25185, "32": 15805}
1843	13	KAPADOKYA 2 GÜN	ALANYA	TRY	2025-11-02 10:43:35.099965	2025-11-02 10:43:35.099965	{"31": 25725, "32": 16100}
1844	13	EFES PAMUKKALE 2 GÜN	ANTALYA	TRY	2025-11-02 10:43:35.102255	2025-11-02 10:43:35.102255	{"31": 27000, "32": 18000}
1845	13	EFES PAMUKKALE 2 GÜN	KEMER	TRY	2025-11-02 10:43:35.105152	2025-11-02 10:43:35.105152	{"31": 28125, "32": 18750}
1846	13	EFES PAMUKKALE 2 GÜN	BELEK	TRY	2025-11-02 10:43:35.107242	2025-11-02 10:43:35.107242	{"31": 26250, "32": 17815}
1847	13	EFES PAMUKKALE 2 GÜN	SİDE	TRY	2025-11-02 10:43:35.109465	2025-11-02 10:43:35.109465	{"31": 27340, "32": 16980}
1848	13	EFES PAMUKKALE 2 GÜN	ALANYA	TRY	2025-11-02 10:43:35.11179	2025-11-02 10:43:35.11179	{"31": 30285, "32": 19080}
1849	13	DEMRE PAMUKKALE TURU 2 GÜN	ANTALYA	TRY	2025-11-02 10:43:35.113459	2025-11-02 10:43:35.113459	{"31": 21910, "32": 16000}
1850	13	DEMRE PAMUKKALE TURU 2 GÜN	KEMER	TRY	2025-11-02 10:43:35.115833	2025-11-02 10:43:35.115833	{"31": 24110, "32": 15220}
1851	13	DEMRE PAMUKKALE TURU 2 GÜN	BELEK	TRY	2025-11-02 10:43:35.119632	2025-11-02 10:43:35.119632	{"31": 23030, "32": 14630}
1852	13	DEMRE PAMUKKALE TURU 2 GÜN	SİDE	TRY	2025-11-02 10:43:35.12267	2025-11-02 10:43:35.12267	{"31": 24110, "32": 15220}
1853	13	DEMRE PAMUKKALE TURU 2 GÜN	ALANYA	TRY	2025-11-02 10:43:35.12633	2025-11-02 10:43:35.12633	{"31": 25725, "32": 16100}
1854	13	KAŞ TURU	ANTALYA	TRY	2025-11-02 10:43:35.130855	2025-11-02 10:43:35.130855	{"31": 12055, "32": 7610}
1855	13	KAŞ TURU	KEMER	TRY	2025-11-02 10:43:35.134266	2025-11-02 10:43:35.134266	{"31": 10115, "32": 6550}
1856	13	KEMER ŞEHİR TURU	ANTALYA	TRY	2025-11-02 10:43:35.138006	2025-11-02 10:43:35.138006	{"31": 9145, "32": 6020}
1857	13	KEMER ŞEHİR TURU	KEMER	TRY	2025-11-02 10:43:35.142668	2025-11-02 10:43:35.142668	{"31": 7740, "32": 5255}
1858	13	KEMER ŞEHİR TURU	BELEK	TRY	2025-11-02 10:43:35.147609	2025-11-02 10:43:35.147609	{"31": 9465, "32": 6200}
1859	13	KEMER ŞEHİR TURU	SİDE	TRY	2025-11-02 10:43:35.152215	2025-11-02 10:43:35.152215	{"31": 10435, "32": 6725}
1860	13	KEMER ŞEHİR TURU	ALANYA	TRY	2025-11-02 10:43:35.15558	2025-11-02 10:43:35.15558	{"31": 12340, "32": 8010}
1861	13	ADRASAN SULUADA TURU	ANTALYA	TRY	2025-11-02 10:43:35.160311	2025-11-02 10:43:35.160311	{"31": 9145, "32": 6020}
1862	13	ADRASAN SULUADA TURU	KEMER	TRY	2025-11-02 10:43:35.207029	2025-11-02 10:43:35.207029	{"31": 8065, "32": 5435}
1863	13	ADRASAN SULUADA TURU	BELEK	TRY	2025-11-02 10:43:35.211728	2025-11-02 10:43:35.211728	{"31": 9575, "32": 6255}
1864	13	ADRASAN SULUADA TURU	SİDE	TRY	2025-11-02 10:43:35.214376	2025-11-02 10:43:35.214376	{"31": 10435, "32": 6725}
1865	13	ADRASAN SULUADA TURU	ALANYA	TRY	2025-11-02 10:43:35.217254	2025-11-02 10:43:35.217254	{"31": 12550, "32": 8130}
1866	13	KEMER BOT TURU	ANTALYA	TRY	2025-11-02 10:43:35.219582	2025-11-02 10:43:35.219582	{"31": 8065, "32": 5435}
1867	13	KEMER BOT TURU	KEMER	TRY	2025-11-02 10:43:35.221625	2025-11-02 10:43:35.221625	{"31": 7205, "32": 4965}
1868	13	KEMER BOT TURU	BELEK	TRY	2025-11-02 10:43:35.224084	2025-11-02 10:43:35.224084	{"31": 8605, "32": 5725}
1869	13	KEMER BOT TURU	SİDE	TRY	2025-11-02 10:43:35.226161	2025-11-02 10:43:35.226161	{"31": 9360, "32": 6140}
1870	13	KEMER BOT TURU	ALANYA	TRY	2025-11-02 10:43:35.228073	2025-11-02 10:43:35.228073	{"31": 11510, "32": 7560}
1871	13	GÖYNÜK DİNOPARK TURU	ANTALYA	TRY	2025-11-02 10:43:35.230606	2025-11-02 10:43:35.230606	{"31": 8080, "32": 5630}
1872	13	GÖYNÜK DİNOPARK TURU	KEMER	TRY	2025-11-02 10:43:35.232848	2025-11-02 10:43:35.232848	{"31": 7205, "32": 4965}
1873	13	GÖYNÜK DİNOPARK TURU	BELEK	TRY	2025-11-02 10:43:35.235141	2025-11-02 10:43:35.235141	{"31": 8390, "32": 5610}
1874	13	TAHTALI TURU	ANTALYA	TRY	2025-11-02 10:43:35.237534	2025-11-02 10:43:35.237534	{"31": 8820, "32": 5845}
1875	13	TAHTALI TURU	KEMER	TRY	2025-11-02 10:43:35.239976	2025-11-02 10:43:35.239976	{"31": 7420, "32": 5080}
1876	13	TAHTALI TURU	BELEK	TRY	2025-11-02 10:43:35.242137	2025-11-02 10:43:35.242137	{"31": 9035, "32": 5965}
1877	13	TAHTALI TURU	SİDE	TRY	2025-11-02 10:43:35.245169	2025-11-02 10:43:35.245169	{"31": 10005, "32": 6490}
1878	13	TAHTALI TURU	ALANYA	TRY	2025-11-02 10:43:35.247691	2025-11-02 10:43:35.247691	{"31": 11920, "32": 7780}
1879	13	TAHTALI + AKVARYUM TURU	ANTALYA	TRY	2025-11-02 10:43:35.250395	2025-11-02 10:43:35.250395	{"31": 9500, "32": 6120}
1880	13	TAHTALI + AKVARYUM TURU	KEMER	TRY	2025-11-02 10:43:35.25352	2025-11-02 10:43:35.25352	{"31": 8495, "32": 5670}
1881	13	TAHTALI + AKVARYUM TURU	BELEK	TRY	2025-11-02 10:43:35.256381	2025-11-02 10:43:35.256381	{"31": 9035, "32": 5965}
1882	13	TAHTALI + AKVARYUM TURU	SİDE	TRY	2025-11-02 10:43:35.259524	2025-11-02 10:43:35.259524	{"31": 10005, "32": 6490}
1883	13	TAHTALI + AKVARYUM TURU	ALANYA	TRY	2025-11-02 10:43:35.262281	2025-11-02 10:43:35.262281	{"31": 11920, "32": 7780}
1884	13	ULUPINAR OLİMPOS PHASELİS TURU	ANTALYA	TRY	2025-11-02 10:43:35.264694	2025-11-02 10:43:35.264694	{"31": 9270, "32": 6280}
1885	13	ULUPINAR OLİMPOS PHASELİS TURU	KEMER	TRY	2025-11-02 10:43:35.267337	2025-11-02 10:43:35.267337	{"31": 8065, "32": 5435}
1886	13	ULUPINAR OLİMPOS PHASELİS TURU	BELEK	TRY	2025-11-02 10:43:35.269731	2025-11-02 10:43:35.269731	{"31": 9465, "32": 6200}
1887	13	ULUPINAR OLİMPOS PHASELİS TURU	SİDE	TRY	2025-11-02 10:43:35.272725	2025-11-02 10:43:35.272725	{"31": 10435, "32": 6725}
1888	13	ULUPINAR OLİMPOS PHASELİS TURU	ALANYA	TRY	2025-11-02 10:43:35.275303	2025-11-02 10:43:35.275303	{"31": 12340, "32": 8010}
1889	13	PERGE ANTALYA TURU	ANTALYA	TRY	2025-11-02 10:43:35.279278	2025-11-02 10:43:35.279278	{"31": 8080, "32": 5630}
1890	13	PERGE ANTALYA TURU	KEMER	TRY	2025-11-02 10:43:35.284267	2025-11-02 10:43:35.284267	{"31": 9145, "32": 6020}
1891	13	PERGE ANTALYA TURU	BELEK	TRY	2025-11-02 10:43:35.287758	2025-11-02 10:43:35.287758	{"31": 8280, "32": 5550}
1892	13	PERGE ANTALYA TURU	SİDE	TRY	2025-11-02 10:43:35.290406	2025-11-02 10:43:35.290406	{"31": 9035, "32": 5965}
1893	13	PERGE ANTALYA TURU	ALANYA	TRY	2025-11-02 10:43:35.292787	2025-11-02 10:43:35.292787	{"31": 10435, "32": 6725}
1894	13	PERGE ASPENDOS SİDE	ANTALYA	TRY	2025-11-02 10:43:35.29556	2025-11-02 10:43:35.29556	{"31": 8605, "32": 5725}
1895	13	PERGE ASPENDOS SİDE	KEMER	TRY	2025-11-02 10:43:35.297727	2025-11-02 10:43:35.297727	{"31": 9790, "32": 6375}
1896	13	PERGE ASPENDOS SİDE	BELEK	TRY	2025-11-02 10:43:35.300343	2025-11-02 10:43:35.300343	{"31": 8065, "32": 5435}
1897	13	PERGE ASPENDOS SİDE	SİDE	TRY	2025-11-02 10:43:35.30299	2025-11-02 10:43:35.30299	{"31": 8820, "32": 5845}
1898	13	PERGE ASPENDOS SİDE	ALANYA	TRY	2025-11-02 10:43:35.305319	2025-11-02 10:43:35.305319	{"31": 10330, "32": 6670}
1899	13	ANTALYA AKŞAM YEMEK TURU	ANTALYA	TRY	2025-11-02 10:43:35.307686	2025-11-02 10:43:35.307686	{"31": 5760, "32": 3970}
1900	13	ANTALYA AKŞAM YEMEK TURU	KEMER	TRY	2025-11-02 10:43:35.310836	2025-11-02 10:43:35.310836	{"31": 7740, "32": 5255}
1901	13	ANTALYA AKŞAM YEMEK TURU	BELEK	TRY	2025-11-02 10:43:35.313166	2025-11-02 10:43:35.313166	{"31": 6195, "32": 4205}
1902	13	ANTALYA AKŞAM YEMEK TURU	SİDE	TRY	2025-11-02 10:43:35.315703	2025-11-02 10:43:35.315703	{"31": 8280, "32": 5550}
1903	13	ANTALYA AKŞAM YEMEK TURU	ALANYA	TRY	2025-11-02 10:43:35.318239	2025-11-02 10:43:35.318239	{"31": 9360, "32": 6140}
1904	13	KEMER	KEMER	TRY	2025-11-02 10:43:35.320624	2025-11-02 10:43:35.320624	{"31": 2665, "32": 1800}
1905	13	KEMER	ANTALYA	TRY	2025-11-02 10:43:35.323221	2025-11-02 10:43:35.323221	{"31": 3895, "32": 2510}
1906	13	KEMER	BELEK	TRY	2025-11-02 10:43:35.326624	2025-11-02 10:43:35.326624	{"31": 6470, "32": 4150}
1907	13	KEMER	SİDE	TRY	2025-11-02 10:43:35.329796	2025-11-02 10:43:35.329796	{"31": 8665, "32": 5480}
1908	13	KEMER	ALANYA	TRY	2025-11-02 10:43:35.333245	2025-11-02 10:43:35.333245	{"31": 12085, "32": 7570}
1909	13	ANTALYA	ANTALYA	TRY	2025-11-02 10:43:35.335881	2025-11-02 10:43:35.335881	{"31": 2665, "32": 1800}
1910	13	ANTALYA	BELEK	TRY	2025-11-02 10:43:35.338391	2025-11-02 10:43:35.338391	{"31": 3275, "32": 2160}
1911	13	ANTALYA	SİDE	TRY	2025-11-02 10:43:35.341125	2025-11-02 10:43:35.341125	{"31": 4870, "32": 3115}
1912	13	ANTALYA	ALANYA	TRY	2025-11-02 10:43:35.344287	2025-11-02 10:43:35.344287	{"31": 6865, "32": 4355}
1913	13	BELEK	BELEK	TRY	2025-11-02 10:43:35.347328	2025-11-02 10:43:35.347328	{"31": 2665, "32": 1800}
1914	13	BELEK	SİDE	TRY	2025-11-02 10:43:35.350467	2025-11-02 10:43:35.350467	{"31": 3700, "32": 2420}
1915	13	BELEK	ALANYA	TRY	2025-11-02 10:43:35.353909	2025-11-02 10:43:35.353909	{"31": 6255, "32": 3985}
1916	13	SİDE	SİDE	TRY	2025-11-02 10:43:35.357048	2025-11-02 10:43:35.357048	{"31": 2665, "32": 1800}
1917	13	SİDE	ALANYA	TRY	2025-11-02 10:43:35.360161	2025-11-02 10:43:35.360161	{"31": 4870, "32": 3115}
1918	13	BÖLGE İÇİ ARA TRANSFER	ARA TRANSFER	TRY	2025-11-02 10:43:35.362755	2025-11-02 10:43:35.362755	{"31": 2665, "32": 1800}
\.


--
-- TOC entry 5453 (class 0 OID 35315)
-- Dependencies: 250
-- Data for Name: vehicle_contracts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicle_contracts (id, vehicle_company_id, contract_code, start_date, end_date, created_at, updated_at) FROM stdin;
2	1	FST-002	2024-06-01	2025-05-31	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
3	2	FST-003	2024-01-15	2024-12-15	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
4	3	FST-004	2024-03-01	2025-02-28	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
5	4	FST-005	2024-01-01	2024-12-31	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
6	5	FST-006	2024-04-01	2025-03-31	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
7	6	FST-007	2024-01-01	2024-12-31	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
8	7	FST-008	2024-05-01	2025-04-30	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
9	8	FST-009	2024-01-01	2024-12-31	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
10	9	FST-010	2024-02-01	2025-01-31	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
11	10	FST-011	2024-01-01	2024-12-31	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
12	11	FST-012	2024-01-01	2024-12-31	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
13	12	FST-013	2024-03-01	2025-02-28	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
14	13	FST-014	2024-01-01	2024-12-31	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689
16	14	FST-016	2025-07-01	2025-12-31	2025-11-01 00:09:11.478458	2025-11-01 00:09:11.478458
15	14	FST-015	2025-01-01	2025-06-25	2025-10-31 21:52:26.045731	2025-11-01 00:11:10.808556
18	8	FST-017	2025-07-01	2026-12-31	2025-11-02 23:10:27.965763	2025-11-02 23:10:27.965763
19	15	FST-02-00018	2026-01-01	2026-01-01	2025-11-03 01:10:04.753961	2025-11-03 01:10:04.753961
20	7	FST-02-00019	2027-01-01	2027-02-02	2025-11-03 01:13:32.925833	2025-11-03 01:13:32.925833
\.


--
-- TOC entry 5455 (class 0 OID 35325)
-- Dependencies: 252
-- Data for Name: vehicle_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.vehicle_types (id, name, vehicle_company_id, created_at, updated_at, min_pax, max_pax) FROM stdin;
1	VIP Mini	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
2	Mini	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
3	Midi	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
4	Bus	1	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
5	VIP Mini	2	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
6	Mini	2	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
7	Midi	2	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
8	Bus	3	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
9	Mini Bus	3	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
10	Mini	4	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
11	Midi	4	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
12	Bus	4	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
13	VIP Mini	5	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
15	VIP Mini	6	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
16	Mini	6	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
17	Midi	6	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
18	Bus	7	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
19	Mini Bus	7	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
20	Mercedes Sprinter	8	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
21	Van	8	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
22	Bus	8	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
23	Luxury Van	9	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
24	Standard Bus	9	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
25	Berlin Cab	10	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
26	Mini Van	10	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
27	Coach	10	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
28	Renault Master	11	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
29	Peugeot Boxer	11	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
30	Coaches	11	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
31	Luxury Sedan	12	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
32	Executive Van	12	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
33	Van	13	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
34	Mini Bus	13	2025-10-31 19:34:50.327689	2025-10-31 19:34:50.327689	\N	\N
14	Mini	5	2025-10-31 19:34:50.327689	2025-10-31 20:36:26.319527	1	12
35	Araç_T_1	14	2025-10-31 21:50:28.209443	2025-10-31 21:50:28.209443	1	12
36	Araç_T_2	14	2025-10-31 21:50:42.679231	2025-10-31 21:50:42.679231	13	25
37	Araç_T_3	14	2025-10-31 21:50:57.036236	2025-10-31 21:50:57.036236	26	35
38	Araç_T_4	14	2025-10-31 21:51:13.66326	2025-10-31 21:51:13.66326	36	40
39	Araç_T_5	14	2025-10-31 21:51:26.648942	2025-10-31 21:51:26.648942	41	60
40	Add Vehicle Company	15	2025-11-02 23:08:08.763613	2025-11-02 23:08:08.763613	\N	\N
41	Araç_T_1	15	2025-11-02 23:16:10.52459	2025-11-02 23:16:10.52459	\N	\N
\.


--
-- TOC entry 5501 (class 0 OID 0)
-- Dependencies: 220
-- Name: cities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cities_id_seq', 10, true);


--
-- TOC entry 5502 (class 0 OID 0)
-- Dependencies: 260
-- Name: cost_general_prices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cost_general_prices_id_seq', 9, true);


--
-- TOC entry 5503 (class 0 OID 0)
-- Dependencies: 258
-- Name: cost_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cost_items_id_seq', 13, true);


--
-- TOC entry 5504 (class 0 OID 0)
-- Dependencies: 256
-- Name: cost_periods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cost_periods_id_seq', 15, true);


--
-- TOC entry 5505 (class 0 OID 0)
-- Dependencies: 262
-- Name: cost_person_prices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cost_person_prices_id_seq', 12, true);


--
-- TOC entry 5506 (class 0 OID 0)
-- Dependencies: 264
-- Name: cost_regional_general_prices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cost_regional_general_prices_id_seq', 1, false);


--
-- TOC entry 5507 (class 0 OID 0)
-- Dependencies: 266
-- Name: cost_regional_person_prices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cost_regional_person_prices_id_seq', 1, false);


--
-- TOC entry 5508 (class 0 OID 0)
-- Dependencies: 254
-- Name: costs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.costs_id_seq', 2, true);


--
-- TOC entry 5509 (class 0 OID 0)
-- Dependencies: 222
-- Name: countries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.countries_id_seq', 6, true);


--
-- TOC entry 5510 (class 0 OID 0)
-- Dependencies: 224
-- Name: country_currencies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.country_currencies_id_seq', 7, true);


--
-- TOC entry 5511 (class 0 OID 0)
-- Dependencies: 226
-- Name: currencies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.currencies_id_seq', 5, true);


--
-- TOC entry 5512 (class 0 OID 0)
-- Dependencies: 228
-- Name: departments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.departments_id_seq', 13, true);


--
-- TOC entry 5513 (class 0 OID 0)
-- Dependencies: 230
-- Name: exchange_rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exchange_rates_id_seq', 159, true);


--
-- TOC entry 5514 (class 0 OID 0)
-- Dependencies: 232
-- Name: merchants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.merchants_id_seq', 16, true);


--
-- TOC entry 5515 (class 0 OID 0)
-- Dependencies: 234
-- Name: positions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.positions_id_seq', 31, true);


--
-- TOC entry 5516 (class 0 OID 0)
-- Dependencies: 236
-- Name: regions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.regions_id_seq', 9, true);


--
-- TOC entry 5517 (class 0 OID 0)
-- Dependencies: 238
-- Name: sub_regions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sub_regions_id_seq', 28, true);


--
-- TOC entry 5518 (class 0 OID 0)
-- Dependencies: 240
-- Name: tour_contract_routes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tour_contract_routes_id_seq', 1, false);


--
-- TOC entry 5519 (class 0 OID 0)
-- Dependencies: 243
-- Name: tours_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tours_id_seq', 5, true);


--
-- TOC entry 5520 (class 0 OID 0)
-- Dependencies: 245
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- TOC entry 5521 (class 0 OID 0)
-- Dependencies: 247
-- Name: vehicle_companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vehicle_companies_id_seq', 15, true);


--
-- TOC entry 5522 (class 0 OID 0)
-- Dependencies: 249
-- Name: vehicle_contract_routes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vehicle_contract_routes_id_seq', 1918, true);


--
-- TOC entry 5523 (class 0 OID 0)
-- Dependencies: 251
-- Name: vehicle_contracts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vehicle_contracts_id_seq', 20, true);


--
-- TOC entry 5524 (class 0 OID 0)
-- Dependencies: 253
-- Name: vehicle_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.vehicle_types_id_seq', 41, true);


--
-- TOC entry 5059 (class 2606 OID 35352)
-- Name: cities cities_name_region_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_name_region_id_key UNIQUE (name, region_id);


--
-- TOC entry 5061 (class 2606 OID 35354)
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- TOC entry 5193 (class 2606 OID 35730)
-- Name: cost_general_prices cost_general_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_general_prices
    ADD CONSTRAINT cost_general_prices_pkey PRIMARY KEY (id);


--
-- TOC entry 5189 (class 2606 OID 35713)
-- Name: cost_items cost_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_items
    ADD CONSTRAINT cost_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5186 (class 2606 OID 35693)
-- Name: cost_periods cost_periods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_periods
    ADD CONSTRAINT cost_periods_pkey PRIMARY KEY (id);


--
-- TOC entry 5196 (class 2606 OID 35756)
-- Name: cost_person_prices cost_person_prices_cost_item_id_age_group_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_person_prices
    ADD CONSTRAINT cost_person_prices_cost_item_id_age_group_key UNIQUE (cost_item_id, age_group);


--
-- TOC entry 5198 (class 2606 OID 35754)
-- Name: cost_person_prices cost_person_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_person_prices
    ADD CONSTRAINT cost_person_prices_pkey PRIMARY KEY (id);


--
-- TOC entry 5201 (class 2606 OID 35781)
-- Name: cost_regional_general_prices cost_regional_general_prices_cost_item_id_sub_region_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_regional_general_prices
    ADD CONSTRAINT cost_regional_general_prices_cost_item_id_sub_region_id_key UNIQUE (cost_item_id, sub_region_id);


--
-- TOC entry 5203 (class 2606 OID 35779)
-- Name: cost_regional_general_prices cost_regional_general_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_regional_general_prices
    ADD CONSTRAINT cost_regional_general_prices_pkey PRIMARY KEY (id);


--
-- TOC entry 5206 (class 2606 OID 35813)
-- Name: cost_regional_person_prices cost_regional_person_prices_cost_item_id_sub_region_id_age__key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_regional_person_prices
    ADD CONSTRAINT cost_regional_person_prices_cost_item_id_sub_region_id_age__key UNIQUE (cost_item_id, sub_region_id, age_group);


--
-- TOC entry 5208 (class 2606 OID 35811)
-- Name: cost_regional_person_prices cost_regional_person_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_regional_person_prices
    ADD CONSTRAINT cost_regional_person_prices_pkey PRIMARY KEY (id);


--
-- TOC entry 5180 (class 2606 OID 35666)
-- Name: costs costs_cost_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costs
    ADD CONSTRAINT costs_cost_code_key UNIQUE (cost_code);


--
-- TOC entry 5182 (class 2606 OID 35664)
-- Name: costs costs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costs
    ADD CONSTRAINT costs_pkey PRIMARY KEY (id);


--
-- TOC entry 5065 (class 2606 OID 35356)
-- Name: countries countries_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_name_key UNIQUE (name);


--
-- TOC entry 5067 (class 2606 OID 35358)
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- TOC entry 5071 (class 2606 OID 35360)
-- Name: country_currencies country_currencies_country_id_currency_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.country_currencies
    ADD CONSTRAINT country_currencies_country_id_currency_code_key UNIQUE (country_id, currency_code);


--
-- TOC entry 5073 (class 2606 OID 35362)
-- Name: country_currencies country_currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.country_currencies
    ADD CONSTRAINT country_currencies_pkey PRIMARY KEY (id);


--
-- TOC entry 5077 (class 2606 OID 35364)
-- Name: currencies currencies_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_code_key UNIQUE (code);


--
-- TOC entry 5079 (class 2606 OID 35366)
-- Name: currencies currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.currencies
    ADD CONSTRAINT currencies_pkey PRIMARY KEY (id);


--
-- TOC entry 5083 (class 2606 OID 35368)
-- Name: departments departments_name_city_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_name_city_id_key UNIQUE (name, city_id);


--
-- TOC entry 5085 (class 2606 OID 35370)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- TOC entry 5089 (class 2606 OID 35372)
-- Name: exchange_rates exchange_rates_country_id_currency_code_rate_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_country_id_currency_code_rate_date_key UNIQUE (country_id, currency_code, rate_date);


--
-- TOC entry 5091 (class 2606 OID 35374)
-- Name: exchange_rates exchange_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (id);


--
-- TOC entry 5097 (class 2606 OID 35376)
-- Name: merchants merchants_name_sub_region_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT merchants_name_sub_region_id_key UNIQUE (name, sub_region_id);


--
-- TOC entry 5099 (class 2606 OID 35378)
-- Name: merchants merchants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT merchants_pkey PRIMARY KEY (id);


--
-- TOC entry 5103 (class 2606 OID 35380)
-- Name: positions positions_name_department_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_name_department_id_key UNIQUE (name, department_id);


--
-- TOC entry 5105 (class 2606 OID 35382)
-- Name: positions positions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_pkey PRIMARY KEY (id);


--
-- TOC entry 5109 (class 2606 OID 35384)
-- Name: regions regions_name_country_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_name_country_id_key UNIQUE (name, country_id);


--
-- TOC entry 5111 (class 2606 OID 35386)
-- Name: regions regions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (id);


--
-- TOC entry 5115 (class 2606 OID 35388)
-- Name: sub_regions sub_regions_name_city_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_regions
    ADD CONSTRAINT sub_regions_name_city_id_key UNIQUE (name, city_id);


--
-- TOC entry 5117 (class 2606 OID 35390)
-- Name: sub_regions sub_regions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_regions
    ADD CONSTRAINT sub_regions_pkey PRIMARY KEY (id);


--
-- TOC entry 5122 (class 2606 OID 35392)
-- Name: tour_contract_routes tour_contract_routes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tour_contract_routes
    ADD CONSTRAINT tour_contract_routes_pkey PRIMARY KEY (id);


--
-- TOC entry 5124 (class 2606 OID 35394)
-- Name: tour_contract_routes tour_contract_routes_tour_id_sub_region_id_vehicle_contract_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tour_contract_routes
    ADD CONSTRAINT tour_contract_routes_tour_id_sub_region_id_vehicle_contract_key UNIQUE (tour_id, sub_region_id, vehicle_contract_route_id);


--
-- TOC entry 5128 (class 2606 OID 35400)
-- Name: tour_sub_regions tour_sub_regions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tour_sub_regions
    ADD CONSTRAINT tour_sub_regions_pkey PRIMARY KEY (tour_id, sub_region_id);


--
-- TOC entry 5138 (class 2606 OID 35402)
-- Name: tours tours_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_pkey PRIMARY KEY (id);


--
-- TOC entry 5140 (class 2606 OID 35404)
-- Name: tours tours_sejour_tour_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_sejour_tour_code_key UNIQUE (sejour_tour_code);


--
-- TOC entry 5148 (class 2606 OID 35406)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5150 (class 2606 OID 35408)
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- TOC entry 5154 (class 2606 OID 35410)
-- Name: vehicle_companies vehicle_companies_name_city_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_companies
    ADD CONSTRAINT vehicle_companies_name_city_id_key UNIQUE (name, city_id);


--
-- TOC entry 5156 (class 2606 OID 35412)
-- Name: vehicle_companies vehicle_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_companies
    ADD CONSTRAINT vehicle_companies_pkey PRIMARY KEY (id);


--
-- TOC entry 5163 (class 2606 OID 35414)
-- Name: vehicle_contract_routes vehicle_contract_routes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_contract_routes
    ADD CONSTRAINT vehicle_contract_routes_pkey PRIMARY KEY (id);


--
-- TOC entry 5165 (class 2606 OID 35416)
-- Name: vehicle_contract_routes vehicle_contract_routes_vehicle_contract_id_from_location_t_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_contract_routes
    ADD CONSTRAINT vehicle_contract_routes_vehicle_contract_id_from_location_t_key UNIQUE (vehicle_contract_id, from_location, to_location);


--
-- TOC entry 5170 (class 2606 OID 35418)
-- Name: vehicle_contracts vehicle_contracts_contract_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_contracts
    ADD CONSTRAINT vehicle_contracts_contract_code_key UNIQUE (contract_code);


--
-- TOC entry 5172 (class 2606 OID 35420)
-- Name: vehicle_contracts vehicle_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_contracts
    ADD CONSTRAINT vehicle_contracts_pkey PRIMARY KEY (id);


--
-- TOC entry 5176 (class 2606 OID 35422)
-- Name: vehicle_types vehicle_types_name_vehicle_company_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_types
    ADD CONSTRAINT vehicle_types_name_vehicle_company_id_key UNIQUE (name, vehicle_company_id);


--
-- TOC entry 5178 (class 2606 OID 35424)
-- Name: vehicle_types vehicle_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_types
    ADD CONSTRAINT vehicle_types_pkey PRIMARY KEY (id);


--
-- TOC entry 5062 (class 1259 OID 35425)
-- Name: idx_cities_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cities_name ON public.cities USING btree (name);


--
-- TOC entry 5063 (class 1259 OID 35426)
-- Name: idx_cities_region_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cities_region_id ON public.cities USING btree (region_id);


--
-- TOC entry 5194 (class 1259 OID 35834)
-- Name: idx_cost_general_prices_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cost_general_prices_item_id ON public.cost_general_prices USING btree (cost_item_id);


--
-- TOC entry 5190 (class 1259 OID 35832)
-- Name: idx_cost_items_period_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cost_items_period_id ON public.cost_items USING btree (cost_period_id);


--
-- TOC entry 5191 (class 1259 OID 35833)
-- Name: idx_cost_items_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cost_items_type ON public.cost_items USING btree (item_type, pricing_type);


--
-- TOC entry 5187 (class 1259 OID 35831)
-- Name: idx_cost_periods_cost_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cost_periods_cost_id ON public.cost_periods USING btree (cost_id);


--
-- TOC entry 5199 (class 1259 OID 35835)
-- Name: idx_cost_person_prices_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cost_person_prices_item_id ON public.cost_person_prices USING btree (cost_item_id);


--
-- TOC entry 5204 (class 1259 OID 35836)
-- Name: idx_cost_regional_general_prices_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cost_regional_general_prices_item_id ON public.cost_regional_general_prices USING btree (cost_item_id);


--
-- TOC entry 5209 (class 1259 OID 35837)
-- Name: idx_cost_regional_person_prices_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cost_regional_person_prices_item_id ON public.cost_regional_person_prices USING btree (cost_item_id);


--
-- TOC entry 5183 (class 1259 OID 35829)
-- Name: idx_costs_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_costs_code ON public.costs USING btree (cost_code);


--
-- TOC entry 5184 (class 1259 OID 35830)
-- Name: idx_costs_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_costs_location ON public.costs USING btree (country_id, region_id, city_id);


--
-- TOC entry 5068 (class 1259 OID 35427)
-- Name: idx_countries_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_countries_code ON public.countries USING btree (code);


--
-- TOC entry 5069 (class 1259 OID 35428)
-- Name: idx_countries_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_countries_name ON public.countries USING btree (name);


--
-- TOC entry 5074 (class 1259 OID 35429)
-- Name: idx_country_currencies_country_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_country_currencies_country_id ON public.country_currencies USING btree (country_id);


--
-- TOC entry 5075 (class 1259 OID 35430)
-- Name: idx_country_currencies_currency_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_country_currencies_currency_code ON public.country_currencies USING btree (currency_code);


--
-- TOC entry 5080 (class 1259 OID 35431)
-- Name: idx_currencies_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_currencies_code ON public.currencies USING btree (code);


--
-- TOC entry 5081 (class 1259 OID 35432)
-- Name: idx_currencies_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_currencies_name ON public.currencies USING btree (name);


--
-- TOC entry 5086 (class 1259 OID 35433)
-- Name: idx_departments_city_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_departments_city_id ON public.departments USING btree (city_id);


--
-- TOC entry 5087 (class 1259 OID 35434)
-- Name: idx_departments_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_departments_name ON public.departments USING btree (name);


--
-- TOC entry 5092 (class 1259 OID 35435)
-- Name: idx_exchange_rates_country_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exchange_rates_country_date ON public.exchange_rates USING btree (country_id, rate_date);


--
-- TOC entry 5093 (class 1259 OID 35436)
-- Name: idx_exchange_rates_currency_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exchange_rates_currency_date ON public.exchange_rates USING btree (currency_code, rate_date);


--
-- TOC entry 5094 (class 1259 OID 35437)
-- Name: idx_merchants_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_merchants_name ON public.merchants USING btree (name);


--
-- TOC entry 5095 (class 1259 OID 35438)
-- Name: idx_merchants_sub_region_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_merchants_sub_region_id ON public.merchants USING btree (sub_region_id);


--
-- TOC entry 5100 (class 1259 OID 35439)
-- Name: idx_positions_department_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_positions_department_id ON public.positions USING btree (department_id);


--
-- TOC entry 5101 (class 1259 OID 35440)
-- Name: idx_positions_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_positions_name ON public.positions USING btree (name);


--
-- TOC entry 5106 (class 1259 OID 35441)
-- Name: idx_regions_country_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regions_country_id ON public.regions USING btree (country_id);


--
-- TOC entry 5107 (class 1259 OID 35442)
-- Name: idx_regions_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regions_name ON public.regions USING btree (name);


--
-- TOC entry 5112 (class 1259 OID 35443)
-- Name: idx_sub_regions_city_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sub_regions_city_id ON public.sub_regions USING btree (city_id);


--
-- TOC entry 5113 (class 1259 OID 35444)
-- Name: idx_sub_regions_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sub_regions_name ON public.sub_regions USING btree (name);


--
-- TOC entry 5118 (class 1259 OID 35445)
-- Name: idx_tour_contract_routes_route_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tour_contract_routes_route_id ON public.tour_contract_routes USING btree (vehicle_contract_route_id);


--
-- TOC entry 5119 (class 1259 OID 35446)
-- Name: idx_tour_contract_routes_sub_region_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tour_contract_routes_sub_region_id ON public.tour_contract_routes USING btree (sub_region_id);


--
-- TOC entry 5120 (class 1259 OID 35447)
-- Name: idx_tour_contract_routes_tour_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tour_contract_routes_tour_id ON public.tour_contract_routes USING btree (tour_id);


--
-- TOC entry 5125 (class 1259 OID 35451)
-- Name: idx_tour_sub_regions_sub_region_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tour_sub_regions_sub_region_id ON public.tour_sub_regions USING btree (sub_region_id);


--
-- TOC entry 5126 (class 1259 OID 35452)
-- Name: idx_tour_sub_regions_tour_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tour_sub_regions_tour_id ON public.tour_sub_regions USING btree (tour_id);


--
-- TOC entry 5129 (class 1259 OID 35453)
-- Name: idx_tours_city_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tours_city_id ON public.tours USING btree (city_id);


--
-- TOC entry 5130 (class 1259 OID 35454)
-- Name: idx_tours_country_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tours_country_id ON public.tours USING btree (country_id);


--
-- TOC entry 5131 (class 1259 OID 35455)
-- Name: idx_tours_merchant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tours_merchant_id ON public.tours USING btree (merchant_id);


--
-- TOC entry 5132 (class 1259 OID 35456)
-- Name: idx_tours_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tours_name ON public.tours USING btree (name);


--
-- TOC entry 5133 (class 1259 OID 35457)
-- Name: idx_tours_region_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tours_region_id ON public.tours USING btree (region_id);


--
-- TOC entry 5134 (class 1259 OID 35458)
-- Name: idx_tours_sejour_tour_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tours_sejour_tour_code ON public.tours USING btree (sejour_tour_code);


--
-- TOC entry 5135 (class 1259 OID 35459)
-- Name: idx_tours_sub_region_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tours_sub_region_id ON public.tours USING btree (sub_region_id);


--
-- TOC entry 5136 (class 1259 OID 35460)
-- Name: idx_tours_vehicle_contract_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tours_vehicle_contract_id ON public.tours USING btree (vehicle_contract_id);


--
-- TOC entry 5141 (class 1259 OID 35461)
-- Name: idx_users_city_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_city_id ON public.users USING btree (city_id);


--
-- TOC entry 5142 (class 1259 OID 35462)
-- Name: idx_users_department_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_department_id ON public.users USING btree (department_id);


--
-- TOC entry 5143 (class 1259 OID 35463)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 5144 (class 1259 OID 35464)
-- Name: idx_users_position_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_position_id ON public.users USING btree (position_id);


--
-- TOC entry 5145 (class 1259 OID 35465)
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- TOC entry 5146 (class 1259 OID 35466)
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- TOC entry 5151 (class 1259 OID 35467)
-- Name: idx_vehicle_companies_city_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicle_companies_city_id ON public.vehicle_companies USING btree (city_id);


--
-- TOC entry 5152 (class 1259 OID 35468)
-- Name: idx_vehicle_companies_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicle_companies_name ON public.vehicle_companies USING btree (name);


--
-- TOC entry 5157 (class 1259 OID 35469)
-- Name: idx_vehicle_contract_routes_contract_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicle_contract_routes_contract_id ON public.vehicle_contract_routes USING btree (vehicle_contract_id);


--
-- TOC entry 5158 (class 1259 OID 35470)
-- Name: idx_vehicle_contract_routes_from_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicle_contract_routes_from_location ON public.vehicle_contract_routes USING btree (from_location);


--
-- TOC entry 5159 (class 1259 OID 35471)
-- Name: idx_vehicle_contract_routes_location_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicle_contract_routes_location_order ON public.vehicle_contract_routes USING btree (from_location, to_location);


--
-- TOC entry 5160 (class 1259 OID 35472)
-- Name: idx_vehicle_contract_routes_to_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicle_contract_routes_to_location ON public.vehicle_contract_routes USING btree (to_location);


--
-- TOC entry 5161 (class 1259 OID 35473)
-- Name: idx_vehicle_contract_routes_type_prices; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicle_contract_routes_type_prices ON public.vehicle_contract_routes USING gin (vehicle_type_prices);


--
-- TOC entry 5166 (class 1259 OID 35474)
-- Name: idx_vehicle_contracts_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicle_contracts_code ON public.vehicle_contracts USING btree (contract_code);


--
-- TOC entry 5167 (class 1259 OID 35475)
-- Name: idx_vehicle_contracts_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicle_contracts_company_id ON public.vehicle_contracts USING btree (vehicle_company_id);


--
-- TOC entry 5168 (class 1259 OID 35476)
-- Name: idx_vehicle_contracts_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicle_contracts_dates ON public.vehicle_contracts USING btree (start_date, end_date);


--
-- TOC entry 5173 (class 1259 OID 35477)
-- Name: idx_vehicle_types_company_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicle_types_company_id ON public.vehicle_types USING btree (vehicle_company_id);


--
-- TOC entry 5174 (class 1259 OID 35478)
-- Name: idx_vehicle_types_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicle_types_name ON public.vehicle_types USING btree (name);


--
-- TOC entry 5271 (class 2620 OID 35843)
-- Name: costs generate_cost_code_trigger; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER generate_cost_code_trigger BEFORE INSERT ON public.costs FOR EACH ROW WHEN (((new.cost_code IS NULL) OR ((new.cost_code)::text = ''::text))) EXECUTE FUNCTION public.generate_cost_code();


--
-- TOC entry 5254 (class 2620 OID 35479)
-- Name: cities update_cities_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON public.cities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5274 (class 2620 OID 35841)
-- Name: cost_items update_cost_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cost_items_updated_at BEFORE UPDATE ON public.cost_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5273 (class 2620 OID 35840)
-- Name: cost_periods update_cost_periods_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cost_periods_updated_at BEFORE UPDATE ON public.cost_periods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5272 (class 2620 OID 35839)
-- Name: costs update_costs_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_costs_updated_at BEFORE UPDATE ON public.costs FOR EACH ROW EXECUTE FUNCTION public.update_costs_updated_at();


--
-- TOC entry 5255 (class 2620 OID 35480)
-- Name: countries update_countries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON public.countries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5256 (class 2620 OID 35481)
-- Name: country_currencies update_country_currencies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_country_currencies_updated_at BEFORE UPDATE ON public.country_currencies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5257 (class 2620 OID 35482)
-- Name: currencies update_currencies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_currencies_updated_at BEFORE UPDATE ON public.currencies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5258 (class 2620 OID 35483)
-- Name: departments update_departments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5259 (class 2620 OID 35484)
-- Name: exchange_rates update_exchange_rates_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_exchange_rates_updated_at BEFORE UPDATE ON public.exchange_rates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5260 (class 2620 OID 35485)
-- Name: merchants update_merchants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON public.merchants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5261 (class 2620 OID 35486)
-- Name: positions update_positions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5262 (class 2620 OID 35487)
-- Name: regions update_regions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON public.regions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5263 (class 2620 OID 35488)
-- Name: sub_regions update_sub_regions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sub_regions_updated_at BEFORE UPDATE ON public.sub_regions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5264 (class 2620 OID 35489)
-- Name: tour_contract_routes update_tour_contract_routes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tour_contract_routes_updated_at BEFORE UPDATE ON public.tour_contract_routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5265 (class 2620 OID 35490)
-- Name: tours update_tours_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_tours_updated_at BEFORE UPDATE ON public.tours FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5266 (class 2620 OID 35491)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5267 (class 2620 OID 35492)
-- Name: vehicle_companies update_vehicle_companies_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vehicle_companies_updated_at BEFORE UPDATE ON public.vehicle_companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5268 (class 2620 OID 35493)
-- Name: vehicle_contract_routes update_vehicle_contract_routes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vehicle_contract_routes_updated_at BEFORE UPDATE ON public.vehicle_contract_routes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5269 (class 2620 OID 35494)
-- Name: vehicle_contracts update_vehicle_contracts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vehicle_contracts_updated_at BEFORE UPDATE ON public.vehicle_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5270 (class 2620 OID 35495)
-- Name: vehicle_types update_vehicle_types_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vehicle_types_updated_at BEFORE UPDATE ON public.vehicle_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5210 (class 2606 OID 35496)
-- Name: cities cities_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE CASCADE;


--
-- TOC entry 5244 (class 2606 OID 35731)
-- Name: cost_general_prices cost_general_prices_cost_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_general_prices
    ADD CONSTRAINT cost_general_prices_cost_item_id_fkey FOREIGN KEY (cost_item_id) REFERENCES public.cost_items(id) ON DELETE CASCADE;


--
-- TOC entry 5245 (class 2606 OID 35736)
-- Name: cost_general_prices cost_general_prices_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_general_prices
    ADD CONSTRAINT cost_general_prices_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id);


--
-- TOC entry 5243 (class 2606 OID 35714)
-- Name: cost_items cost_items_cost_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_items
    ADD CONSTRAINT cost_items_cost_period_id_fkey FOREIGN KEY (cost_period_id) REFERENCES public.cost_periods(id) ON DELETE CASCADE;


--
-- TOC entry 5242 (class 2606 OID 35694)
-- Name: cost_periods cost_periods_cost_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_periods
    ADD CONSTRAINT cost_periods_cost_id_fkey FOREIGN KEY (cost_id) REFERENCES public.costs(id) ON DELETE CASCADE;


--
-- TOC entry 5246 (class 2606 OID 35757)
-- Name: cost_person_prices cost_person_prices_cost_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_person_prices
    ADD CONSTRAINT cost_person_prices_cost_item_id_fkey FOREIGN KEY (cost_item_id) REFERENCES public.cost_items(id) ON DELETE CASCADE;


--
-- TOC entry 5247 (class 2606 OID 35762)
-- Name: cost_person_prices cost_person_prices_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_person_prices
    ADD CONSTRAINT cost_person_prices_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id);


--
-- TOC entry 5248 (class 2606 OID 35782)
-- Name: cost_regional_general_prices cost_regional_general_prices_cost_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_regional_general_prices
    ADD CONSTRAINT cost_regional_general_prices_cost_item_id_fkey FOREIGN KEY (cost_item_id) REFERENCES public.cost_items(id) ON DELETE CASCADE;


--
-- TOC entry 5249 (class 2606 OID 35792)
-- Name: cost_regional_general_prices cost_regional_general_prices_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_regional_general_prices
    ADD CONSTRAINT cost_regional_general_prices_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id);


--
-- TOC entry 5250 (class 2606 OID 35787)
-- Name: cost_regional_general_prices cost_regional_general_prices_sub_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_regional_general_prices
    ADD CONSTRAINT cost_regional_general_prices_sub_region_id_fkey FOREIGN KEY (sub_region_id) REFERENCES public.sub_regions(id) ON DELETE CASCADE;


--
-- TOC entry 5251 (class 2606 OID 35814)
-- Name: cost_regional_person_prices cost_regional_person_prices_cost_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_regional_person_prices
    ADD CONSTRAINT cost_regional_person_prices_cost_item_id_fkey FOREIGN KEY (cost_item_id) REFERENCES public.cost_items(id) ON DELETE CASCADE;


--
-- TOC entry 5252 (class 2606 OID 35824)
-- Name: cost_regional_person_prices cost_regional_person_prices_currency_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_regional_person_prices
    ADD CONSTRAINT cost_regional_person_prices_currency_id_fkey FOREIGN KEY (currency_id) REFERENCES public.currencies(id);


--
-- TOC entry 5253 (class 2606 OID 35819)
-- Name: cost_regional_person_prices cost_regional_person_prices_sub_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cost_regional_person_prices
    ADD CONSTRAINT cost_regional_person_prices_sub_region_id_fkey FOREIGN KEY (sub_region_id) REFERENCES public.sub_regions(id) ON DELETE CASCADE;


--
-- TOC entry 5239 (class 2606 OID 35677)
-- Name: costs costs_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costs
    ADD CONSTRAINT costs_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE SET NULL;


--
-- TOC entry 5240 (class 2606 OID 35667)
-- Name: costs costs_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costs
    ADD CONSTRAINT costs_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE SET NULL;


--
-- TOC entry 5241 (class 2606 OID 35672)
-- Name: costs costs_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.costs
    ADD CONSTRAINT costs_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE SET NULL;


--
-- TOC entry 5211 (class 2606 OID 35501)
-- Name: country_currencies country_currencies_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.country_currencies
    ADD CONSTRAINT country_currencies_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE CASCADE;


--
-- TOC entry 5212 (class 2606 OID 35506)
-- Name: country_currencies country_currencies_currency_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.country_currencies
    ADD CONSTRAINT country_currencies_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES public.currencies(code) ON DELETE RESTRICT;


--
-- TOC entry 5213 (class 2606 OID 35511)
-- Name: departments departments_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE SET NULL;


--
-- TOC entry 5214 (class 2606 OID 35516)
-- Name: exchange_rates exchange_rates_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE CASCADE;


--
-- TOC entry 5215 (class 2606 OID 35521)
-- Name: exchange_rates exchange_rates_currency_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES public.currencies(code) ON DELETE RESTRICT;


--
-- TOC entry 5216 (class 2606 OID 35526)
-- Name: merchants merchants_sub_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.merchants
    ADD CONSTRAINT merchants_sub_region_id_fkey FOREIGN KEY (sub_region_id) REFERENCES public.sub_regions(id) ON DELETE CASCADE;


--
-- TOC entry 5217 (class 2606 OID 35531)
-- Name: positions positions_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.positions
    ADD CONSTRAINT positions_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE CASCADE;


--
-- TOC entry 5218 (class 2606 OID 35536)
-- Name: regions regions_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE CASCADE;


--
-- TOC entry 5219 (class 2606 OID 35541)
-- Name: sub_regions sub_regions_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sub_regions
    ADD CONSTRAINT sub_regions_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE CASCADE;


--
-- TOC entry 5220 (class 2606 OID 35546)
-- Name: tour_contract_routes tour_contract_routes_sub_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tour_contract_routes
    ADD CONSTRAINT tour_contract_routes_sub_region_id_fkey FOREIGN KEY (sub_region_id) REFERENCES public.sub_regions(id) ON DELETE CASCADE;


--
-- TOC entry 5221 (class 2606 OID 35551)
-- Name: tour_contract_routes tour_contract_routes_tour_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tour_contract_routes
    ADD CONSTRAINT tour_contract_routes_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(id) ON DELETE CASCADE;


--
-- TOC entry 5222 (class 2606 OID 35556)
-- Name: tour_contract_routes tour_contract_routes_vehicle_contract_route_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tour_contract_routes
    ADD CONSTRAINT tour_contract_routes_vehicle_contract_route_id_fkey FOREIGN KEY (vehicle_contract_route_id) REFERENCES public.vehicle_contract_routes(id) ON DELETE CASCADE;


--
-- TOC entry 5223 (class 2606 OID 35571)
-- Name: tour_sub_regions tour_sub_regions_sub_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tour_sub_regions
    ADD CONSTRAINT tour_sub_regions_sub_region_id_fkey FOREIGN KEY (sub_region_id) REFERENCES public.sub_regions(id) ON DELETE CASCADE;


--
-- TOC entry 5224 (class 2606 OID 35576)
-- Name: tour_sub_regions tour_sub_regions_tour_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tour_sub_regions
    ADD CONSTRAINT tour_sub_regions_tour_id_fkey FOREIGN KEY (tour_id) REFERENCES public.tours(id) ON DELETE CASCADE;


--
-- TOC entry 5225 (class 2606 OID 35581)
-- Name: tours tours_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE CASCADE;


--
-- TOC entry 5226 (class 2606 OID 35586)
-- Name: tours tours_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE CASCADE;


--
-- TOC entry 5227 (class 2606 OID 35591)
-- Name: tours tours_merchant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_merchant_id_fkey FOREIGN KEY (merchant_id) REFERENCES public.merchants(id) ON DELETE CASCADE;


--
-- TOC entry 5228 (class 2606 OID 35596)
-- Name: tours tours_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE CASCADE;


--
-- TOC entry 5229 (class 2606 OID 35601)
-- Name: tours tours_sub_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_sub_region_id_fkey FOREIGN KEY (sub_region_id) REFERENCES public.sub_regions(id) ON DELETE CASCADE;


--
-- TOC entry 5230 (class 2606 OID 35606)
-- Name: tours tours_vehicle_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tours
    ADD CONSTRAINT tours_vehicle_contract_id_fkey FOREIGN KEY (vehicle_contract_id) REFERENCES public.vehicle_contracts(id) ON DELETE SET NULL;


--
-- TOC entry 5231 (class 2606 OID 35611)
-- Name: users users_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE SET NULL;


--
-- TOC entry 5232 (class 2606 OID 35616)
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;


--
-- TOC entry 5233 (class 2606 OID 35621)
-- Name: users users_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.positions(id) ON DELETE SET NULL;


--
-- TOC entry 5234 (class 2606 OID 35626)
-- Name: vehicle_companies vehicle_companies_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_companies
    ADD CONSTRAINT vehicle_companies_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE CASCADE;


--
-- TOC entry 5235 (class 2606 OID 35631)
-- Name: vehicle_contract_routes vehicle_contract_routes_currency_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_contract_routes
    ADD CONSTRAINT vehicle_contract_routes_currency_code_fkey FOREIGN KEY (currency_code) REFERENCES public.currencies(code) ON DELETE RESTRICT;


--
-- TOC entry 5236 (class 2606 OID 35636)
-- Name: vehicle_contract_routes vehicle_contract_routes_vehicle_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_contract_routes
    ADD CONSTRAINT vehicle_contract_routes_vehicle_contract_id_fkey FOREIGN KEY (vehicle_contract_id) REFERENCES public.vehicle_contracts(id) ON DELETE CASCADE;


--
-- TOC entry 5237 (class 2606 OID 35641)
-- Name: vehicle_contracts vehicle_contracts_vehicle_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_contracts
    ADD CONSTRAINT vehicle_contracts_vehicle_company_id_fkey FOREIGN KEY (vehicle_company_id) REFERENCES public.vehicle_companies(id) ON DELETE CASCADE;


--
-- TOC entry 5238 (class 2606 OID 35646)
-- Name: vehicle_types vehicle_types_vehicle_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_types
    ADD CONSTRAINT vehicle_types_vehicle_company_id_fkey FOREIGN KEY (vehicle_company_id) REFERENCES public.vehicle_companies(id) ON DELETE CASCADE;


-- Completed on 2025-11-03 01:21:42

--
-- PostgreSQL database dump complete
--

\unrestrict aIfwMXKN80q42Dt6ES1pFNSAA1IGjRfn22ZfFleAz5lZsw3CfezC4dxWURMztnP

