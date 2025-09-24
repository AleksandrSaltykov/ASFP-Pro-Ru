package handlers

import (
	_ "embed"
	"github.com/gofiber/fiber/v2"
)

//go:embed home.html
var homePage string

// Home renders the landing page for the control center.
func Home() fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Type("html", "utf-8")
		return c.SendString(homePage)
	}
}
