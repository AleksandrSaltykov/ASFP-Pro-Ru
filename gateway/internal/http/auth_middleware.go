// Package http contains gateway HTTP middleware.
package http

import (
	"encoding/base64"
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"

	"asfppro/gateway/internal/auth"
)

const userContextKey = "auth.user"

func authMiddleware(authSvc *auth.Service, logger zerolog.Logger) fiber.Handler {
	realmHeader := "Basic realm=\"ASFP-Pro\""

	return func(c *fiber.Ctx) error {
		username, password, ok := parseBasicAuth(c.Get(fiber.HeaderAuthorization))
		if !ok {
			c.Response().Header.Set("WWW-Authenticate", realmHeader)
			return fiber.ErrUnauthorized
		}

		user, err := authSvc.Authenticate(c.Context(), username, password)
		if err != nil {
			c.Response().Header.Set("WWW-Authenticate", realmHeader)
			if errors.Is(err, auth.ErrInactive) {
				logger.Warn().Str("email", username).Msg("inactive user attempted to authenticate")
				return fiber.ErrForbidden
			}
			logger.Warn().Str("email", username).Msg("authentication failed")
			return fiber.ErrUnauthorized
		}

		c.Locals(userContextKey, user)
		return c.Next()
	}
}

func parseBasicAuth(header string) (string, string, bool) {
	header = strings.TrimSpace(header)
	if header == "" {
		return "", "", false
	}

	const prefix = "Basic "
	if !strings.HasPrefix(strings.ToLower(header), strings.ToLower(prefix)) {
		return "", "", false
	}

	payload := strings.TrimSpace(header[len(prefix):])
	decoded, err := base64.StdEncoding.DecodeString(payload)
	if err != nil {
		return "", "", false
	}

	parts := strings.SplitN(string(decoded), ":", 2)
	if len(parts) != 2 {
		return "", "", false
	}

	return parts[0], parts[1], true
}

// CurrentUser extracts authenticated user from Fiber context.
func CurrentUser(c *fiber.Ctx) (auth.User, bool) {
	if value := c.Locals(userContextKey); value != nil {
		if user, ok := value.(auth.User); ok {
			return user, true
		}
	}
	return auth.User{}, false
}
