-- +goose Up
-- Create org unit hierarchy, permission matrix and API tokens for extended RBAC.
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

-- +goose Down
DROP TABLE IF EXISTS core.user_org_units;
DROP TABLE IF EXISTS core.api_tokens;
DROP TABLE IF EXISTS core.role_permissions;
DROP TABLE IF EXISTS core.org_units;
