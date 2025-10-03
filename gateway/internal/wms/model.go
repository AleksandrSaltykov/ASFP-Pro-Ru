package wms

import (
	"time"

	"github.com/google/uuid"
)

// CatalogNode represents minimal information about catalog entries.
type CatalogNode struct {
	ID          uuid.UUID `json:"id"`
	Type        string    `json:"type"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	IsActive    bool      `json:"isActive"`
}

// Warehouse describes warehouse record.
type Warehouse struct {
	ID          uuid.UUID `json:"id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description,omitempty"`
	Status      string    `json:"status"`
	OrgUnitCode string    `json:"orgUnitCode"`
}

// StockRecord represents inventory row.
type StockRecord struct {
	SKU       string    `json:"sku"`
	Warehouse string    `json:"warehouse"`
	Quantity  float64   `json:"quantity"`
	UOM       string    `json:"uom"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// CreateCatalogInput is used to create catalog node.
type CreateCatalogInput struct {
	Type        string
	Code        string
	Name        string
	Description string
}

// UpdateCatalogInput mutates catalog node properties.
type UpdateCatalogInput struct {
	Name        string
	Description string
	IsActive    *bool
}

// CreateWarehouseInput describes new warehouse payload.
type CreateWarehouseInput struct {
	Code        string
	Name        string
	Description string
	Status      string
	OrgUnitCode string
}

// UpdateWarehouseInput mutates existing warehouse.
type UpdateWarehouseInput struct {
	Name        *string
	Description *string
	Status      *string
}

// UpsertStockInput carries inventory upsert request.
type UpsertStockInput struct {
	SKU       string
	Warehouse string
	Quantity  float64
	UOM       string
}
