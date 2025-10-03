INSERT INTO core.roles (code, description) VALUES
    ('director', 'Генеральный директор'),
    ('sales', 'Отдел продаж'),
    ('warehouse', 'Склад')
ON CONFLICT (code) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO core.users (id, email, full_name, password_hash)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    'admin@example.com',
    'Администратор',
    crypt('admin123', gen_salt('bf'))
)
ON CONFLICT (email) DO UPDATE
SET
    full_name = EXCLUDED.full_name,
    password_hash = EXCLUDED.password_hash;

INSERT INTO core.user_roles (user_id, role_code, warehouse_scope)
SELECT u.id, 'director', '*'
FROM core.users u
WHERE u.email = 'admin@example.com'
ON CONFLICT DO NOTHING;

-- Org units hierarchy
INSERT INTO core.org_units (code, name, description, parent_id, path, level)
VALUES ('HQ', 'Головной офис', 'Корневой организационный юнит', NULL, 'HQ', 0)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = TRUE;

WITH parent AS (
    SELECT id, path, level FROM core.org_units WHERE code = 'HQ'
)
INSERT INTO core.org_units (code, name, description, parent_id, path, level)
SELECT 'HQ-SALES', 'Отдел продаж', 'Коммерческий блок', parent.id, parent.path || '.HQ-SALES', parent.level + 1
FROM parent
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = TRUE,
    parent_id = EXCLUDED.parent_id,
    path = EXCLUDED.path,
    level = EXCLUDED.level;

WITH parent AS (
    SELECT id, path, level FROM core.org_units WHERE code = 'HQ'
)
INSERT INTO core.org_units (code, name, description, parent_id, path, level)
SELECT 'HQ-WMS', 'Складской блок', 'Операции склада', parent.id, parent.path || '.HQ-WMS', parent.level + 1
FROM parent
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = TRUE,
    parent_id = EXCLUDED.parent_id,
    path = EXCLUDED.path,
    level = EXCLUDED.level;

-- Permission matrix
INSERT INTO core.role_permissions (role_code, resource, action, scope, effect)
VALUES
    ('director', '*', '*', '*', 'allow'),
    ('sales', 'crm.deal', 'read', 'HQ-SALES', 'allow'),
    ('sales', 'crm.deal', 'write', 'HQ-SALES', 'allow'),
    ('sales', 'crm.customer', 'read', 'HQ-SALES', 'allow'),
    ('sales', 'crm.customer', 'write', 'HQ-SALES', 'allow'),
    ('warehouse', 'wms.catalog', 'read', 'HQ-WMS', 'allow'),
    ('warehouse', 'wms.catalog', 'write', 'HQ-WMS', 'allow'),
    ('warehouse', 'wms.warehouse', 'read', 'HQ-WMS', 'allow'),
    ('warehouse', 'wms.warehouse', 'write', 'HQ-WMS', 'allow'),
    ('warehouse', 'wms.stock', 'read', 'HQ-WMS', 'allow'),
    ('warehouse', 'wms.stock', 'write', 'HQ-WMS', 'allow')
ON CONFLICT (role_code, resource, action, scope) DO UPDATE
SET effect = EXCLUDED.effect,
    metadata = EXCLUDED.metadata;

-- Map administrator to HQ org unit
INSERT INTO core.user_org_units (user_id, org_unit_code)
SELECT u.id, 'HQ'
FROM core.users u
WHERE u.email = 'admin@example.com'
ON CONFLICT DO NOTHING;
