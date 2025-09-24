package handler

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"asfppro/pkg/health"
	"asfppro/pkg/queue"
)

// Health returns liveness probe handler.
func Health() fiber.Handler {
	return health.LiveHandler()
}

// Ready validates storage and queue dependencies.
func Ready(pool *pgxpool.Pool, publisher *queue.Publisher) fiber.Handler {
	if pool == nil || publisher == nil {
		return func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"status": "degraded",
				"error":  "dependencies not initialised",
			})
		}
	}

	checks := []health.Check{
		{
			Name:    "postgres",
			Timeout: 3 * time.Second,
			Probe: func(ctx context.Context) error {
				return pool.Ping(ctx)
			},
		},
		{
			Name:    "tarantool",
			Timeout: 3 * time.Second,
			Probe: func(ctx context.Context) error {
				return publisher.Ping(ctx)
			},
		},
	}

	return health.FiberHandler(checks)
}
