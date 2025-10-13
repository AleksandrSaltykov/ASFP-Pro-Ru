// Package service implements WMS inventory logic.
package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"asfppro/modules/wms/internal/entity"
	"asfppro/modules/wms/internal/repository"
	"asfppro/pkg/audit"
)

// InventoryService orchestrates stock operations.
type InventoryService struct {
	repo    *repository.InventoryRepository
	auditor *audit.Recorder
	logger  zerolog.Logger
}

// NewInventoryService builds service.
func NewInventoryService(repo *repository.InventoryRepository, auditor *audit.Recorder, logger zerolog.Logger) *InventoryService {
	return &InventoryService{repo: repo, auditor: auditor, logger: logger}
}

// Upsert updates stock level with validation.
func (s *InventoryService) Upsert(ctx context.Context, item entity.StockItem) (entity.StockItem, error) {
	if strings.TrimSpace(item.SKU) == "" {
		return entity.StockItem{}, fmt.Errorf("sku is required")
	}
	if strings.TrimSpace(item.Warehouse) == "" {
		return entity.StockItem{}, fmt.Errorf("warehouse is required")
	}
	if item.Quantity < 0 {
		return entity.StockItem{}, fmt.Errorf("quantity must be >= 0")
	}
	if item.UOM == "" {
		item.UOM = "pcs"
	}

	item.UpdatedAt = time.Now().UTC()
	stored, err := s.repo.Upsert(ctx, item)
	if err != nil {
		return entity.StockItem{}, err
	}

	s.recordAudit(ctx, stored)

	return stored, nil
}

// List returns last known stock.
func (s *InventoryService) List(ctx context.Context, warehouse string, limit int) ([]entity.StockItem, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.List(ctx, warehouse, limit)
}

// Balances returns enriched stock balances.
func (s *InventoryService) Balances(ctx context.Context, warehouse, sku string, limit int) ([]entity.StockBalance, error) {
	return s.repo.ListBalances(ctx, strings.TrimSpace(warehouse), sku, limit)
}

// Availability returns aggregated availability info.
func (s *InventoryService) Availability(ctx context.Context, warehouse, sku string, limit int) ([]entity.StockAvailability, error) {
	return s.repo.ListAvailability(ctx, strings.TrimSpace(warehouse), sku, limit)
}

// EndlessPolicies returns endless aisle policy list.
func (s *InventoryService) EndlessPolicies(ctx context.Context, warehouse string) ([]entity.EndlessPolicy, error) {
	return s.repo.ListEndlessPolicies(ctx, strings.TrimSpace(warehouse))
}

// Movements returns recent stock movements.
func (s *InventoryService) Movements(ctx context.Context, warehouse string, limit int) ([]entity.StockMovement, error) {
	return s.repo.ListMovements(ctx, strings.TrimSpace(warehouse), limit)
}

// UpdateEndlessPolicy updates endless aisle settings.
func (s *InventoryService) UpdateEndlessPolicy(ctx context.Context, input entity.EndlessPolicyUpdate) (entity.EndlessPolicy, error) {
	return s.repo.UpdateEndlessPolicy(ctx, input)
}

// ResetEndlessPolicy resets endless aisle settings for SKU/warehouse.
func (s *InventoryService) ResetEndlessPolicy(ctx context.Context, input entity.EndlessPolicyReset) (entity.EndlessPolicy, error) {
	return s.repo.ResetEndlessPolicy(ctx, input)
}

func (s *InventoryService) recordAudit(ctx context.Context, item entity.StockItem) {
	if s.auditor == nil {
		return
	}

	payload := map[string]any{
		"sku":       item.SKU,
		"warehouse": item.Warehouse,
		"quantity":  item.Quantity,
		"uom":       item.UOM,
		"updatedAt": item.UpdatedAt,
	}

	entityID := fmt.Sprintf("%s:%s", item.SKU, item.Warehouse)
	if err := s.auditor.Record(ctx, audit.Entry{
		ActorID:  uuid.Nil,
		Action:   "wms.stock.upsert",
		Entity:   "wms.stock",
		EntityID: entityID,
		Payload:  payload,
	}); err != nil {
		s.logger.Error().Err(err).Msg("audit stock upsert")
	}
}
