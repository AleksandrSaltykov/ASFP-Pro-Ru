package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"asfppro/modules/wms/internal/entity"
)

// InventoryRepository stores stock balances.
type InventoryRepository struct {
	pool *pgxpool.Pool
}

// NewInventoryRepository builds repository.
func NewInventoryRepository(pool *pgxpool.Pool) *InventoryRepository {
	return &InventoryRepository{pool: pool}
}

// Upsert stores item quantity for warehouse.
func (r *InventoryRepository) Upsert(ctx context.Context, item entity.StockItem) (entity.StockItem, error) {
	query := `
	INSERT INTO wms.stock (sku, warehouse, quantity, uom)
	VALUES ($1, $2, $3, $4)
	ON CONFLICT (sku, warehouse)
	DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW()
	RETURNING updated_at
	`
	row := r.pool.QueryRow(ctx, query, item.SKU, item.Warehouse, item.Quantity, item.UOM)
	if err := row.Scan(&item.UpdatedAt); err != nil {
		return entity.StockItem{}, fmt.Errorf("upsert stock: %w", err)
	}
	return item, nil
}

// List returns stock items per warehouse.
func (r *InventoryRepository) List(ctx context.Context, warehouse string, limit int) ([]entity.StockItem, error) {
	query := `
	SELECT sku, warehouse, quantity, uom, updated_at
	FROM wms.stock
	WHERE ($1 = '' OR warehouse = $1)
	ORDER BY updated_at DESC
	LIMIT $2
	`
	rows, err := r.pool.Query(ctx, query, warehouse, limit)
	if err != nil {
		return nil, fmt.Errorf("list stock: %w", err)
	}
	defer rows.Close()

	var items []entity.StockItem
	for rows.Next() {
		var item entity.StockItem
		if err := rows.Scan(&item.SKU, &item.Warehouse, &item.Quantity, &item.UOM, &item.UpdatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, rows.Err()
}
