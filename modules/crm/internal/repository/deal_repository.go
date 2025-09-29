// Package repository persists CRM deal data.
package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"asfppro/modules/crm/internal/entity"
)

// DealRepository persists deals in Postgres.
type DealRepository struct {
	pool *pgxpool.Pool
}

// NewDealRepository returns repository instance.
func NewDealRepository(pool *pgxpool.Pool) *DealRepository {
	return &DealRepository{pool: pool}
}

// Create inserts deal row and returns stored entity.
func (r *DealRepository) Create(ctx context.Context, deal entity.Deal) (entity.Deal, error) {
	query := `
	INSERT INTO crm.deals (id, title, customer_id, stage, amount, currency, created_by)
	VALUES ($1, $2, $3, $4, $5, $6, $7)
	RETURNING created_at
	`
	row := r.pool.QueryRow(ctx, query, deal.ID, deal.Title, deal.CustomerID, deal.Stage, deal.Amount, deal.Currency, deal.CreatedBy)
	if err := row.Scan(&deal.CreatedAt); err != nil {
		return entity.Deal{}, fmt.Errorf("insert deal: %w", err)
	}
	return deal, nil
}

// List returns limited deals page.
func (r *DealRepository) List(ctx context.Context, limit int) ([]entity.Deal, error) {
	query := `
	SELECT id, title, customer_id, stage, amount, currency, created_by, created_at
	FROM crm.deals
	ORDER BY created_at DESC
	LIMIT $1
	`
	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("select deals: %w", err)
	}
	defer rows.Close()

	var deals []entity.Deal
	for rows.Next() {
		var d entity.Deal
		if err := rows.Scan(&d.ID, &d.Title, &d.CustomerID, &d.Stage, &d.Amount, &d.Currency, &d.CreatedBy, &d.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan deal: %w", err)
		}
		deals = append(deals, d)
	}

	return deals, rows.Err()
}

// History returns chronological events for specific deal.
func (r *DealRepository) History(ctx context.Context, dealID string, limit int) ([]entity.DealEvent, error) {
	query := `
	SELECT id, deal_id, event_type, payload, created_at
	FROM crm.deal_events
	WHERE deal_id = $1
	ORDER BY created_at DESC
	LIMIT $2
	`
	rows, err := r.pool.Query(ctx, query, dealID, limit)
	if err != nil {
		return nil, fmt.Errorf("select deal events: %w", err)
	}
	defer rows.Close()

	var events []entity.DealEvent
	for rows.Next() {
		var (
			e       entity.DealEvent
			payload []byte
		)
		if err := rows.Scan(&e.ID, &e.DealID, &e.EventType, &payload, &e.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan deal event: %w", err)
		}
		e.Payload = payload
		events = append(events, e)
	}

	return events, rows.Err()
}

// AppendEvent writes deal event row.
func (r *DealRepository) AppendEvent(ctx context.Context, event entity.DealEvent) error {
	query := `
	INSERT INTO crm.deal_events (deal_id, event_type, payload)
	VALUES ($1, $2, $3)
	`
	if _, err := r.pool.Exec(ctx, query, event.DealID, event.EventType, event.Payload); err != nil {
		return fmt.Errorf("insert deal event: %w", err)
	}
	return nil
}
