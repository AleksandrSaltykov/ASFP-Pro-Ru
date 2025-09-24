package handlers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"asfppro/pkg/health"
	"asfppro/pkg/s3"
)

// Health exposes liveness probe.
func Health() fiber.Handler {
	return health.LiveHandler()
}

// Ready exposes readiness probe checking critical dependencies.
func Ready(pool *pgxpool.Pool, storage *s3.Client) fiber.Handler {
	if pool == nil || storage == nil {
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
			Name:    "s3",
			Timeout: 5 * time.Second,
			Probe: func(ctx context.Context) error {
				return storage.Ping(ctx)
			},
		},
	}
	return health.FiberHandler(checks)
}
