package wms

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	corepkg "asfppro/gateway/internal/core"
	"asfppro/pkg/audit"
)

// ErrForbidden is returned when subject has no access to resource scope.
var ErrForbidden = errors.New("wms: forbidden")

// Service contains business logic for WMS minimal operations.
type Service struct {
	repo    *Repository
	auditor *audit.Recorder
	logger  zerolog.Logger
}

// NewService constructs WMS service.
func NewService(repo *Repository, auditor *audit.Recorder, logger zerolog.Logger) *Service {
	return &Service{repo: repo, auditor: auditor, logger: logger.With().Str("component", "wms.service").Logger()}
}

// ListCatalogNodes returns catalog nodes for type.
func (s *Service) ListCatalogNodes(ctx context.Context, catalogType string) ([]CatalogNode, error) {
	catalogType = strings.TrimSpace(strings.ToLower(catalogType))
	if catalogType == "" {
		return nil, fmt.Errorf("catalog type is required")
	}
	return s.repo.ListCatalogNodes(ctx, catalogType)
}

// CreateCatalogNode creates new node.
func (s *Service) CreateCatalogNode(ctx context.Context, actor uuid.UUID, input CreateCatalogInput) (CatalogNode, error) {
	input.Type = strings.TrimSpace(strings.ToLower(input.Type))
	input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
	input.Name = strings.TrimSpace(input.Name)
	if input.Type == "" || input.Code == "" || input.Name == "" {
		return CatalogNode{}, fmt.Errorf("type, code and name are required")
	}

	node, err := s.repo.CreateCatalogNode(ctx, input)
	if err != nil {
		return CatalogNode{}, err
	}

	s.recordAudit(ctx, actor, "wms.catalog.create", node.ID.String(), node)
	return node, nil
}

// UpdateCatalogNode updates node.
func (s *Service) UpdateCatalogNode(ctx context.Context, actor uuid.UUID, id uuid.UUID, input UpdateCatalogInput) (CatalogNode, error) {
	input.Name = strings.TrimSpace(input.Name)
	if input.Name == "" {
		return CatalogNode{}, fmt.Errorf("name is required")
	}

	node, err := s.repo.UpdateCatalogNode(ctx, id, input)
	if err != nil {
		return CatalogNode{}, err
	}

	s.recordAudit(ctx, actor, "wms.catalog.update", node.ID.String(), node)
	return node, nil
}

// DeleteCatalogNode removes node.
func (s *Service) DeleteCatalogNode(ctx context.Context, actor uuid.UUID, id uuid.UUID) error {
	if err := s.repo.DeleteCatalogNode(ctx, id); err != nil {
		return err
	}
	s.recordAudit(ctx, actor, "wms.catalog.delete", id.String(), nil)
	return nil
}

// ListWarehouses returns warehouses.
func (s *Service) ListWarehouses(ctx context.Context, subject corepkg.Subject) ([]Warehouse, error) {
	allowAll, scopes := extractScopes(subject)
	return s.repo.ListWarehouses(ctx, scopes, allowAll)
}

// CreateWarehouse creates warehouse.
func (s *Service) CreateWarehouse(ctx context.Context, actor uuid.UUID, subject corepkg.Subject, input CreateWarehouseInput) (Warehouse, error) {
	input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
	input.Name = strings.TrimSpace(input.Name)
	input.Status = strings.TrimSpace(strings.ToLower(input.Status))
	if input.Status == "" {
		input.Status = "active"
	}
	if input.Code == "" || input.Name == "" {
		return Warehouse{}, fmt.Errorf("code and name are required")
	}
	input.OrgUnitCode = normalizeScopeValue(input.OrgUnitCode)
	allowAll, scopes := extractScopes(subject)
	if input.OrgUnitCode == "" {
		if allowAll {
			return Warehouse{}, fmt.Errorf("orgUnitCode is required when subject has global scope")
		}
		if len(scopes) == 1 {
			input.OrgUnitCode = scopes[0]
		} else {
			return Warehouse{}, fmt.Errorf("orgUnitCode is required")
		}
	}
	if !allowAll && !containsScope(scopes, input.OrgUnitCode) {
		return Warehouse{}, ErrForbidden
	}

	wh, err := s.repo.CreateWarehouse(ctx, input)
	if err != nil {
		return Warehouse{}, err
	}

	s.recordAudit(ctx, actor, "wms.warehouse.create", wh.ID.String(), wh)
	return wh, nil
}

// UpdateWarehouse updates basic fields.
func (s *Service) UpdateWarehouse(ctx context.Context, actor uuid.UUID, subject corepkg.Subject, id uuid.UUID, input UpdateWarehouseInput) (Warehouse, error) {
	warehouse, err := s.repo.GetWarehouseByID(ctx, id)
	if err != nil {
		return Warehouse{}, err
	}
	allowAll, scopes := extractScopes(subject)
	if !allowAll && !containsScope(scopes, warehouse.OrgUnitCode) {
		return Warehouse{}, ErrForbidden
	}
	if input.Name != nil {
		trimmed := strings.TrimSpace(*input.Name)
		if trimmed == "" {
			return Warehouse{}, fmt.Errorf("name cannot be empty")
		}
		input.Name = &trimmed
	}
	if input.Status != nil {
		trimmed := strings.TrimSpace(strings.ToLower(*input.Status))
		if trimmed == "" {
			return Warehouse{}, fmt.Errorf("status cannot be empty")
		}
		input.Status = &trimmed
	}

	wh, err := s.repo.UpdateWarehouse(ctx, id, input)
	if err != nil {
		return Warehouse{}, err
	}

	s.recordAudit(ctx, actor, "wms.warehouse.update", wh.ID.String(), wh)
	return wh, nil
}

// DeleteWarehouse deletes record.
func (s *Service) DeleteWarehouse(ctx context.Context, actor uuid.UUID, subject corepkg.Subject, id uuid.UUID) error {
	warehouse, err := s.repo.GetWarehouseByID(ctx, id)
	if err != nil {
		return err
	}
	allowAll, scopes := extractScopes(subject)
	if !allowAll && !containsScope(scopes, warehouse.OrgUnitCode) {
		return ErrForbidden
	}
	if err := s.repo.DeleteWarehouse(ctx, id); err != nil {
		return err
	}
	s.recordAudit(ctx, actor, "wms.warehouse.delete", id.String(), nil)
	return nil
}

// UpsertStock persists stock record.
func (s *Service) UpsertStock(ctx context.Context, actor uuid.UUID, subject corepkg.Subject, input UpsertStockInput) (StockRecord, error) {
	input.SKU = strings.TrimSpace(strings.ToUpper(input.SKU))
	input.Warehouse = strings.TrimSpace(strings.ToUpper(input.Warehouse))
	if input.SKU == "" || input.Warehouse == "" {
		return StockRecord{}, fmt.Errorf("sku and warehouse are required")
	}
	if input.UOM == "" {
		input.UOM = "pcs"
	}
	allowAll, scopes := extractScopes(subject)
	if !allowAll {
		warehouse, err := s.repo.GetWarehouseByCode(ctx, input.Warehouse)
		if err != nil {
			return StockRecord{}, err
		}
		if !containsScope(scopes, warehouse.OrgUnitCode) {
			return StockRecord{}, ErrForbidden
		}
	}

	stock, err := s.repo.UpsertStock(ctx, input)
	if err != nil {
		return StockRecord{}, err
	}

	s.recordAudit(ctx, actor, "wms.stock.upsert", fmt.Sprintf("%s:%s", stock.SKU, stock.Warehouse), stock)
	return stock, nil
}

// ListStock lists inventory records.
func (s *Service) ListStock(ctx context.Context, subject corepkg.Subject, sku, warehouse string) ([]StockRecord, error) {
	allowAll, scopes := extractScopes(subject)
	return s.repo.ListStock(ctx, scopes, allowAll, strings.TrimSpace(strings.ToUpper(sku)), strings.TrimSpace(strings.ToUpper(warehouse)))
}

func extractScopes(subject corepkg.Subject) (bool, []string) {
	scopeSet := make(map[string]struct{})
	allowAll := false

	for _, role := range subject.Roles {
		scope := normalizeScopeValue(role.Scope)
		if scope == "" {
			continue
		}
		if scope == "*" {
			allowAll = true
			continue
		}
		scopeSet[scope] = struct{}{}
	}

	for _, unit := range subject.OrgUnits {
		scope := normalizeScopeValue(unit)
		if scope == "" {
			continue
		}
		if scope == "*" {
			allowAll = true
			continue
		}
		scopeSet[scope] = struct{}{}
	}

	scopes := make([]string, 0, len(scopeSet))
	for scope := range scopeSet {
		scopes = append(scopes, scope)
	}
	sort.Strings(scopes)
	return allowAll, scopes
}

func containsScope(scopes []string, target string) bool {
	for _, scope := range scopes {
		if scope == target {
			return true
		}
	}
	return false
}

func normalizeScopeValue(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return ""
	}
	if trimmed == "*" {
		return "*"
	}
	return strings.ToUpper(trimmed)
}

func (s *Service) recordAudit(ctx context.Context, actor uuid.UUID, action, entityID string, payload any) {
	if s.auditor == nil {
		return
	}
	entry := audit.Entry{
		ActorID:  actor,
		Action:   action,
		Entity:   "wms",
		EntityID: entityID,
		Payload:  payload,
	}
	if err := s.auditor.Record(ctx, entry); err != nil {
		s.logger.Error().Err(err).Msg("wms audit record")
	}
}
