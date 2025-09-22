-- +goose Up
CREATE SCHEMA IF NOT EXISTS wms;

CREATE TABLE IF NOT EXISTS wms.stock (
    sku TEXT NOT NULL,
    warehouse TEXT NOT NULL,
    quantity NUMERIC(18,3) NOT NULL DEFAULT 0,
    uom TEXT NOT NULL DEFAULT 'pcs',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (sku, warehouse)
);

-- +goose Down
DROP TABLE IF EXISTS wms.stock;
DROP SCHEMA IF EXISTS wms CASCADE;
