INSERT INTO wms.warehouse (
    id,
    code,
    name,
    description,
    address,
    timezone,
    status,
    operating_hours,
    contact,
    org_unit_code
)
SELECT
    uuid_generate_v4(),
    data.code,
    data.name,
    data.description,
    data.address,
    data.timezone,
    data.status,
    data.operating_hours,
    data.contact,
    data.org_unit
FROM (
    VALUES
        (
            'msk-main',
            '����ࠫ�� ᪫�� ��᪢�',
            '�᭮���� ᪫�� ��������',
            '{"city":"��᪢�","street":"�஬�諥����, 1"}'::jsonb,
            'Europe/Moscow',
            'active',
            '{"mon-fri":"08:00-20:00","sat":"09:00-15:00"}'::jsonb,
            '{"manager":"���� �������","phone":"+7 (495) 000-11-22"}'::jsonb,
            'HQ-WMS'
        ),
        (
            'spb-hub',
            '����ꥬ��ୠ� ����',
            '�᭮���� ����� ���� ��� ���뢠��',
            '{"city":"������","street":"��������, 45"}'::jsonb,
            'Europe/Moscow',
            'active',
            '{"mon-fri":"09:00-21:00"}'::jsonb,
            '{"manager":"������� ����","phone":"+7 (812) 000-33-44"}'::jsonb,
            'HQ-WMS'
        )
) AS data(code, name, description, address, timezone, status, operating_hours, contact, org_unit)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    address = EXCLUDED.address,
    timezone = EXCLUDED.timezone,
    status = EXCLUDED.status,
    operating_hours = EXCLUDED.operating_hours,
    contact = EXCLUDED.contact,
    org_unit_code = EXCLUDED.org_unit_code,
    updated_at = NOW();

INSERT INTO wms.warehouse_zone (
    id,
    warehouse_id,
    code,
    name,
    zone_type,
    is_buffer,
    temperature_min,
    temperature_max,
    hazard_class,
    access_restrictions,
    layout,
    metadata
)
SELECT
    uuid_generate_v4(),
    w.id,
    zone.code,
    zone.name,
    zone.zone_type,
    zone.is_buffer,
    zone.temperature_min,
    zone.temperature_max,
    zone.hazard_class,
    zone.access_restrictions,
    zone.layout,
    zone.metadata
FROM wms.warehouse w
JOIN (
    VALUES
      ('RECEIVING', '���� �ਥ���', 'receiving', TRUE, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT,
       '[]'::jsonb, '{"gates":["A1","A2"]}'::jsonb, '{}'::jsonb),
      ('STORAGE', '�᭮���� ᪫��', 'storage', FALSE, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT,
       '[]'::jsonb, '{"rows":5,"levels":4}'::jsonb, '{}'::jsonb)
) AS zone(code, name, zone_type, is_buffer, temperature_min, temperature_max, hazard_class, access_restrictions, layout, metadata)
WHERE w.code IN ('msk-main', 'spb-hub')
ON CONFLICT (warehouse_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    zone_type = EXCLUDED.zone_type,
    is_buffer = EXCLUDED.is_buffer,
    temperature_min = EXCLUDED.temperature_min,
    temperature_max = EXCLUDED.temperature_max,
    hazard_class = EXCLUDED.hazard_class,
    access_restrictions = EXCLUDED.access_restrictions,
    layout = EXCLUDED.layout,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

WITH zones AS (
    SELECT wz.id, wz.code, wz.warehouse_id, w.code AS warehouse_code
    FROM wms.warehouse_zone wz
    JOIN wms.warehouse w ON w.id = wz.warehouse_id
    WHERE w.code IN ('msk-main', 'spb-hub')
      AND wz.code IN ('RECEIVING', 'STORAGE')
)
INSERT INTO wms.warehouse_cell (
    id,
    warehouse_id,
    zone_id,
    code,
    label,
    address,
    cell_type,
    status,
    is_pick_face,
    length_mm,
    width_mm,
    height_mm,
    max_weight_kg,
    max_volume_l,
    allowed_handling,
    metadata
)
SELECT
    uuid_generate_v4(),
    z.warehouse_id,
    z.id,
    CASE
        WHEN z.code = 'RECEIVING' THEN 'RCV-GATE-01-' || upper(replace(z.warehouse_code, '-', ''))
        ELSE 'ST-ROW-A01-' || upper(replace(z.warehouse_code, '-', ''))
    END,
    CASE
        WHEN z.code = 'RECEIVING' THEN '���� 1 ' || upper(replace(z.warehouse_code, '-', ''))
        ELSE '�⥫��� A01 ' || upper(replace(z.warehouse_code, '-', ''))
    END,
    CASE
        WHEN z.code = 'RECEIVING' THEN '{"gate":"A1"}'::jsonb
        ELSE '{"row":"A","slot":"01"}'::jsonb
    END,
    CASE
        WHEN z.code = 'RECEIVING' THEN 'dock'
        ELSE 'shelf'
    END,
    'active',
    CASE WHEN z.code = 'RECEIVING' THEN TRUE ELSE FALSE END,
    CASE WHEN z.code = 'RECEIVING' THEN NULL ELSE 1200::NUMERIC END,
    CASE WHEN z.code = 'RECEIVING' THEN NULL ELSE 800::NUMERIC END,
    CASE WHEN z.code = 'RECEIVING' THEN NULL ELSE 2500::NUMERIC END,
    CASE WHEN z.code = 'RECEIVING' THEN NULL ELSE 500::NUMERIC END,
    CASE WHEN z.code = 'RECEIVING' THEN NULL ELSE 2.4::NUMERIC END,
    CASE
        WHEN z.code = 'RECEIVING' THEN '[]'::jsonb
        ELSE '{"handling":["manual","forklift"]}'::jsonb
    END,
    '{}'::jsonb
FROM zones z
ON CONFLICT (warehouse_id, code) DO UPDATE SET
    label = EXCLUDED.label,
    address = EXCLUDED.address,
    status = EXCLUDED.status,
    length_mm = EXCLUDED.length_mm,
    width_mm = EXCLUDED.width_mm,
    height_mm = EXCLUDED.height_mm,
    max_weight_kg = EXCLUDED.max_weight_kg,
    max_volume_l = EXCLUDED.max_volume_l,
    allowed_handling = EXCLUDED.allowed_handling,
    metadata = EXCLUDED.metadata,
    updated_at = NOW();

WITH items AS (
    SELECT id, sku, unit_id FROM wms.item WHERE sku = 'DEMO-SIGN-001'
), warehouses AS (
    SELECT id, code FROM wms.warehouse WHERE code IN ('msk-main', 'spb-hub')
)
INSERT INTO wms.item_warehouse (item_id, warehouse_id, status, min_stock, max_stock)
SELECT
    items.id,
    warehouses.id,
    'active',
    CASE WHEN warehouses.code = 'msk-main' THEN 60 ELSE 30 END,
    CASE WHEN warehouses.code = 'msk-main' THEN 160 ELSE 90 END
FROM items CROSS JOIN warehouses
ON CONFLICT (item_id, warehouse_id) DO UPDATE SET
    min_stock = EXCLUDED.min_stock,
    max_stock = EXCLUDED.max_stock,
    status = EXCLUDED.status;

INSERT INTO wms.stock (sku, warehouse, quantity, uom, updated_at)
VALUES
    ('DEMO-SIGN-001', 'msk-main', 96, 'pcs', NOW() - INTERVAL '2 hours'),
    ('DEMO-SIGN-001', 'spb-hub', 48, 'pcs', NOW() - INTERVAL '1 hour')
ON CONFLICT (sku, warehouse) DO UPDATE SET
    quantity = EXCLUDED.quantity,
    updated_at = EXCLUDED.updated_at;
