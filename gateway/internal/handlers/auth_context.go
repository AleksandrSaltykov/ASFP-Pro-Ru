package handlers

import (
	"github.com/gofiber/fiber/v2"

	"asfppro/gateway/internal/auth"
)

const userContextKey = "auth.user"

func currentUser(c *fiber.Ctx) (auth.User, bool) {
	if value := c.Locals(userContextKey); value != nil {
		if user, ok := value.(auth.User); ok {
			return user, true
		}
	}
	return auth.User{}, false
}
