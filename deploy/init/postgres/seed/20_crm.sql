INSERT INTO crm.customers (id, name, inn, kpp)
VALUES (uuid_generate_v4(), 'ООО «Афиша»', '7701234567', '770101001')
ON CONFLICT DO NOTHING;
