package http

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"

	"asfppro/gateway/internal/auth"
	corepkg "asfppro/gateway/internal/core"
)

// PermissionGuard returns middleware that enforces resource/action access for authenticated users.
type PermissionGuard func(resource, action string) fiber.Handler

const subjectContextKey = "rbac.subject"

func permissionGuard(coreSvc *corepkg.Service, logger zerolog.Logger) PermissionGuard {
	return func(resource, action string) fiber.Handler {
		return func(c *fiber.Ctx) error {
			user, ok := CurrentUser(c)
			if !ok {
				return fiber.ErrUnauthorized
			}

			subject := toSubject(user)
			allowed, err := coreSvc.CheckPermission(c.Context(), subject, resource, action)
			if err != nil {
				logger.Error().Err(err).Str("resource", resource).Str("action", action).Msg("permission check failed")
				return fiber.ErrInternalServerError
			}
			if !allowed {
				return fiber.ErrForbidden
			}

			c.Locals(subjectContextKey, subject)
			return c.Next()
		}
	}
}

func toSubject(user auth.User) corepkg.Subject {
	roles := make([]corepkg.RoleGrant, 0, len(user.Roles))
	scopeSet := make(map[string]struct{})

	for _, role := range user.Roles {
		code := strings.TrimSpace(role.Code)
		if code == "" {
			continue
		}
		scope := strings.TrimSpace(role.Scope)
		roles = append(roles, corepkg.RoleGrant{Code: strings.ToLower(code), Scope: scope})
		if scope != "" {
			scopeSet[strings.ToUpper(scope)] = struct{}{}
		}
	}

	for _, unit := range user.OrgUnits {
		code := strings.TrimSpace(unit)
		if code != "" {
			scopeSet[strings.ToUpper(code)] = struct{}{}
		}
	}

	scopes := make([]string, 0, len(scopeSet))
	for scope := range scopeSet {
		scopes = append(scopes, scope)
	}

	return corepkg.Subject{
		ID:       user.ID,
		Roles:    roles,
		OrgUnits: scopes,
	}
}
