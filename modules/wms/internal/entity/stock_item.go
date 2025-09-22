package entity

import "time"

// StockItem describes warehouse balances item.
type StockItem struct {
	SKU       string    `json:"sku"`
	Warehouse string    `json:"warehouse"`
	Quantity  float64   `json:"quantity"`
	UOM       string    `json:"uom"`
	UpdatedAt time.Time `json:"updatedAt"`
}
