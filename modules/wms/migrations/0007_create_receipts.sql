-- +goose Up
CREATE TABLE IF NOT EXISTS wms.receipt (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    external_reference TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    warehouse_id UUID NOT NULL REFERENCES wms.warehouse(id),
    supplier_id UUID,
    supplier_name TEXT NOT NULL,
    supplier_inn TEXT,
    currency TEXT NOT NULL DEFAULT 'RUB',
    expected_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    total_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_vat NUMERIC(18,2) NOT NULL DEFAULT 0,
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wms.receipt_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES wms.receipt(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES wms.item(id),
    sku TEXT NOT NULL,
    item_name TEXT NOT NULL,
    unit_id UUID NOT NULL REFERENCES wms.catalog_node(id),
    unit_code TEXT NOT NULL,
    quantity NUMERIC(18,3) NOT NULL,
    expected_quantity NUMERIC(18,3) NOT NULL,
    received_quantity NUMERIC(18,3) NOT NULL,
    unit_cost NUMERIC(18,4) NOT NULL,
    vat_rate NUMERIC(5,2),
    vat_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
    batch_number TEXT,
    production_date DATE,
    expiration_date DATE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wms_receipt_warehouse ON wms.receipt (warehouse_id);
CREATE INDEX IF NOT EXISTS idx_wms_receipt_status ON wms.receipt (status);
CREATE INDEX IF NOT EXISTS idx_wms_receipt_line_receipt ON wms.receipt_line (receipt_id);
CREATE INDEX IF NOT EXISTS idx_wms_receipt_line_item ON wms.receipt_line (item_id);

-- +goose Down
DROP TABLE IF EXISTS wms.receipt_line;
DROP TABLE IF EXISTS wms.receipt;

