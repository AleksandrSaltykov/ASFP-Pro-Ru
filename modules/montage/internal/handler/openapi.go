package handler

import "github.com/gofiber/fiber/v2"

// OpenAPI отдаёт спецификацию.
func OpenAPI(openapi []byte) fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
		return c.Send(openapi)
	}
}
