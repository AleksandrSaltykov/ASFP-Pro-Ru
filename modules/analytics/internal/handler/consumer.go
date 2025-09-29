// Package handler processes analytics queue events.
package handler

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"asfppro/modules/analytics/internal/repository"
	"asfppro/pkg/audit"
	"asfppro/pkg/queue"
)

// Consumer handles incoming Tarantool jobs.
type Consumer struct {
	queue   *queue.Consumer
	repo    *repository.EventRepository
	auditor *audit.Recorder
	logger  zerolog.Logger
}

type dealCreatedPayload struct {
	ID         string  `json:"id"`
	Stage      string  `json:"stage"`
	Amount     float64 `json:"amount"`
	Currency   string  `json:"currency"`
	CustomerID string  `json:"customerId"`
	CreatedBy  string  `json:"createdBy"`
	CreatedAt  string  `json:"createdAt"`
}

// NewConsumer constructs consumer worker.
func NewConsumer(queue *queue.Consumer, repo *repository.EventRepository, auditor *audit.Recorder, logger zerolog.Logger) *Consumer {
	return &Consumer{queue: queue, repo: repo, auditor: auditor, logger: logger}
}

// Run begins polling loop until ctx cancelled.
func (c *Consumer) Run(ctx context.Context) {
	c.logger.Info().Msg("analytics consumer started")
	for {
		select {
		case <-ctx.Done():
			c.logger.Info().Msg("analytics consumer stopped")
			return
		default:
		}

		var message struct {
			EventType string          `json:"event_type"`
			Payload   json.RawMessage `json:"payload"`
		}

		_, err := c.queue.Next(ctx, &message)
		if err != nil {
			c.logger.Error().Err(err).Msg("fetch event")
			time.Sleep(time.Second)
			continue
		}
		if len(message.Payload) == 0 {
			time.Sleep(250 * time.Millisecond)
			continue
		}

		switch message.EventType {
		case "DealCreated":
			var payload dealCreatedPayload
			if err := json.Unmarshal(message.Payload, &payload); err != nil {
				c.logger.Error().Err(err).Bytes("payload", message.Payload).Msg("decode deal event")
				continue
			}
			ts, err := time.Parse(time.RFC3339, payload.CreatedAt)
			if err != nil {
				c.logger.Error().Err(err).Str("value", payload.CreatedAt).Msg("parse timestamp")
				continue
			}
			if err := c.repo.InsertDealCreated(ctx, repository.DealCreatedEvent{
				ID:         payload.ID,
				Stage:      payload.Stage,
				Amount:     payload.Amount,
				Currency:   payload.Currency,
				CustomerID: payload.CustomerID,
				CreatedBy:  payload.CreatedBy,
				CreatedAt:  ts,
			}); err != nil {
				c.logger.Error().Err(err).Msg("persist deal analytics")
				continue
			}
			c.recordAudit(ctx, payload, ts)
		default:
			c.logger.Warn().Str("event", message.EventType).Msg("skip unknown event")
		}
	}
}

func (c *Consumer) recordAudit(ctx context.Context, payload dealCreatedPayload, occurred time.Time) {
	if c.auditor == nil {
		return
	}

	actorID := uuid.Nil
	if parsed, err := uuid.Parse(strings.TrimSpace(payload.CreatedBy)); err == nil {
		actorID = parsed
	}

	entryPayload := map[string]any{
		"eventId":    payload.ID,
		"stage":      payload.Stage,
		"amount":     payload.Amount,
		"currency":   payload.Currency,
		"customerId": payload.CustomerID,
		"createdAt":  occurred.Format(time.RFC3339),
	}

	if err := c.auditor.Record(ctx, audit.Entry{
		ActorID:  actorID,
		Action:   "analytics.event.deal_created",
		Entity:   "analytics.event",
		EntityID: payload.ID,
		Payload:  entryPayload,
	}); err != nil {
		c.logger.Error().Err(err).Str("eventId", payload.ID).Msg("audit analytics event")
	}
}
