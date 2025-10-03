// Package handler hosts MES HTTP handlers.
package handler

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"

	"asfppro/pkg/health"
)

// Health reports service liveness.
func Health() fiber.Handler {
	return health.LiveHandler()
}

// Ready probes dependent services.
func Ready(pool *pgxpool.Pool) fiber.Handler {
	if pool == nil {
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
	}

	return health.FiberHandler(checks)
}
