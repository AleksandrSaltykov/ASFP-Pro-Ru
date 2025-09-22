INSERT INTO core.roles (code, description) VALUES
    ('director', 'Генеральный директор'),
    ('sales', 'Отдел продаж'),
    ('warehouse', 'Склад')
ON CONFLICT (code) DO NOTHING;

INSERT INTO core.users (id, email, full_name, password_hash)
VALUES (uuid_generate_v4(), 'admin@example.com', 'Администратор', crypt('admin123', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;

INSERT INTO crm.customers (id, name, inn, kpp)
VALUES (uuid_generate_v4(), 'ООО «Афиша»', '7701234567', '770101001')
ON CONFLICT (name) DO NOTHING;

INSERT INTO wms.stock (sku, warehouse, quantity, uom)
VALUES ('banner-001', 'msk-main', 120, 'pcs')
ON CONFLICT (sku, warehouse) DO UPDATE SET quantity = EXCLUDED.quantity;
