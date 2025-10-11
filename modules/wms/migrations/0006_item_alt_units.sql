-- +goose Up
ALTER TABLE wms.item
    ADD COLUMN IF NOT EXISTS alternative_unit_id UUID REFERENCES wms.catalog_node(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS conversion_rate NUMERIC(14,6);

CREATE INDEX IF NOT EXISTS idx_wms_item_alternative_unit ON wms.item (alternative_unit_id);

-- +goose Down
ALTER TABLE wms.item
    DROP COLUMN IF EXISTS conversion_rate,
    DROP COLUMN IF EXISTS alternative_unit_id;
