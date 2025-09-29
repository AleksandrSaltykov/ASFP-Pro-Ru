package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"reflect"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"asfppro/modules/wms/internal/entity"
)

// MasterDataRepository manages warehouses, zones and cells.
type MasterDataRepository struct {
	pool *pgxpool.Pool
}

// NewMasterDataRepository creates repository instance.
func NewMasterDataRepository(pool *pgxpool.Pool) *MasterDataRepository {
	return &MasterDataRepository{pool: pool}
}

// ListWarehouses returns available warehouses.
func (r *MasterDataRepository) ListWarehouses(ctx context.Context) ([]entity.Warehouse, error) {
	query := `
		SELECT id, code, name, description, address, timezone, status, operating_hours, contact,
		       metadata, created_by, updated_by, created_at, updated_at
		FROM wms.warehouse
		ORDER BY name
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list warehouses: %w", err)
	}
	defer rows.Close()

	warehouses := make([]entity.Warehouse, 0)
	for rows.Next() {
		warehouse, err := scanWarehouse(rows)
		if err != nil {
			return nil, err
		}
		warehouses = append(warehouses, warehouse)
	}

	return warehouses, rows.Err()
}

// GetWarehouse returns warehouse by id.
func (r *MasterDataRepository) GetWarehouse(ctx context.Context, id uuid.UUID) (entity.Warehouse, error) {
	query := `
		SELECT id, code, name, description, address, timezone, status, operating_hours, contact,
		       metadata, created_by, updated_by, created_at, updated_at
		FROM wms.warehouse
		WHERE id = $1
	`
	row := r.pool.QueryRow(ctx, query, id)
	warehouse, err := scanWarehouse(row)
	if err != nil {
		if err == pgx.ErrNoRows {
			return entity.Warehouse{}, err
		}
		return entity.Warehouse{}, fmt.Errorf("get warehouse: %w", err)
	}
	return warehouse, nil
}

// CreateWarehouse inserts new warehouse.
func (r *MasterDataRepository) CreateWarehouse(ctx context.Context, warehouse entity.Warehouse) (entity.Warehouse, error) {
	if warehouse.ID == uuid.Nil {
		warehouse.ID = uuid.New()
	}
	address, _ := json.Marshal(warehouse.Address)
	operating := mustJSON(warehouse.OperatingHours)
	contact, _ := json.Marshal(warehouse.Contact)
	metadata := mustJSON(warehouse.Metadata)

	query := `
		INSERT INTO wms.warehouse (
			id, code, name, description, address, timezone, status, operating_hours,
			contact, metadata, created_by, updated_by
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8,
			$9, $10, $11, $12
		)
		RETURNING created_at, updated_at
	`
	row := r.pool.QueryRow(ctx, query,
		warehouse.ID, warehouse.Code, warehouse.Name, warehouse.Description,
		address, warehouse.Timezone, warehouse.Status, operating,
		contact, metadata, nilUUID(warehouse.CreatedBy), nilUUID(warehouse.UpdatedBy),
	)
	if err := row.Scan(&warehouse.CreatedAt, &warehouse.UpdatedAt); err != nil {
		return entity.Warehouse{}, fmt.Errorf("insert warehouse: %w", err)
	}
	return warehouse, nil
}

// UpdateWarehouse updates existing record.
func (r *MasterDataRepository) UpdateWarehouse(ctx context.Context, warehouse entity.Warehouse) (entity.Warehouse, error) {
	address, _ := json.Marshal(warehouse.Address)
	operating := mustJSON(warehouse.OperatingHours)
	contact, _ := json.Marshal(warehouse.Contact)
	metadata := mustJSON(warehouse.Metadata)

	query := `
		UPDATE wms.warehouse
		SET code = $2,
		    name = $3,
		    description = $4,
		    address = $5,
		    timezone = $6,
		    status = $7,
		    operating_hours = $8,
		    contact = $9,
		    metadata = $10,
		    updated_by = $11,
		    updated_at = NOW()
		WHERE id = $1
		RETURNING created_at, updated_at
	`
	row := r.pool.QueryRow(ctx, query,
		warehouse.ID, warehouse.Code, warehouse.Name, warehouse.Description,
		address, warehouse.Timezone, warehouse.Status, operating,
		contact, metadata, nilUUID(warehouse.UpdatedBy),
	)
	if err := row.Scan(&warehouse.CreatedAt, &warehouse.UpdatedAt); err != nil {
		return entity.Warehouse{}, fmt.Errorf("update warehouse: %w", err)
	}
	return warehouse, nil
}

// DeleteWarehouse removes warehouse by id.
func (r *MasterDataRepository) DeleteWarehouse(ctx context.Context, id uuid.UUID) error {
	command := `DELETE FROM wms.warehouse WHERE id = $1`
	if _, err := r.pool.Exec(ctx, command, id); err != nil {
		return fmt.Errorf("delete warehouse: %w", err)
	}
	return nil
}

// CreateZone adds new zone for warehouse.
func (r *MasterDataRepository) CreateZone(ctx context.Context, zone entity.WarehouseZone) (entity.WarehouseZone, error) {
	if zone.ID == uuid.Nil {
		zone.ID = uuid.New()
	}
	access := mustJSON(zone.AccessRestrictions)
	layout := mustJSON(zone.Layout)
	metadata := mustJSON(zone.Metadata)

	query := `
		INSERT INTO wms.warehouse_zone (
			id, warehouse_id, code, name, zone_type, is_buffer,
			temperature_min, temperature_max, hazard_class,
			access_restrictions, layout, metadata, created_by, updated_by
		)
		VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8, $9,
			$10, $11, $12, $13, $14
		)
		RETURNING created_at, updated_at
	`
	row := r.pool.QueryRow(ctx, query,
		zone.ID, zone.WarehouseID, zone.Code, zone.Name, zone.ZoneType, zone.IsBuffer,
		zone.TemperatureMin, zone.TemperatureMax, zone.HazardClass,
		access, layout, metadata, nilUUID(zone.CreatedBy), nilUUID(zone.UpdatedBy),
	)
	if err := row.Scan(&zone.CreatedAt, &zone.UpdatedAt); err != nil {
		return entity.WarehouseZone{}, fmt.Errorf("insert zone: %w", err)
	}
	return zone, nil
}

// UpdateZone updates zone info.
func (r *MasterDataRepository) UpdateZone(ctx context.Context, zone entity.WarehouseZone) (entity.WarehouseZone, error) {
	access := mustJSON(zone.AccessRestrictions)
	layout := mustJSON(zone.Layout)
	metadata := mustJSON(zone.Metadata)

	query := `
		UPDATE wms.warehouse_zone
		SET code = $2,
		    name = $3,
		    zone_type = $4,
		    is_buffer = $5,
		    temperature_min = $6,
		    temperature_max = $7,
		    hazard_class = $8,
		    access_restrictions = $9,
		    layout = $10,
		    metadata = $11,
		    updated_by = $12,
		    updated_at = NOW()
		WHERE id = $1 AND warehouse_id = $13
		RETURNING created_at, updated_at
	`
	row := r.pool.QueryRow(ctx, query,
		zone.ID, zone.Code, zone.Name, zone.ZoneType, zone.IsBuffer,
		zone.TemperatureMin, zone.TemperatureMax, zone.HazardClass,
		access, layout, metadata, nilUUID(zone.UpdatedBy), zone.WarehouseID,
	)
	if err := row.Scan(&zone.CreatedAt, &zone.UpdatedAt); err != nil {
		return entity.WarehouseZone{}, fmt.Errorf("update zone: %w", err)
	}
	return zone, nil
}

// DeleteZone removes zone.
func (r *MasterDataRepository) DeleteZone(ctx context.Context, warehouseID, zoneID uuid.UUID) error {
	command := `DELETE FROM wms.warehouse_zone WHERE id = $1 AND warehouse_id = $2`
	if _, err := r.pool.Exec(ctx, command, zoneID, warehouseID); err != nil {
		return fmt.Errorf("delete zone: %w", err)
	}
	return nil
}

// ListZones returns zones for warehouse.
func (r *MasterDataRepository) ListZones(ctx context.Context, warehouseID uuid.UUID) ([]entity.WarehouseZone, error) {
	query := `
		SELECT id, warehouse_id, code, name, zone_type, is_buffer,
		       temperature_min, temperature_max, hazard_class,
		       access_restrictions, layout, metadata,
		       created_by, updated_by, created_at, updated_at
		FROM wms.warehouse_zone
		WHERE warehouse_id = $1
		ORDER BY name
	`
	rows, err := r.pool.Query(ctx, query, warehouseID)
	if err != nil {
		return nil, fmt.Errorf("list zones: %w", err)
	}
	defer rows.Close()

	zones := make([]entity.WarehouseZone, 0)
	for rows.Next() {
		zone, err := scanZone(rows)
		if err != nil {
			return nil, err
		}
		zones = append(zones, zone)
	}
	return zones, rows.Err()
}

// GetZone obtains zone by id.
func (r *MasterDataRepository) GetZone(ctx context.Context, zoneID uuid.UUID) (entity.WarehouseZone, error) {
	query := `
		SELECT id, warehouse_id, code, name, zone_type, is_buffer,
		       temperature_min, temperature_max, hazard_class,
		       access_restrictions, layout, metadata,
		       created_by, updated_by, created_at, updated_at
		FROM wms.warehouse_zone
		WHERE id = $1
	`
	row := r.pool.QueryRow(ctx, query, zoneID)
	zone, err := scanZone(row)
	if err != nil {
		return entity.WarehouseZone{}, err
	}
	return zone, nil
}

// CreateCell stores new storage cell.
func (r *MasterDataRepository) CreateCell(ctx context.Context, cell entity.WarehouseCell) (entity.WarehouseCell, error) {
	if cell.ID == uuid.Nil {
		cell.ID = uuid.New()
	}
	address := mustJSON(cell.Address)
	allowed := mustJSON(cell.AllowedHandling)
	metadata := mustJSON(cell.Metadata)

	query := `
		INSERT INTO wms.warehouse_cell (
			id, warehouse_id, zone_id, code, label, address,
			cell_type, status, is_pick_face, length_mm, width_mm, height_mm,
			max_weight_kg, max_volume_l, allowed_handling, temperature_min, temperature_max,
			hazard_classes, metadata, created_by, updated_by
		) VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8, $9, $10, $11, $12,
			$13, $14, $15, $16, $17,
			$18, $19, $20, $21
		)
		RETURNING created_at, updated_at
	`
	row := r.pool.QueryRow(ctx, query,
		cell.ID, cell.WarehouseID, cell.ZoneID, cell.Code, cell.Label, address,
		cell.CellType, cell.Status, cell.IsPickFace, cell.LengthMM, cell.WidthMM, cell.HeightMM,
		cell.MaxWeightKG, cell.MaxVolumeL, allowed, cell.TemperatureMin, cell.TemperatureMax,
		cell.HazardClasses, metadata, nilUUID(cell.CreatedBy), nilUUID(cell.UpdatedBy),
	)
	if err := row.Scan(&cell.CreatedAt, &cell.UpdatedAt); err != nil {
		return entity.WarehouseCell{}, fmt.Errorf("insert cell: %w", err)
	}
	return cell, nil
}

// UpdateCell updates cell attributes.
func (r *MasterDataRepository) UpdateCell(ctx context.Context, cell entity.WarehouseCell) (entity.WarehouseCell, error) {
	address := mustJSON(cell.Address)
	allowed := mustJSON(cell.AllowedHandling)
	metadata := mustJSON(cell.Metadata)

	query := `
		UPDATE wms.warehouse_cell
		SET code = $2,
		    label = $3,
		    address = $4,
		    cell_type = $5,
		    status = $6,
		    is_pick_face = $7,
		    length_mm = $8,
		    width_mm = $9,
		    height_mm = $10,
		    max_weight_kg = $11,
		    max_volume_l = $12,
		    allowed_handling = $13,
		    temperature_min = $14,
		    temperature_max = $15,
		    hazard_classes = $16,
		    metadata = $17,
		    updated_by = $18,
		    updated_at = NOW()
		WHERE id = $1 AND warehouse_id = $19 AND zone_id = $20
		RETURNING created_at, updated_at
	`
	row := r.pool.QueryRow(ctx, query,
		cell.ID, cell.Code, cell.Label, address, cell.CellType, cell.Status, cell.IsPickFace,
		cell.LengthMM, cell.WidthMM, cell.HeightMM, cell.MaxWeightKG, cell.MaxVolumeL,
		allowed, cell.TemperatureMin, cell.TemperatureMax, cell.HazardClasses,
		metadata, nilUUID(cell.UpdatedBy), cell.WarehouseID, cell.ZoneID,
	)
	if err := row.Scan(&cell.CreatedAt, &cell.UpdatedAt); err != nil {
		return entity.WarehouseCell{}, fmt.Errorf("update cell: %w", err)
	}
	return cell, nil
}

// DeleteCell deletes cell.
func (r *MasterDataRepository) DeleteCell(ctx context.Context, warehouseID, zoneID, cellID uuid.UUID) error {
	command := `DELETE FROM wms.warehouse_cell WHERE id = $1 AND warehouse_id = $2 AND zone_id = $3`
	if _, err := r.pool.Exec(ctx, command, cellID, warehouseID, zoneID); err != nil {
		return fmt.Errorf("delete cell: %w", err)
	}
	return nil
}

// ListCells returns cells for zone.
func (r *MasterDataRepository) ListCells(ctx context.Context, warehouseID, zoneID uuid.UUID) ([]entity.WarehouseCell, error) {
	query := `
		SELECT id, warehouse_id, zone_id, code, label, address, cell_type,
		       status, is_pick_face, length_mm, width_mm, height_mm,
		       max_weight_kg, max_volume_l, allowed_handling,
		       temperature_min, temperature_max, hazard_classes, metadata,
		       created_by, updated_by, created_at, updated_at
		FROM wms.warehouse_cell
		WHERE warehouse_id = $1 AND zone_id = $2
		ORDER BY code
	`
	rows, err := r.pool.Query(ctx, query, warehouseID, zoneID)
	if err != nil {
		return nil, fmt.Errorf("list cells: %w", err)
	}
	defer rows.Close()

	cells := make([]entity.WarehouseCell, 0)
	for rows.Next() {
		cell, err := scanCell(rows)
		if err != nil {
			return nil, err
		}
		cells = append(cells, cell)
	}
	return cells, rows.Err()
}

// GetCell returns cell by id.
func (r *MasterDataRepository) GetCell(ctx context.Context, cellID uuid.UUID) (entity.WarehouseCell, error) {
	query := `
		SELECT id, warehouse_id, zone_id, code, label, address, cell_type,
		       status, is_pick_face, length_mm, width_mm, height_mm,
		       max_weight_kg, max_volume_l, allowed_handling,
		       temperature_min, temperature_max, hazard_classes, metadata,
		       created_by, updated_by, created_at, updated_at
		FROM wms.warehouse_cell
		WHERE id = $1
	`
	row := r.pool.QueryRow(ctx, query, cellID)
	cell, err := scanCell(row)
	if err != nil {
		return entity.WarehouseCell{}, err
	}
	return cell, nil
}

// CreateEquipment adds new equipment.
func (r *MasterDataRepository) CreateEquipment(ctx context.Context, eq entity.WarehouseEquipment) (entity.WarehouseEquipment, error) {
	if eq.ID == uuid.Nil {
		eq.ID = uuid.New()
	}
	metadata := mustJSON(eq.Metadata)
	query := `
		INSERT INTO wms.equipment (
			id, warehouse_id, code, name, equipment_type, status,
			manufacturer, serial_number, commissioning_date,
			metadata, created_by, updated_by
		) VALUES (
			$1, $2, $3, $4, $5, $6,
			$7, $8, $9,
			$10, $11, $12
		)
		RETURNING created_at, updated_at
	`
	row := r.pool.QueryRow(ctx, query,
		eq.ID, eq.WarehouseID, eq.Code, eq.Name, eq.EquipmentType, eq.Status,
		eq.Manufacturer, eq.SerialNumber, eq.Commissioning,
		metadata, nilUUID(eq.CreatedBy), nilUUID(eq.UpdatedBy),
	)
	if err := row.Scan(&eq.CreatedAt, &eq.UpdatedAt); err != nil {
		return entity.WarehouseEquipment{}, fmt.Errorf("insert equipment: %w", err)
	}
	return eq, nil
}

// UpdateEquipment updates equipment properties.
func (r *MasterDataRepository) UpdateEquipment(ctx context.Context, eq entity.WarehouseEquipment) (entity.WarehouseEquipment, error) {
	metadata := mustJSON(eq.Metadata)
	query := `
		UPDATE wms.equipment
		SET code = $2,
		    name = $3,
		    equipment_type = $4,
		    status = $5,
		    manufacturer = $6,
		    serial_number = $7,
		    commissioning_date = $8,
		    metadata = $9,
		    updated_by = $10,
		    updated_at = NOW()
		WHERE id = $1 AND warehouse_id = $11
		RETURNING created_at, updated_at
	`
	row := r.pool.QueryRow(ctx, query,
		eq.ID, eq.Code, eq.Name, eq.EquipmentType, eq.Status,
		eq.Manufacturer, eq.SerialNumber, eq.Commissioning,
		metadata, nilUUID(eq.UpdatedBy), eq.WarehouseID,
	)
	if err := row.Scan(&eq.CreatedAt, &eq.UpdatedAt); err != nil {
		return entity.WarehouseEquipment{}, fmt.Errorf("update equipment: %w", err)
	}
	return eq, nil
}

// DeleteEquipment removes equipment.
func (r *MasterDataRepository) DeleteEquipment(ctx context.Context, warehouseID, equipmentID uuid.UUID) error {
	command := `DELETE FROM wms.equipment WHERE id = $1 AND warehouse_id = $2`
	if _, err := r.pool.Exec(ctx, command, equipmentID, warehouseID); err != nil {
		return fmt.Errorf("delete equipment: %w", err)
	}
	return nil
}

// ListEquipment returns equipment of warehouse.
func (r *MasterDataRepository) ListEquipment(ctx context.Context, warehouseID uuid.UUID) ([]entity.WarehouseEquipment, error) {
	query := `
		SELECT id, warehouse_id, code, name, equipment_type, status,
		       manufacturer, serial_number, commissioning_date,
		       metadata, created_by, updated_by, created_at, updated_at
		FROM wms.equipment
		WHERE warehouse_id = $1
		ORDER BY name
	`
	rows, err := r.pool.Query(ctx, query, warehouseID)
	if err != nil {
		return nil, fmt.Errorf("list equipment: %w", err)
	}
	defer rows.Close()

	equipment := make([]entity.WarehouseEquipment, 0)
	for rows.Next() {
		eq, err := scanEquipment(rows)
		if err != nil {
			return nil, err
		}
		equipment = append(equipment, eq)
	}
	return equipment, rows.Err()
}

// AssignEquipment attaches equipment to cell.
func (r *MasterDataRepository) AssignEquipment(ctx context.Context, assignment entity.CellEquipmentAssignment) error {
	query := `
		INSERT INTO wms.warehouse_cell_equipment (cell_id, equipment_id, assigned_at, assigned_by)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (cell_id, equipment_id)
		DO UPDATE SET assigned_at = EXCLUDED.assigned_at, assigned_by = EXCLUDED.assigned_by
	`
	if _, err := r.pool.Exec(ctx, query, assignment.CellID, assignment.EquipmentID, assignment.AssignedAt, nilUUID(assignment.AssignedBy)); err != nil {
		return fmt.Errorf("assign equipment: %w", err)
	}
	return nil
}

// UnassignEquipment detaches equipment from cell.
func (r *MasterDataRepository) UnassignEquipment(ctx context.Context, cellID, equipmentID uuid.UUID) error {
	command := `DELETE FROM wms.warehouse_cell_equipment WHERE cell_id = $1 AND equipment_id = $2`
	if _, err := r.pool.Exec(ctx, command, cellID, equipmentID); err != nil {
		return fmt.Errorf("unassign equipment: %w", err)
	}
	return nil
}

// ListCellHistory returns history entries for cell.
func (r *MasterDataRepository) ListCellHistory(ctx context.Context, cellID uuid.UUID, limit int) ([]entity.WarehouseCellHistory, error) {
	query := `
		SELECT id, cell_id, changed_at, changed_by, change_type, payload
		FROM wms.warehouse_cell_history
		WHERE cell_id = $1
		ORDER BY changed_at DESC
		LIMIT $2
	`
	rows, err := r.pool.Query(ctx, query, cellID, limit)
	if err != nil {
		return nil, fmt.Errorf("list cell history: %w", err)
	}
	defer rows.Close()

	history := make([]entity.WarehouseCellHistory, 0)
	for rows.Next() {
		var payload []byte
		var record entity.WarehouseCellHistory
		if err := rows.Scan(&record.ID, &record.CellID, &record.ChangedAt, &record.ChangedBy, &record.ChangeType, &payload); err != nil {
			return nil, err
		}
		if len(payload) > 0 {
			record.Payload = payload
		}
		history = append(history, record)
	}
	return history, rows.Err()
}

// AddCellHistory inserts audit entry.
func (r *MasterDataRepository) AddCellHistory(ctx context.Context, record entity.WarehouseCellHistory) error {
	query := `
		INSERT INTO wms.warehouse_cell_history (cell_id, changed_at, changed_by, change_type, payload)
		VALUES ($1, $2, $3, $4, $5)
	`
	_, err := r.pool.Exec(ctx, query, record.CellID, record.ChangedAt, nilUUID(record.ChangedBy), record.ChangeType, record.Payload)
	if err != nil {
		return fmt.Errorf("insert cell history: %w", err)
	}
	return nil
}

func scanWarehouse(row pgx.Row) (entity.Warehouse, error) {
	var (
		warehouse                                                 entity.Warehouse
		description                                               sql.NullString
		addressBytes, operatingBytes, contactBytes, metadataBytes []byte
	)
	if err := row.Scan(
		&warehouse.ID,
		&warehouse.Code,
		&warehouse.Name,
		&description,
		&addressBytes,
		&warehouse.Timezone,
		&warehouse.Status,
		&operatingBytes,
		&contactBytes,
		&metadataBytes,
		&warehouse.CreatedBy,
		&warehouse.UpdatedBy,
		&warehouse.CreatedAt,
		&warehouse.UpdatedAt,
	); err != nil {
		return entity.Warehouse{}, err
	}
	if description.Valid {
		warehouse.Description = description.String
	}
	if len(addressBytes) > 0 {
		_ = json.Unmarshal(addressBytes, &warehouse.Address)
	}
	if len(operatingBytes) > 0 {
		_ = json.Unmarshal(operatingBytes, &warehouse.OperatingHours)
	}
	if len(contactBytes) > 0 {
		_ = json.Unmarshal(contactBytes, &warehouse.Contact)
	}
	warehouse.Metadata = mustMap(metadataBytes)
	return warehouse, nil
}

func scanZone(row pgx.Row) (entity.WarehouseZone, error) {
	var (
		zone                                    entity.WarehouseZone
		hazardClass                             sql.NullString
		accessBytes, layoutBytes, metadataBytes []byte
	)
	if err := row.Scan(
		&zone.ID,
		&zone.WarehouseID,
		&zone.Code,
		&zone.Name,
		&zone.ZoneType,
		&zone.IsBuffer,
		&zone.TemperatureMin,
		&zone.TemperatureMax,
		&hazardClass,
		&accessBytes,
		&layoutBytes,
		&metadataBytes,
		&zone.CreatedBy,
		&zone.UpdatedBy,
		&zone.CreatedAt,
		&zone.UpdatedAt,
	); err != nil {
		return entity.WarehouseZone{}, err
	}
	if hazardClass.Valid {
		zone.HazardClass = hazardClass.String
	}
	zone.AccessRestrictions = mustStringSlice(accessBytes)
	zone.Layout = mustMap(layoutBytes)
	zone.Metadata = mustMap(metadataBytes)
	return zone, nil
}

func scanCell(row pgx.Row) (entity.WarehouseCell, error) {
	var (
		cell                                      entity.WarehouseCell
		label                                     sql.NullString
		addressBytes, allowedBytes, metadataBytes []byte
	)
	if err := row.Scan(
		&cell.ID,
		&cell.WarehouseID,
		&cell.ZoneID,
		&cell.Code,
		&label,
		&addressBytes,
		&cell.CellType,
		&cell.Status,
		&cell.IsPickFace,
		&cell.LengthMM,
		&cell.WidthMM,
		&cell.HeightMM,
		&cell.MaxWeightKG,
		&cell.MaxVolumeL,
		&allowedBytes,
		&cell.TemperatureMin,
		&cell.TemperatureMax,
		&cell.HazardClasses,
		&metadataBytes,
		&cell.CreatedBy,
		&cell.UpdatedBy,
		&cell.CreatedAt,
		&cell.UpdatedAt,
	); err != nil {
		return entity.WarehouseCell{}, err
	}
	if label.Valid {
		cell.Label = label.String
	}
	cell.Address = mustMap(addressBytes)
	cell.AllowedHandling = mustStringSlice(allowedBytes)
	cell.Metadata = mustMap(metadataBytes)
	return cell, nil
}

func scanEquipment(row pgx.Row) (entity.WarehouseEquipment, error) {
	var (
		eq            entity.WarehouseEquipment
		manufacturer  sql.NullString
		serialNumber  sql.NullString
		metadataBytes []byte
	)
	if err := row.Scan(
		&eq.ID,
		&eq.WarehouseID,
		&eq.Code,
		&eq.Name,
		&eq.EquipmentType,
		&eq.Status,
		&manufacturer,
		&serialNumber,
		&eq.Commissioning,
		&metadataBytes,
		&eq.CreatedBy,
		&eq.UpdatedBy,
		&eq.CreatedAt,
		&eq.UpdatedAt,
	); err != nil {
		return entity.WarehouseEquipment{}, err
	}
	if manufacturer.Valid {
		eq.Manufacturer = manufacturer.String
	}
	if serialNumber.Valid {
		eq.SerialNumber = serialNumber.String
	}
	eq.Metadata = mustMap(metadataBytes)
	return eq, nil
}

func mustJSON(v any) []byte {
	if v == nil {
		return []byte("{}")
	}
	val := reflect.ValueOf(v)
	switch val.Kind() {
	case reflect.Slice, reflect.Array:
		if val.IsNil() || val.Len() == 0 {
			return []byte("[]")
		}
	case reflect.Map:
		if val.IsNil() || val.Len() == 0 {
			return []byte("{}")
		}
	}
	bytes, err := json.Marshal(v)
	if err != nil {
		if val.Kind() == reflect.Slice || val.Kind() == reflect.Array {
			return []byte("[]")
		}
		return []byte("{}")
	}
	if string(bytes) == "null" {
		if val.Kind() == reflect.Slice || val.Kind() == reflect.Array {
			return []byte("[]")
		}
		return []byte("{}")
	}
	return bytes
}

func mustMap(bytes []byte) map[string]any {
	if len(bytes) == 0 {
		return map[string]any{}
	}
	var m map[string]any
	if err := json.Unmarshal(bytes, &m); err != nil {
		return map[string]any{}
	}
	return m
}

func mustStringSlice(bytes []byte) []string {
	if len(bytes) == 0 {
		return []string{}
	}
	var arr []string
	if err := json.Unmarshal(bytes, &arr); err != nil {
		return []string{}
	}
	return arr
}

func nilUUID(id uuid.UUID) *uuid.UUID {
	if id == uuid.Nil {
		return nil
	}
	return &id
}
