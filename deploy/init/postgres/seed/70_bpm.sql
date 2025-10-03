-- BPM module demo seeds. Insert only when expected columns present.
DO
$$
BEGIN
    IF to_regclass('bpm.process_definition') IS NOT NULL THEN
        INSERT INTO bpm.process_definition (id, code, name, description, status, definition)
        VALUES
            ('70000000-0000-0000-0000-000000000001', 'ONBOARDING', 'Онбординг сотрудника', 'Процесс оформления нового сотрудника', 'published', '{"steps":["collect_docs","issue_access"]}'),
            ('70000000-0000-0000-0000-000000000002', 'SALES_APPROVAL', 'Согласование сделки', 'Многошаговая проверка условий сделки', 'published', '{"steps":["manager","finance","director"]}')
        ON CONFLICT (id) DO UPDATE
            SET code = EXCLUDED.code,
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                status = EXCLUDED.status,
                definition = EXCLUDED.definition;
    END IF;

    IF to_regclass('bpm.form') IS NOT NULL THEN
        INSERT INTO bpm.form (id, process_id, code, name, schema, ui_schema)
        VALUES
            ('70000000-0000-0000-0000-000000000101', '70000000-0000-0000-0000-000000000001', 'ONBOARDING_MAIN', 'Анкета онбординга', '{"fields":["firstName","position"]}', '{"layout":"single"}'),
            ('70000000-0000-0000-0000-000000000102', '70000000-0000-0000-0000-000000000002', 'SALES_APPROVAL_MAIN', 'Форма согласования сделки', '{"fields":["dealId","amount","risk"]}', '{"layout":"steps"}')
        ON CONFLICT (id) DO UPDATE
            SET code = EXCLUDED.code,
                name = EXCLUDED.name,
                schema = EXCLUDED.schema,
                ui_schema = EXCLUDED.ui_schema;
    END IF;

    IF to_regclass('bpm.task') IS NOT NULL THEN
        INSERT INTO bpm.task (id, process_id, code, title, status, assignee, payload)
        VALUES
            ('70000000-0000-0000-0000-000000000201', '70000000-0000-0000-0000-000000000001', 'ONBOARDING_COLLECT', 'Сбор документов', 'in_progress', 'hr-manager', '{"deadline":"2d"}'),
            ('70000000-0000-0000-0000-000000000202', '70000000-0000-0000-0000-000000000002', 'SALES_FINANCE', 'Проверка финансистом', 'pending', 'finance-team', '{"priority":"high"}')
        ON CONFLICT (id) DO UPDATE
            SET status = EXCLUDED.status,
                assignee = EXCLUDED.assignee,
                payload = EXCLUDED.payload;
    END IF;

    IF to_regclass('bpm.assignment_rule') IS NOT NULL THEN
        INSERT INTO bpm.assignment_rule (id, process_id, task_code, priority, rule_type, rule_value, conditions)
        VALUES
            ('70000000-0000-0000-0000-000000000301', '70000000-0000-0000-0000-000000000001', 'ONBOARDING_COLLECT', 1, 'role', 'hr-manager', '{"autoAssign":true}'),
            ('70000000-0000-0000-0000-000000000302', '70000000-0000-0000-0000-000000000002', 'SALES_FINANCE', 1, 'team', 'finance-team', '{"slaHours":24}')
        ON CONFLICT (id) DO UPDATE
            SET priority = EXCLUDED.priority,
                rule_type = EXCLUDED.rule_type,
                rule_value = EXCLUDED.rule_value,
                conditions = EXCLUDED.conditions;
    END IF;

    IF to_regclass('bpm.escalation') IS NOT NULL THEN
        INSERT INTO bpm.escalation (id, task_id, threshold_minutes, escalate_to, policy, metadata)
        VALUES
            ('70000000-0000-0000-0000-000000000401', '70000000-0000-0000-0000-000000000201', 240, 'hr-director', 'notify_manager', '{"channel":"email"}'),
            ('70000000-0000-0000-0000-000000000402', '70000000-0000-0000-0000-000000000202', 180, 'sales-director', 'auto_reassign', '{"channel":"slack"}')
        ON CONFLICT (id) DO UPDATE
            SET threshold_minutes = EXCLUDED.threshold_minutes,
                escalate_to = EXCLUDED.escalate_to,
                policy = EXCLUDED.policy,
                metadata = EXCLUDED.metadata;
    END IF;
END;
$$;
