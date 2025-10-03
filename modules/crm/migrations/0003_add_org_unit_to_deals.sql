-- +goose Up
ALTER TABLE crm.deals
    ADD COLUMN org_unit_code TEXT NOT NULL DEFAULT 'HQ-SALES' REFERENCES core.org_units(code);

UPDATE crm.deals
SET org_unit_code = 'HQ-SALES'
WHERE org_unit_code IS NULL;

ALTER TABLE crm.deals
    ALTER COLUMN org_unit_code DROP DEFAULT;

-- +goose Down
ALTER TABLE crm.deals
    DROP COLUMN IF EXISTS org_unit_code;
