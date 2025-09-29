package handlers

import (
	"context"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"asfppro/pkg/audit"
)

// AuditListHandler exposes aggregated audit log entries for authorized users.
func AuditListHandler(recorder *audit.Recorder, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, ok := currentUser(c)
		if !ok {
			return fiber.ErrUnauthorized
		}

		if !hasRole(user.Roles, "admin") {
			return fiber.ErrForbidden
		}

		if recorder == nil {
			return fiber.NewError(fiber.StatusServiceUnavailable, "audit recorder not configured")
		}

		filter, err := buildFilter(c)
		if err != nil {
			return err
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		records, err := recorder.List(ctx, filter)
		if err != nil {
			logger.Error().Err(err).Msg("list audit records")
			return fiber.NewError(fiber.StatusInternalServerError, "cannot load audit log")
		}

		return c.JSON(fiber.Map{"items": records})
	}
}

func buildFilter(c *fiber.Ctx) (audit.Filter, error) {
	filter := audit.Filter{}
	if actor := strings.TrimSpace(c.Query("actorId")); actor != "" {
		id, err := uuid.Parse(actor)
		if err != nil {
			return filter, fiber.NewError(fiber.StatusBadRequest, "invalid actorId")
		}
		filter.ActorID = id
	}

	filter.Entity = c.Query("entity")
	filter.EntityID = c.Query("entityId")
	filter.Limit = c.QueryInt("limit", 50)

	if after := strings.TrimSpace(c.Query("afterId")); after != "" {
		value, err := strconv.ParseInt(after, 10, 64)
		if err != nil {
			return filter, fiber.NewError(fiber.StatusBadRequest, "invalid afterId")
		}
		if value > 0 {
			filter.AfterID = value
		}
	}

	return filter, nil
}

func hasRole(roles []string, target string) bool {
	for _, role := range roles {
		if strings.EqualFold(strings.TrimSpace(role), target) {
			return true
		}
	}
	return false
}
