-- Docs module demo seeds. Performs inserts only when templates and sequences tables exist.
DO
$$
BEGIN
    IF to_regclass('docs.template') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'docs' AND table_name = 'template' AND column_name = 'code')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'docs' AND table_name = 'template' AND column_name = 'name')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'docs' AND table_name = 'template' AND column_name = 'id') THEN
        INSERT INTO docs.template (id, code, name)
        VALUES
            ('60000000-0000-0000-0000-000000000001', 'COMMERCIAL_OFFER', 'Коммерческое предложение'),
            ('60000000-0000-0000-0000-000000000002', 'INSTALLATION_ACT', 'Акт монтажа')
        ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name;
    ELSE
        RAISE NOTICE 'docs.template missing expected columns, skipping seed';
    END IF;

    IF to_regclass('docs.number_sequence') IS NOT NULL
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'docs' AND table_name = 'number_sequence' AND column_name = 'code')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'docs' AND table_name = 'number_sequence' AND column_name = 'id') THEN
        INSERT INTO docs.number_sequence (id, code)
        VALUES
            ('60000000-0000-0000-0000-000000000101', 'DOC-OFFER'),
            ('60000000-0000-0000-0000-000000000102', 'DOC-ACT')
        ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code;
    ELSE
        RAISE NOTICE 'docs.number_sequence missing expected columns, skipping seed';
    END IF;
END;
$$;
