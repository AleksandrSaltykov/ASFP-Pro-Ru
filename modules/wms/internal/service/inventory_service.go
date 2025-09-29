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
