package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"asfppro/modules/wms/internal/entity"
)

type dbQuerier interface {
	Query(context.Context, string, ...any) (pgx.Rows, error)
	QueryRow(context.Context, string, ...any) pgx.Row
}

// InboundRepository stores inbound receipt documents.
type InboundRepository struct {
	pool *pgxpool.Pool
}

// NewInboundRepository builds repository.
func NewInboundRepository(pool *pgxpool.Pool) *InboundRepository {
	return &InboundRepository{pool: pool}
}

// ListReceipts returns receipts with optional filters.
func (r *InboundRepository) ListReceipts(ctx context.Context, filter entity.ReceiptFilter) ([]entity.Receipt, error) {
	limit := filter.Limit
	if limit <= 0 || limit > 200 {
		limit = 50
	}

	query := `
SELECT
	r.id,
	r.code,
	COALESCE(r.external_reference, ''),
	COALESCE(r.status, 'draft'),
	r.warehouse_id,
	COALESCE(w.name, ''),
	r.supplier_id,
	COALESCE(r.supplier_name, ''),
	COALESCE(r.supplier_inn, ''),
	COALESCE(r.currency, 'RUB'),
	r.expected_at,
	r.received_at,
	COALESCE(r.total_amount, 0)::float8,
	COALESCE(r.total_vat, 0)::float8,
	COALESCE(cnt.lines_count, 0),
	COALESCE(r.notes, ''),
	COALESCE(r.metadata, '{}'::jsonb),
	r.created_by,
	r.updated_by,
	r.created_at,
	r.updated_at
FROM wms.receipt r
LEFT JOIN wms.warehouse w ON w.id = r.warehouse_id
LEFT JOIN (
	SELECT receipt_id, COUNT(*) AS lines_count
	FROM wms.receipt_line
	GROUP BY receipt_id
) cnt ON cnt.receipt_id = r.id
%s
ORDER BY r.created_at DESC
LIMIT $%d`

	conditions := make([]string, 0, 3)
	args := make([]any, 0, 4)

	if filter.WarehouseID != nil && *filter.WarehouseID != uuid.Nil {
		conditions = append(conditions, fmt.Sprintf("r.warehouse_id = $%d", len(args)+1))
		args = append(args, *filter.WarehouseID)
	}
	if status := strings.TrimSpace(filter.Status); status != "" {
		conditions = append(conditions, fmt.Sprintf("r.status = $%d", len(args)+1))
		args = append(args, status)
	}
	if search := strings.TrimSpace(filter.Search); search != "" {
		clause := fmt.Sprintf("(r.code ILIKE $%d OR r.supplier_name ILIKE $%d)", len(args)+1, len(args)+1)
		conditions = append(conditions, clause)
		args = append(args, "%"+search+"%")
	}

	where := ""
	if len(conditions) > 0 {
		where = "WHERE " + strings.Join(conditions, " AND ")
	}

	args = append(args, limit)
	rows, err := r.pool.Query(ctx, fmt.Sprintf(query, where, len(args)), args...)
	if err != nil {
		return nil, fmt.Errorf("list receipts: %w", err)
	}
	defer rows.Close()

	receipts := make([]entity.Receipt, 0)
	for rows.Next() {
		var receipt entity.Receipt
		var externalRef string
		var supplierInn string
		var currency string
		var metadataBytes []byte
		var notes string
		var createdBy, updatedBy uuid.UUID
		var supplierID sql.NullString

		if err := rows.Scan(
			&receipt.ID,
			&receipt.Code,
			&externalRef,
			&receipt.Status,
			&receipt.WarehouseID,
			&receipt.WarehouseName,
			&supplierID,
			&receipt.SupplierName,
			&supplierInn,
			&currency,
			&receipt.ExpectedAt,
			&receipt.ReceivedAt,
			&receipt.TotalAmount,
			&receipt.TotalVat,
			&receipt.LinesCount,
			&notes,
			&metadataBytes,
			&createdBy,
			&updatedBy,
			&receipt.CreatedAt,
			&receipt.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan receipt: %w", err)
		}

		if externalRef != "" {
			receipt.ExternalReference = externalRef
		}
		if supplierInn != "" {
			receipt.SupplierInn = supplierInn
		}
		if currency != "" {
			receipt.Currency = currency
		} else {
			receipt.Currency = "RUB"
		}
		if supplierID.Valid {
			id, err := uuid.Parse(supplierID.String)
			if err == nil {
				receipt.SupplierID = &id
			}
		}
		if createdBy != uuid.Nil {
			receipt.CreatedBy = &createdBy
		}
		if updatedBy != uuid.Nil {
			receipt.UpdatedBy = &updatedBy
		}
		if notes != "" {
			receipt.Notes = notes
		}

		receipt.Metadata = decodeJSON(metadataBytes)

		receipts = append(receipts, receipt)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate receipts: %w", err)
	}
	return receipts, nil
}

// GetReceipt returns receipt with lines.
func (r *InboundRepository) GetReceipt(ctx context.Context, id uuid.UUID) (entity.ReceiptDetails, error) {
	return r.fetchReceipt(ctx, r.pool, id)
}

// CreateReceipt inserts receipt and lines.
func (r *InboundRepository) CreateReceipt(ctx context.Context, receipt entity.Receipt, lines []entity.ReceiptLine) (entity.ReceiptDetails, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return entity.ReceiptDetails{}, fmt.Errorf("begin tx: %w", err)
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	insertReceipt := `
INSERT INTO wms.receipt (
	id, code, external_reference, status, warehouse_id,
	supplier_id, supplier_name, supplier_inn, currency,
	expected_at, received_at, total_amount, total_vat,
	notes, metadata, created_by, updated_by
)
VALUES (
	$1, $2, NULLIF($3, ''), $4, $5,
	$6, $7, NULLIF($8, ''), $9,
	$10, $11, $12, $13,
	NULLIF($14, ''), $15, $16, $17
)
RETURNING created_at, updated_at`

	metadataBytes := encodeJSON(receipt.Metadata)

	var supplierID *uuid.UUID
	if receipt.SupplierID != nil && *receipt.SupplierID != uuid.Nil {
		supplierID = receipt.SupplierID
	}

	var createdBy, updatedBy *uuid.UUID
	if receipt.CreatedBy != nil && *receipt.CreatedBy != uuid.Nil {
		createdBy = receipt.CreatedBy
	}
	if receipt.UpdatedBy != nil && *receipt.UpdatedBy != uuid.Nil {
		updatedBy = receipt.UpdatedBy
	}

	row := tx.QueryRow(ctx, insertReceipt,
		receipt.ID,
		receipt.Code,
		receipt.ExternalReference,
		receipt.Status,
		receipt.WarehouseID,
		supplierID,
		receipt.SupplierName,
		receipt.SupplierInn,
		receipt.Currency,
		receipt.ExpectedAt,
		receipt.ReceivedAt,
		receipt.TotalAmount,
		receipt.TotalVat,
		receipt.Notes,
		metadataBytes,
		createdBy,
		updatedBy,
	)
	if err = row.Scan(&receipt.CreatedAt, &receipt.UpdatedAt); err != nil {
		return entity.ReceiptDetails{}, fmt.Errorf("insert receipt: %w", err)
	}

	if err = r.upsertLines(ctx, tx, receipt.ID, lines); err != nil {
		return entity.ReceiptDetails{}, err
	}

	if err = tx.Commit(ctx); err != nil {
		return entity.ReceiptDetails{}, fmt.Errorf("commit tx: %w", err)
	}

	return r.fetchReceipt(ctx, r.pool, receipt.ID)
}

// UpdateReceipt updates receipt and lines set.
func (r *InboundRepository) UpdateReceipt(ctx context.Context, receipt entity.Receipt, lines []entity.ReceiptLine) (entity.ReceiptDetails, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return entity.ReceiptDetails{}, fmt.Errorf("begin tx: %w", err)
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	updateReceipt := `
UPDATE wms.receipt
SET
	code = $2,
	external_reference = NULLIF($3, ''),
	status = $4,
	warehouse_id = $5,
	supplier_id = $6,
	supplier_name = $7,
	supplier_inn = NULLIF($8, ''),
	currency = $9,
	expected_at = $10,
	received_at = $11,
	total_amount = $12,
	total_vat = $13,
	notes = NULLIF($14, ''),
	metadata = $15,
	updated_by = $16,
	updated_at = NOW()
WHERE id = $1`

	metadataBytes := encodeJSON(receipt.Metadata)

	var supplierID *uuid.UUID
	if receipt.SupplierID != nil && *receipt.SupplierID != uuid.Nil {
		supplierID = receipt.SupplierID
	}
	var updatedBy *uuid.UUID
	if receipt.UpdatedBy != nil && *receipt.UpdatedBy != uuid.Nil {
		updatedBy = receipt.UpdatedBy
	}

	_, err = tx.Exec(ctx, updateReceipt,
		receipt.ID,
		receipt.Code,
		receipt.ExternalReference,
		receipt.Status,
		receipt.WarehouseID,
		supplierID,
		receipt.SupplierName,
		receipt.SupplierInn,
		receipt.Currency,
		receipt.ExpectedAt,
		receipt.ReceivedAt,
		receipt.TotalAmount,
		receipt.TotalVat,
		receipt.Notes,
		metadataBytes,
		updatedBy,
	)
	if err != nil {
		return entity.ReceiptDetails{}, fmt.Errorf("update receipt: %w", err)
	}

	if err = r.pruneReceiptLines(ctx, tx, receipt.ID, lines); err != nil {
		return entity.ReceiptDetails{}, err
	}
	if err = r.upsertLines(ctx, tx, receipt.ID, lines); err != nil {
		return entity.ReceiptDetails{}, err
	}

	if err = tx.Commit(ctx); err != nil {
		return entity.ReceiptDetails{}, fmt.Errorf("commit tx: %w", err)
	}

	return r.fetchReceipt(ctx, r.pool, receipt.ID)
}

// DeleteReceipt removes receipt with lines.
func (r *InboundRepository) DeleteReceipt(ctx context.Context, id uuid.UUID) error {
	cmd, err := r.pool.Exec(ctx, "DELETE FROM wms.receipt WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("delete receipt: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return fmt.Errorf("receipt not found")
	}
	return nil
}

// LoadItemsContext returns item information used to enrich lines.
func (r *InboundRepository) LoadItemsContext(ctx context.Context, itemIDs []uuid.UUID) (map[uuid.UUID]struct {
	SKU      string
	Name     string
	UnitID   uuid.UUID
	UnitCode string
}, error) {
	if len(itemIDs) == 0 {
		return map[uuid.UUID]struct {
			SKU      string
			Name     string
			UnitID   uuid.UUID
			UnitCode string
		}{}, nil
	}
	query := `
SELECT i.id, i.sku, i.name, i.unit_id, u.code
FROM wms.item i
JOIN wms.catalog_node u ON u.id = i.unit_id
WHERE i.id = ANY($1)`
	rows, err := r.pool.Query(ctx, query, itemIDs)
	if err != nil {
		return nil, fmt.Errorf("load items context: %w", err)
	}
	defer rows.Close()

	result := make(map[uuid.UUID]struct {
		SKU      string
		Name     string
		UnitID   uuid.UUID
		UnitCode string
	}, len(itemIDs))

	for rows.Next() {
		var id, unitID uuid.UUID
		var sku, name, unitCode string
		if err := rows.Scan(&id, &sku, &name, &unitID, &unitCode); err != nil {
			return nil, fmt.Errorf("scan item context: %w", err)
		}
		result[id] = struct {
			SKU      string
			Name     string
			UnitID   uuid.UUID
			UnitCode string
		}{
			SKU:      sku,
			Name:     name,
			UnitID:   unitID,
			UnitCode: unitCode,
		}
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate items context: %w", err)
	}
	return result, nil
}

// LoadUnitCodes returns unit codes for provided identifiers.
func (r *InboundRepository) LoadUnitCodes(ctx context.Context, unitIDs []uuid.UUID) (map[uuid.UUID]string, error) {
	if len(unitIDs) == 0 {
		return map[uuid.UUID]string{}, nil
	}
	query := `SELECT id, code FROM wms.catalog_node WHERE id = ANY($1)`
	rows, err := r.pool.Query(ctx, query, unitIDs)
	if err != nil {
		return nil, fmt.Errorf("load unit codes: %w", err)
	}
	defer rows.Close()

	codes := make(map[uuid.UUID]string, len(unitIDs))
	for rows.Next() {
		var id uuid.UUID
		var code string
		if err := rows.Scan(&id, &code); err != nil {
			return nil, fmt.Errorf("scan unit code: %w", err)
		}
		codes[id] = code
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate unit codes: %w", err)
	}
	return codes, nil
}

func (r *InboundRepository) fetchReceipt(ctx context.Context, querier dbQuerier, id uuid.UUID) (entity.ReceiptDetails, error) {
	const headerQuery = `
SELECT
	r.id,
	r.code,
	COALESCE(r.external_reference, ''),
	COALESCE(r.status, 'draft'),
	r.warehouse_id,
	COALESCE(w.name, ''),
	r.supplier_id,
	COALESCE(r.supplier_name, ''),
	COALESCE(r.supplier_inn, ''),
	COALESCE(r.currency, 'RUB'),
	r.expected_at,
	r.received_at,
	COALESCE(r.total_amount, 0)::float8,
	COALESCE(r.total_vat, 0)::float8,
	COALESCE(r.notes, ''),
	COALESCE(r.metadata, '{}'::jsonb),
	r.created_by,
	r.updated_by,
	r.created_at,
	r.updated_at
FROM wms.receipt r
LEFT JOIN wms.warehouse w ON w.id = r.warehouse_id
WHERE r.id = $1`

	var receipt entity.ReceiptDetails
	var externalRef, supplierInn, currency, notes string
	var metadataBytes []byte
	var createdBy, updatedBy uuid.UUID
	var supplierID sql.NullString

	err := querier.QueryRow(ctx, headerQuery, id).Scan(
		&receipt.ID,
		&receipt.Code,
		&externalRef,
		&receipt.Status,
		&receipt.WarehouseID,
		&receipt.WarehouseName,
		&supplierID,
		&receipt.SupplierName,
		&supplierInn,
		&currency,
		&receipt.ExpectedAt,
		&receipt.ReceivedAt,
		&receipt.TotalAmount,
		&receipt.TotalVat,
		&notes,
		&metadataBytes,
		&createdBy,
		&updatedBy,
		&receipt.CreatedAt,
		&receipt.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return entity.ReceiptDetails{}, fmt.Errorf("receipt not found")
		}
		return entity.ReceiptDetails{}, fmt.Errorf("get receipt: %w", err)
	}

	if externalRef != "" {
		receipt.ExternalReference = externalRef
	}
	if supplierInn != "" {
		receipt.SupplierInn = supplierInn
	}
	if currency != "" {
		receipt.Currency = currency
	} else {
		receipt.Currency = "RUB"
	}
	if notes != "" {
		receipt.Notes = notes
	}
	if supplierID.Valid {
		if parsed, err := uuid.Parse(supplierID.String); err == nil {
			receipt.SupplierID = &parsed
		}
	}
	if createdBy != uuid.Nil {
		receipt.CreatedBy = &createdBy
	}
	if updatedBy != uuid.Nil {
		receipt.UpdatedBy = &updatedBy
	}

	receipt.Metadata = decodeJSON(metadataBytes)

	const linesQuery = `
SELECT
	id,
	receipt_id,
	item_id,
	sku,
	item_name,
	unit_id,
	unit_code,
	quantity::float8,
	expected_quantity::float8,
	received_quantity::float8,
	unit_cost::float8,
	vat_rate,
	vat_amount::float8,
	total_cost::float8,
	COALESCE(batch_number, ''),
	production_date,
	expiration_date,
	COALESCE(metadata, '{}'::jsonb),
	created_at,
	updated_at
FROM wms.receipt_line
WHERE receipt_id = $1
ORDER BY created_at ASC`

	rows, err := querier.Query(ctx, linesQuery, receipt.ID)
	if err != nil {
		return entity.ReceiptDetails{}, fmt.Errorf("list receipt lines: %w", err)
	}
	defer rows.Close()

	receipt.Lines = make([]entity.ReceiptLine, 0)
	for rows.Next() {
		var line entity.ReceiptLine
		var batch string
		var metadata []byte
		var vatRate sql.NullFloat64

		if err := rows.Scan(
			&line.ID,
			&line.ReceiptID,
			&line.ItemID,
			&line.SKU,
			&line.ItemName,
			&line.UnitID,
			&line.UnitCode,
			&line.Quantity,
			&line.ExpectedQuantity,
			&line.ReceivedQuantity,
			&line.UnitCost,
			&vatRate,
			&line.VatAmount,
			&line.TotalCost,
			&batch,
			&line.ProductionDate,
			&line.ExpirationDate,
			&metadata,
			&line.CreatedAt,
			&line.UpdatedAt,
		); err != nil {
			return entity.ReceiptDetails{}, fmt.Errorf("scan receipt line: %w", err)
		}

		if vatRate.Valid {
			line.VatRate = &vatRate.Float64
		}
		if batch != "" {
			line.BatchNumber = batch
		}
		line.Metadata = decodeJSON(metadata)

		receipt.Lines = append(receipt.Lines, line)
	}
	if err := rows.Err(); err != nil {
		return entity.ReceiptDetails{}, fmt.Errorf("iterate receipt lines: %w", err)
	}

	receipt.LinesCount = len(receipt.Lines)

	return receipt, nil
}

func (r *InboundRepository) upsertLines(ctx context.Context, tx pgx.Tx, receiptID uuid.UUID, lines []entity.ReceiptLine) error {
	if len(lines) == 0 {
		return nil
	}

	const query = `
INSERT INTO wms.receipt_line (
	id, receipt_id, item_id, sku, item_name,
	unit_id, unit_code, quantity, expected_quantity, received_quantity,
	unit_cost, vat_rate, vat_amount, total_cost,
	batch_number, production_date, expiration_date, metadata
) VALUES (
	$1, $2, $3, $4, $5,
	$6, $7, $8, $9, $10,
	$11, $12, $13, $14,
	NULLIF($15, ''), $16, $17, $18
)
ON CONFLICT (id) DO UPDATE SET
	item_id = EXCLUDED.item_id,
	sku = EXCLUDED.sku,
	item_name = EXCLUDED.item_name,
	unit_id = EXCLUDED.unit_id,
	unit_code = EXCLUDED.unit_code,
	quantity = EXCLUDED.quantity,
	expected_quantity = EXCLUDED.expected_quantity,
	received_quantity = EXCLUDED.received_quantity,
	unit_cost = EXCLUDED.unit_cost,
	vat_rate = EXCLUDED.vat_rate,
	vat_amount = EXCLUDED.vat_amount,
	total_cost = EXCLUDED.total_cost,
	batch_number = EXCLUDED.batch_number,
	production_date = EXCLUDED.production_date,
	expiration_date = EXCLUDED.expiration_date,
	metadata = EXCLUDED.metadata,
	updated_at = NOW()`

	for _, line := range lines {
		meta := encodeJSON(line.Metadata)
		var vatRate any
		if line.VatRate != nil {
			vatRate = *line.VatRate
		} else {
			vatRate = nil
		}

		if _, err := tx.Exec(ctx, query,
			line.ID,
			receiptID,
			line.ItemID,
			line.SKU,
			line.ItemName,
			line.UnitID,
			line.UnitCode,
			line.Quantity,
			line.ExpectedQuantity,
			line.ReceivedQuantity,
			line.UnitCost,
			vatRate,
			line.VatAmount,
			line.TotalCost,
			line.BatchNumber,
			line.ProductionDate,
			line.ExpirationDate,
			meta,
		); err != nil {
			return fmt.Errorf("upsert receipt line: %w", err)
		}
	}

	return nil
}

func (r *InboundRepository) pruneReceiptLines(ctx context.Context, tx pgx.Tx, receiptID uuid.UUID, lines []entity.ReceiptLine) error {
	keep := make([]uuid.UUID, 0, len(lines))
	for _, line := range lines {
		if line.ID != uuid.Nil {
			keep = append(keep, line.ID)
		}
	}

	query := `
DELETE FROM wms.receipt_line
WHERE receipt_id = $1
  AND NOT (id = ANY($2::uuid[]))`

	if _, err := tx.Exec(ctx, query, receiptID, keep); err != nil {
		return fmt.Errorf("prune receipt lines: %w", err)
	}
	return nil
}

func decodeJSON(data []byte) map[string]any {
	if len(data) == 0 || string(data) == "null" {
		return map[string]any{}
	}
	var result map[string]any
	if err := json.Unmarshal(data, &result); err != nil {
		return map[string]any{}
	}
	return result
}

func encodeJSON(value map[string]any) []byte {
	if value == nil {
		value = map[string]any{}
	}
	data, err := json.Marshal(value)
	if err != nil {
		return []byte("{}")
	}
	return data
}
