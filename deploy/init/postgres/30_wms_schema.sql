CREATE SCHEMA IF NOT EXISTS wms;

CREATE TABLE IF NOT EXISTS wms.warehouse (
    id UUID PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    address JSONB NOT NULL DEFAULT '{}'::jsonb,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    status TEXT NOT NULL DEFAULT 'active',
    operating_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
    contact JSONB NOT NULL DEFAULT '{}'::jsonb,
    org_unit_code TEXT NOT NULL REFERENCES core.org_units(code),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wms.warehouse_zone (
    id UUID PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES wms.warehouse(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    zone_type TEXT NOT NULL,
    is_buffer BOOLEAN NOT NULL DEFAULT FALSE,
    temperature_min NUMERIC(10,2),
    temperature_max NUMERIC(10,2),
    hazard_class TEXT,
    access_restrictions JSONB NOT NULL DEFAULT '[]'::jsonb,
    layout JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (warehouse_id, code)
);

CREATE TABLE IF NOT EXISTS wms.warehouse_cell (
    id UUID PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES wms.warehouse(id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES wms.warehouse_zone(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    label TEXT,
    address JSONB NOT NULL DEFAULT '{}'::jsonb,
    cell_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    is_pick_face BOOLEAN NOT NULL DEFAULT FALSE,
    length_mm NUMERIC(10,2),
    width_mm NUMERIC(10,2),
    height_mm NUMERIC(10,2),
    max_weight_kg NUMERIC(12,3),
    max_volume_l NUMERIC(12,3),
    allowed_handling JSONB NOT NULL DEFAULT '[]'::jsonb,
    temperature_min NUMERIC(10,2),
    temperature_max NUMERIC(10,2),
    hazard_classes JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (warehouse_id, code)
);

CREATE TABLE IF NOT EXISTS wms.stock (
    sku TEXT NOT NULL,
    warehouse TEXT NOT NULL,
    quantity NUMERIC(18,3) NOT NULL DEFAULT 0,
    uom TEXT NOT NULL DEFAULT 'pcs',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (sku, warehouse)
);

CREATE INDEX IF NOT EXISTS idx_wms_stock_updated_at ON wms.stock (updated_at DESC);
