-- +goose Up
INSERT INTO crm.customers (id, name, inn, kpp)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'ООО "Ромашка"', '7701234567', '770101001'),
    ('22222222-2222-2222-2222-222222222222', 'АО "Неон"', '7812345678', '781201001'),
    ('33333333-3333-3333-3333-333333333333', 'ИП Сидоров П.А.', '5409876543', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO crm.deals (id, title, customer_id, stage, amount, currency, created_by, created_at, org_unit_code)
VALUES
    ('31111111-aaaa-4aaa-8aaa-111111111111', 'Ремонт фасада ТЦ "Альфа"', '11111111-1111-1111-1111-111111111111', 'new', 1200000, 'RUB', 'demo@asfp.pro', NOW() - INTERVAL '10 days', 'HQ-SALES'),
    ('32222222-bbbb-4bbb-8bbb-222222222222', 'Подсветка автосалона "Неон"', '22222222-2222-2222-2222-222222222222', 'qualification', 850000, 'RUB', 'demo@asfp.pro', NOW() - INTERVAL '7 days', 'HQ-SALES'),
    ('33333333-cccc-4ccc-8ccc-333333333333', 'Экран на фасад БЦ "Орион"', '22222222-2222-2222-2222-222222222222', 'negotiation', 2150000, 'RUB', 'demo@asfp.pro', NOW() - INTERVAL '3 days', 'HQ-SALES'),
    ('34444444-dddd-4ddd-8ddd-444444444444', 'Печать баннеров для ИП Сидоров П.А.', '33333333-3333-3333-3333-333333333333', 'won', 320000, 'RUB', 'demo@asfp.pro', NOW() - INTERVAL '1 day', 'HQ-SALES'),
    ('35555555-eeee-4eee-8eee-555555555555', 'Рестайлинг витрины "Ромашка"', '11111111-1111-1111-1111-111111111111', 'lost', 540000, 'RUB', 'demo@asfp.pro', NOW() - INTERVAL '5 days', 'HQ-SALES')
ON CONFLICT (id) DO NOTHING;

INSERT INTO crm.deal_events (deal_id, event_type, payload)
VALUES
    ('31111111-aaaa-4aaa-8aaa-111111111111', 'deal.created', jsonb_build_object(
        'title', 'Ремонт фасада ТЦ "Альфа"',
        'amount', 1200000,
        'currency', 'RUB',
        'customerId', '11111111-1111-1111-1111-111111111111',
        'createdBy', 'demo@asfp.pro',
        'stage', 'new'
    )),
    ('31111111-aaaa-4aaa-8aaa-111111111111', 'stage.changed', jsonb_build_object('from', 'qualification', 'to', 'new')),
    ('32222222-bbbb-4bbb-8bbb-222222222222', 'deal.created', jsonb_build_object(
        'title', 'Подсветка автосалона "Неон"',
        'amount', 850000,
        'currency', 'RUB',
        'customerId', '22222222-2222-2222-2222-222222222222',
        'createdBy', 'demo@asfp.pro',
        'stage', 'qualification'
    )),
    ('32222222-bbbb-4bbb-8bbb-222222222222', 'stage.changed', jsonb_build_object('from', 'new', 'to', 'qualification')),
    ('33333333-cccc-4ccc-8ccc-333333333333', 'deal.created', jsonb_build_object(
        'title', 'Экран на фасад БЦ "Орион"',
        'amount', 2150000,
        'currency', 'RUB',
        'customerId', '22222222-2222-2222-2222-222222222222',
        'createdBy', 'demo@asfp.pro',
        'stage', 'negotiation'
    )),
    ('33333333-cccc-4ccc-8ccc-333333333333', 'stage.changed', jsonb_build_object('from', 'qualification', 'to', 'negotiation')),
    ('34444444-dddd-4ddd-8ddd-444444444444', 'deal.created', jsonb_build_object(
        'title', 'Печать баннеров для ИП Сидоров П.А.',
        'amount', 320000,
        'currency', 'RUB',
        'customerId', '33333333-3333-3333-3333-333333333333',
        'createdBy', 'demo@asfp.pro',
        'stage', 'won'
    )),
    ('34444444-dddd-4ddd-8ddd-444444444444', 'stage.changed', jsonb_build_object('from', 'negotiation', 'to', 'won')),
    ('35555555-eeee-4eee-8eee-555555555555', 'deal.created', jsonb_build_object(
        'title', 'Рестайлинг витрины "Ромашка"',
        'amount', 540000,
        'currency', 'RUB',
        'customerId', '11111111-1111-1111-1111-111111111111',
        'createdBy', 'demo@asfp.pro',
        'stage', 'lost'
    )),
    ('35555555-eeee-4eee-8eee-555555555555', 'stage.changed', jsonb_build_object('from', 'negotiation', 'to', 'lost'))
ON CONFLICT DO NOTHING;

-- +goose Down
DELETE FROM crm.deal_events WHERE deal_id IN (
    '31111111-aaaa-4aaa-8aaa-111111111111',
    '32222222-bbbb-4bbb-8bbb-222222222222',
    '33333333-cccc-4ccc-8ccc-333333333333',
    '34444444-dddd-4ddd-8ddd-444444444444',
    '35555555-eeee-4eee-8eee-555555555555'
);

DELETE FROM crm.deals WHERE id IN (
    '31111111-aaaa-4aaa-8aaa-111111111111',
    '32222222-bbbb-4bbb-8bbb-222222222222',
    '33333333-cccc-4ccc-8ccc-333333333333',
    '34444444-dddd-4ddd-8ddd-444444444444',
    '35555555-eeee-4eee-8eee-555555555555'
);

DELETE FROM crm.customers WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333'
);
