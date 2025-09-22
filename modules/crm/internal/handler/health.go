package handler

import "github.com/gofiber/fiber/v2"

// Health returns healthcheck handler.
func Health() fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"status": "ok"})
	}
}
