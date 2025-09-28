-- +goose Up
CREATE TABLE IF NOT EXISTS wms.catalog_node (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_type TEXT NOT NULL,
    parent_id UUID REFERENCES wms.catalog_node(id) ON DELETE SET NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    level SMALLINT NOT NULL DEFAULT 0,
    path TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    sort_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_wms_catalog_node UNIQUE (catalog_type, code),
    CONSTRAINT chk_wms_catalog_type CHECK (catalog_type <> ''),
    CONSTRAINT chk_wms_catalog_code CHECK (code <> '')
);

CREATE INDEX IF NOT EXISTS idx_wms_catalog_node_type ON wms.catalog_node (catalog_type, sort_order);
CREATE INDEX IF NOT EXISTS idx_wms_catalog_node_parent ON wms.catalog_node (parent_id);
CREATE INDEX IF NOT EXISTS idx_wms_catalog_node_path ON wms.catalog_node (catalog_type, path);

INSERT INTO wms.catalog_node (catalog_type, code, name, description, level, path, metadata, sort_order, is_active)
VALUES ('category', 'ROOT', 'Root Catalog', 'Root node for hierarchical categories', 0, 'ROOT', '{"system": true}'::jsonb, 0, TRUE)
ON CONFLICT (catalog_type, code) DO NOTHING;

INSERT INTO wms.catalog_node (catalog_type, code, name, description, level, path, metadata, sort_order, is_active)
VALUES
    ('unit', 'PCS', 'Pieces', 'Generic count unit', 0, 'PCS', '{"decimalPlaces": 0}'::jsonb, 0, TRUE),
    ('unit', 'KG', 'Kilogram', 'Mass unit', 0, 'KG', '{"decimalPlaces": 3}'::jsonb, 10, TRUE)
ON CONFLICT (catalog_type, code) DO NOTHING;

CREATE TABLE IF NOT EXISTS wms.item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES wms.catalog_node(id) ON DELETE SET NULL,
    category_path TEXT,
    unit_id UUID NOT NULL REFERENCES wms.catalog_node(id) ON DELETE RESTRICT,
    barcode TEXT,
    weight_kg NUMERIC(12,3),
    volume_m3 NUMERIC(14,4),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_wms_item_sku UNIQUE (sku)
);

CREATE INDEX IF NOT EXISTS idx_wms_item_category ON wms.item (category_id);
CREATE INDEX IF NOT EXISTS idx_wms_item_unit ON wms.item (unit_id);
CREATE INDEX IF NOT EXISTS idx_wms_item_created_at ON wms.item (created_at DESC);

CREATE TABLE IF NOT EXISTS wms.item_warehouse (
    item_id UUID NOT NULL REFERENCES wms.item(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES wms.warehouse(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    min_stock NUMERIC(14,4),
    max_stock NUMERIC(14,4),
    PRIMARY KEY (item_id, warehouse_id)
);

CREATE TABLE IF NOT EXISTS wms.attribute_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    target_type TEXT NOT NULL,
    data_type TEXT NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ui_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    position SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_wms_attribute_template UNIQUE (target_type, code),
    CONSTRAINT chk_wms_attribute_data_type CHECK (data_type IN ('string', 'number', 'boolean', 'json'))
);

CREATE INDEX IF NOT EXISTS idx_wms_attribute_templates_target ON wms.attribute_templates (target_type, position);

CREATE TABLE IF NOT EXISTS wms.attribute_values (
    owner_type TEXT NOT NULL,
    owner_id UUID NOT NULL,
    template_id UUID NOT NULL REFERENCES wms.attribute_templates(id) ON DELETE CASCADE,
    string_value TEXT,
    number_value NUMERIC(20,6),
    boolean_value BOOLEAN,
    json_value JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (owner_type, owner_id, template_id)
);

CREATE INDEX IF NOT EXISTS idx_wms_attribute_values_template ON wms.attribute_values (template_id);
CREATE INDEX IF NOT EXISTS idx_wms_attribute_values_owner ON wms.attribute_values (owner_type, owner_id);

CREATE TABLE IF NOT EXISTS wms.catalog_links (
    left_id UUID NOT NULL,
    left_type TEXT NOT NULL,
    right_id UUID NOT NULL,
    right_type TEXT NOT NULL,
    relation_code TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (left_id, left_type, right_id, right_type, relation_code),
    CONSTRAINT chk_wms_catalog_relation_code CHECK (relation_code <> '')
);

CREATE INDEX IF NOT EXISTS idx_wms_catalog_links_left ON wms.catalog_links (left_type, left_id, relation_code);
CREATE INDEX IF NOT EXISTS idx_wms_catalog_links_right ON wms.catalog_links (right_type, relation_code, right_id);

-- +goose Down
DROP TABLE IF EXISTS wms.catalog_links;
DROP TABLE IF EXISTS wms.attribute_values;
DROP TABLE IF EXISTS wms.attribute_templates;
DROP TABLE IF EXISTS wms.item_warehouse;
DROP TABLE IF EXISTS wms.item;
DROP TABLE IF EXISTS wms.catalog_node;
