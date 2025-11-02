--
-- PostgreSQL database cluster dump
--

\restrict v7YlqDzMEGMmZbFgpXmSFyhVIDutCGEtyguJNVAf39YdDaCreuqj2APxnyqOFCS

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:xbSrahG0LGEXFFrlpCNSQQ==$zqPjEBl0vULCe/3g9J0hkkO7KY+LYrO5IiuUkxNcgto=:R0RH4vPRAqWXDROIuXzGSOh1pQXBUBLQ6MxAPfWujq0=';

--
-- User Configurations
--








\unrestrict v7YlqDzMEGMmZbFgpXmSFyhVIDutCGEtyguJNVAf39YdDaCreuqj2APxnyqOFCS

--
-- PostgreSQL database cluster dump complete
--

