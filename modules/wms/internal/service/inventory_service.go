package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/rs/zerolog"

	"asfppro/modules/wms/internal/entity"
	"asfppro/modules/wms/internal/repository"
)

// InventoryService orchestrates stock operations.
type InventoryService struct {
	repo   *repository.InventoryRepository
	logger zerolog.Logger
}

// NewInventoryService builds service.
func NewInventoryService(repo *repository.InventoryRepository, logger zerolog.Logger) *InventoryService {
	return &InventoryService{repo: repo, logger: logger}
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
	return s.repo.Upsert(ctx, item)
}

// List returns last known stock.
func (s *InventoryService) List(ctx context.Context, warehouse string, limit int) ([]entity.StockItem, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.List(ctx, warehouse, limit)
}
