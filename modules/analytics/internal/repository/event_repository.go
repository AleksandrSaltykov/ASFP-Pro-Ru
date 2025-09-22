package repository

import (
	"context"
	"fmt"
	"time"

	ch "github.com/ClickHouse/clickhouse-go/v2"
)

// EventRepository stores analytics events in ClickHouse.
type EventRepository struct {
	conn ch.Conn
}

// NewEventRepository builds repository.
func NewEventRepository(conn ch.Conn) *EventRepository {
	return &EventRepository{conn: conn}
}

// InsertDealCreated saves deal created analytics event.
func (r *EventRepository) InsertDealCreated(ctx context.Context, payload DealCreatedEvent) error {
	batch, err := r.conn.PrepareBatch(ctx, "INSERT INTO analytics.events")
	if err != nil {
		return fmt.Errorf("prepare batch: %w", err)
	}

	if err := batch.Append(time.Now(), payload.ID, payload.Amount, payload.Currency, payload.CustomerID, payload.CreatedAt); err != nil {
		return fmt.Errorf("append batch: %w", err)
	}

	return batch.Send()
}

// DealCreatedEvent mirrors payload from CRM event.
type DealCreatedEvent struct {
	ID         string
	Amount     float64
	Currency   string
	CustomerID string
	CreatedAt  time.Time
}
