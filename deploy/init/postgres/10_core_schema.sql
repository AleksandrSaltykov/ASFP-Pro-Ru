CREATE SCHEMA IF NOT EXISTS core;

CREATE TABLE IF NOT EXISTS core.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

CREATE TABLE IF NOT EXISTS core.org_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES core.org_units(id) ON DELETE SET NULL,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    path TEXT NOT NULL UNIQUE,
    level SMALLINT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS core.role_permissions (
    role_code TEXT NOT NULL REFERENCES core.roles(code) ON DELETE CASCADE,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    scope TEXT NOT NULL DEFAULT '*',
    effect TEXT NOT NULL DEFAULT 'allow',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_code, resource, action, scope)
);

CREATE TABLE IF NOT EXISTS core.api_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    role_code TEXT NOT NULL REFERENCES core.roles(code) ON DELETE CASCADE,
    scope TEXT NOT NULL DEFAULT '*',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS core.user_org_units (
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    org_unit_code TEXT NOT NULL REFERENCES core.org_units(code) ON DELETE CASCADE,
    PRIMARY KEY (user_id, org_unit_code)
);
