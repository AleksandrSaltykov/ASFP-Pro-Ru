package http

import "github.com/gofiber/fiber/v2"

// OpenAPI returns handler which exposes static OpenAPI document.
func OpenAPI(spec []byte) fiber.Handler {
	if len(spec) == 0 {
		return func(c *fiber.Ctx) error {
			return fiber.NewError(fiber.StatusInternalServerError, "openapi spec not available")
		}
	}

	return func(c *fiber.Ctx) error {
		c.Set(fiber.HeaderContentType, fiber.MIMEApplicationJSON)
		return c.Send(spec)
	}
}
