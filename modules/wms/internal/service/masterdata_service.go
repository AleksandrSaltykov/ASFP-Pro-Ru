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

	"asfppro/pkg/audit"

	"asfppro/modules/wms/internal/entity"
	"asfppro/modules/wms/internal/repository"
)

var (
	errWarehouseNotFound = errors.New("warehouse not found")
	errZoneNotFound      = errors.New("zone not found")
	errCellNotFound      = errors.New("cell not found")
	errItemNotFound      = errors.New("item not found")
)

// MasterDataService contains business logic for warehouses/zones/cells.
type MasterDataService struct {
	repo    *repository.MasterDataRepository
	auditor *audit.Recorder
	logger  zerolog.Logger
}

// NewMasterDataService builds service.
func NewMasterDataService(repo *repository.MasterDataRepository, auditor *audit.Recorder, logger zerolog.Logger) *MasterDataService {
	return &MasterDataService{repo: repo, auditor: auditor, logger: logger}
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

	diff := map[string]any{
		"before": before,
		"after":  cell,
	}
	s.logCellHistory(ctx, cell.ID, payload.UpdatedBy, "update", diff)

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

	s.logCellHistory(ctx, cellID, actor, "delete", map[string]any{"before": before})

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
		ChangedAt:  time.Now().UTC(),
		ChangedBy:  actor,
		ChangeType: changeType,
		Payload:    bytes,
	})

	if s.auditor == nil {
		return
	}

	auditPayload := map[string]any{
		"changeType": changeType,
		"cellId":     cellID.String(),
		"payload":    payload,
	}

	if err := s.auditor.Record(ctx, audit.Entry{
		ActorID:  actor,
		Action:   fmt.Sprintf("wms.cell.%s", changeType),
		Entity:   "wms.cell",
		EntityID: cellID.String(),
		Payload:  auditPayload,
	}); err != nil {
		s.logger.Error().Err(err).Msg("audit cell change")
	}
}

// ListCatalogNodes returns catalog entries for provided type ordered by sort order.
func (s *MasterDataService) ListCatalogNodes(ctx context.Context, catalogType string) ([]entity.CatalogNode, error) {
	typ, err := normalizeCatalogType(catalogType)
	if err != nil {
		return nil, err
	}
	return s.repo.ListCatalogNodes(ctx, typ)
}

// GetCatalogNode returns catalog entry by id.
func (s *MasterDataService) GetCatalogNode(ctx context.Context, catalogType string, id uuid.UUID) (entity.CatalogNode, error) {
	typ, err := normalizeCatalogType(catalogType)
	if err != nil {
		return entity.CatalogNode{}, err
	}
	node, err := s.repo.GetCatalogNode(ctx, typ, id)
	if err != nil {
		return entity.CatalogNode{}, err
	}
	return node, nil
}

// CreateCatalogNode creates catalog node with provided metadata.
func (s *MasterDataService) CreateCatalogNode(ctx context.Context, catalogType string, payload entity.CatalogNode) (entity.CatalogNode, error) {
	typ, err := normalizeCatalogType(catalogType)
	if err != nil {
		return entity.CatalogNode{}, err
	}
	payload.Type = typ
	if payload.Metadata == nil {
		payload.Metadata = map[string]any{}
	}
	return s.repo.CreateCatalogNode(ctx, payload)
}

// UpdateCatalogNode updates mutable catalog node attributes.
func (s *MasterDataService) UpdateCatalogNode(ctx context.Context, catalogType string, id uuid.UUID, payload entity.CatalogNode) (entity.CatalogNode, error) {
	typ, err := normalizeCatalogType(catalogType)
	if err != nil {
		return entity.CatalogNode{}, err
	}
	payload.ID = id
	payload.Type = typ
	if payload.Metadata == nil {
		payload.Metadata = map[string]any{}
	}
	return s.repo.UpdateCatalogNode(ctx, payload)
}

// DeleteCatalogNode removes catalog node by id.
func (s *MasterDataService) DeleteCatalogNode(ctx context.Context, catalogType string, id uuid.UUID) error {
	typ, err := normalizeCatalogType(catalogType)
	if err != nil {
		return err
	}
	return s.repo.DeleteCatalogNode(ctx, typ, id)
}

// ListAttributeTemplates returns dynamic attribute templates for target type.
func (s *MasterDataService) ListAttributeTemplates(ctx context.Context, targetType string) ([]entity.AttributeTemplate, error) {
	target := strings.TrimSpace(targetType)
	if target == "" {
		target = "item"
	}
	return s.repo.ListAttributeTemplates(ctx, target)
}

// ListItems returns item master data with attributes.
func (s *MasterDataService) ListItems(ctx context.Context) ([]entity.Item, error) {
	return s.repo.ListItems(ctx)
}

// GetItem returns item by id with attributes.
func (s *MasterDataService) GetItem(ctx context.Context, id uuid.UUID) (entity.Item, error) {
	item, err := s.repo.GetItem(ctx, id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.Item{}, errItemNotFound
		}
		return entity.Item{}, err
	}
	return item, nil
}

// CreateItem validates payload and creates new item entry.
func (s *MasterDataService) CreateItem(ctx context.Context, payload entity.Item, attributes []entity.AttributeValueUpsert) (entity.Item, error) {
	payload.SKU = strings.TrimSpace(payload.SKU)
	payload.Name = strings.TrimSpace(payload.Name)
	if payload.SKU == "" || payload.Name == "" {
		return entity.Item{}, fmt.Errorf("sku and name are required")
	}
	if payload.UnitID == uuid.Nil {
		return entity.Item{}, fmt.Errorf("unitId is required")
	}
	if payload.Metadata == nil {
		payload.Metadata = map[string]any{}
	}

	unit, err := s.repo.GetCatalogNode(ctx, entity.CatalogTypeUnit, payload.UnitID)
	if err != nil {
		return entity.Item{}, err
	}
	payload.Unit = unit

	if payload.CategoryID != nil && *payload.CategoryID != uuid.Nil {
		category, err := s.repo.GetCatalogNode(ctx, entity.CatalogTypeCategory, *payload.CategoryID)
		if err != nil {
			return entity.Item{}, err
		}
		payload.Category = category
		payload.CategoryPath = category.Path
	} else {
		payload.CategoryID = nil
		payload.CategoryPath = ""
	}

	payload.Warehouses = uniqueUUIDs(payload.Warehouses)

	normalizedAttrs, err := s.validateItemAttributes(ctx, attributes)
	if err != nil {
		return entity.Item{}, err
	}

	return s.repo.CreateItem(ctx, payload, normalizedAttrs)
}

// UpdateItem updates item metadata and attributes.
func (s *MasterDataService) UpdateItem(ctx context.Context, id uuid.UUID, payload entity.Item, attributes []entity.AttributeValueUpsert) (entity.Item, error) {
	payload.ID = id
	payload.SKU = strings.TrimSpace(payload.SKU)
	payload.Name = strings.TrimSpace(payload.Name)
	if payload.SKU == "" || payload.Name == "" {
		return entity.Item{}, fmt.Errorf("sku and name are required")
	}
	if payload.UnitID == uuid.Nil {
		return entity.Item{}, fmt.Errorf("unitId is required")
	}
	if payload.Metadata == nil {
		payload.Metadata = map[string]any{}
	}

	unit, err := s.repo.GetCatalogNode(ctx, entity.CatalogTypeUnit, payload.UnitID)
	if err != nil {
		return entity.Item{}, err
	}
	payload.Unit = unit

	if payload.CategoryID != nil && *payload.CategoryID != uuid.Nil {
		category, err := s.repo.GetCatalogNode(ctx, entity.CatalogTypeCategory, *payload.CategoryID)
		if err != nil {
			return entity.Item{}, err
		}
		payload.Category = category
		payload.CategoryPath = category.Path
	} else {
		payload.CategoryID = nil
		payload.CategoryPath = ""
	}

	payload.Warehouses = uniqueUUIDs(payload.Warehouses)

	normalizedAttrs, err := s.validateItemAttributes(ctx, attributes)
	if err != nil {
		return entity.Item{}, err
	}

	item, err := s.repo.UpdateItem(ctx, payload, normalizedAttrs)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.Item{}, errItemNotFound
		}
		return entity.Item{}, err
	}
	return item, nil
}

// DeleteItem removes item by id.
func (s *MasterDataService) DeleteItem(ctx context.Context, id uuid.UUID) error {
	return s.repo.DeleteItem(ctx, id)
}

// ListCatalogLinks returns relations for provided entity.
func (s *MasterDataService) ListCatalogLinks(ctx context.Context, leftType string, leftID uuid.UUID) ([]entity.CatalogLink, error) {
	return s.repo.ListCatalogLinks(ctx, strings.TrimSpace(leftType), leftID)
}

// ReplaceCatalogLinks rewrites relations for provided entity.
func (s *MasterDataService) ReplaceCatalogLinks(ctx context.Context, leftType string, leftID uuid.UUID, links []entity.CatalogLink) error {
	for i := range links {
		if links[i].Metadata == nil {
			links[i].Metadata = map[string]any{}
		}
	}
	return s.repo.ReplaceCatalogLinks(ctx, strings.TrimSpace(leftType), leftID, links)
}

func (s *MasterDataService) validateItemAttributes(ctx context.Context, attrs []entity.AttributeValueUpsert) ([]entity.AttributeValueUpsert, error) {
	if len(attrs) == 0 {
		return nil, nil
	}

	templates, err := s.repo.ListAttributeTemplates(ctx, "item")
	if err != nil {
		return nil, err
	}

	lookup := make(map[uuid.UUID]entity.AttributeTemplate, len(templates))
	for _, tpl := range templates {
		lookup[tpl.ID] = tpl
	}

	seen := make(map[uuid.UUID]struct{}, len(attrs))
	normalized := make([]entity.AttributeValueUpsert, 0, len(attrs))

	for _, attr := range attrs {
		if attr.TemplateID == uuid.Nil {
			return nil, fmt.Errorf("attribute templateId is required")
		}

		tpl, ok := lookup[attr.TemplateID]
		if !ok {
			return nil, fmt.Errorf("attribute template %s not found", attr.TemplateID)
		}
		if _, dup := seen[attr.TemplateID]; dup {
			return nil, fmt.Errorf("duplicate attribute template %s", tpl.Code)
		}
		seen[attr.TemplateID] = struct{}{}

		switch tpl.DataType {
		case entity.AttributeDataTypeString:
			if attr.String == nil {
				if tpl.IsRequired {
					return nil, fmt.Errorf("attribute %s requires stringValue", tpl.Code)
				}
				value := ""
				attr.String = &value
			}
		case entity.AttributeDataTypeNumber:
			if attr.Number == nil && tpl.IsRequired {
				return nil, fmt.Errorf("attribute %s requires numberValue", tpl.Code)
			}
		case entity.AttributeDataTypeBoolean:
			if attr.Boolean == nil {
				value := false
				if tpl.IsRequired {
					return nil, fmt.Errorf("attribute %s requires booleanValue", tpl.Code)
				}
				attr.Boolean = &value
			}
		case entity.AttributeDataTypeJSON:
			if attr.JSON == nil {
				attr.JSON = map[string]any{}
			}
		}

		normalized = append(normalized, attr)
	}

	return normalized, nil
}

func normalizeCatalogType(raw string) (entity.CatalogType, error) {
	value := strings.TrimSpace(strings.ToLower(raw))
	if value == "" {
		return "", fmt.Errorf("catalog type is required")
	}
	switch value {
	case string(entity.CatalogTypeCategory):
		return entity.CatalogTypeCategory, nil
	case string(entity.CatalogTypeUnit):
		return entity.CatalogTypeUnit, nil
	default:
		return entity.CatalogType(value), nil
	}
}

func uniqueUUIDs(values []uuid.UUID) []uuid.UUID {
	seen := make(map[uuid.UUID]struct{}, len(values))
	result := make([]uuid.UUID, 0, len(values))
	for _, id := range values {
		if id == uuid.Nil {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		result = append(result, id)
	}
	return result
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

// ErrItemNotFound exposes service error.
func ErrItemNotFound() error { return errItemNotFound }
