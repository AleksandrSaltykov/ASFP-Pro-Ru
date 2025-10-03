-- Montage demo seeds. Each insert runs only if destination tables expose id/code/name columns.
DO
$$
BEGIN
    IF to_regclass('montage.crew') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'montage' AND table_name = 'crew' AND column_name = 'code')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'montage' AND table_name = 'crew' AND column_name = 'name')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'montage' AND table_name = 'crew' AND column_name = 'id') THEN
        INSERT INTO montage.crew (id, code, name, specialization)
        VALUES
            ('50000000-0000-0000-0000-000000000001', 'CREW-NORTH', 'Бригада Север', 'Высотные работы'),
            ('50000000-0000-0000-0000-000000000002', 'CREW-MSK', 'Бригада Москва', 'Работа с фасадами')
        ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name, specialization = EXCLUDED.specialization;
    ELSE
        RAISE NOTICE 'montage.crew missing expected columns, skipping seed';
    END IF;

    IF to_regclass('montage.vehicle') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'montage' AND table_name = 'vehicle' AND column_name = 'code')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'montage' AND table_name = 'vehicle' AND column_name = 'id') THEN
        INSERT INTO montage.vehicle (id, code, name, plate, capacity)
        VALUES
            ('50000000-0000-0000-0000-000000000101', 'VAN-01', 'Газель NEXT', 'A123BC77', '2.5t'),
            ('50000000-0000-0000-0000-000000000102', 'VAN-02', 'Ford Transit', 'B987CD99', '3.0t')
        ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name, plate = EXCLUDED.plate, capacity = EXCLUDED.capacity;
    ELSE
        RAISE NOTICE 'montage.vehicle missing expected columns, skipping seed';
    END IF;

    IF to_regclass('montage.task') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'montage' AND table_name = 'task' AND column_name = 'title')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'montage' AND table_name = 'task' AND column_name = 'id') THEN
        INSERT INTO montage.task (id, code, title, status, crew_id, vehicle_id, scheduled_at, location)
        VALUES ('50000000-0000-0000-0000-000000000201', 'TASK-DEMO', 'Монтаж фасадной вывески', 'planned', '50000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000101', NOW() + INTERVAL '1 day', 'Москва, Ленинградский проспект 10')
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, status = EXCLUDED.status, crew_id = EXCLUDED.crew_id, vehicle_id = EXCLUDED.vehicle_id, scheduled_at = EXCLUDED.scheduled_at, location = EXCLUDED.location;
    ELSE
        RAISE NOTICE 'montage.task missing expected columns, skipping seed';
    END IF;
END;
$$;
