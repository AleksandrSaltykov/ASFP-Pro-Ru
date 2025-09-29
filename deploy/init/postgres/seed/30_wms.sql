INSERT INTO wms.warehouse (
    id,
    code,
    name,
    description,
    address,
    timezone,
    status,
    operating_hours,
    contact
)
VALUES (
    uuid_generate_v4(),
    'msk-main',
    'Центральный склад Москва',
    'Основной склад компании',
    '{"city":"Москва","street":"Промышленная, 1"}'::jsonb,
    'Europe/Moscow',
    'active',
    '{"mon-fri":"08:00-20:00","sat":"09:00-15:00"}'::jsonb,
    '{"manager":"Анна Волкова","phone":"+7 (495) 000-11-22"}'::jsonb
)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    address = EXCLUDED.address,
    timezone = EXCLUDED.timezone,
    status = EXCLUDED.status,
    operating_hours = EXCLUDED.operating_hours,
    contact = EXCLUDED.contact,
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
    id,
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
CROSS JOIN (
    VALUES
      ('RECEIVING', 'Зона приемки', 'receiving', TRUE, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT,
       '[]'::jsonb, '{"gates":["A1","A2"]}'::jsonb, '{}'::jsonb),
      ('STORAGE', 'Основной склад', 'storage', FALSE, NULL::NUMERIC, NULL::NUMERIC, NULL::TEXT,
       '[]'::jsonb, '{"rows":5,"levels":4}'::jsonb, '{}'::jsonb)
) AS zone(code, name, zone_type, is_buffer, temperature_min, temperature_max, hazard_class, access_restrictions, layout, metadata)
WHERE w.code = 'msk-main'
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

WITH wh AS (
    SELECT id FROM wms.warehouse WHERE code = 'msk-main'
), zr AS (
    SELECT id FROM wms.warehouse_zone WHERE warehouse_id = (SELECT id FROM wh) AND code = 'RECEIVING'
), zs AS (
    SELECT id FROM wms.warehouse_zone WHERE warehouse_id = (SELECT id FROM wh) AND code = 'STORAGE'
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
    (SELECT id FROM wh),
    cell.zone_id,
    cell.code,
    cell.label,
    cell.address,
    cell.cell_type,
    cell.status,
    cell.is_pick_face,
    cell.length_mm,
    cell.width_mm,
    cell.height_mm,
    cell.max_weight_kg,
    cell.max_volume_l,
    cell.allowed_handling,
    cell.metadata
FROM (
    SELECT (SELECT id FROM zr) AS zone_id,
           'RCV-GATE-01' AS code,
           'Ворота 1' AS label,
           '{"gate":"A1"}'::jsonb AS address,
           'dock' AS cell_type,
           'active' AS status,
           TRUE AS is_pick_face,
           NULL::NUMERIC AS length_mm,
           NULL::NUMERIC AS width_mm,
           NULL::NUMERIC AS height_mm,
           NULL::NUMERIC AS max_weight_kg,
           NULL::NUMERIC AS max_volume_l,
           '[]'::jsonb AS allowed_handling,
           '{}'::jsonb AS metadata
    UNION ALL
    SELECT (SELECT id FROM zs) AS zone_id,
           'ST-ROW-A01' AS code,
           'Стеллаж A01' AS label,
           '{"row":"A","slot":"01"}'::jsonb AS address,
           'shelf' AS cell_type,
           'active' AS status,
           FALSE AS is_pick_face,
           1200::NUMERIC AS length_mm,
           800::NUMERIC AS width_mm,
           2500::NUMERIC AS height_mm,
           500::NUMERIC AS max_weight_kg,
           2.4::NUMERIC AS max_volume_l,
           '{"handling":["manual","forklift"]}'::jsonb AS allowed_handling,
           '{}'::jsonb AS metadata
) AS cell
WHERE cell.zone_id IS NOT NULL
ON CONFLICT (warehouse_id, code) DO UPDATE SET
    zone_id = EXCLUDED.zone_id,
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

INSERT INTO wms.stock (sku, warehouse, quantity, uom)
VALUES ('banner-001', 'msk-main', 120, 'pcs')
ON CONFLICT (sku, warehouse) DO UPDATE SET quantity = EXCLUDED.quantity;
