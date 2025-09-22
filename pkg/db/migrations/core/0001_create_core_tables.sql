-- +goose Up
CREATE SCHEMA IF NOT EXISTS core;

CREATE TABLE IF NOT EXISTS core.users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.roles (
    code TEXT PRIMARY KEY,
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS core.user_roles (
    user_id UUID REFERENCES core.users(id) ON DELETE CASCADE,
    role_code TEXT REFERENCES core.roles(code) ON DELETE CASCADE,
    warehouse_scope TEXT,
    PRIMARY KEY (user_id, role_code, warehouse_scope)
);

CREATE TABLE IF NOT EXISTS core.audit_log (
    id BIGSERIAL PRIMARY KEY,
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    actor_id UUID,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    payload JSONB
);

-- +goose Down
DROP TABLE IF EXISTS core.audit_log;
DROP TABLE IF EXISTS core.user_roles;
DROP TABLE IF EXISTS core.roles;
DROP TABLE IF EXISTS core.users;
DROP SCHEMA IF EXISTS core CASCADE;
