-- +goose Up
-- Seed sample catalog nodes, attribute templates and demo item for WMS dynamic master data.
WITH root AS (
    SELECT id, path FROM wms.catalog_node WHERE catalog_type = 'category' AND code = 'ROOT'
), inserted AS (
    INSERT INTO wms.catalog_node (
        id, catalog_type, parent_id, code, name, description, level, path,
        metadata, sort_order, is_active
    )
    SELECT
        gen_random_uuid(),
        'category',
        root.id,
        data.code,
        data.name,
        data.description,
        1,
        root.path || '.' || data.code,
        data.metadata,
        data.sort_order,
        TRUE
    FROM root,
    (VALUES
        ('SIGNAGE', 'Рекламные конструкции', 'Категория для наружных конструкций', '{"system": false}'::jsonb, 10),
        ('PRINT', 'Печатная продукция', 'Категория для печатных материалов', '{"system": false}'::jsonb, 20)
    ) AS data(code, name, description, metadata, sort_order)
    ON CONFLICT (catalog_type, code) DO NOTHING
    RETURNING id, code
)
SELECT 1;

INSERT INTO wms.attribute_templates (
    id, code, name, description, target_type, data_type, is_required,
    metadata, ui_schema, position
) VALUES
    ('10000000-0000-0000-0000-000000000001', 'color', 'Цвет конструкции', 'Основной цвет изделия', 'item', 'string', FALSE,
        '{"example": "Синий"}'::jsonb, '{"component": "Select", "options": ["Синий", "Красный", "Белый"]}'::jsonb, 10),
    ('10000000-0000-0000-0000-000000000002', 'width_mm', 'Ширина, мм', 'Габаритная ширина', 'item', 'number', TRUE,
        '{"unit": "mm"}'::jsonb, '{"component": "NumberInput", "step": 1}'::jsonb, 20),
    ('10000000-0000-0000-0000-000000000003', 'is_outdoor', 'Уличное размещение', 'Подходит для улицы', 'item', 'boolean', FALSE,
        '{}'::jsonb, '{"component": "Switch"}'::jsonb, 30),
    ('10000000-0000-0000-0000-000000000004', 'notes', 'Примечания', 'Дополнительная информация', 'item', 'json', FALSE,
        '{}'::jsonb, '{"component": "JsonEditor"}'::jsonb, 40)
ON CONFLICT (target_type, code) DO NOTHING;

WITH category AS (
    SELECT id, path FROM wms.catalog_node WHERE catalog_type = 'category' AND code = 'SIGNAGE'
), unit AS (
    SELECT id FROM wms.catalog_node WHERE catalog_type = 'unit' AND code = 'PCS'
), upsert AS (
    INSERT INTO wms.item (
        id, sku, name, description, category_id, category_path, unit_id,
        barcode, weight_kg, volume_m3, metadata
    )
    SELECT
        '20000000-0000-0000-0000-000000000001',
        'DEMO-SIGN-001',
        'Демонстрационная вывеска',
        'Базовая демонстрационная карточка изделия',
        category.id,
        category.path,
        unit.id,
        '4600000000017',
        35.5,
        0.8,
        '{"demo": true}'::jsonb
    FROM category, unit
    ON CONFLICT (sku) DO UPDATE SET
        category_id = excluded.category_id,
        category_path = excluded.category_path,
        unit_id = excluded.unit_id,
        updated_at = NOW()
    RETURNING id
)
INSERT INTO wms.attribute_values (
    owner_type, owner_id, template_id, string_value, number_value, boolean_value, json_value
)
SELECT
    'item',
    upsert.id,
    tpl.template_id,
    tpl.string_value,
    tpl.number_value,
    tpl.boolean_value,
    tpl.json_value
FROM upsert,
(
    VALUES
        ('10000000-0000-0000-0000-000000000001'::uuid, 'Синий', NULL::numeric, NULL::boolean, NULL::jsonb),
        ('10000000-0000-0000-0000-000000000002'::uuid, NULL::text, 2400::numeric, NULL::boolean, NULL::jsonb),
        ('10000000-0000-0000-0000-000000000003'::uuid, NULL::text, NULL::numeric, TRUE, NULL::jsonb),
        ('10000000-0000-0000-0000-000000000004'::uuid, NULL::text, NULL::numeric, NULL::boolean, '{"note": "Образец для тестов"}'::jsonb)
) AS tpl(template_id, string_value, number_value, boolean_value, json_value)
ON CONFLICT (owner_type, owner_id, template_id) DO UPDATE SET
    string_value = excluded.string_value,
    number_value = excluded.number_value,
    boolean_value = excluded.boolean_value,
    json_value = excluded.json_value,
    updated_at = NOW();

-- +goose Down
DELETE FROM wms.attribute_values WHERE owner_id = '20000000-0000-0000-0000-000000000001';
DELETE FROM wms.item WHERE id = '20000000-0000-0000-0000-000000000001';
DELETE FROM wms.attribute_templates WHERE id IN (
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000004'
);
DELETE FROM wms.catalog_node WHERE catalog_type = 'category' AND code IN ('SIGNAGE', 'PRINT');
