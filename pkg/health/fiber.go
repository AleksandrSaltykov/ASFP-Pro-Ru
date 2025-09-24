package health

import (
	"context"

	"github.com/gofiber/fiber/v2"
)

// FiberHandler returns Fiber handler evaluating provided checks.
func FiberHandler(checks []Check) fiber.Handler {
	return func(c *fiber.Ctx) error {
		ctx := c.UserContext()
		if ctx == nil {
			ctx = context.Background()
		}

		results := Run(ctx, checks)
		payload := fiber.Map{
			"status": "ok",
			"checks": map[string]string{},
		}
		status := fiber.StatusOK

		details := payload["checks"].(map[string]string)
		for name, err := range results {
			if err != nil {
				status = fiber.StatusServiceUnavailable
				details[name] = err.Error()
				continue
			}
			details[name] = "ok"
		}

		if len(details) == 0 {
			delete(payload, "checks")
		}

		return c.Status(status).JSON(payload)
	}
}

// LiveHandler returns a minimal 200 OK handler.
func LiveHandler() fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"status": "ok"})
	}
}
