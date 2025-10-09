-- +goose Up
INSERT INTO core.role_permissions (role_code, resource, action, scope, effect)
VALUES
    ('admin', 'crm.customer', 'read', '*', 'allow'),
    ('admin', 'crm.customer', 'write', '*', 'allow'),
    ('admin', 'crm.deal', 'read', '*', 'allow'),
    ('admin', 'crm.deal', 'write', '*', 'allow')
ON CONFLICT (role_code, resource, action, scope) DO UPDATE
SET effect = EXCLUDED.effect;

-- +goose Down
DELETE FROM core.role_permissions
WHERE role_code = 'admin'
  AND resource IN ('crm.customer', 'crm.deal')
  AND action IN ('read', 'write');
