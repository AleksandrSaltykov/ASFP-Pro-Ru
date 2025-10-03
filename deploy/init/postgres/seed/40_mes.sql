-- MES demo data seeds. Execute inserts only when target tables and expected columns are available.
DO
$$
BEGIN
    IF to_regclass('mes.work_center') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mes' AND table_name = 'work_center' AND column_name = 'code')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mes' AND table_name = 'work_center' AND column_name = 'name')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mes' AND table_name = 'work_center' AND column_name = 'id') THEN
        INSERT INTO mes.work_center (id, code, name)
        VALUES
            ('40000000-0000-0000-0000-000000000001', 'CUTTING', 'Цех резки'),
            ('40000000-0000-0000-0000-000000000002', 'PRINT', 'Печать баннеров')
        ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name;
    ELSE
        RAISE NOTICE 'mes.work_center missing expected columns, skipping seed';
    END IF;

    IF to_regclass('mes.operation') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mes' AND table_name = 'operation' AND column_name = 'code')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mes' AND table_name = 'operation' AND column_name = 'name')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mes' AND table_name = 'operation' AND column_name = 'id') THEN
        INSERT INTO mes.operation (id, code, name)
        VALUES
            ('40000000-0000-0000-0000-000000000101', 'CUT-VINYL', 'Резка винила'),
            ('40000000-0000-0000-0000-000000000102', 'PRINT-BANNER', 'Печать баннера')
        ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name;
    ELSE
        RAISE NOTICE 'mes.operation missing expected columns, skipping seed';
    END IF;

    IF to_regclass('mes.route') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mes' AND table_name = 'route' AND column_name = 'code')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mes' AND table_name = 'route' AND column_name = 'name')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'mes' AND table_name = 'route' AND column_name = 'id') THEN
        INSERT INTO mes.route (id, code, name)
        VALUES ('40000000-0000-0000-0000-000000000201', 'STANDARD-SIGN', 'Маршрут изготовления вывески')
        ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name;
    ELSE
        RAISE NOTICE 'mes.route missing expected columns, skipping seed';
    END IF;
END;
$$;
