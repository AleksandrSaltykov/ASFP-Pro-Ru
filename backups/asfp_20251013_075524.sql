--
-- PostgreSQL database dump
--

\restrict ifzKAlBHorfHO0NMPj2PFkGa7hrTQIFOsMvTIfRoRcxRVV6IaAaddj1A3dvvBuV

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: bpm; Type: SCHEMA; Schema: -; Owner: asfp
--

CREATE SCHEMA bpm;


ALTER SCHEMA bpm OWNER TO asfp;

--
-- Name: core; Type: SCHEMA; Schema: -; Owner: asfp
--

CREATE SCHEMA core;


ALTER SCHEMA core OWNER TO asfp;

--
-- Name: crm; Type: SCHEMA; Schema: -; Owner: asfp
--

CREATE SCHEMA crm;


ALTER SCHEMA crm OWNER TO asfp;

--
-- Name: docs; Type: SCHEMA; Schema: -; Owner: asfp
--

CREATE SCHEMA docs;


ALTER SCHEMA docs OWNER TO asfp;

--
-- Name: mes; Type: SCHEMA; Schema: -; Owner: asfp
--

CREATE SCHEMA mes;


ALTER SCHEMA mes OWNER TO asfp;

--
-- Name: montage; Type: SCHEMA; Schema: -; Owner: asfp
--

CREATE SCHEMA montage;


ALTER SCHEMA montage OWNER TO asfp;

--
-- Name: wms; Type: SCHEMA; Schema: -; Owner: asfp
--

CREATE SCHEMA wms;


ALTER SCHEMA wms OWNER TO asfp;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assignment_rule; Type: TABLE; Schema: bpm; Owner: asfp
--

CREATE TABLE bpm.assignment_rule (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    process_id uuid NOT NULL,
    task_code text NOT NULL,
    priority integer DEFAULT 1 NOT NULL,
    rule_type text NOT NULL,
    rule_value text NOT NULL,
    conditions jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE bpm.assignment_rule OWNER TO asfp;

--
-- Name: escalation; Type: TABLE; Schema: bpm; Owner: asfp
--

CREATE TABLE bpm.escalation (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    task_id uuid NOT NULL,
    threshold_minutes integer NOT NULL,
    escalate_to text NOT NULL,
    policy text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE bpm.escalation OWNER TO asfp;

--
-- Name: form; Type: TABLE; Schema: bpm; Owner: asfp
--

CREATE TABLE bpm.form (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    process_id uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    schema jsonb DEFAULT '{}'::jsonb NOT NULL,
    ui_schema jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE bpm.form OWNER TO asfp;

--
-- Name: process_definition; Type: TABLE; Schema: bpm; Owner: asfp
--

CREATE TABLE bpm.process_definition (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    version integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    definition jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE bpm.process_definition OWNER TO asfp;

--
-- Name: task; Type: TABLE; Schema: bpm; Owner: asfp
--

CREATE TABLE bpm.task (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    process_id uuid NOT NULL,
    code text NOT NULL,
    title text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    assignee text,
    due_at timestamp with time zone,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE bpm.task OWNER TO asfp;

--
-- Name: api_tokens; Type: TABLE; Schema: core; Owner: asfp
--

CREATE TABLE core.api_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    token_hash text NOT NULL,
    role_code text NOT NULL,
    scope text DEFAULT '*'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    last_used_at timestamp with time zone,
    revoked_at timestamp with time zone
);


ALTER TABLE core.api_tokens OWNER TO asfp;

--
-- Name: audit_log; Type: TABLE; Schema: core; Owner: asfp
--

CREATE TABLE core.audit_log (
    id bigint NOT NULL,
    occurred_at timestamp with time zone DEFAULT now(),
    actor_id uuid,
    action text NOT NULL,
    entity text NOT NULL,
    entity_id text,
    payload jsonb
);


ALTER TABLE core.audit_log OWNER TO asfp;

--
-- Name: audit_log_id_seq; Type: SEQUENCE; Schema: core; Owner: asfp
--

CREATE SEQUENCE core.audit_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE core.audit_log_id_seq OWNER TO asfp;

--
-- Name: audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: asfp
--

ALTER SEQUENCE core.audit_log_id_seq OWNED BY core.audit_log.id;


--
-- Name: org_units; Type: TABLE; Schema: core; Owner: asfp
--

CREATE TABLE core.org_units (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    parent_id uuid,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    path text NOT NULL,
    level smallint NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE core.org_units OWNER TO asfp;

--
-- Name: role_permissions; Type: TABLE; Schema: core; Owner: asfp
--

CREATE TABLE core.role_permissions (
    role_code text NOT NULL,
    resource text NOT NULL,
    action text NOT NULL,
    scope text DEFAULT '*'::text NOT NULL,
    effect text DEFAULT 'allow'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE core.role_permissions OWNER TO asfp;

--
-- Name: roles; Type: TABLE; Schema: core; Owner: asfp
--

CREATE TABLE core.roles (
    code text NOT NULL,
    description text NOT NULL
);


ALTER TABLE core.roles OWNER TO asfp;

--
-- Name: user_org_units; Type: TABLE; Schema: core; Owner: asfp
--

CREATE TABLE core.user_org_units (
    user_id uuid NOT NULL,
    org_unit_code text NOT NULL
);


ALTER TABLE core.user_org_units OWNER TO asfp;

--
-- Name: user_roles; Type: TABLE; Schema: core; Owner: asfp
--

CREATE TABLE core.user_roles (
    user_id uuid NOT NULL,
    role_code text NOT NULL,
    warehouse_scope text NOT NULL
);


ALTER TABLE core.user_roles OWNER TO asfp;

--
-- Name: users; Type: TABLE; Schema: core; Owner: asfp
--

CREATE TABLE core.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    password_hash text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE core.users OWNER TO asfp;

--
-- Name: customer_bank_accounts; Type: TABLE; Schema: crm; Owner: asfp
--

CREATE TABLE crm.customer_bank_accounts (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    account_name text,
    bank_name text,
    account_number text NOT NULL,
    bik text,
    corr_account text,
    comment text,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE crm.customer_bank_accounts OWNER TO asfp;

--
-- Name: customer_contacts; Type: TABLE; Schema: crm; Owner: asfp
--

CREATE TABLE crm.customer_contacts (
    id uuid NOT NULL,
    customer_id uuid NOT NULL,
    name text NOT NULL,
    "position" text,
    phone text,
    email text,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE crm.customer_contacts OWNER TO asfp;

--
-- Name: customers; Type: TABLE; Schema: crm; Owner: asfp
--

CREATE TABLE crm.customers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    inn text,
    kpp text,
    created_at timestamp with time zone DEFAULT now(),
    comment text,
    phone text,
    email text,
    website text,
    legal_address text,
    actual_address text,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE crm.customers OWNER TO asfp;

--
-- Name: deal_events; Type: TABLE; Schema: crm; Owner: asfp
--

CREATE TABLE crm.deal_events (
    id bigint NOT NULL,
    deal_id uuid,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE crm.deal_events OWNER TO asfp;

--
-- Name: deal_events_id_seq; Type: SEQUENCE; Schema: crm; Owner: asfp
--

CREATE SEQUENCE crm.deal_events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE crm.deal_events_id_seq OWNER TO asfp;

--
-- Name: deal_events_id_seq; Type: SEQUENCE OWNED BY; Schema: crm; Owner: asfp
--

ALTER SEQUENCE crm.deal_events_id_seq OWNED BY crm.deal_events.id;


--
-- Name: deals; Type: TABLE; Schema: crm; Owner: asfp
--

CREATE TABLE crm.deals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title text NOT NULL,
    customer_id uuid,
    stage text NOT NULL,
    amount numeric(18,2) NOT NULL,
    currency text DEFAULT 'RUB'::text NOT NULL,
    created_by text,
    org_unit_code text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE crm.deals OWNER TO asfp;

--
-- Name: document; Type: TABLE; Schema: docs; Owner: asfp
--

CREATE TABLE docs.document (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    template_id uuid NOT NULL,
    sequence_id uuid NOT NULL,
    number text NOT NULL,
    title text NOT NULL,
    status text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    issued_at timestamp with time zone,
    signed_at timestamp with time zone,
    archived_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE docs.document OWNER TO asfp;

--
-- Name: document_signer; Type: TABLE; Schema: docs; Owner: asfp
--

CREATE TABLE docs.document_signer (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    document_id uuid NOT NULL,
    signer_id uuid NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    signed_at timestamp with time zone,
    order_no smallint DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE docs.document_signer OWNER TO asfp;

--
-- Name: number_sequence; Type: TABLE; Schema: docs; Owner: asfp
--

CREATE TABLE docs.number_sequence (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    prefix text DEFAULT ''::text NOT NULL,
    padding smallint DEFAULT 4 NOT NULL,
    current_value bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE docs.number_sequence OWNER TO asfp;

--
-- Name: signer; Type: TABLE; Schema: docs; Owner: asfp
--

CREATE TABLE docs.signer (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    full_name text NOT NULL,
    "position" text,
    email text,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE docs.signer OWNER TO asfp;

--
-- Name: template; Type: TABLE; Schema: docs; Owner: asfp
--

CREATE TABLE docs.template (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    version integer DEFAULT 1 NOT NULL,
    body jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE docs.template OWNER TO asfp;

--
-- Name: operation; Type: TABLE; Schema: mes; Owner: asfp
--

CREATE TABLE mes.operation (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    default_duration_minutes integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE mes.operation OWNER TO asfp;

--
-- Name: route; Type: TABLE; Schema: mes; Owner: asfp
--

CREATE TABLE mes.route (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE mes.route OWNER TO asfp;

--
-- Name: route_operation; Type: TABLE; Schema: mes; Owner: asfp
--

CREATE TABLE mes.route_operation (
    route_id uuid NOT NULL,
    operation_id uuid NOT NULL,
    "position" smallint NOT NULL
);


ALTER TABLE mes.route_operation OWNER TO asfp;

--
-- Name: work_center; Type: TABLE; Schema: mes; Owner: asfp
--

CREATE TABLE mes.work_center (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE mes.work_center OWNER TO asfp;

--
-- Name: work_order; Type: TABLE; Schema: mes; Owner: asfp
--

CREATE TABLE mes.work_order (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    customer_id uuid,
    route_id uuid,
    status text DEFAULT 'planned'::text NOT NULL,
    planned_start timestamp with time zone,
    planned_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE mes.work_order OWNER TO asfp;

--
-- Name: crew; Type: TABLE; Schema: montage; Owner: asfp
--

CREATE TABLE montage.crew (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    specialization text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE montage.crew OWNER TO asfp;

--
-- Name: task; Type: TABLE; Schema: montage; Owner: asfp
--

CREATE TABLE montage.task (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    title text NOT NULL,
    status text DEFAULT 'planned'::text NOT NULL,
    crew_id uuid,
    vehicle_id uuid,
    scheduled_at timestamp with time zone,
    location text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE montage.task OWNER TO asfp;

--
-- Name: vehicle; Type: TABLE; Schema: montage; Owner: asfp
--

CREATE TABLE montage.vehicle (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    plate text DEFAULT ''::text NOT NULL,
    capacity text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE montage.vehicle OWNER TO asfp;

--
-- Name: goose_db_version_crm; Type: TABLE; Schema: public; Owner: asfp
--

CREATE TABLE public.goose_db_version_crm (
    id integer NOT NULL,
    version_id bigint NOT NULL,
    is_applied boolean NOT NULL,
    tstamp timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.goose_db_version_crm OWNER TO asfp;

--
-- Name: goose_db_version_crm_id_seq; Type: SEQUENCE; Schema: public; Owner: asfp
--

ALTER TABLE public.goose_db_version_crm ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.goose_db_version_crm_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: goose_db_version_wms; Type: TABLE; Schema: public; Owner: asfp
--

CREATE TABLE public.goose_db_version_wms (
    id integer NOT NULL,
    version_id bigint NOT NULL,
    is_applied boolean NOT NULL,
    tstamp timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.goose_db_version_wms OWNER TO asfp;

--
-- Name: goose_db_version_wms_id_seq; Type: SEQUENCE; Schema: public; Owner: asfp
--

ALTER TABLE public.goose_db_version_wms ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.goose_db_version_wms_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: attribute_templates; Type: TABLE; Schema: wms; Owner: asfp
--

CREATE TABLE wms.attribute_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    target_type text NOT NULL,
    data_type text NOT NULL,
    is_required boolean DEFAULT false NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    ui_schema jsonb DEFAULT '{}'::jsonb NOT NULL,
    "position" smallint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_wms_attribute_data_type CHECK ((data_type = ANY (ARRAY['string'::text, 'number'::text, 'boolean'::text, 'json'::text])))
);


ALTER TABLE wms.attribute_templates OWNER TO asfp;

--
-- Name: attribute_values; Type: TABLE; Schema: wms; Owner: asfp
--

CREATE TABLE wms.attribute_values (
    owner_type text NOT NULL,
    owner_id uuid NOT NULL,
    template_id uuid NOT NULL,
    string_value text,
    number_value numeric(20,6),
    boolean_value boolean,
    json_value jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE wms.attribute_values OWNER TO asfp;

--
-- Name: catalog_links; Type: TABLE; Schema: wms; Owner: asfp
--

CREATE TABLE wms.catalog_links (
    left_id uuid NOT NULL,
    left_type text NOT NULL,
    right_id uuid NOT NULL,
    right_type text NOT NULL,
    relation_code text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_wms_catalog_relation_code CHECK ((relation_code <> ''::text))
);


ALTER TABLE wms.catalog_links OWNER TO asfp;

--
-- Name: catalog_node; Type: TABLE; Schema: wms; Owner: asfp
--

CREATE TABLE wms.catalog_node (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    catalog_type text NOT NULL,
    parent_id uuid,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    level smallint DEFAULT 0 NOT NULL,
    path text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_wms_catalog_code CHECK ((code <> ''::text)),
    CONSTRAINT chk_wms_catalog_type CHECK ((catalog_type <> ''::text))
);


ALTER TABLE wms.catalog_node OWNER TO asfp;

--
-- Name: equipment; Type: TABLE; Schema: wms; Owner: asfp
--

CREATE TABLE wms.equipment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    warehouse_id uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    equipment_type text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    manufacturer text,
    serial_number text,
    commissioning_date date,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE wms.equipment OWNER TO asfp;

--
-- Name: item; Type: TABLE; Schema: wms; Owner: asfp
--

CREATE TABLE wms.item (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sku text NOT NULL,
    name text NOT NULL,
    description text,
    category_id uuid,
    category_path text,
    unit_id uuid NOT NULL,
    barcode text,
    weight_kg numeric(12,3),
    volume_m3 numeric(14,4),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    alternative_unit_id uuid,
    conversion_rate numeric(18,6),
    CONSTRAINT item_conversion_rate_check CHECK (((conversion_rate IS NULL) OR (conversion_rate > (0)::numeric)))
);


ALTER TABLE wms.item OWNER TO asfp;

--
-- Name: item_warehouse; Type: TABLE; Schema: wms; Owner: asfp
--

CREATE TABLE wms.item_warehouse (
    item_id uuid NOT NULL,
    warehouse_id uuid NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    min_stock numeric(14,4),
    max_stock numeric(14,4)
);


ALTER TABLE wms.item_warehouse OWNER TO asfp;

--
-- Name: stock; Type: TABLE; Schema: wms; Owner: asfp
--

CREATE TABLE wms.stock (
    sku text NOT NULL,
    warehouse text NOT NULL,
    quantity numeric(18,3) DEFAULT 0 NOT NULL,
    uom text DEFAULT 'pcs'::text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE wms.stock OWNER TO asfp;

--
-- Name: warehouse; Type: TABLE; Schema: wms; Owner: asfp
--

CREATE TABLE wms.warehouse (
    id uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    address jsonb DEFAULT '{}'::jsonb NOT NULL,
    timezone text DEFAULT 'UTC'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    operating_hours jsonb DEFAULT '{}'::jsonb NOT NULL,
    contact jsonb DEFAULT '{}'::jsonb NOT NULL,
    org_unit_code text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE wms.warehouse OWNER TO asfp;

--
-- Name: warehouse_cell; Type: TABLE; Schema: wms; Owner: asfp
--

CREATE TABLE wms.warehouse_cell (
    id uuid NOT NULL,
    warehouse_id uuid NOT NULL,
    zone_id uuid NOT NULL,
    code text NOT NULL,
    label text,
    address jsonb DEFAULT '{}'::jsonb NOT NULL,
    cell_type text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    is_pick_face boolean DEFAULT false NOT NULL,
    length_mm numeric(10,2),
    width_mm numeric(10,2),
    height_mm numeric(10,2),
    max_weight_kg numeric(12,3),
    max_volume_l numeric(12,3),
    allowed_handling jsonb DEFAULT '[]'::jsonb NOT NULL,
    temperature_min numeric(10,2),
    temperature_max numeric(10,2),
    hazard_classes jsonb DEFAULT '[]'::jsonb NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE wms.warehouse_cell OWNER TO asfp;

--
-- Name: warehouse_cell_equipment; Type: TABLE; Schema: wms; Owner: asfp
--

CREATE TABLE wms.warehouse_cell_equipment (
    cell_id uuid NOT NULL,
    equipment_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    assigned_by uuid
);


ALTER TABLE wms.warehouse_cell_equipment OWNER TO asfp;

--
-- Name: warehouse_cell_history; Type: TABLE; Schema: wms; Owner: asfp
--

CREATE TABLE wms.warehouse_cell_history (
    id bigint NOT NULL,
    cell_id uuid NOT NULL,
    changed_at timestamp with time zone DEFAULT now() NOT NULL,
    changed_by uuid,
    change_type text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE wms.warehouse_cell_history OWNER TO asfp;

--
-- Name: warehouse_cell_history_id_seq; Type: SEQUENCE; Schema: wms; Owner: asfp
--

CREATE SEQUENCE wms.warehouse_cell_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE wms.warehouse_cell_history_id_seq OWNER TO asfp;

--
-- Name: warehouse_cell_history_id_seq; Type: SEQUENCE OWNED BY; Schema: wms; Owner: asfp
--

ALTER SEQUENCE wms.warehouse_cell_history_id_seq OWNED BY wms.warehouse_cell_history.id;


--
-- Name: warehouse_layout_version; Type: TABLE; Schema: wms; Owner: asfp
--

CREATE TABLE wms.warehouse_layout_version (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    warehouse_id uuid NOT NULL,
    version integer NOT NULL,
    name text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    description text,
    payload jsonb DEFAULT '{}'::jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    activated_at timestamp with time zone
);


ALTER TABLE wms.warehouse_layout_version OWNER TO asfp;

--
-- Name: warehouse_zone; Type: TABLE; Schema: wms; Owner: asfp
--

CREATE TABLE wms.warehouse_zone (
    id uuid NOT NULL,
    warehouse_id uuid NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    zone_type text NOT NULL,
    is_buffer boolean DEFAULT false NOT NULL,
    temperature_min numeric(10,2),
    temperature_max numeric(10,2),
    hazard_class text,
    access_restrictions jsonb DEFAULT '[]'::jsonb NOT NULL,
    layout jsonb DEFAULT '{}'::jsonb NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE wms.warehouse_zone OWNER TO asfp;

--
-- Name: audit_log id; Type: DEFAULT; Schema: core; Owner: asfp
--

ALTER TABLE ONLY core.audit_log ALTER COLUMN id SET DEFAULT nextval('core.audit_log_id_seq'::regclass);


--
-- Name: deal_events id; Type: DEFAULT; Schema: crm; Owner: asfp
--

ALTER TABLE ONLY crm.deal_events ALTER COLUMN id SET DEFAULT nextval('crm.deal_events_id_seq'::regclass);


--
-- Name: warehouse_cell_history id; Type: DEFAULT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.warehouse_cell_history ALTER COLUMN id SET DEFAULT nextval('wms.warehouse_cell_history_id_seq'::regclass);


--
-- Data for Name: assignment_rule; Type: TABLE DATA; Schema: bpm; Owner: asfp
--

COPY bpm.assignment_rule (id, process_id, task_code, priority, rule_type, rule_value, conditions, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: escalation; Type: TABLE DATA; Schema: bpm; Owner: asfp
--

COPY bpm.escalation (id, task_id, threshold_minutes, escalate_to, policy, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: form; Type: TABLE DATA; Schema: bpm; Owner: asfp
--

COPY bpm.form (id, process_id, code, name, version, schema, ui_schema, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: process_definition; Type: TABLE DATA; Schema: bpm; Owner: asfp
--

COPY bpm.process_definition (id, code, name, description, version, status, definition, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: task; Type: TABLE DATA; Schema: bpm; Owner: asfp
--

COPY bpm.task (id, process_id, code, title, status, assignee, due_at, payload, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: api_tokens; Type: TABLE DATA; Schema: core; Owner: asfp
--

COPY core.api_tokens (id, name, token_hash, role_code, scope, created_at, created_by, last_used_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: audit_log; Type: TABLE DATA; Schema: core; Owner: asfp
--

COPY core.audit_log (id, occurred_at, actor_id, action, entity, entity_id, payload) FROM stdin;
\.


--
-- Data for Name: org_units; Type: TABLE DATA; Schema: core; Owner: asfp
--

COPY core.org_units (id, parent_id, code, name, description, path, level, is_active, metadata, created_at, updated_at) FROM stdin;
4d3d4be9-a0af-4ce2-9e21-0da08a7c5664	\N	HQ	Головной офис	Корневой организационный юнит	HQ	0	t	{}	2025-10-09 13:48:19.32894+00	2025-10-09 13:48:19.32894+00
999ef133-939e-4dd0-a367-9249212af36a	4d3d4be9-a0af-4ce2-9e21-0da08a7c5664	HQ-SALES	Отдел продаж	Коммерческий блок	HQ.HQ-SALES	1	t	{}	2025-10-09 13:48:19.329614+00	2025-10-09 13:48:19.329614+00
777809bc-3e73-4ecf-b801-7a373569b36c	4d3d4be9-a0af-4ce2-9e21-0da08a7c5664	HQ-WMS	Складской блок	Операции склада	HQ.HQ-WMS	1	t	{}	2025-10-09 13:48:19.330161+00	2025-10-09 13:48:19.330161+00
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: core; Owner: asfp
--

COPY core.role_permissions (role_code, resource, action, scope, effect, metadata, created_at, updated_at) FROM stdin;
director	*	*	*	allow	{}	2025-10-09 13:48:19.330515+00	2025-10-09 13:48:19.330515+00
sales	crm.deal	read	HQ-SALES	allow	{}	2025-10-09 13:48:19.330515+00	2025-10-09 13:48:19.330515+00
sales	crm.deal	write	HQ-SALES	allow	{}	2025-10-09 13:48:19.330515+00	2025-10-09 13:48:19.330515+00
sales	crm.customer	read	HQ-SALES	allow	{}	2025-10-09 13:48:19.330515+00	2025-10-09 13:48:19.330515+00
sales	crm.customer	write	HQ-SALES	allow	{}	2025-10-09 13:48:19.330515+00	2025-10-09 13:48:19.330515+00
warehouse	wms.catalog	read	HQ-WMS	allow	{}	2025-10-09 13:48:19.330515+00	2025-10-09 13:48:19.330515+00
warehouse	wms.catalog	write	HQ-WMS	allow	{}	2025-10-09 13:48:19.330515+00	2025-10-09 13:48:19.330515+00
warehouse	wms.warehouse	read	HQ-WMS	allow	{}	2025-10-09 13:48:19.330515+00	2025-10-09 13:48:19.330515+00
warehouse	wms.warehouse	write	HQ-WMS	allow	{}	2025-10-09 13:48:19.330515+00	2025-10-09 13:48:19.330515+00
warehouse	wms.stock	read	HQ-WMS	allow	{}	2025-10-09 13:48:19.330515+00	2025-10-09 13:48:19.330515+00
warehouse	wms.stock	write	HQ-WMS	allow	{}	2025-10-09 13:48:19.330515+00	2025-10-09 13:48:19.330515+00
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: core; Owner: asfp
--

COPY core.roles (code, description) FROM stdin;
director	Генеральный директор
sales	Отдел продаж
warehouse	Склад
\.


--
-- Data for Name: user_org_units; Type: TABLE DATA; Schema: core; Owner: asfp
--

COPY core.user_org_units (user_id, org_unit_code) FROM stdin;
10000000-0000-0000-0000-000000000001	HQ
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: core; Owner: asfp
--

COPY core.user_roles (user_id, role_code, warehouse_scope) FROM stdin;
10000000-0000-0000-0000-000000000001	director	*
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: core; Owner: asfp
--

COPY core.users (id, email, full_name, password_hash, is_active, created_at) FROM stdin;
10000000-0000-0000-0000-000000000001	admin@example.com	Администратор	$2a$06$fp6aHFNAq4AW6KaphmmqoenopGQ2E4NwhHbbKm3hxu35SuXNeeYkK	t	2025-10-09 13:48:19.323441+00
\.


--
-- Data for Name: customer_bank_accounts; Type: TABLE DATA; Schema: crm; Owner: asfp
--

COPY crm.customer_bank_accounts (id, customer_id, account_name, bank_name, account_number, bik, corr_account, comment, is_default, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: customer_contacts; Type: TABLE DATA; Schema: crm; Owner: asfp
--

COPY crm.customer_contacts (id, customer_id, name, "position", phone, email, comment, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: crm; Owner: asfp
--

COPY crm.customers (id, name, inn, kpp, created_at, comment, phone, email, website, legal_address, actual_address, updated_at) FROM stdin;
30000000-0000-0000-0000-000000000001	ООО «Афиша»	7701234567	770101001	2025-10-09 13:48:19.331948+00	Поставщик	\N	\N	\N	\N	\N	2025-10-09 16:20:04.74657+00
30000000-0000-0000-0000-000000000002	ООО «Сфера Принт»	7812345678	781201001	2025-10-09 13:48:19.331948+00	Поставщик	\N	\N	\N	\N	\N	2025-10-09 16:20:04.74657+00
11111111-1111-1111-1111-111111111111	ООО "Ромашка"	7701234567	770101001	2025-10-09 16:18:19.054828+00	Поставщик	\N	\N	\N	\N	\N	2025-10-09 16:20:04.74657+00
22222222-2222-2222-2222-222222222222	АО "Неон"	7812345678	781201001	2025-10-09 16:18:19.054828+00	Поставщик	\N	\N	\N	\N	\N	2025-10-09 16:20:04.74657+00
33333333-3333-3333-3333-333333333333	ИП Сидоров П.А.	5409876543	\N	2025-10-09 16:18:19.054828+00	Поставщик	\N	\N	\N	\N	\N	2025-10-09 16:20:04.74657+00
\.


--
-- Data for Name: deal_events; Type: TABLE DATA; Schema: crm; Owner: asfp
--

COPY crm.deal_events (id, deal_id, event_type, payload, created_at) FROM stdin;
1001	31000000-0000-0000-0000-000000000001	deal.created	{"stage": "new", "title": "Демо договор на вывеску"}	2025-10-09 13:48:19.333339+00
1002	31000000-0000-0000-0000-000000000002	deal.created	{"stage": "qualification", "title": "Обслуживание digital-вывесок"}	2025-10-09 13:48:19.333339+00
1	31111111-aaaa-4aaa-8aaa-111111111111	deal.created	{"stage": "new", "title": "Ремонт фасада ТЦ \\"Альфа\\"", "amount": 1200000, "currency": "RUB", "createdBy": "demo@asfp.pro", "customerId": "11111111-1111-1111-1111-111111111111"}	2025-10-09 16:18:19.054828+00
2	31111111-aaaa-4aaa-8aaa-111111111111	stage.changed	{"to": "new", "from": "qualification"}	2025-10-09 16:18:19.054828+00
3	32222222-bbbb-4bbb-8bbb-222222222222	deal.created	{"stage": "qualification", "title": "Подсветка автосалона \\"Неон\\"", "amount": 850000, "currency": "RUB", "createdBy": "demo@asfp.pro", "customerId": "22222222-2222-2222-2222-222222222222"}	2025-10-09 16:18:19.054828+00
4	32222222-bbbb-4bbb-8bbb-222222222222	stage.changed	{"to": "qualification", "from": "new"}	2025-10-09 16:18:19.054828+00
5	33333333-cccc-4ccc-8ccc-333333333333	deal.created	{"stage": "negotiation", "title": "Экран на фасад БЦ \\"Орион\\"", "amount": 2150000, "currency": "RUB", "createdBy": "demo@asfp.pro", "customerId": "22222222-2222-2222-2222-222222222222"}	2025-10-09 16:18:19.054828+00
6	33333333-cccc-4ccc-8ccc-333333333333	stage.changed	{"to": "negotiation", "from": "qualification"}	2025-10-09 16:18:19.054828+00
7	34444444-dddd-4ddd-8ddd-444444444444	deal.created	{"stage": "won", "title": "Печать баннеров для ИП Сидоров П.А.", "amount": 320000, "currency": "RUB", "createdBy": "demo@asfp.pro", "customerId": "33333333-3333-3333-3333-333333333333"}	2025-10-09 16:18:19.054828+00
8	34444444-dddd-4ddd-8ddd-444444444444	stage.changed	{"to": "won", "from": "negotiation"}	2025-10-09 16:18:19.054828+00
9	35555555-eeee-4eee-8eee-555555555555	deal.created	{"stage": "lost", "title": "Рестайлинг витрины \\"Ромашка\\"", "amount": 540000, "currency": "RUB", "createdBy": "demo@asfp.pro", "customerId": "11111111-1111-1111-1111-111111111111"}	2025-10-09 16:18:19.054828+00
10	35555555-eeee-4eee-8eee-555555555555	stage.changed	{"to": "lost", "from": "negotiation"}	2025-10-09 16:18:19.054828+00
\.


--
-- Data for Name: deals; Type: TABLE DATA; Schema: crm; Owner: asfp
--

COPY crm.deals (id, title, customer_id, stage, amount, currency, created_by, org_unit_code, created_at) FROM stdin;
31000000-0000-0000-0000-000000000001	Демо договор на вывеску	30000000-0000-0000-0000-000000000001	new	350000.00	RUB	admin@example.com	HQ-SALES	2025-10-09 13:48:19.332333+00
31000000-0000-0000-0000-000000000002	Обслуживание digital-вывесок	30000000-0000-0000-0000-000000000002	qualification	120000.00	RUB	admin@example.com	HQ-SALES	2025-10-09 13:48:19.332333+00
31111111-aaaa-4aaa-8aaa-111111111111	Ремонт фасада ТЦ "Альфа"	11111111-1111-1111-1111-111111111111	new	1200000.00	RUB	demo@asfp.pro	HQ-SALES	2025-09-29 16:18:19.054828+00
32222222-bbbb-4bbb-8bbb-222222222222	Подсветка автосалона "Неон"	22222222-2222-2222-2222-222222222222	qualification	850000.00	RUB	demo@asfp.pro	HQ-SALES	2025-10-02 16:18:19.054828+00
33333333-cccc-4ccc-8ccc-333333333333	Экран на фасад БЦ "Орион"	22222222-2222-2222-2222-222222222222	negotiation	2150000.00	RUB	demo@asfp.pro	HQ-SALES	2025-10-06 16:18:19.054828+00
34444444-dddd-4ddd-8ddd-444444444444	Печать баннеров для ИП Сидоров П.А.	33333333-3333-3333-3333-333333333333	won	320000.00	RUB	demo@asfp.pro	HQ-SALES	2025-10-08 16:18:19.054828+00
35555555-eeee-4eee-8eee-555555555555	Рестайлинг витрины "Ромашка"	11111111-1111-1111-1111-111111111111	lost	540000.00	RUB	demo@asfp.pro	HQ-SALES	2025-10-04 16:18:19.054828+00
\.


--
-- Data for Name: document; Type: TABLE DATA; Schema: docs; Owner: asfp
--

COPY docs.document (id, template_id, sequence_id, number, title, status, payload, issued_at, signed_at, archived_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: document_signer; Type: TABLE DATA; Schema: docs; Owner: asfp
--

COPY docs.document_signer (id, document_id, signer_id, status, signed_at, order_no, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: number_sequence; Type: TABLE DATA; Schema: docs; Owner: asfp
--

COPY docs.number_sequence (id, code, prefix, padding, current_value, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: signer; Type: TABLE DATA; Schema: docs; Owner: asfp
--

COPY docs.signer (id, code, full_name, "position", email, phone, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: template; Type: TABLE DATA; Schema: docs; Owner: asfp
--

COPY docs.template (id, code, name, description, version, body, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: operation; Type: TABLE DATA; Schema: mes; Owner: asfp
--

COPY mes.operation (id, code, name, description, default_duration_minutes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: route; Type: TABLE DATA; Schema: mes; Owner: asfp
--

COPY mes.route (id, code, name, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: route_operation; Type: TABLE DATA; Schema: mes; Owner: asfp
--

COPY mes.route_operation (route_id, operation_id, "position") FROM stdin;
\.


--
-- Data for Name: work_center; Type: TABLE DATA; Schema: mes; Owner: asfp
--

COPY mes.work_center (id, code, name, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: work_order; Type: TABLE DATA; Schema: mes; Owner: asfp
--

COPY mes.work_order (id, code, customer_id, route_id, status, planned_start, planned_end, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: crew; Type: TABLE DATA; Schema: montage; Owner: asfp
--

COPY montage.crew (id, code, name, specialization, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: task; Type: TABLE DATA; Schema: montage; Owner: asfp
--

COPY montage.task (id, code, title, status, crew_id, vehicle_id, scheduled_at, location, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: vehicle; Type: TABLE DATA; Schema: montage; Owner: asfp
--

COPY montage.vehicle (id, code, name, plate, capacity, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: goose_db_version_crm; Type: TABLE DATA; Schema: public; Owner: asfp
--

COPY public.goose_db_version_crm (id, version_id, is_applied, tstamp) FROM stdin;
1	0	t	2025-10-09 16:18:19.023958
2	1	t	2025-10-09 16:18:19.05206
3	2	t	2025-10-09 16:18:19.054828
4	3	t	2025-10-09 16:19:33.538446
5	4	t	2025-10-09 16:19:33.538446
\.


--
-- Data for Name: goose_db_version_wms; Type: TABLE DATA; Schema: public; Owner: asfp
--

COPY public.goose_db_version_wms (id, version_id, is_applied, tstamp) FROM stdin;
1	0	t	2025-10-09 14:00:44.867493
2	1	t	2025-10-09 14:00:44.886932
3	2	t	2025-10-09 14:00:44.889622
4	3	t	2025-10-09 14:00:44.924188
5	4	t	2025-10-09 14:00:44.970063
6	5	t	2025-10-09 14:00:44.976313
7	6	t	2025-10-09 14:00:44.980289
\.


--
-- Data for Name: attribute_templates; Type: TABLE DATA; Schema: wms; Owner: asfp
--

COPY wms.attribute_templates (id, code, name, description, target_type, data_type, is_required, metadata, ui_schema, "position", created_at, updated_at) FROM stdin;
10000000-0000-0000-0000-000000000001	color	Цвет конструкции	Основной цвет изделия	item	string	f	{"example": "Синий"}	{"options": ["Синий", "Красный", "Белый"], "component": "Select"}	10	2025-10-09 14:00:44.970063+00	2025-10-09 14:00:44.970063+00
10000000-0000-0000-0000-000000000002	width_mm	Ширина, мм	Габаритная ширина	item	number	t	{"unit": "mm"}	{"step": 1, "component": "NumberInput"}	20	2025-10-09 14:00:44.970063+00	2025-10-09 14:00:44.970063+00
10000000-0000-0000-0000-000000000003	is_outdoor	Уличное размещение	Подходит для улицы	item	boolean	f	{}	{"component": "Switch"}	30	2025-10-09 14:00:44.970063+00	2025-10-09 14:00:44.970063+00
10000000-0000-0000-0000-000000000004	notes	Примечания	Дополнительная информация	item	json	f	{}	{"component": "JsonEditor"}	40	2025-10-09 14:00:44.970063+00	2025-10-09 14:00:44.970063+00
\.


--
-- Data for Name: attribute_values; Type: TABLE DATA; Schema: wms; Owner: asfp
--

COPY wms.attribute_values (owner_type, owner_id, template_id, string_value, number_value, boolean_value, json_value, updated_at) FROM stdin;
item	20000000-0000-0000-0000-000000000001	10000000-0000-0000-0000-000000000001	Синий	\N	\N	\N	2025-10-09 14:00:44.970063+00
item	20000000-0000-0000-0000-000000000001	10000000-0000-0000-0000-000000000002	\N	2400.000000	\N	\N	2025-10-09 14:00:44.970063+00
item	20000000-0000-0000-0000-000000000001	10000000-0000-0000-0000-000000000003	\N	\N	t	\N	2025-10-09 14:00:44.970063+00
item	20000000-0000-0000-0000-000000000001	10000000-0000-0000-0000-000000000004	\N	\N	\N	{"note": "Образец для тестов"}	2025-10-09 14:00:44.970063+00
\.


--
-- Data for Name: catalog_links; Type: TABLE DATA; Schema: wms; Owner: asfp
--

COPY wms.catalog_links (left_id, left_type, right_id, right_type, relation_code, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: catalog_node; Type: TABLE DATA; Schema: wms; Owner: asfp
--

COPY wms.catalog_node (id, catalog_type, parent_id, code, name, description, level, path, metadata, sort_order, is_active, created_by, updated_by, created_at, updated_at) FROM stdin;
61128402-95a7-4eeb-851d-16e1c76aa282	category	\N	ROOT	Root Catalog	Root node for hierarchical categories	0	ROOT	{"system": true}	0	t	\N	\N	2025-10-09 14:00:44.924188+00	2025-10-09 14:00:44.924188+00
04dcf27a-fd32-402f-8e0b-97066f55b78e	unit	\N	PCS	Pieces	Generic count unit	0	PCS	{"decimalPlaces": 0}	0	t	\N	\N	2025-10-09 14:00:44.924188+00	2025-10-09 14:00:44.924188+00
78ac196e-428b-46a2-9b53-164560ca9220	category	61128402-95a7-4eeb-851d-16e1c76aa282	PRINT	Печатная продукция	Категория для печатных материалов	1	ROOT.PRINT	{"system": false}	20	t	\N	\N	2025-10-09 14:00:44.970063+00	2025-10-09 14:00:44.970063+00
e0130b2b-4215-4b0f-a8ee-4101b93fc5f7	unit	\N	UNT-MGJNB1FH4YG0	кв.м	\N	0	UNT-MGJNB1FH4YG0	{}	10	t	\N	\N	2025-10-09 16:42:21.104225+00	2025-10-09 16:42:21.104225+00
0d375a14-35ae-4269-9227-02298ea45e0d	unit	\N	UNT-MGJNBCLD11A9	рул	\N	0	UNT-MGJNBCLD11A9	{}	10	t	\N	\N	2025-10-09 16:42:30.185006+00	2025-10-09 16:42:30.185006+00
\.


--
-- Data for Name: equipment; Type: TABLE DATA; Schema: wms; Owner: asfp
--

COPY wms.equipment (id, warehouse_id, code, name, equipment_type, status, manufacturer, serial_number, commissioning_date, metadata, created_by, updated_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: item; Type: TABLE DATA; Schema: wms; Owner: asfp
--

COPY wms.item (id, sku, name, description, category_id, category_path, unit_id, barcode, weight_kg, volume_m3, metadata, created_by, updated_by, created_at, updated_at, alternative_unit_id, conversion_rate) FROM stdin;
20000000-0000-0000-0000-000000000001	DEMO-SIGN-001	Демонстрационная вывеска	Базовая демонстрационная карточка изделия	\N	ROOT.SIGNAGE	04dcf27a-fd32-402f-8e0b-97066f55b78e	4600000000017	35.500	0.8000	{"demo": true}	\N	\N	2025-10-09 14:00:44.970063+00	2025-10-09 14:00:44.970063+00	\N	\N
\.


--
-- Data for Name: item_warehouse; Type: TABLE DATA; Schema: wms; Owner: asfp
--

COPY wms.item_warehouse (item_id, warehouse_id, status, min_stock, max_stock) FROM stdin;
\.


--
-- Data for Name: stock; Type: TABLE DATA; Schema: wms; Owner: asfp
--

COPY wms.stock (sku, warehouse, quantity, uom, updated_at) FROM stdin;
banner-001	msk-main	120.000	pcs	2025-10-09 13:48:19.337896+00
\.


--
-- Data for Name: warehouse; Type: TABLE DATA; Schema: wms; Owner: asfp
--

COPY wms.warehouse (id, code, name, description, address, timezone, status, operating_hours, contact, org_unit_code, metadata, created_by, updated_by, created_at, updated_at) FROM stdin;
92cb097a-c3f5-448c-930b-bbd5fac72d40	msk-main	Центральный склад Москва	Основной склад компании	{"city": "Москва", "street": "Промышленная, 1"}	Europe/Moscow	active	{"sat": "09:00-15:00", "mon-fri": "08:00-20:00"}	{"phone": "+7 (495) 000-11-22", "manager": "Анна Волкова"}	HQ-WMS	{}	\N	\N	2025-10-09 13:48:19.334337+00	2025-10-09 13:48:19.334337+00
3b92428c-81a5-43c6-93b1-b0a2e434905d	WH-MGJNCBKCDDK3	Основной склад сырье		{}	UTC	active	{}	{}	HQ-WMS	{}	\N	\N	2025-10-09 16:43:21.96715+00	2025-10-09 16:43:21.96715+00
\.


--
-- Data for Name: warehouse_cell; Type: TABLE DATA; Schema: wms; Owner: asfp
--

COPY wms.warehouse_cell (id, warehouse_id, zone_id, code, label, address, cell_type, status, is_pick_face, length_mm, width_mm, height_mm, max_weight_kg, max_volume_l, allowed_handling, temperature_min, temperature_max, hazard_classes, metadata, created_by, updated_by, created_at, updated_at) FROM stdin;
4b1a89bd-78d8-4459-88d6-392483fe9738	92cb097a-c3f5-448c-930b-bbd5fac72d40	54e6e625-c9a6-464b-a915-f064a71bfb0c	RCV-GATE-01	Ворота 1	{"gate": "A1"}	dock	active	t	\N	\N	\N	\N	\N	[]	\N	\N	[]	{}	\N	\N	2025-10-09 13:48:19.335934+00	2025-10-09 13:48:19.335934+00
b4131a5d-3b91-458e-bfa1-d4ae4d92f9b3	92cb097a-c3f5-448c-930b-bbd5fac72d40	3103234b-239a-456b-ab1e-617204b0e705	ST-ROW-A01	Стеллаж A01	{"row": "A", "slot": "01"}	shelf	active	f	1200.00	800.00	2500.00	500.000	2.400	{"handling": ["manual", "forklift"]}	\N	\N	[]	{}	\N	\N	2025-10-09 13:48:19.335934+00	2025-10-09 13:48:19.335934+00
\.


--
-- Data for Name: warehouse_cell_equipment; Type: TABLE DATA; Schema: wms; Owner: asfp
--

COPY wms.warehouse_cell_equipment (cell_id, equipment_id, assigned_at, assigned_by) FROM stdin;
\.


--
-- Data for Name: warehouse_cell_history; Type: TABLE DATA; Schema: wms; Owner: asfp
--

COPY wms.warehouse_cell_history (id, cell_id, changed_at, changed_by, change_type, payload) FROM stdin;
\.


--
-- Data for Name: warehouse_layout_version; Type: TABLE DATA; Schema: wms; Owner: asfp
--

COPY wms.warehouse_layout_version (id, warehouse_id, version, name, status, description, payload, created_by, created_at, activated_at) FROM stdin;
\.


--
-- Data for Name: warehouse_zone; Type: TABLE DATA; Schema: wms; Owner: asfp
--

COPY wms.warehouse_zone (id, warehouse_id, code, name, zone_type, is_buffer, temperature_min, temperature_max, hazard_class, access_restrictions, layout, metadata, created_by, updated_by, created_at, updated_at) FROM stdin;
54e6e625-c9a6-464b-a915-f064a71bfb0c	92cb097a-c3f5-448c-930b-bbd5fac72d40	RECEIVING	Зона приемки	receiving	t	\N	\N	\N	[]	{"gates": ["A1", "A2"]}	{}	\N	\N	2025-10-09 13:48:19.334881+00	2025-10-09 13:48:19.334881+00
3103234b-239a-456b-ab1e-617204b0e705	92cb097a-c3f5-448c-930b-bbd5fac72d40	STORAGE	Основной склад	storage	f	\N	\N	\N	[]	{"rows": 5, "levels": 4}	{}	\N	\N	2025-10-09 13:48:19.334881+00	2025-10-09 13:48:19.334881+00
\.


--
-- Name: audit_log_id_seq; Type: SEQUENCE SET; Schema: core; Owner: asfp
--

SELECT pg_catalog.setval('core.audit_log_id_seq', 1, false);


--
-- Name: deal_events_id_seq; Type: SEQUENCE SET; Schema: crm; Owner: asfp
--

SELECT pg_catalog.setval('crm.deal_events_id_seq', 10, true);


--
-- Name: goose_db_version_crm_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asfp
--

SELECT pg_catalog.setval('public.goose_db_version_crm_id_seq', 5, true);


--
-- Name: goose_db_version_wms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asfp
--

SELECT pg_catalog.setval('public.goose_db_version_wms_id_seq', 7, true);


--
-- Name: warehouse_cell_history_id_seq; Type: SEQUENCE SET; Schema: wms; Owner: asfp
--

SELECT pg_catalog.setval('wms.warehouse_cell_history_id_seq', 1, false);


--
-- Name: assignment_rule assignment_rule_pkey; Type: CONSTRAINT; Schema: bpm; Owner: asfp
--

ALTER TABLE ONLY bpm.assignment_rule
    ADD CONSTRAINT assignment_rule_pkey PRIMARY KEY (id);


--
-- Name: escalation escalation_pkey; Type: CONSTRAINT; Schema: bpm; Owner: asfp
--

ALTER TABLE ONLY bpm.escalation
    ADD CONSTRAINT escalation_pkey PRIMARY KEY (id);


--
-- Name: form form_code_key; Type: CONSTRAINT; Schema: bpm; Owner: asfp
--

ALTER TABLE ONLY bpm.form
    ADD CONSTRAINT form_code_key UNIQUE (code);


--
-- Name: form form_pkey; Type: CONSTRAINT; Schema: bpm; Owner: asfp
--

ALTER TABLE ONLY bpm.form
    ADD CONSTRAINT form_pkey PRIMARY KEY (id);


--
-- Name: process_definition process_definition_code_key; Type: CONSTRAINT; Schema: bpm; Owner: asfp
--

ALTER TABLE ONLY bpm.process_definition
    ADD CONSTRAINT process_definition_code_key UNIQUE (code);


--
-- Name: process_definition process_definition_pkey; Type: CONSTRAINT; Schema: bpm; Owner: asfp
--

ALTER TABLE ONLY bpm.process_definition
    ADD CONSTRAINT process_definition_pkey PRIMARY KEY (id);


--
-- Name: task task_code_key; Type: CONSTRAINT; Schema: bpm; Owner: asfp
--

ALTER TABLE ONLY bpm.task
    ADD CONSTRAINT task_code_key UNIQUE (code);


--
-- Name: task task_pkey; Type: CONSTRAINT; Schema: bpm; Owner: asfp
--

ALTER TABLE ONLY bpm.task
    ADD CONSTRAINT task_pkey PRIMARY KEY (id);


--
-- Name: assignment_rule uq_bpm_assignment_rule_process_task; Type: CONSTRAINT; Schema: bpm; Owner: asfp
--

ALTER TABLE ONLY bpm.assignment_rule
    ADD CONSTRAINT uq_bpm_assignment_rule_process_task UNIQUE (process_id, task_code, priority);


--
-- Name: api_tokens api_tokens_pkey; Type: CONSTRAINT; Schema: core; Owner: asfp
--

ALTER TABLE ONLY core.api_tokens
    ADD CONSTRAINT api_tokens_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: core; Owner: asfp
--

ALTER TABLE ONLY core.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: org_units org_units_code_key; Type: CONSTRAINT; Schema: core; Owner: asfp
--

ALTER TABLE ONLY core.org_units
    ADD CONSTRAINT org_units_code_key UNIQUE (code);


--
-- Name: org_units org_units_path_key; Type: CONSTRAINT; Schema: core; Owner: asfp
--

ALTER TABLE ONLY core.org_units
    ADD CONSTRAINT org_units_path_key UNIQUE (path);


--
-- Name: org_units org_units_pkey; Type: CONSTRAINT; Schema: core; Owner: asfp
--

ALTER TABLE ONLY core.org_units
    ADD CONSTRAINT org_units_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: core; Owner: asfp
--

ALTER TABLE ONLY core.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_code, resource, action, scope);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: core; Owner: asfp
--

ALTER TABLE ONLY core.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (code);


--
-- Name: user_org_units user_org_units_pkey; Type: CONSTRAINT; Schema: core; Owner: asfp
--

ALTER TABLE ONLY core.user_org_units
    ADD CONSTRAINT user_org_units_pkey PRIMARY KEY (user_id, org_unit_code);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: core; Owner: asfp
--

ALTER TABLE ONLY core.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_code, warehouse_scope);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: core; Owner: asfp
--

ALTER TABLE ONLY core.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: core; Owner: asfp
--

ALTER TABLE ONLY core.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: customer_bank_accounts customer_bank_accounts_pkey; Type: CONSTRAINT; Schema: crm; Owner: asfp
--

ALTER TABLE ONLY crm.customer_bank_accounts
    ADD CONSTRAINT customer_bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: customer_contacts customer_contacts_pkey; Type: CONSTRAINT; Schema: crm; Owner: asfp
--

ALTER TABLE ONLY crm.customer_contacts
    ADD CONSTRAINT customer_contacts_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: crm; Owner: asfp
--

ALTER TABLE ONLY crm.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: deal_events deal_events_pkey; Type: CONSTRAINT; Schema: crm; Owner: asfp
--

ALTER TABLE ONLY crm.deal_events
    ADD CONSTRAINT deal_events_pkey PRIMARY KEY (id);


--
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: crm; Owner: asfp
--

ALTER TABLE ONLY crm.deals
    ADD CONSTRAINT deals_pkey PRIMARY KEY (id);


--
-- Name: document document_number_key; Type: CONSTRAINT; Schema: docs; Owner: asfp
--

ALTER TABLE ONLY docs.document
    ADD CONSTRAINT document_number_key UNIQUE (number);


--
-- Name: document document_pkey; Type: CONSTRAINT; Schema: docs; Owner: asfp
--

ALTER TABLE ONLY docs.document
    ADD CONSTRAINT document_pkey PRIMARY KEY (id);


--
-- Name: document_signer document_signer_document_id_signer_id_key; Type: CONSTRAINT; Schema: docs; Owner: asfp
--

ALTER TABLE ONLY docs.document_signer
    ADD CONSTRAINT document_signer_document_id_signer_id_key UNIQUE (document_id, signer_id);


--
-- Name: document_signer document_signer_pkey; Type: CONSTRAINT; Schema: docs; Owner: asfp
--

ALTER TABLE ONLY docs.document_signer
    ADD CONSTRAINT document_signer_pkey PRIMARY KEY (id);


--
-- Name: number_sequence number_sequence_code_key; Type: CONSTRAINT; Schema: docs; Owner: asfp
--

ALTER TABLE ONLY docs.number_sequence
    ADD CONSTRAINT number_sequence_code_key UNIQUE (code);


--
-- Name: number_sequence number_sequence_pkey; Type: CONSTRAINT; Schema: docs; Owner: asfp
--

ALTER TABLE ONLY docs.number_sequence
    ADD CONSTRAINT number_sequence_pkey PRIMARY KEY (id);


--
-- Name: signer signer_code_key; Type: CONSTRAINT; Schema: docs; Owner: asfp
--

ALTER TABLE ONLY docs.signer
    ADD CONSTRAINT signer_code_key UNIQUE (code);


--
-- Name: signer signer_pkey; Type: CONSTRAINT; Schema: docs; Owner: asfp
--

ALTER TABLE ONLY docs.signer
    ADD CONSTRAINT signer_pkey PRIMARY KEY (id);


--
-- Name: template template_code_key; Type: CONSTRAINT; Schema: docs; Owner: asfp
--

ALTER TABLE ONLY docs.template
    ADD CONSTRAINT template_code_key UNIQUE (code);


--
-- Name: template template_pkey; Type: CONSTRAINT; Schema: docs; Owner: asfp
--

ALTER TABLE ONLY docs.template
    ADD CONSTRAINT template_pkey PRIMARY KEY (id);


--
-- Name: operation operation_code_key; Type: CONSTRAINT; Schema: mes; Owner: asfp
--

ALTER TABLE ONLY mes.operation
    ADD CONSTRAINT operation_code_key UNIQUE (code);


--
-- Name: operation operation_pkey; Type: CONSTRAINT; Schema: mes; Owner: asfp
--

ALTER TABLE ONLY mes.operation
    ADD CONSTRAINT operation_pkey PRIMARY KEY (id);


--
-- Name: route route_code_key; Type: CONSTRAINT; Schema: mes; Owner: asfp
--

ALTER TABLE ONLY mes.route
    ADD CONSTRAINT route_code_key UNIQUE (code);


--
-- Name: route_operation route_operation_pkey; Type: CONSTRAINT; Schema: mes; Owner: asfp
--

ALTER TABLE ONLY mes.route_operation
    ADD CONSTRAINT route_operation_pkey PRIMARY KEY (route_id, operation_id);


--
-- Name: route route_pkey; Type: CONSTRAINT; Schema: mes; Owner: asfp
--

ALTER TABLE ONLY mes.route
    ADD CONSTRAINT route_pkey PRIMARY KEY (id);


--
-- Name: work_center work_center_code_key; Type: CONSTRAINT; Schema: mes; Owner: asfp
--

ALTER TABLE ONLY mes.work_center
    ADD CONSTRAINT work_center_code_key UNIQUE (code);


--
-- Name: work_center work_center_pkey; Type: CONSTRAINT; Schema: mes; Owner: asfp
--

ALTER TABLE ONLY mes.work_center
    ADD CONSTRAINT work_center_pkey PRIMARY KEY (id);


--
-- Name: work_order work_order_code_key; Type: CONSTRAINT; Schema: mes; Owner: asfp
--

ALTER TABLE ONLY mes.work_order
    ADD CONSTRAINT work_order_code_key UNIQUE (code);


--
-- Name: work_order work_order_pkey; Type: CONSTRAINT; Schema: mes; Owner: asfp
--

ALTER TABLE ONLY mes.work_order
    ADD CONSTRAINT work_order_pkey PRIMARY KEY (id);


--
-- Name: crew crew_code_key; Type: CONSTRAINT; Schema: montage; Owner: asfp
--

ALTER TABLE ONLY montage.crew
    ADD CONSTRAINT crew_code_key UNIQUE (code);


--
-- Name: crew crew_pkey; Type: CONSTRAINT; Schema: montage; Owner: asfp
--

ALTER TABLE ONLY montage.crew
    ADD CONSTRAINT crew_pkey PRIMARY KEY (id);


--
-- Name: task task_code_key; Type: CONSTRAINT; Schema: montage; Owner: asfp
--

ALTER TABLE ONLY montage.task
    ADD CONSTRAINT task_code_key UNIQUE (code);


--
-- Name: task task_pkey; Type: CONSTRAINT; Schema: montage; Owner: asfp
--

ALTER TABLE ONLY montage.task
    ADD CONSTRAINT task_pkey PRIMARY KEY (id);


--
-- Name: vehicle vehicle_code_key; Type: CONSTRAINT; Schema: montage; Owner: asfp
--

ALTER TABLE ONLY montage.vehicle
    ADD CONSTRAINT vehicle_code_key UNIQUE (code);


--
-- Name: vehicle vehicle_pkey; Type: CONSTRAINT; Schema: montage; Owner: asfp
--

ALTER TABLE ONLY montage.vehicle
    ADD CONSTRAINT vehicle_pkey PRIMARY KEY (id);


--
-- Name: goose_db_version_crm goose_db_version_crm_pkey; Type: CONSTRAINT; Schema: public; Owner: asfp
--

ALTER TABLE ONLY public.goose_db_version_crm
    ADD CONSTRAINT goose_db_version_crm_pkey PRIMARY KEY (id);


--
-- Name: goose_db_version_wms goose_db_version_wms_pkey; Type: CONSTRAINT; Schema: public; Owner: asfp
--

ALTER TABLE ONLY public.goose_db_version_wms
    ADD CONSTRAINT goose_db_version_wms_pkey PRIMARY KEY (id);


--
-- Name: attribute_templates attribute_templates_pkey; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.attribute_templates
    ADD CONSTRAINT attribute_templates_pkey PRIMARY KEY (id);


--
-- Name: attribute_values attribute_values_pkey; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.attribute_values
    ADD CONSTRAINT attribute_values_pkey PRIMARY KEY (owner_type, owner_id, template_id);


--
-- Name: catalog_links catalog_links_pkey; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.catalog_links
    ADD CONSTRAINT catalog_links_pkey PRIMARY KEY (left_id, left_type, right_id, right_type, relation_code);


--
-- Name: catalog_node catalog_node_pkey; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.catalog_node
    ADD CONSTRAINT catalog_node_pkey PRIMARY KEY (id);


--
-- Name: equipment equipment_pkey; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);


--
-- Name: equipment equipment_warehouse_id_code_key; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.equipment
    ADD CONSTRAINT equipment_warehouse_id_code_key UNIQUE (warehouse_id, code);


--
-- Name: item item_pkey; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.item
    ADD CONSTRAINT item_pkey PRIMARY KEY (id);


--
-- Name: item_warehouse item_warehouse_pkey; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.item_warehouse
    ADD CONSTRAINT item_warehouse_pkey PRIMARY KEY (item_id, warehouse_id);


--
-- Name: stock stock_pkey; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.stock
    ADD CONSTRAINT stock_pkey PRIMARY KEY (sku, warehouse);


--
-- Name: attribute_templates uq_wms_attribute_template; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.attribute_templates
    ADD CONSTRAINT uq_wms_attribute_template UNIQUE (target_type, code);


--
-- Name: catalog_node uq_wms_catalog_node; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.catalog_node
    ADD CONSTRAINT uq_wms_catalog_node UNIQUE (catalog_type, code);


--
-- Name: item uq_wms_item_sku; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.item
    ADD CONSTRAINT uq_wms_item_sku UNIQUE (sku);


--
-- Name: warehouse_cell_equipment warehouse_cell_equipment_pkey; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.warehouse_cell_equipment
    ADD CONSTRAINT warehouse_cell_equipment_pkey PRIMARY KEY (cell_id, equipment_id);


--
-- Name: warehouse_cell_history warehouse_cell_history_pkey; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.warehouse_cell_history
    ADD CONSTRAINT warehouse_cell_history_pkey PRIMARY KEY (id);


--
-- Name: warehouse_cell warehouse_cell_pkey; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.warehouse_cell
    ADD CONSTRAINT warehouse_cell_pkey PRIMARY KEY (id);


--
-- Name: warehouse_cell warehouse_cell_warehouse_id_code_key; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.warehouse_cell
    ADD CONSTRAINT warehouse_cell_warehouse_id_code_key UNIQUE (warehouse_id, code);


--
-- Name: warehouse warehouse_code_key; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.warehouse
    ADD CONSTRAINT warehouse_code_key UNIQUE (code);


--
-- Name: warehouse_layout_version warehouse_layout_version_pkey; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.warehouse_layout_version
    ADD CONSTRAINT warehouse_layout_version_pkey PRIMARY KEY (id);


--
-- Name: warehouse_layout_version warehouse_layout_version_warehouse_id_version_key; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.warehouse_layout_version
    ADD CONSTRAINT warehouse_layout_version_warehouse_id_version_key UNIQUE (warehouse_id, version);


--
-- Name: warehouse warehouse_pkey; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.warehouse
    ADD CONSTRAINT warehouse_pkey PRIMARY KEY (id);


--
-- Name: warehouse_zone warehouse_zone_pkey; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.warehouse_zone
    ADD CONSTRAINT warehouse_zone_pkey PRIMARY KEY (id);


--
-- Name: warehouse_zone warehouse_zone_warehouse_id_code_key; Type: CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.warehouse_zone
    ADD CONSTRAINT warehouse_zone_warehouse_id_code_key UNIQUE (warehouse_id, code);


--
-- Name: idx_bpm_assignment_rule_process; Type: INDEX; Schema: bpm; Owner: asfp
--

CREATE INDEX idx_bpm_assignment_rule_process ON bpm.assignment_rule USING btree (process_id, task_code);


--
-- Name: idx_bpm_escalation_task; Type: INDEX; Schema: bpm; Owner: asfp
--

CREATE INDEX idx_bpm_escalation_task ON bpm.escalation USING btree (task_id);


--
-- Name: idx_bpm_task_process; Type: INDEX; Schema: bpm; Owner: asfp
--

CREATE INDEX idx_bpm_task_process ON bpm.task USING btree (process_id);


--
-- Name: idx_bpm_task_status; Type: INDEX; Schema: bpm; Owner: asfp
--

CREATE INDEX idx_bpm_task_status ON bpm.task USING btree (status);


--
-- Name: idx_customer_bank_accounts_customer_id; Type: INDEX; Schema: crm; Owner: asfp
--

CREATE INDEX idx_customer_bank_accounts_customer_id ON crm.customer_bank_accounts USING btree (customer_id);


--
-- Name: idx_customer_contacts_customer_id; Type: INDEX; Schema: crm; Owner: asfp
--

CREATE INDEX idx_customer_contacts_customer_id ON crm.customer_contacts USING btree (customer_id);


--
-- Name: idx_docs_document_signer_document; Type: INDEX; Schema: docs; Owner: asfp
--

CREATE INDEX idx_docs_document_signer_document ON docs.document_signer USING btree (document_id);


--
-- Name: idx_docs_document_status; Type: INDEX; Schema: docs; Owner: asfp
--

CREATE INDEX idx_docs_document_status ON docs.document USING btree (status);


--
-- Name: idx_docs_document_template; Type: INDEX; Schema: docs; Owner: asfp
--

CREATE INDEX idx_docs_document_template ON docs.document USING btree (template_id);


--
-- Name: idx_mes_work_order_route; Type: INDEX; Schema: mes; Owner: asfp
--

CREATE INDEX idx_mes_work_order_route ON mes.work_order USING btree (route_id);


--
-- Name: idx_mes_work_order_status; Type: INDEX; Schema: mes; Owner: asfp
--

CREATE INDEX idx_mes_work_order_status ON mes.work_order USING btree (status);


--
-- Name: idx_montage_task_crew; Type: INDEX; Schema: montage; Owner: asfp
--

CREATE INDEX idx_montage_task_crew ON montage.task USING btree (crew_id);


--
-- Name: idx_montage_task_status; Type: INDEX; Schema: montage; Owner: asfp
--

CREATE INDEX idx_montage_task_status ON montage.task USING btree (status);


--
-- Name: idx_wms_attribute_templates_target; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_attribute_templates_target ON wms.attribute_templates USING btree (target_type, "position");


--
-- Name: idx_wms_attribute_values_owner; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_attribute_values_owner ON wms.attribute_values USING btree (owner_type, owner_id);


--
-- Name: idx_wms_attribute_values_template; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_attribute_values_template ON wms.attribute_values USING btree (template_id);


--
-- Name: idx_wms_catalog_links_left; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_catalog_links_left ON wms.catalog_links USING btree (left_type, left_id, relation_code);


--
-- Name: idx_wms_catalog_links_right; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_catalog_links_right ON wms.catalog_links USING btree (right_type, relation_code, right_id);


--
-- Name: idx_wms_catalog_node_parent; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_catalog_node_parent ON wms.catalog_node USING btree (parent_id);


--
-- Name: idx_wms_catalog_node_path; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_catalog_node_path ON wms.catalog_node USING btree (catalog_type, path);


--
-- Name: idx_wms_catalog_node_type; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_catalog_node_type ON wms.catalog_node USING btree (catalog_type, sort_order);


--
-- Name: idx_wms_cell_history_cell; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_cell_history_cell ON wms.warehouse_cell_history USING btree (cell_id);


--
-- Name: idx_wms_cell_status; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_cell_status ON wms.warehouse_cell USING btree (status);


--
-- Name: idx_wms_cell_warehouse; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_cell_warehouse ON wms.warehouse_cell USING btree (warehouse_id);


--
-- Name: idx_wms_cell_zone; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_cell_zone ON wms.warehouse_cell USING btree (zone_id);


--
-- Name: idx_wms_equipment_type; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_equipment_type ON wms.equipment USING btree (equipment_type);


--
-- Name: idx_wms_equipment_warehouse; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_equipment_warehouse ON wms.equipment USING btree (warehouse_id);


--
-- Name: idx_wms_item_alternative_unit; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_item_alternative_unit ON wms.item USING btree (alternative_unit_id);


--
-- Name: idx_wms_item_category; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_item_category ON wms.item USING btree (category_id);


--
-- Name: idx_wms_item_created_at; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_item_created_at ON wms.item USING btree (created_at DESC);


--
-- Name: idx_wms_item_unit; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_item_unit ON wms.item USING btree (unit_id);


--
-- Name: idx_wms_stock_updated_at; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_stock_updated_at ON wms.stock USING btree (updated_at DESC);


--
-- Name: idx_wms_warehouse_status; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_warehouse_status ON wms.warehouse USING btree (status);


--
-- Name: idx_wms_zone_type; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_zone_type ON wms.warehouse_zone USING btree (zone_type);


--
-- Name: idx_wms_zone_warehouse; Type: INDEX; Schema: wms; Owner: asfp
--

CREATE INDEX idx_wms_zone_warehouse ON wms.warehouse_zone USING btree (warehouse_id);


--
-- Name: assignment_rule assignment_rule_process_id_fkey; Type: FK CONSTRAINT; Schema: bpm; Owner: asfp
--

ALTER TABLE ONLY bpm.assignment_rule
    ADD CONSTRAINT assignment_rule_process_id_fkey FOREIGN KEY (process_id) REFERENCES bpm.process_definition(id) ON DELETE CASCADE;


--
-- Name: escalation escalation_task_id_fkey; Type: FK CONSTRAINT; Schema: bpm; Owner: asfp
--

ALTER TABLE ONLY bpm.escalation
    ADD CONSTRAINT escalation_task_id_fkey FOREIGN KEY (task_id) REFERENCES bpm.task(id) ON DELETE CASCADE;


--
-- Name: form form_process_id_fkey; Type: FK CONSTRAINT; Schema: bpm; Owner: asfp
--

ALTER TABLE ONLY bpm.form
    ADD CONSTRAINT form_process_id_fkey FOREIGN KEY (process_id) REFERENCES bpm.process_definition(id) ON DELETE CASCADE;


--
-- Name: task task_process_id_fkey; Type: FK CONSTRAINT; Schema: bpm; Owner: asfp
--

ALTER TABLE ONLY bpm.task
    ADD CONSTRAINT task_process_id_fkey FOREIGN KEY (process_id) REFERENCES bpm.process_definition(id) ON DELETE CASCADE;


--
-- Name: api_tokens api_tokens_created_by_fkey; Type: FK CONSTRAINT; Schema: core; Owner: asfp
--

ALTER TABLE ONLY core.api_tokens
    ADD CONSTRAINT api_tokens_created_by_fkey FOREIGN KEY (created_by) REFERENCES core.users(id) ON DELETE SET NULL;


--
-- Name: api_tokens api_tokens_role_code_fkey; Type: FK CONSTRAINT; Schema: core; Owner: asfp
--

ALTER TABLE ONLY core.api_tokens
    ADD CONSTRAINT api_tokens_role_code_fkey FOREIGN KEY (role_code) REFERENCES core.roles(code) ON DELETE CASCADE;


--
-- Name: org_units org_units_parent_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: asfp
--

ALTER TABLE ONLY core.org_units
    ADD CONSTRAINT org_units_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES core.org_units(id) ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_role_code_fkey; Type: FK CONSTRAINT; Schema: core; Owner: asfp
--

ALTER TABLE ONLY core.role_permissions
    ADD CONSTRAINT role_permissions_role_code_fkey FOREIGN KEY (role_code) REFERENCES core.roles(code) ON DELETE CASCADE;


--
-- Name: user_org_units user_org_units_org_unit_code_fkey; Type: FK CONSTRAINT; Schema: core; Owner: asfp
--

ALTER TABLE ONLY core.user_org_units
    ADD CONSTRAINT user_org_units_org_unit_code_fkey FOREIGN KEY (org_unit_code) REFERENCES core.org_units(code) ON DELETE CASCADE;


--
-- Name: user_org_units user_org_units_user_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: asfp
--

ALTER TABLE ONLY core.user_org_units
    ADD CONSTRAINT user_org_units_user_id_fkey FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_role_code_fkey; Type: FK CONSTRAINT; Schema: core; Owner: asfp
--

ALTER TABLE ONLY core.user_roles
    ADD CONSTRAINT user_roles_role_code_fkey FOREIGN KEY (role_code) REFERENCES core.roles(code) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: asfp
--

ALTER TABLE ONLY core.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE;


--
-- Name: customer_bank_accounts customer_bank_accounts_customer_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: asfp
--

ALTER TABLE ONLY crm.customer_bank_accounts
    ADD CONSTRAINT customer_bank_accounts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES crm.customers(id) ON DELETE CASCADE;


--
-- Name: customer_contacts customer_contacts_customer_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: asfp
--

ALTER TABLE ONLY crm.customer_contacts
    ADD CONSTRAINT customer_contacts_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES crm.customers(id) ON DELETE CASCADE;


--
-- Name: deal_events deal_events_deal_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: asfp
--

ALTER TABLE ONLY crm.deal_events
    ADD CONSTRAINT deal_events_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES crm.deals(id) ON DELETE CASCADE;


--
-- Name: deals deals_customer_id_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: asfp
--

ALTER TABLE ONLY crm.deals
    ADD CONSTRAINT deals_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES crm.customers(id);


--
-- Name: deals deals_org_unit_code_fkey; Type: FK CONSTRAINT; Schema: crm; Owner: asfp
--

ALTER TABLE ONLY crm.deals
    ADD CONSTRAINT deals_org_unit_code_fkey FOREIGN KEY (org_unit_code) REFERENCES core.org_units(code);


--
-- Name: document document_sequence_id_fkey; Type: FK CONSTRAINT; Schema: docs; Owner: asfp
--

ALTER TABLE ONLY docs.document
    ADD CONSTRAINT document_sequence_id_fkey FOREIGN KEY (sequence_id) REFERENCES docs.number_sequence(id);


--
-- Name: document_signer document_signer_document_id_fkey; Type: FK CONSTRAINT; Schema: docs; Owner: asfp
--

ALTER TABLE ONLY docs.document_signer
    ADD CONSTRAINT document_signer_document_id_fkey FOREIGN KEY (document_id) REFERENCES docs.document(id) ON DELETE CASCADE;


--
-- Name: document_signer document_signer_signer_id_fkey; Type: FK CONSTRAINT; Schema: docs; Owner: asfp
--

ALTER TABLE ONLY docs.document_signer
    ADD CONSTRAINT document_signer_signer_id_fkey FOREIGN KEY (signer_id) REFERENCES docs.signer(id);


--
-- Name: document document_template_id_fkey; Type: FK CONSTRAINT; Schema: docs; Owner: asfp
--

ALTER TABLE ONLY docs.document
    ADD CONSTRAINT document_template_id_fkey FOREIGN KEY (template_id) REFERENCES docs.template(id);


--
-- Name: route_operation route_operation_operation_id_fkey; Type: FK CONSTRAINT; Schema: mes; Owner: asfp
--

ALTER TABLE ONLY mes.route_operation
    ADD CONSTRAINT route_operation_operation_id_fkey FOREIGN KEY (operation_id) REFERENCES mes.operation(id);


--
-- Name: route_operation route_operation_route_id_fkey; Type: FK CONSTRAINT; Schema: mes; Owner: asfp
--

ALTER TABLE ONLY mes.route_operation
    ADD CONSTRAINT route_operation_route_id_fkey FOREIGN KEY (route_id) REFERENCES mes.route(id) ON DELETE CASCADE;


--
-- Name: work_order work_order_route_id_fkey; Type: FK CONSTRAINT; Schema: mes; Owner: asfp
--

ALTER TABLE ONLY mes.work_order
    ADD CONSTRAINT work_order_route_id_fkey FOREIGN KEY (route_id) REFERENCES mes.route(id);


--
-- Name: task task_crew_id_fkey; Type: FK CONSTRAINT; Schema: montage; Owner: asfp
--

ALTER TABLE ONLY montage.task
    ADD CONSTRAINT task_crew_id_fkey FOREIGN KEY (crew_id) REFERENCES montage.crew(id);


--
-- Name: task task_vehicle_id_fkey; Type: FK CONSTRAINT; Schema: montage; Owner: asfp
--

ALTER TABLE ONLY montage.task
    ADD CONSTRAINT task_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES montage.vehicle(id);


--
-- Name: attribute_values attribute_values_template_id_fkey; Type: FK CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.attribute_values
    ADD CONSTRAINT attribute_values_template_id_fkey FOREIGN KEY (template_id) REFERENCES wms.attribute_templates(id) ON DELETE CASCADE;


--
-- Name: catalog_node catalog_node_parent_id_fkey; Type: FK CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.catalog_node
    ADD CONSTRAINT catalog_node_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES wms.catalog_node(id) ON DELETE SET NULL;


--
-- Name: equipment equipment_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.equipment
    ADD CONSTRAINT equipment_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES wms.warehouse(id) ON DELETE CASCADE;


--
-- Name: item item_alternative_unit_id_fkey; Type: FK CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.item
    ADD CONSTRAINT item_alternative_unit_id_fkey FOREIGN KEY (alternative_unit_id) REFERENCES wms.catalog_node(id) ON DELETE SET NULL;


--
-- Name: item item_category_id_fkey; Type: FK CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.item
    ADD CONSTRAINT item_category_id_fkey FOREIGN KEY (category_id) REFERENCES wms.catalog_node(id) ON DELETE SET NULL;


--
-- Name: item item_unit_id_fkey; Type: FK CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.item
    ADD CONSTRAINT item_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES wms.catalog_node(id) ON DELETE RESTRICT;


--
-- Name: item_warehouse item_warehouse_item_id_fkey; Type: FK CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.item_warehouse
    ADD CONSTRAINT item_warehouse_item_id_fkey FOREIGN KEY (item_id) REFERENCES wms.item(id) ON DELETE CASCADE;


--
-- Name: item_warehouse item_warehouse_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.item_warehouse
    ADD CONSTRAINT item_warehouse_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES wms.warehouse(id) ON DELETE CASCADE;


--
-- Name: warehouse_cell_equipment warehouse_cell_equipment_cell_id_fkey; Type: FK CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.warehouse_cell_equipment
    ADD CONSTRAINT warehouse_cell_equipment_cell_id_fkey FOREIGN KEY (cell_id) REFERENCES wms.warehouse_cell(id) ON DELETE CASCADE;


--
-- Name: warehouse_cell_equipment warehouse_cell_equipment_equipment_id_fkey; Type: FK CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.warehouse_cell_equipment
    ADD CONSTRAINT warehouse_cell_equipment_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES wms.equipment(id) ON DELETE CASCADE;


--
-- Name: warehouse_cell_history warehouse_cell_history_cell_id_fkey; Type: FK CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.warehouse_cell_history
    ADD CONSTRAINT warehouse_cell_history_cell_id_fkey FOREIGN KEY (cell_id) REFERENCES wms.warehouse_cell(id) ON DELETE CASCADE;


--
-- Name: warehouse_cell warehouse_cell_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.warehouse_cell
    ADD CONSTRAINT warehouse_cell_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES wms.warehouse(id) ON DELETE CASCADE;


--
-- Name: warehouse_cell warehouse_cell_zone_id_fkey; Type: FK CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.warehouse_cell
    ADD CONSTRAINT warehouse_cell_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES wms.warehouse_zone(id) ON DELETE CASCADE;


--
-- Name: warehouse_layout_version warehouse_layout_version_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.warehouse_layout_version
    ADD CONSTRAINT warehouse_layout_version_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES wms.warehouse(id) ON DELETE CASCADE;


--
-- Name: warehouse warehouse_org_unit_code_fkey; Type: FK CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.warehouse
    ADD CONSTRAINT warehouse_org_unit_code_fkey FOREIGN KEY (org_unit_code) REFERENCES core.org_units(code);


--
-- Name: warehouse_zone warehouse_zone_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: wms; Owner: asfp
--

ALTER TABLE ONLY wms.warehouse_zone
    ADD CONSTRAINT warehouse_zone_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES wms.warehouse(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ifzKAlBHorfHO0NMPj2PFkGa7hrTQIFOsMvTIfRoRcxRVV6IaAaddj1A3dvvBuV

