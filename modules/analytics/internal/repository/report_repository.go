package repository

import (
	"context"
	"time"
)

// ConversionRow represents conversion metrics per period.
type ConversionRow struct {
	Period      time.Time
	TotalCount  uint64
	WonCount    uint64
	TotalAmount float64
	WonAmount   float64
}

// ManagerLoadRow represents deals aggregated by owner.
type ManagerLoadRow struct {
	Manager     string
	TotalCount  uint64
	TotalAmount float64
}

// ConversionReport gathers aggregated conversion data within range.
func (r *EventRepository) ConversionReport(ctx context.Context, from, to time.Time) ([]ConversionRow, error) {
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
		return nil, err
	}
	defer func() { _ = rows.Close() }()

	var result []ConversionRow
	for rows.Next() {
		var row ConversionRow
		if err := rows.Scan(&row.Period, &row.TotalCount, &row.WonCount, &row.TotalAmount, &row.WonAmount); err != nil {
			return nil, err
		}
		result = append(result, row)
	}

	return result, rows.Err()
}

// ManagerLoad gathers deal counts grouped by manager (created_by).
func (r *EventRepository) ManagerLoad(ctx context.Context, from, to time.Time) ([]ManagerLoadRow, error) {
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
		return nil, err
	}
	defer func() { _ = rows.Close() }()

	var result []ManagerLoadRow
	for rows.Next() {
		var row ManagerLoadRow
		if err := rows.Scan(&row.Manager, &row.TotalCount, &row.TotalAmount); err != nil {
			return nil, err
		}
		result = append(result, row)
	}

	return result, rows.Err()
}
