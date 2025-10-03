package handler

import (
	"encoding/json"
	"errors"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"asfppro/modules/mes/internal/entity"
	"asfppro/modules/mes/internal/repository"
	"asfppro/modules/mes/internal/service"
)

// RegisterRoutes wires MES endpoints.
func RegisterRoutes(app *fiber.App, svc *service.Service, logger zerolog.Logger) {
	if app == nil || svc == nil {
		return
	}

	api := app.Group("/api/v1/mes")
	api.Get("/work-centers", listWorkCentersHandler(svc))
	api.Post("/work-centers", createWorkCenterHandler(svc, logger))
	api.Put("/work-centers/:id", updateWorkCenterHandler(svc, logger))

	api.Get("/operations", listOperationsHandler(svc))
	api.Post("/operations", createOperationHandler(svc, logger))
	api.Put("/operations/:id", updateOperationHandler(svc, logger))

	api.Get("/routes", listRoutesHandler(svc))
	api.Post("/routes", createRouteHandler(svc, logger))
	api.Put("/routes/:id", updateRouteHandler(svc, logger))
}

func listWorkCentersHandler(svc *service.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		limit := parseLimit(c.Query("limit"), 50)
		centers, err := svc.ListWorkCenters(c.Context(), limit)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": centers})
	}
}

func createWorkCenterHandler(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var input entity.WorkCenterCreateInput
		if err := c.BodyParser(&input); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		center, err := svc.CreateWorkCenter(c.Context(), input)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		logger.Info().Str("workCenterId", center.ID).Msg("mes work center created")
		return c.Status(fiber.StatusCreated).JSON(center)
	}
}

func updateWorkCenterHandler(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid work center id")
		}

		var payload map[string]any
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := entity.WorkCenterUpdateInput{}
		if name, ok := payload["name"].(string); ok {
			input.Name = ptr(strings.TrimSpace(name))
		}
		if desc, ok := payload["description"].(string); ok {
			input.Description = ptr(desc)
		}

		center, err := svc.UpdateWorkCenter(c.Context(), id, input)
		if err != nil {
			status := fiber.StatusBadRequest
			if errors.Is(err, repository.ErrWorkCenterNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}

		logger.Info().Str("workCenterId", center.ID).Msg("mes work center updated")
		return c.JSON(center)
	}
}

func listOperationsHandler(svc *service.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		limit := parseLimit(c.Query("limit"), 50)
		ops, err := svc.ListOperations(c.Context(), limit)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": ops})
	}
}

func createOperationHandler(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var input entity.OperationCreateInput
		if err := c.BodyParser(&input); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		op, err := svc.CreateOperation(c.Context(), input)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		logger.Info().Str("operationId", op.ID).Msg("mes operation created")
		return c.Status(fiber.StatusCreated).JSON(op)
	}
}

func updateOperationHandler(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid operation id")
		}

		var payload map[string]any
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := entity.OperationUpdateInput{}
		if name, ok := payload["name"].(string); ok {
			input.Name = ptr(strings.TrimSpace(name))
		}
		if desc, ok := payload["description"].(string); ok {
			input.Description = ptr(desc)
		}
		if durationRaw, ok := payload["defaultDurationMinutes"]; ok {
			switch v := durationRaw.(type) {
			case float64:
				d := int(v)
				input.DurationMin = &d
			case string:
				trim := strings.TrimSpace(v)
				if trim != "" {
					parsed, err := strconv.Atoi(trim)
					if err != nil {
						return fiber.NewError(fiber.StatusBadRequest, "invalid defaultDurationMinutes")
					}
					input.DurationMin = &parsed
				}
			default:
				return fiber.NewError(fiber.StatusBadRequest, "invalid defaultDurationMinutes")
			}
		}

		op, err := svc.UpdateOperation(c.Context(), id, input)
		if err != nil {
			status := fiber.StatusBadRequest
			if errors.Is(err, repository.ErrOperationNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}

		logger.Info().Str("operationId", op.ID).Msg("mes operation updated")
		return c.JSON(op)
	}
}

func listRoutesHandler(svc *service.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		limit := parseLimit(c.Query("limit"), 50)
		routes, err := svc.ListRoutes(c.Context(), limit)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": routes})
	}
}

func createRouteHandler(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var input entity.RouteCreateInput
		if err := c.BodyParser(&input); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		route, err := svc.CreateRoute(c.Context(), input)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		logger.Info().Str("routeId", route.ID).Msg("mes route created")
		return c.Status(fiber.StatusCreated).JSON(route)
	}
}

func updateRouteHandler(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid route id")
		}

		var payload map[string]any
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := entity.RouteUpdateInput{}
		if name, ok := payload["name"].(string); ok {
			input.Name = ptr(strings.TrimSpace(name))
		}
		if desc, ok := payload["description"].(string); ok {
			input.Description = ptr(desc)
		}

		route, err := svc.UpdateRoute(c.Context(), id, input)
		if err != nil {
			status := fiber.StatusBadRequest
			if errors.Is(err, repository.ErrRouteNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}

		logger.Info().Str("routeId", route.ID).Msg("mes route updated")
		return c.JSON(route)
	}
}

func parseLimit(raw string, fallback int) int {
	if raw == "" {
		return fallback
	}
	limit, err := strconv.Atoi(raw)
	if err != nil || limit <= 0 {
		return fallback
	}
	if limit > 100 {
		return 100
	}
	return limit
}

func ptr[T any](v T) *T {
	return &v
}
