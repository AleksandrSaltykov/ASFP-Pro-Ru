-- +goose Up
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS wms.warehouse (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    address JSONB DEFAULT '{}'::jsonb,
    timezone TEXT DEFAULT 'UTC',
    status TEXT NOT NULL DEFAULT 'active',
    operating_hours JSONB DEFAULT '{}'::jsonb,
    contact JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wms_warehouse_status ON wms.warehouse(status);

CREATE TABLE IF NOT EXISTS wms.warehouse_zone (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES wms.warehouse(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    zone_type TEXT NOT NULL,
    is_buffer BOOLEAN NOT NULL DEFAULT FALSE,
    temperature_min NUMERIC(6,2),
    temperature_max NUMERIC(6,2),
    hazard_class TEXT,
    access_restrictions JSONB DEFAULT '[]'::jsonb,
    layout JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (warehouse_id, code)
);

CREATE INDEX IF NOT EXISTS idx_wms_zone_warehouse ON wms.warehouse_zone(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_wms_zone_type ON wms.warehouse_zone(zone_type);

CREATE TABLE IF NOT EXISTS wms.warehouse_layout_version (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES wms.warehouse(id) ON DELETE CASCADE,
    version INT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    description TEXT,
    payload JSONB DEFAULT '{}'::jsonb,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    UNIQUE (warehouse_id, version)
);

CREATE TABLE IF NOT EXISTS wms.warehouse_cell (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES wms.warehouse(id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES wms.warehouse_zone(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    label TEXT,
    address JSONB NOT NULL DEFAULT '{}'::jsonb,
    cell_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    is_pick_face BOOLEAN NOT NULL DEFAULT FALSE,
    length_mm INT,
    width_mm INT,
    height_mm INT,
    max_weight_kg NUMERIC(10,2),
    max_volume_l NUMERIC(12,3),
    allowed_handling JSONB DEFAULT '[]'::jsonb,
    temperature_min NUMERIC(6,2),
    temperature_max NUMERIC(6,2),
    hazard_classes TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (warehouse_id, code)
);

CREATE INDEX IF NOT EXISTS idx_wms_cell_warehouse ON wms.warehouse_cell(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_wms_cell_zone ON wms.warehouse_cell(zone_id);
CREATE INDEX IF NOT EXISTS idx_wms_cell_status ON wms.warehouse_cell(status);

CREATE TABLE IF NOT EXISTS wms.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES wms.warehouse(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    equipment_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    manufacturer TEXT,
    serial_number TEXT,
    commissioning_date DATE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (warehouse_id, code)
);

CREATE INDEX IF NOT EXISTS idx_wms_equipment_warehouse ON wms.equipment(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_wms_equipment_type ON wms.equipment(equipment_type);

CREATE TABLE IF NOT EXISTS wms.warehouse_cell_equipment (
    cell_id UUID NOT NULL REFERENCES wms.warehouse_cell(id) ON DELETE CASCADE,
    equipment_id UUID NOT NULL REFERENCES wms.equipment(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID,
    PRIMARY KEY (cell_id, equipment_id)
);

CREATE TABLE IF NOT EXISTS wms.warehouse_cell_history (
    id BIGSERIAL PRIMARY KEY,
    cell_id UUID NOT NULL REFERENCES wms.warehouse_cell(id) ON DELETE CASCADE,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changed_by UUID,
    change_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_wms_cell_history_cell ON wms.warehouse_cell_history(cell_id);

-- +goose Down
DROP TABLE IF EXISTS wms.warehouse_cell_history;
DROP TABLE IF EXISTS wms.warehouse_cell_equipment;
DROP TABLE IF EXISTS wms.equipment;
DROP TABLE IF EXISTS wms.warehouse_cell;
DROP TABLE IF EXISTS wms.warehouse_layout_version;
DROP TABLE IF EXISTS wms.warehouse_zone;
DROP TABLE IF EXISTS wms.warehouse;
