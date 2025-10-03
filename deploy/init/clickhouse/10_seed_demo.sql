INSERT INTO analytics.events (occurred_at, event_type, deal_id, stage, amount, currency, customer_id, created_by, created_at)
VALUES
    (now() - INTERVAL 45 DAY, 'deal.created', '31000000-0000-0000-0000-000000000001', 'new', 350000, 'RUB', '30000000-0000-0000-0000-000000000001', 'admin@example.com', now() - INTERVAL 45 DAY),
    (now() - INTERVAL 32 DAY, 'deal.created', '31000000-0000-0000-0000-000000000002', 'qualification', 120000, 'RUB', '30000000-0000-0000-0000-000000000002', 'manager@example.com', now() - INTERVAL 32 DAY),
    (now() - INTERVAL 15 DAY, 'deal.created', '31000000-0000-0000-0000-000000000003', 'won', 560000, 'RUB', '30000000-0000-0000-0000-000000000001', 'sales@example.com', now() - INTERVAL 15 DAY),
    (now() - INTERVAL 7 DAY, 'deal.created', '31000000-0000-0000-0000-000000000004', 'won', 210000, 'RUB', '30000000-0000-0000-0000-000000000003', 'sales@example.com', now() - INTERVAL 7 DAY);
