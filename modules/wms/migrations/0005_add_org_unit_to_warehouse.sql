-- +goose Up
ALTER TABLE wms.warehouse
    ADD COLUMN IF NOT EXISTS org_unit_code TEXT REFERENCES core.org_units(code);

UPDATE wms.warehouse
SET org_unit_code = 'HQ-WMS'
WHERE org_unit_code IS NULL;

ALTER TABLE wms.warehouse
    ALTER COLUMN org_unit_code SET DEFAULT 'HQ-WMS';

ALTER TABLE wms.warehouse
    ALTER COLUMN org_unit_code SET NOT NULL;

ALTER TABLE wms.warehouse
    ALTER COLUMN org_unit_code DROP DEFAULT;

-- +goose Down
ALTER TABLE wms.warehouse
    DROP COLUMN IF EXISTS org_unit_code;
