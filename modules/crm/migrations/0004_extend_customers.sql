-- +goose Up
ALTER TABLE crm.customers
    ADD COLUMN comment TEXT,
    ADD COLUMN phone TEXT,
    ADD COLUMN email TEXT,
    ADD COLUMN website TEXT,
    ADD COLUMN legal_address TEXT,
    ADD COLUMN actual_address TEXT,
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE crm.customers SET updated_at = COALESCE(updated_at, created_at);
UPDATE crm.customers SET comment = COALESCE(comment, 'Поставщик');

CREATE TABLE IF NOT EXISTS crm.customer_bank_accounts (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES crm.customers(id) ON DELETE CASCADE,
    account_name TEXT,
    bank_name TEXT,
    account_number TEXT NOT NULL,
    bik TEXT,
    corr_account TEXT,
    comment TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_bank_accounts_customer_id ON crm.customer_bank_accounts(customer_id);

CREATE TABLE IF NOT EXISTS crm.customer_contacts (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES crm.customers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position TEXT,
    phone TEXT,
    email TEXT,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer_id ON crm.customer_contacts(customer_id);

-- +goose Down
DROP TABLE IF EXISTS crm.customer_contacts;
DROP TABLE IF EXISTS crm.customer_bank_accounts;

ALTER TABLE crm.customers
    DROP COLUMN IF EXISTS updated_at,
    DROP COLUMN IF EXISTS actual_address,
    DROP COLUMN IF EXISTS legal_address,
    DROP COLUMN IF EXISTS website,
    DROP COLUMN IF EXISTS email,
    DROP COLUMN IF EXISTS phone,
    DROP COLUMN IF EXISTS comment;
