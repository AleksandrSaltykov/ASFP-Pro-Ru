-- +goose Up
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO core.roles (code, description)
VALUES
    ('admin', 'Полные права доступа'),
    ('manager', 'Работа с CRM и заказами')
ON CONFLICT (code) DO NOTHING;

INSERT INTO core.users (id, email, full_name, password_hash)
VALUES (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'admin@asfp.pro',
    'Demo Administrator',
    crypt('admin123', gen_salt('bf'))
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO core.user_roles (user_id, role_code)
VALUES (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'admin'
)
ON CONFLICT DO NOTHING;

-- +goose Down
DELETE FROM core.user_roles WHERE user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
DELETE FROM core.users WHERE id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
DELETE FROM core.roles WHERE code IN ('admin', 'manager');

