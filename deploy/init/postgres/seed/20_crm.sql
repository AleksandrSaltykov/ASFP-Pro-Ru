INSERT INTO crm.customers (id, name, inn, kpp)
VALUES
    ('30000000-0000-0000-0000-000000000001', 'ООО «Афиша»', '7701234567', '770101001'),
    ('30000000-0000-0000-0000-000000000002', 'ООО «Сфера Принт»', '7812345678', '781201001')
ON CONFLICT (id) DO UPDATE
SET
    name = EXCLUDED.name,
    inn = EXCLUDED.inn,
    kpp = EXCLUDED.kpp;

DO
$$
BEGIN
    IF to_regclass('crm.deals') IS NOT NULL THEN
        INSERT INTO crm.deals (id, title, customer_id, stage, amount, currency, created_by, org_unit_code)
        VALUES
            ('31000000-0000-0000-0000-000000000001', 'Демо договор на вывеску', '30000000-0000-0000-0000-000000000001', 'new', 350000, 'RUB', 'admin@example.com', 'HQ-SALES'),
            ('31000000-0000-0000-0000-000000000002', 'Обслуживание digital-вывесок', '30000000-0000-0000-0000-000000000002', 'qualification', 120000, 'RUB', 'admin@example.com', 'HQ-SALES')
        ON CONFLICT (id) DO UPDATE
        SET
            title = EXCLUDED.title,
            customer_id = EXCLUDED.customer_id,
            stage = EXCLUDED.stage,
            amount = EXCLUDED.amount,
            currency = EXCLUDED.currency,
            created_by = EXCLUDED.created_by,
            org_unit_code = EXCLUDED.org_unit_code;
    ELSE
        RAISE NOTICE 'crm.deals table missing, skipping deals seed';
    END IF;
END;
$$;

DO
$$
BEGIN
    IF to_regclass('crm.deal_events') IS NOT NULL THEN
        INSERT INTO crm.deal_events (id, deal_id, event_type, payload)
        VALUES
            (1001, '31000000-0000-0000-0000-000000000001', 'deal.created', json_build_object('title', 'Демо договор на вывеску', 'stage', 'new')),
            (1002, '31000000-0000-0000-0000-000000000002', 'deal.created', json_build_object('title', 'Обслуживание digital-вывесок', 'stage', 'qualification'))
        ON CONFLICT (id) DO UPDATE
        SET
            deal_id = EXCLUDED.deal_id,
            event_type = EXCLUDED.event_type,
            payload = EXCLUDED.payload;
    ELSE
        RAISE NOTICE 'crm.deal_events table missing, skipping deal events seed';
    END IF;
END;
$$;
