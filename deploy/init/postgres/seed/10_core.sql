INSERT INTO core.roles (code, description) VALUES
    ('director', 'Генеральный директор'),
    ('sales', 'Отдел продаж'),
    ('warehouse', 'Склад')
ON CONFLICT (code) DO NOTHING;

INSERT INTO core.users (id, email, full_name, password_hash)
VALUES (uuid_generate_v4(), 'admin@example.com', 'Администратор', crypt('admin123', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;
