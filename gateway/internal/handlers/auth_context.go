package handlers

import (
	"github.com/gofiber/fiber/v2"

	"asfppro/gateway/internal/auth"
	corepkg "asfppro/gateway/internal/core"
)

const userContextKey = "auth.user"
const subjectContextKey = "rbac.subject"

func currentUser(c *fiber.Ctx) (auth.User, bool) {
	if value := c.Locals(userContextKey); value != nil {
		if user, ok := value.(auth.User); ok {
			return user, true
		}
	}
	return auth.User{}, false
}

func currentSubject(c *fiber.Ctx) (corepkg.Subject, bool) {
	if value := c.Locals(subjectContextKey); value != nil {
		if subject, ok := value.(corepkg.Subject); ok {
			return subject, true
		}
	}
	return corepkg.Subject{}, false
}
