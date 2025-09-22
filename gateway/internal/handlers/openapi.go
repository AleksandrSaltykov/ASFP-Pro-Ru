package handlers

import "github.com/gofiber/fiber/v2"

// OpenAPI serves static OpenAPI description.
func OpenAPI(openapi []byte) fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
		return c.Send(openapi)
	}
}
