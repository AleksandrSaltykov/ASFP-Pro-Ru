package wms

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository talks to wms.* tables.
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository constructs repository.
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// ListCatalogNodes fetches catalog entries for provided type.
func (r *Repository) ListCatalogNodes(ctx context.Context, catalogType string) ([]CatalogNode, error) {
	const query = `SELECT id, catalog_type, code, name, COALESCE(description, ''), is_active
FROM wms.catalog_node WHERE catalog_type = $1 ORDER BY sort_order, name`

	rows, err := r.pool.Query(ctx, query, catalogType)
	if err != nil {
		return nil, fmt.Errorf("list catalog nodes: %w", err)
	}
	defer rows.Close()

	var nodes []CatalogNode
	for rows.Next() {
		var node CatalogNode
		if err := rows.Scan(&node.ID, &node.Type, &node.Code, &node.Name, &node.Description, &node.IsActive); err != nil {
			return nil, fmt.Errorf("scan catalog node: %w", err)
		}
		nodes = append(nodes, node)
	}
	return nodes, rows.Err()
}

// CreateCatalogNode inserts catalog node.
func (r *Repository) CreateCatalogNode(ctx context.Context, input CreateCatalogInput) (CatalogNode, error) {
	const query = `INSERT INTO wms.catalog_node (
    catalog_type, code, name, description, level, path, metadata, sort_order, is_active
) VALUES ($1, $2, $3, NULLIF($4, ''), 0, $5, '{}'::jsonb, 0, TRUE)
RETURNING id, catalog_type, code, name, COALESCE(description, ''), is_active`

	var node CatalogNode
	path := strings.ToUpper(strings.TrimSpace(input.Code))
	if path == "" {
		path = input.Code
	}

	if err := r.pool.QueryRow(ctx, query, input.Type, input.Code, input.Name, input.Description, path).
		Scan(&node.ID, &node.Type, &node.Code, &node.Name, &node.Description, &node.IsActive); err != nil {
		if pgErr, ok := err.(*pgconn.PgError); ok && pgErr.Code == "23505" {
			return CatalogNode{}, fmt.Errorf("catalog code already exists")
		}
		return CatalogNode{}, fmt.Errorf("insert catalog node: %w", err)
	}
	return node, nil
}

// UpdateCatalogNode updates basic fields.
func (r *Repository) UpdateCatalogNode(ctx context.Context, id uuid.UUID, input UpdateCatalogInput) (CatalogNode, error) {
	const query = `UPDATE wms.catalog_node
SET name = $1,
    description = NULLIF($2, ''),
    is_active = COALESCE($3, is_active),
    updated_at = NOW()
WHERE id = $4
RETURNING id, catalog_type, code, name, COALESCE(description, ''), is_active`

	var node CatalogNode
	if err := r.pool.QueryRow(ctx, query, input.Name, input.Description, input.IsActive, id).
		Scan(&node.ID, &node.Type, &node.Code, &node.Name, &node.Description, &node.IsActive); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return CatalogNode{}, fmt.Errorf("catalog node not found")
		}
		return CatalogNode{}, fmt.Errorf("update catalog node: %w", err)
	}
	return node, nil
}

// DeleteCatalogNode removes node.
func (r *Repository) DeleteCatalogNode(ctx context.Context, id uuid.UUID) error {
	cmd, err := r.pool.Exec(ctx, "DELETE FROM wms.catalog_node WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("delete catalog node: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return fmt.Errorf("catalog node not found")
	}
	return nil
}

// ListWarehouses returns warehouses.
func (r *Repository) ListWarehouses(ctx context.Context, scopes []string, allowAll bool) ([]Warehouse, error) {
	if !allowAll && len(scopes) == 0 {
		return []Warehouse{}, nil
	}

	baseQuery := `SELECT id, code, name, COALESCE(description, ''), status, org_unit_code FROM wms.warehouse`
	args := make([]any, 0, 1)
	if allowAll || len(scopes) == 0 {
		baseQuery += " ORDER BY created_at DESC"
		rows, err := r.pool.Query(ctx, baseQuery)
		if err != nil {
			return nil, fmt.Errorf("list warehouses: %w", err)
		}
		defer rows.Close()

		var warehouses []Warehouse
		for rows.Next() {
			var wh Warehouse
			if err := rows.Scan(&wh.ID, &wh.Code, &wh.Name, &wh.Description, &wh.Status, &wh.OrgUnitCode); err != nil {
				return nil, fmt.Errorf("scan warehouse: %w", err)
			}
			warehouses = append(warehouses, wh)
		}
		return warehouses, rows.Err()
	}

	baseQuery += " WHERE org_unit_code = ANY($1) ORDER BY created_at DESC"
	args = append(args, scopes)
	rows, err := r.pool.Query(ctx, baseQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("list warehouses: %w", err)
	}
	defer rows.Close()

	var warehouses []Warehouse
	for rows.Next() {
		var wh Warehouse
		if err := rows.Scan(&wh.ID, &wh.Code, &wh.Name, &wh.Description, &wh.Status, &wh.OrgUnitCode); err != nil {
			return nil, fmt.Errorf("scan warehouse: %w", err)
		}
		warehouses = append(warehouses, wh)
	}
	return warehouses, rows.Err()
}

// CreateWarehouse inserts warehouse.
func (r *Repository) CreateWarehouse(ctx context.Context, input CreateWarehouseInput) (Warehouse, error) {
	const query = `INSERT INTO wms.warehouse (id, code, name, description, status, org_unit_code)
VALUES ($1, $2, $3, NULLIF($4, ''), COALESCE(NULLIF($5, ''), 'active'), $6)
RETURNING id, code, name, COALESCE(description, ''), status, org_unit_code`

	var wh Warehouse
	id := uuid.New()
	if err := r.pool.QueryRow(ctx, query, id, input.Code, input.Name, input.Description, input.Status, input.OrgUnitCode).
		Scan(&wh.ID, &wh.Code, &wh.Name, &wh.Description, &wh.Status, &wh.OrgUnitCode); err != nil {
		if pgErr, ok := err.(*pgconn.PgError); ok && pgErr.Code == "23505" {
			return Warehouse{}, fmt.Errorf("warehouse code already exists")
		}
		return Warehouse{}, fmt.Errorf("insert warehouse: %w", err)
	}
	return wh, nil
}

// UpdateWarehouse modifies existing warehouse.
func (r *Repository) UpdateWarehouse(ctx context.Context, id uuid.UUID, input UpdateWarehouseInput) (Warehouse, error) {
	setParts := make([]string, 0, 3)
	args := make([]any, 0, 4)
	idx := 1

	if input.Name != nil {
		setParts = append(setParts, fmt.Sprintf("name = $%d", idx))
		args = append(args, *input.Name)
		idx++
	}
	if input.Description != nil {
		setParts = append(setParts, fmt.Sprintf("description = NULLIF($%d, '')", idx))
		args = append(args, *input.Description)
		idx++
	}
	if input.Status != nil {
		setParts = append(setParts, fmt.Sprintf("status = NULLIF($%d, '')", idx))
		args = append(args, *input.Status)
		idx++
	}

	if len(setParts) == 0 {
		setParts = append(setParts, "updated_at = NOW()")
	} else {
		setParts = append(setParts, "updated_at = NOW()")
	}

	query := fmt.Sprintf("UPDATE wms.warehouse SET %s WHERE id = $%d RETURNING id, code, name, COALESCE(description, ''), status, org_unit_code", strings.Join(setParts, ", "), idx)
	args = append(args, id)

	var wh Warehouse
	if err := r.pool.QueryRow(ctx, query, args...).Scan(&wh.ID, &wh.Code, &wh.Name, &wh.Description, &wh.Status, &wh.OrgUnitCode); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Warehouse{}, fmt.Errorf("warehouse not found")
		}
		return Warehouse{}, fmt.Errorf("update warehouse: %w", err)
	}
	return wh, nil
}

// GetWarehouseByID returns warehouse by identifier.
func (r *Repository) GetWarehouseByID(ctx context.Context, id uuid.UUID) (Warehouse, error) {
	const query = `SELECT id, code, name, COALESCE(description, ''), status, org_unit_code FROM wms.warehouse WHERE id = $1`
	var wh Warehouse
	if err := r.pool.QueryRow(ctx, query, id).Scan(&wh.ID, &wh.Code, &wh.Name, &wh.Description, &wh.Status, &wh.OrgUnitCode); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Warehouse{}, fmt.Errorf("warehouse not found")
		}
		return Warehouse{}, fmt.Errorf("get warehouse: %w", err)
	}
	return wh, nil
}

// GetWarehouseByCode returns warehouse by code.
func (r *Repository) GetWarehouseByCode(ctx context.Context, code string) (Warehouse, error) {
	const query = `SELECT id, code, name, COALESCE(description, ''), status, org_unit_code FROM wms.warehouse WHERE code = $1`
	var wh Warehouse
	if err := r.pool.QueryRow(ctx, query, code).Scan(&wh.ID, &wh.Code, &wh.Name, &wh.Description, &wh.Status, &wh.OrgUnitCode); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Warehouse{}, fmt.Errorf("warehouse not found")
		}
		return Warehouse{}, fmt.Errorf("get warehouse: %w", err)
	}
	return wh, nil
}

// DeleteWarehouse removes warehouse.
func (r *Repository) DeleteWarehouse(ctx context.Context, id uuid.UUID) error {
	cmd, err := r.pool.Exec(ctx, "DELETE FROM wms.warehouse WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("delete warehouse: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return fmt.Errorf("warehouse not found")
	}
	return nil
}

// UpsertStock inserts new record or updates existing quantity.
func (r *Repository) UpsertStock(ctx context.Context, input UpsertStockInput) (StockRecord, error) {
	const query = `INSERT INTO wms.stock (sku, warehouse, quantity, uom)
VALUES ($1, $2, $3, COALESCE(NULLIF($4, ''), 'pcs'))
ON CONFLICT (sku, warehouse) DO UPDATE
SET quantity = EXCLUDED.quantity,
    uom = EXCLUDED.uom,
    updated_at = NOW()
RETURNING sku, warehouse, quantity, uom, updated_at`

	var stock StockRecord
	if err := r.pool.QueryRow(ctx, query, input.SKU, input.Warehouse, input.Quantity, input.UOM).
		Scan(&stock.SKU, &stock.Warehouse, &stock.Quantity, &stock.UOM, &stock.UpdatedAt); err != nil {
		return StockRecord{}, fmt.Errorf("upsert stock: %w", err)
	}
	return stock, nil
}

// ListStock returns stock records optionally filtered by warehouse or sku.
func (r *Repository) ListStock(ctx context.Context, scopes []string, allowAll bool, sku, warehouse string) ([]StockRecord, error) {
	if !allowAll && len(scopes) == 0 {
		return []StockRecord{}, nil
	}

	query := `SELECT s.sku, s.warehouse, s.quantity, s.uom, s.updated_at
FROM wms.stock s
JOIN wms.warehouse w ON w.code = s.warehouse
WHERE ($1 = '' OR s.sku = $1)
  AND ($2 = '' OR s.warehouse = $2)`
	args := []any{sku, warehouse}
	if !allowAll {
		query += " AND w.org_unit_code = ANY($3)"
		args = append(args, scopes)
	}
	query += " ORDER BY s.updated_at DESC"

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list stock: %w", err)
	}
	defer rows.Close()

	var records []StockRecord
	for rows.Next() {
		var record StockRecord
		if err := rows.Scan(&record.SKU, &record.Warehouse, &record.Quantity, &record.UOM, &record.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan stock: %w", err)
		}
		records = append(records, record)
	}
	return records, rows.Err()
}
