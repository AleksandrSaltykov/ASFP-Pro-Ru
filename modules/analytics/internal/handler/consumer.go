package handler

import (
	"context"
	"encoding/json"
	"time"

	"github.com/rs/zerolog"

	"asfppro/modules/analytics/internal/repository"
	"asfppro/pkg/queue"
)

// Consumer handles incoming Tarantool jobs.
type Consumer struct {
	queue  *queue.Consumer
	repo   *repository.EventRepository
	logger zerolog.Logger
}

// NewConsumer constructs consumer worker.
func NewConsumer(queue *queue.Consumer, repo *repository.EventRepository, logger zerolog.Logger) *Consumer {
	return &Consumer{queue: queue, repo: repo, logger: logger}
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
			var payload struct {
				ID         string  `json:"id"`
				Amount     float64 `json:"amount"`
				Currency   string  `json:"currency"`
				CustomerID string  `json:"customerId"`
				CreatedAt  string  `json:"createdAt"`
			}
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
				Amount:     payload.Amount,
				Currency:   payload.Currency,
				CustomerID: payload.CustomerID,
				CreatedAt:  ts,
			}); err != nil {
				c.logger.Error().Err(err).Msg("persist deal analytics")
			}
		default:
			c.logger.Warn().Str("event", message.EventType).Msg("skip unknown event")
		}
	}
}
