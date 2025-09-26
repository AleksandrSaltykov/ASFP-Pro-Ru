package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/rs/zerolog"

	"asfppro/modules/wms/internal/entity"
	"asfppro/modules/wms/internal/repository"
)

var (
	errWarehouseNotFound = errors.New("warehouse not found")
	errZoneNotFound      = errors.New("zone not found")
	errCellNotFound      = errors.New("cell not found")
)

// MasterDataService contains business logic for warehouses/zones/cells.
type MasterDataService struct {
	repo   *repository.MasterDataRepository
	logger zerolog.Logger
}

// NewMasterDataService builds service.
func NewMasterDataService(repo *repository.MasterDataRepository, logger zerolog.Logger) *MasterDataService {
	return &MasterDataService{repo: repo, logger: logger}
}

// ListWarehouses returns all warehouses.
func (s *MasterDataService) ListWarehouses(ctx context.Context) ([]entity.Warehouse, error) {
	return s.repo.ListWarehouses(ctx)
}

// GetWarehouseDetails returns warehouse with zones/cells/equipment.
func (s *MasterDataService) GetWarehouseDetails(ctx context.Context, id uuid.UUID) (entity.WarehouseDetails, error) {
	warehouse, err := s.repo.GetWarehouse(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.WarehouseDetails{}, errWarehouseNotFound
		}
		return entity.WarehouseDetails{}, err
	}

	zones, err := s.repo.ListZones(ctx, id)
	if err != nil {
		return entity.WarehouseDetails{}, err
	}

	cells := make([]entity.WarehouseCell, 0)
	for _, zone := range zones {
		zoneCells, err := s.repo.ListCells(ctx, id, zone.ID)
		if err != nil {
			return entity.WarehouseDetails{}, err
		}
		cells = append(cells, zoneCells...)
	}

	equipment, err := s.repo.ListEquipment(ctx, id)
	if err != nil {
		return entity.WarehouseDetails{}, err
	}

	return entity.WarehouseDetails{
		Warehouse: warehouse,
		Zones:     zones,
		Cells:     cells,
		Equipment: equipment,
	}, nil
}

// CreateWarehouse validates and creates warehouse.
func (s *MasterDataService) CreateWarehouse(ctx context.Context, payload entity.Warehouse) (entity.Warehouse, error) {
	payload.Code = strings.TrimSpace(payload.Code)
	payload.Name = strings.TrimSpace(payload.Name)
	if payload.Code == "" {
		return entity.Warehouse{}, fmt.Errorf("code is required")
	}
	if payload.Name == "" {
		return entity.Warehouse{}, fmt.Errorf("name is required")
	}
	if payload.Timezone == "" {
		payload.Timezone = "UTC"
	}
	if payload.Status == "" {
		payload.Status = "active"
	}

	if payload.Metadata == nil {
		payload.Metadata = map[string]any{}
	}

	warehouse, err := s.repo.CreateWarehouse(ctx, payload)
	if err != nil {
		return entity.Warehouse{}, err
	}
	return warehouse, nil
}

// UpdateWarehouse updates existing warehouse.
func (s *MasterDataService) UpdateWarehouse(ctx context.Context, id uuid.UUID, payload entity.Warehouse) (entity.Warehouse, error) {
	payload.ID = id
	payload.Code = strings.TrimSpace(payload.Code)
	payload.Name = strings.TrimSpace(payload.Name)
	if payload.Code == "" || payload.Name == "" {
		return entity.Warehouse{}, fmt.Errorf("code and name are required")
	}
	if payload.Metadata == nil {
		payload.Metadata = map[string]any{}
	}

	warehouse, err := s.repo.UpdateWarehouse(ctx, payload)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.Warehouse{}, errWarehouseNotFound
		}
		return entity.Warehouse{}, err
	}
	return warehouse, nil
}

// DeleteWarehouse removes warehouse.
func (s *MasterDataService) DeleteWarehouse(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteWarehouse(ctx, id)
}

// CreateZone creates new zone.
func (s *MasterDataService) CreateZone(ctx context.Context, warehouseID uuid.UUID, payload entity.WarehouseZone) (entity.WarehouseZone, error) {
	payload.WarehouseID = warehouseID
	payload.Code = strings.TrimSpace(payload.Code)
	payload.Name = strings.TrimSpace(payload.Name)
	payload.ZoneType = strings.TrimSpace(payload.ZoneType)

	if payload.Code == "" || payload.Name == "" || payload.ZoneType == "" {
		return entity.WarehouseZone{}, fmt.Errorf("code, name and zoneType are required")
	}
	if payload.Metadata == nil {
		payload.Metadata = map[string]any{}
	}

	zone, err := s.repo.CreateZone(ctx, payload)
	if err != nil {
		return entity.WarehouseZone{}, err
	}
	return zone, nil
}

// UpdateZone updates zone info.
func (s *MasterDataService) UpdateZone(ctx context.Context, warehouseID, zoneID uuid.UUID, payload entity.WarehouseZone) (entity.WarehouseZone, error) {
	payload.ID = zoneID
	payload.WarehouseID = warehouseID
	payload.Code = strings.TrimSpace(payload.Code)
	payload.Name = strings.TrimSpace(payload.Name)
	payload.ZoneType = strings.TrimSpace(payload.ZoneType)

	if payload.Code == "" || payload.Name == "" || payload.ZoneType == "" {
		return entity.WarehouseZone{}, fmt.Errorf("code, name and zoneType are required")
	}
	if payload.Metadata == nil {
		payload.Metadata = map[string]any{}
	}

	zone, err := s.repo.UpdateZone(ctx, payload)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.WarehouseZone{}, errZoneNotFound
		}
		return entity.WarehouseZone{}, err
	}
	return zone, nil
}

// DeleteZone removes zone.
func (s *MasterDataService) DeleteZone(ctx context.Context, warehouseID, zoneID uuid.UUID) error {
	return s.repo.DeleteZone(ctx, warehouseID, zoneID)
}

// ListZones returns zones for warehouse.
func (s *MasterDataService) ListZones(ctx context.Context, warehouseID uuid.UUID) ([]entity.WarehouseZone, error) {
	return s.repo.ListZones(ctx, warehouseID)
}

// CreateCell creates new cell.
func (s *MasterDataService) CreateCell(ctx context.Context, warehouseID, zoneID uuid.UUID, payload entity.WarehouseCell) (entity.WarehouseCell, error) {
	payload.WarehouseID = warehouseID
	payload.ZoneID = zoneID
	payload.Code = normalizeCellCode(payload.Code)
	if payload.Code == "" {
		return entity.WarehouseCell{}, fmt.Errorf("code is required")
	}
	if payload.CellType == "" {
		return entity.WarehouseCell{}, fmt.Errorf("cellType is required")
	}
	if payload.Status == "" {
		payload.Status = "active"
	}
	if payload.Address == nil {
		payload.Address = map[string]any{}
	}
	if payload.Metadata == nil {
		payload.Metadata = map[string]any{}
	}

	cell, err := s.repo.CreateCell(ctx, payload)
	if err != nil {
		return entity.WarehouseCell{}, err
	}

	s.logCellHistory(ctx, cell.ID, payload.CreatedBy, "create", payload)
	return cell, nil
}

// UpdateCell updates cell data.
func (s *MasterDataService) UpdateCell(ctx context.Context, warehouseID, zoneID, cellID uuid.UUID, payload entity.WarehouseCell) (entity.WarehouseCell, error) {
	payload.ID = cellID
	payload.WarehouseID = warehouseID
	payload.ZoneID = zoneID
	payload.Code = normalizeCellCode(payload.Code)
	if payload.Code == "" {
		return entity.WarehouseCell{}, fmt.Errorf("code is required")
	}
	if payload.CellType == "" {
		return entity.WarehouseCell{}, fmt.Errorf("cellType is required")
	}
	if payload.Address == nil {
		payload.Address = map[string]any{}
	}
	if payload.Metadata == nil {
		payload.Metadata = map[string]any{}
	}

	before, err := s.repo.GetCell(ctx, cellID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.WarehouseCell{}, errCellNotFound
		}
		return entity.WarehouseCell{}, err
	}

	cell, err := s.repo.UpdateCell(ctx, payload)
	if err != nil {
		return entity.WarehouseCell{}, err
	}

	diffPayload, _ := json.Marshal(map[string]any{
		"before": before,
		"after":  cell,
	})
	s.repo.AddCellHistory(ctx, entity.WarehouseCellHistory{
		CellID:     cell.ID,
		ChangedAt: time.Now().UTC(),
		ChangedBy: payload.UpdatedBy,
		ChangeType: "update",
		Payload:   diffPayload,
	})

	return cell, nil
}

// DeleteCell removes a cell and records history.
func (s *MasterDataService) DeleteCell(ctx context.Context, warehouseID, zoneID, cellID uuid.UUID, actor uuid.UUID) error {
	before, err := s.repo.GetCell(ctx, cellID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return errCellNotFound
		}
		return err
	}

	if err := s.repo.DeleteCell(ctx, warehouseID, zoneID, cellID); err != nil {
		return err
	}

	diffPayload, _ := json.Marshal(map[string]any{"before": before})
	s.repo.AddCellHistory(ctx, entity.WarehouseCellHistory{
		CellID:     cellID,
		ChangedAt: time.Now().UTC(),
		ChangedBy: actor,
		ChangeType: "delete",
		Payload:   diffPayload,
	})

	return nil
}

// ListCells returns cells for zone.
func (s *MasterDataService) ListCells(ctx context.Context, warehouseID, zoneID uuid.UUID) ([]entity.WarehouseCell, error) {
	return s.repo.ListCells(ctx, warehouseID, zoneID)
}

// AssignEquipment assigns equipment to cell.
func (s *MasterDataService) AssignEquipment(ctx context.Context, cellID, equipmentID, actor uuid.UUID) error {
	return s.repo.AssignEquipment(ctx, entity.CellEquipmentAssignment{
		CellID:      cellID,
		EquipmentID: equipmentID,
		AssignedAt:  time.Now().UTC(),
		AssignedBy:  actor,
	})
}

// UnassignEquipment detaches equipment from cell.
func (s *MasterDataService) UnassignEquipment(ctx context.Context, cellID, equipmentID uuid.UUID) error {
	return s.repo.UnassignEquipment(ctx, cellID, equipmentID)
}

// CreateEquipment creates equipment entity.
func (s *MasterDataService) CreateEquipment(ctx context.Context, warehouseID uuid.UUID, payload entity.WarehouseEquipment) (entity.WarehouseEquipment, error) {
	payload.WarehouseID = warehouseID
	payload.Code = strings.TrimSpace(payload.Code)
	payload.Name = strings.TrimSpace(payload.Name)
	payload.EquipmentType = strings.TrimSpace(payload.EquipmentType)
	if payload.Code == "" || payload.Name == "" || payload.EquipmentType == "" {
		return entity.WarehouseEquipment{}, fmt.Errorf("code, name and type are required")
	}
	if payload.Status == "" {
		payload.Status = "active"
	}
	if payload.Metadata == nil {
		payload.Metadata = map[string]any{}
	}
	return s.repo.CreateEquipment(ctx, payload)
}

// UpdateEquipment updates equipment.
func (s *MasterDataService) UpdateEquipment(ctx context.Context, warehouseID, equipmentID uuid.UUID, payload entity.WarehouseEquipment) (entity.WarehouseEquipment, error) {
	payload.ID = equipmentID
	payload.WarehouseID = warehouseID
	payload.Code = strings.TrimSpace(payload.Code)
	payload.Name = strings.TrimSpace(payload.Name)
	payload.EquipmentType = strings.TrimSpace(payload.EquipmentType)
	if payload.Code == "" || payload.Name == "" || payload.EquipmentType == "" {
		return entity.WarehouseEquipment{}, fmt.Errorf("code, name and type are required")
	}
	if payload.Metadata == nil {
		payload.Metadata = map[string]any{}
	}
	return s.repo.UpdateEquipment(ctx, payload)
}

// DeleteEquipment removes equipment.
func (s *MasterDataService) DeleteEquipment(ctx context.Context, warehouseID, equipmentID uuid.UUID) error {
	return s.repo.DeleteEquipment(ctx, warehouseID, equipmentID)
}

// ListEquipment returns equipment list.
func (s *MasterDataService) ListEquipment(ctx context.Context, warehouseID uuid.UUID) ([]entity.WarehouseEquipment, error) {
	return s.repo.ListEquipment(ctx, warehouseID)
}

// ListCellHistory returns audit entries for cell.
func (s *MasterDataService) ListCellHistory(ctx context.Context, cellID uuid.UUID, limit int) ([]entity.WarehouseCellHistory, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.ListCellHistory(ctx, cellID, limit)
}

func (s *MasterDataService) logCellHistory(ctx context.Context, cellID uuid.UUID, actor uuid.UUID, changeType string, payload any) {
	bytes, _ := json.Marshal(payload)
	_ = s.repo.AddCellHistory(ctx, entity.WarehouseCellHistory{
		CellID:     cellID,
		ChangedAt: time.Now().UTC(),
		ChangedBy: actor,
		ChangeType: changeType,
		Payload:   bytes,
	})
}

func normalizeCellCode(code string) string {
	code = strings.TrimSpace(code)
	code = strings.ToUpper(code)
	code = strings.ReplaceAll(code, " ", "")
	return code
}

// ErrWarehouseNotFound exposes service error.
func ErrWarehouseNotFound() error { return errWarehouseNotFound }

// ErrZoneNotFound exposes service error.
func ErrZoneNotFound() error { return errZoneNotFound }

// ErrCellNotFound exposes service error.
func ErrCellNotFound() error { return errCellNotFound }
