package entity

import (
	"time"

	"github.com/google/uuid"
)

// Item represents a product master data entry enriched with dynamic attributes.
type Item struct {
	ID           uuid.UUID      `json:"id"`
	SKU          string         `json:"sku"`
	Name         string         `json:"name"`
	Description  string         `json:"description,omitempty"`
	CategoryID   *uuid.UUID     `json:"categoryId,omitempty"`
	CategoryPath string         `json:"categoryPath,omitempty"`
	Category     CatalogNode    `json:"category,omitempty"`
	UnitID       uuid.UUID      `json:"unitId"`
	Unit         CatalogNode    `json:"unit"`
	Barcode      string         `json:"barcode,omitempty"`
	WeightKG     *float64       `json:"weightKg,omitempty"`
	VolumeM3     *float64       `json:"volumeM3,omitempty"`
	Metadata     map[string]any `json:"metadata,omitempty"`
	Warehouses   []uuid.UUID    `json:"warehouseIds,omitempty"`
	Attributes   ItemAttributes `json:"attributes,omitempty"`
	CreatedBy    *uuid.UUID     `json:"createdBy,omitempty"`
	UpdatedBy    *uuid.UUID     `json:"updatedBy,omitempty"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
}
