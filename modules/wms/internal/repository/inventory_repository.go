// Package repository persists WMS inventory data.
package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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

// ErrEndlessPolicyNotFound indicates missing endless policy mapping.
var ErrEndlessPolicyNotFound = errors.New("endless policy not found")

func composeEndlessPolicy(skuCode, itemName, warehouseCode string, minStock, maxStock *float64, onHand float64, uom string, updatedAt time.Time) entity.EndlessPolicy {
	policyKind := entity.EndlessPolicyNone
	var reorderPoint *float64
	var safetyStock *float64
	if minStock != nil && maxStock != nil {
		policyKind = entity.EndlessPolicyMinMax
		safetyStock = minStock
	} else if minStock != nil && maxStock == nil {
		policyKind = entity.EndlessPolicyROP
		reorderPoint = minStock
		safetyStock = minStock
	}
	return entity.EndlessPolicy{
		ID:           entity.DeterministicUUID("endless", warehouseCode, skuCode),
		ItemCode:     skuCode,
		ItemName:     itemName,
		Warehouse:    warehouseCode,
		Policy:       policyKind,
		Min:          minStock,
		Max:          maxStock,
		ReorderPoint: reorderPoint,
		SafetyStock:  safetyStock,
		Note:         "",
		Available:    onHand,
		UpdatedAt:    updatedAt,
		UOM:          uom,
	}
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

// ListBalances returns enriched stock balances with catalog metadata.
func (r *InventoryRepository) ListBalances(ctx context.Context, warehouse, sku string, limit int) ([]entity.StockBalance, error) {
	if limit <= 0 || limit > 500 {
		limit = 200
	}
	filterSKU := strings.TrimSpace(sku)
	query := `
SELECT
    s.sku,
    s.warehouse,
    s.quantity,
    s.uom,
    s.updated_at,
    COALESCE(i.name, '') AS item_name,
    COALESCE(cat.name, '') AS category_name
FROM wms.stock s
LEFT JOIN wms.item i ON i.sku = s.sku
LEFT JOIN wms.catalog_node cat ON cat.id = i.category_id
WHERE ($1 = '' OR s.warehouse = $1)
  AND ($2 = '' OR s.sku ILIKE $2)
ORDER BY s.updated_at DESC
LIMIT $3
`
	argSKU := filterSKU
	if argSKU != "" && !strings.Contains(argSKU, "%") {
		argSKU = "%" + argSKU + "%"
	}
	rows, err := r.pool.Query(ctx, query, strings.TrimSpace(warehouse), argSKU, limit)
	if err != nil {
		return nil, fmt.Errorf("list stock balances: %w", err)
	}
	defer rows.Close()

	balances := make([]entity.StockBalance, 0)
	for rows.Next() {
		var (
			skuCode       string
			warehouseCode string
			quantity      float64
			uom           string
			updatedAt     time.Time
			itemName      string
			category      string
		)
		if err := rows.Scan(&skuCode, &warehouseCode, &quantity, &uom, &updatedAt, &itemName, &category); err != nil {
			return nil, fmt.Errorf("scan stock balances: %w", err)
		}
		balances = append(balances, entity.StockBalance{
			ID:        entity.DeterministicUUID("balance", warehouseCode, skuCode),
			ItemCode:  skuCode,
			ItemName:  itemName,
			Category:  category,
			Warehouse: warehouseCode,
			OnHand:    quantity,
			UOM:       uom,
			UpdatedAt: updatedAt,
		})
	}

	return balances, rows.Err()
}

// ListAvailability aggregates availability numbers using receipts for on-order items.
func (r *InventoryRepository) ListAvailability(ctx context.Context, warehouse, sku string, limit int) ([]entity.StockAvailability, error) {
	if limit <= 0 || limit > 500 {
		limit = 200
	}
	warehouse = strings.TrimSpace(warehouse)
	filterSKU := strings.TrimSpace(sku)
	argSKU := filterSKU
	if argSKU != "" && !strings.Contains(argSKU, "%") {
		argSKU = "%" + argSKU + "%"
	}
	query := `
WITH stock AS (
    SELECT s.sku,
           s.warehouse,
           s.quantity,
           s.uom,
           s.updated_at
    FROM wms.stock s
    WHERE ($1 = '' OR s.warehouse = $1)
      AND ($2 = '' OR s.sku ILIKE $2)
),
pending AS (
    SELECT rl.sku,
           w.code AS warehouse,
           SUM(GREATEST(rl.expected_quantity - rl.received_quantity, 0)) AS on_order
    FROM wms.receipt_line rl
    INNER JOIN wms.receipt r ON r.id = rl.receipt_id
    INNER JOIN wms.warehouse w ON w.id = r.warehouse_id
    WHERE ($1 = '' OR w.code = $1)
      AND ($2 = '' OR rl.sku ILIKE $2)
      AND r.status NOT IN ('cancelled')
    GROUP BY rl.sku, w.code
)
SELECT
    st.sku,
    st.warehouse,
    st.quantity,
    st.uom,
    st.updated_at,
    COALESCE(pending.on_order, 0) AS on_order,
    COALESCE(i.name, '') AS item_name,
    COALESCE(cat.name, '') AS category_name
FROM stock st
LEFT JOIN pending ON pending.sku = st.sku AND pending.warehouse = st.warehouse
LEFT JOIN wms.item i ON i.sku = st.sku
LEFT JOIN wms.catalog_node cat ON cat.id = i.category_id
ORDER BY st.updated_at DESC
LIMIT $3
`
	rows, err := r.pool.Query(ctx, query, warehouse, argSKU, limit)
	if err != nil {
		return nil, fmt.Errorf("list stock availability: %w", err)
	}
	defer rows.Close()

	items := make([]entity.StockAvailability, 0)
	for rows.Next() {
		var (
			skuCode       string
			warehouseCode string
			onHand        float64
			uom           string
			updatedAt     time.Time
			onOrder       float64
			itemName      string
			category      string
		)
		if err := rows.Scan(&skuCode, &warehouseCode, &onHand, &uom, &updatedAt, &onOrder, &itemName, &category); err != nil {
			return nil, fmt.Errorf("scan stock availability: %w", err)
		}
		reserved := 0.0
		available := onHand - reserved
		if available < 0 {
			available = 0
		}
		availability := entity.StockAvailability{
			ID:        entity.DeterministicUUID("availability", warehouseCode, skuCode),
			ItemCode:  skuCode,
			ItemName:  itemName,
			Category:  category,
			Warehouse: warehouseCode,
			OnHand:    onHand,
			Reserved:  reserved,
			OnOrder:   onOrder,
			Available: available,
			UOM:       uom,
			UpdatedAt: updatedAt,
		}
		items = append(items, availability)
	}

	return items, rows.Err()
}

// ListEndlessPolicies returns endless policy configuration.
func (r *InventoryRepository) ListEndlessPolicies(ctx context.Context, warehouse string) ([]entity.EndlessPolicy, error) {
	query := `
SELECT
    i.sku,
    i.name,
    w.code AS warehouse_code,
    iw.min_stock,
    iw.max_stock,
    COALESCE(s.quantity, 0) AS on_hand,
    COALESCE(s.uom, cat_unit.code) AS uom,
    COALESCE(s.updated_at, NOW()) AS updated_at
FROM wms.item_warehouse iw
INNER JOIN wms.item i ON i.id = iw.item_id
INNER JOIN wms.warehouse w ON w.id = iw.warehouse_id
LEFT JOIN wms.stock s ON s.sku = i.sku AND s.warehouse = w.code
LEFT JOIN wms.catalog_node cat_unit ON cat_unit.id = i.unit_id
WHERE ($1 = '' OR w.code = $1)
ORDER BY i.sku, w.code
`
	rows, err := r.pool.Query(ctx, query, strings.TrimSpace(warehouse))
	if err != nil {
		return nil, fmt.Errorf("list endless policies: %w", err)
	}
	defer rows.Close()

	policies := make([]entity.EndlessPolicy, 0)
	for rows.Next() {
		var (
			skuCode       string
			itemName      string
			warehouseCode string
			minStock      *float64
			maxStock      *float64
			onHand        float64
			uom           string
			updatedAt     time.Time
		)
		if err := rows.Scan(&skuCode, &itemName, &warehouseCode, &minStock, &maxStock, &onHand, &uom, &updatedAt); err != nil {
			return nil, fmt.Errorf("scan endless policies: %w", err)
		}
		policies = append(policies, composeEndlessPolicy(skuCode, itemName, warehouseCode, minStock, maxStock, onHand, uom, updatedAt))
	}

	return policies, rows.Err()
}

func (r *InventoryRepository) fetchEndlessPolicy(ctx context.Context, skuCode, warehouseCode string) (entity.EndlessPolicy, error) {
	query := `
SELECT
    i.sku,
    i.name,
    w.code AS warehouse_code,
    iw.min_stock,
    iw.max_stock,
    COALESCE(s.quantity, 0) AS on_hand,
    COALESCE(s.uom, cat_unit.code) AS uom,
    COALESCE(s.updated_at, NOW()) AS updated_at
FROM wms.item_warehouse iw
INNER JOIN wms.item i ON i.id = iw.item_id
INNER JOIN wms.warehouse w ON w.id = iw.warehouse_id
LEFT JOIN wms.stock s ON s.sku = i.sku AND s.warehouse = w.code
LEFT JOIN wms.catalog_node cat_unit ON cat_unit.id = i.unit_id
WHERE i.sku = $1 AND w.code = $2
`
	row := r.pool.QueryRow(ctx, query, skuCode, warehouseCode)
	var (
		itemName  string
		minStock  *float64
		maxStock  *float64
		onHand    float64
		uom       string
		updatedAt time.Time
	)
	if err := row.Scan(&skuCode, &itemName, &warehouseCode, &minStock, &maxStock, &onHand, &uom, &updatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.EndlessPolicy{}, ErrEndlessPolicyNotFound
		}
		return entity.EndlessPolicy{}, fmt.Errorf("fetch endless policy: %w", err)
	}
	return composeEndlessPolicy(skuCode, itemName, warehouseCode, minStock, maxStock, onHand, uom, updatedAt), nil
}

// UpdateEndlessPolicy upserts endless policy thresholds.
func (r *InventoryRepository) UpdateEndlessPolicy(ctx context.Context, input entity.EndlessPolicyUpdate) (entity.EndlessPolicy, error) {
	sku := strings.TrimSpace(input.ItemCode)
	warehouse := strings.TrimSpace(input.Warehouse)
	if sku == "" || warehouse == "" {
		return entity.EndlessPolicy{}, fmt.Errorf("itemCode and warehouse are required")
	}

	var minVal any
	var maxVal any

	switch input.Policy {
	case entity.EndlessPolicyMinMax:
		if input.Min == nil || input.Max == nil {
			return entity.EndlessPolicy{}, fmt.Errorf("min and max must be provided for MINMAX policy")
		}
		minVal = *input.Min
		maxVal = *input.Max
	case entity.EndlessPolicyROP:
		if input.ReorderPoint == nil {
			return entity.EndlessPolicy{}, fmt.Errorf("reorderPoint must be provided for ROP policy")
		}
		minVal = *input.ReorderPoint
		maxVal = nil
	case entity.EndlessPolicyNone:
		minVal = nil
		maxVal = nil
	default:
		return entity.EndlessPolicy{}, fmt.Errorf("unsupported policy: %s", input.Policy)
	}

	query := `
INSERT INTO wms.item_warehouse (item_id, warehouse_id, status, min_stock, max_stock)
SELECT i.id, w.id, 'active', $3, $4
FROM wms.item i, wms.warehouse w
WHERE i.sku = $1 AND w.code = $2
ON CONFLICT (item_id, warehouse_id) DO UPDATE
	SET min_stock = EXCLUDED.min_stock,
	    max_stock = EXCLUDED.max_stock,
	    status = EXCLUDED.status
RETURNING 1
`
	if tag, err := r.pool.Exec(ctx, query, sku, warehouse, minVal, maxVal); err != nil {
		return entity.EndlessPolicy{}, fmt.Errorf("update endless policy: %w", err)
	} else if tag.RowsAffected() == 0 {
		return entity.EndlessPolicy{}, ErrEndlessPolicyNotFound
	}

	return r.fetchEndlessPolicy(ctx, sku, warehouse)
}

// ResetEndlessPolicy clears endless policy thresholds.
func (r *InventoryRepository) ResetEndlessPolicy(ctx context.Context, input entity.EndlessPolicyReset) (entity.EndlessPolicy, error) {
	return r.UpdateEndlessPolicy(ctx, entity.EndlessPolicyUpdate{
		ItemCode:  input.ItemCode,
		Warehouse: input.Warehouse,
		Policy:    entity.EndlessPolicyNone,
	})
}

// ListMovements returns recent stock movements based on receipts.
func (r *InventoryRepository) ListMovements(ctx context.Context, warehouse string, limit int) ([]entity.StockMovement, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	query := `
SELECT
    rl.id,
    COALESCE(r.received_at, r.updated_at, r.created_at) AS occurred_at,
    rl.sku,
    rl.item_name,
    w.code AS warehouse_code,
    rl.received_quantity,
    rl.unit_code,
    r.code AS reference_code,
    r.notes,
    r.updated_by
FROM wms.receipt_line rl
INNER JOIN wms.receipt r ON r.id = rl.receipt_id
INNER JOIN wms.warehouse w ON w.id = r.warehouse_id
WHERE ($1 = '' OR w.code = $1)
ORDER BY occurred_at DESC NULLS LAST
LIMIT $2
`
	rows, err := r.pool.Query(ctx, query, strings.TrimSpace(warehouse), limit)
	if err != nil {
		return nil, fmt.Errorf("list stock movements: %w", err)
	}
	defer rows.Close()

	movements := make([]entity.StockMovement, 0)
	for rows.Next() {
		var (
			lineID        uuid.UUID
			occurredAt    time.Time
			skuCode       string
			itemName      string
			warehouseCode string
			quantity      float64
			uom           string
			reference     string
			note          *string
			updatedBy     *uuid.UUID
		)
		if err := rows.Scan(&lineID, &occurredAt, &skuCode, &itemName, &warehouseCode, &quantity, &uom, &reference, &note, &updatedBy); err != nil {
			return nil, fmt.Errorf("scan stock movements: %w", err)
		}
		movement := entity.StockMovement{
			ID:          lineID,
			OccurredAt:  occurredAt,
			Type:        entity.MovementReceipt,
			ItemCode:    skuCode,
			ItemName:    itemName,
			ToWarehouse: warehouseCode,
			Quantity:    quantity,
			UOM:         uom,
			Reference:   reference,
		}
		if note != nil {
			movement.Note = *note
		}
		if updatedBy != nil {
			movement.Actor = updatedBy.String()
		}
		movements = append(movements, movement)
	}

	return movements, rows.Err()
}
