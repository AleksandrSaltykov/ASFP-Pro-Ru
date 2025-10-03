package analytics

import (
	"context"
	"fmt"
	"time"

	ch "github.com/ClickHouse/clickhouse-go/v2"
)

// Repository provides access to analytics data stored in ClickHouse.
type Repository struct {
	conn ch.Conn
}

// NewRepository creates a repository instance.
func NewRepository(conn ch.Conn) *Repository {
	return &Repository{conn: conn}
}

// ConversionReport returns aggregated conversion metrics between bounds.
func (r *Repository) ConversionReport(ctx context.Context, from, to time.Time) ([]ConversionRow, error) {
	query := `
SELECT
    toStartOfMonth(created_at) AS period,
    count() AS total_count,
    countIf(stage = 'won') AS won_count,
    sum(amount) AS total_amount,
    sumIf(amount, stage = 'won') AS won_amount
FROM analytics.events
WHERE event_type = 'deal.created' AND created_at BETWEEN ? AND ?
GROUP BY period
ORDER BY period`

	rows, err := r.conn.Query(ctx, query, from, to)
	if err != nil {
		return nil, fmt.Errorf("query conversion report: %w", err)
	}
	defer func() { _ = rows.Close() }()

	var result []ConversionRow
	for rows.Next() {
		var row ConversionRow
		if err := rows.Scan(&row.Period, &row.TotalCount, &row.WonCount, &row.TotalAmount, &row.WonAmount); err != nil {
			return nil, fmt.Errorf("scan conversion row: %w", err)
		}
		result = append(result, row)
	}

	return result, rows.Err()
}

// ManagerLoad aggregates deals by manager.
func (r *Repository) ManagerLoad(ctx context.Context, from, to time.Time) ([]ManagerLoadRow, error) {
	query := `
SELECT
    if(length(created_by) = 0, 'unknown', created_by) AS manager,
    count() AS total_count,
    sum(amount) AS total_amount
FROM analytics.events
WHERE event_type = 'deal.created' AND created_at BETWEEN ? AND ?
GROUP BY manager
ORDER BY total_count DESC`

	rows, err := r.conn.Query(ctx, query, from, to)
	if err != nil {
		return nil, fmt.Errorf("query manager load: %w", err)
	}
	defer func() { _ = rows.Close() }()

	var result []ManagerLoadRow
	for rows.Next() {
		var row ManagerLoadRow
		if err := rows.Scan(&row.Manager, &row.TotalCount, &row.TotalAmount); err != nil {
			return nil, fmt.Errorf("scan manager load row: %w", err)
		}
		result = append(result, row)
	}

	return result, rows.Err()
}
