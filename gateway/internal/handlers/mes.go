package handlers

import (
	"encoding/json"
	"errors"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"asfppro/gateway/internal/mes"
)

// RegisterMESRoutes wires minimal MES endpoints via gateway.
func RegisterMESRoutes(router fiber.Router, svc *mes.Service, guard func(resource, action string) fiber.Handler, logger zerolog.Logger) {
	if router == nil || svc == nil {
		return
	}
	if guard == nil {
		guard = func(_, _ string) fiber.Handler {
			return func(c *fiber.Ctx) error { return c.Next() }
		}
	}

	router.Get("/api/v1/mes/work-centers", guard("mes.work_center", "read"), listMesWorkCenters(svc))
	router.Post("/api/v1/mes/work-centers", guard("mes.work_center", "write"), createMesWorkCenter(svc, logger))
	router.Put("/api/v1/mes/work-centers/:id", guard("mes.work_center", "write"), updateMesWorkCenter(svc, logger))

	router.Get("/api/v1/mes/operations", guard("mes.operation", "read"), listMesOperations(svc))
	router.Post("/api/v1/mes/operations", guard("mes.operation", "write"), createMesOperation(svc, logger))
	router.Put("/api/v1/mes/operations/:id", guard("mes.operation", "write"), updateMesOperation(svc, logger))

	router.Get("/api/v1/mes/routes", guard("mes.route", "read"), listMesRoutes(svc))
	router.Post("/api/v1/mes/routes", guard("mes.route", "write"), createMesRoute(svc, logger))
	router.Put("/api/v1/mes/routes/:id", guard("mes.route", "write"), updateMesRoute(svc, logger))
}

func listMesWorkCenters(svc *mes.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		limit := parseQueryLimit(c.Query("limit"), 50)
		centers, err := svc.ListWorkCenters(c.Context(), limit)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": centers})
	}
}

func createMesWorkCenter(svc *mes.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req struct {
			Code        string `json:"code"`
			Name        string `json:"name"`
			Description string `json:"description"`
		}
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		wc, err := svc.CreateWorkCenter(c.Context(), mes.CreateWorkCenterInput{
			Code:        req.Code,
			Name:        req.Name,
			Description: req.Description,
		})
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		logger.Info().Str("workCenterId", wc.ID.String()).Msg("gateway mes work center created")
		return c.Status(fiber.StatusCreated).JSON(wc)
	}
}

func updateMesWorkCenter(svc *mes.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid work center id")
		}

		var payload map[string]any
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := mes.UpdateWorkCenterInput{}
		if name, ok := payload["name"].(string); ok {
			value := strings.TrimSpace(name)
			input.Name = &value
		}
		if desc, ok := payload["description"].(string); ok {
			value := desc
			input.Description = &value
		}

		wc, err := svc.UpdateWorkCenter(c.Context(), id, input)
		if err != nil {
			status := fiber.StatusBadRequest
			if errors.Is(err, mes.ErrWorkCenterNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}

		logger.Info().Str("workCenterId", wc.ID.String()).Msg("gateway mes work center updated")
		return c.JSON(wc)
	}
}

func listMesOperations(svc *mes.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		limit := parseQueryLimit(c.Query("limit"), 50)
		ops, err := svc.ListOperations(c.Context(), limit)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": ops})
	}
}

func createMesOperation(svc *mes.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req struct {
			Code        string `json:"code"`
			Name        string `json:"name"`
			Description string `json:"description"`
			Duration    int    `json:"defaultDurationMinutes"`
		}
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		op, err := svc.CreateOperation(c.Context(), mes.CreateOperationInput{
			Code:        req.Code,
			Name:        req.Name,
			Description: req.Description,
			DurationMin: req.Duration,
		})
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		logger.Info().Str("operationId", op.ID.String()).Msg("gateway mes operation created")
		return c.Status(fiber.StatusCreated).JSON(op)
	}
}

func updateMesOperation(svc *mes.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid operation id")
		}

		var payload map[string]any
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := mes.UpdateOperationInput{}
		if name, ok := payload["name"].(string); ok {
			value := strings.TrimSpace(name)
			input.Name = &value
		}
		if desc, ok := payload["description"].(string); ok {
			value := desc
			input.Description = &value
		}
		if durationRaw, ok := payload["defaultDurationMinutes"]; ok {
			switch v := durationRaw.(type) {
			case float64:
				val := int(v)
				input.DurationMin = &val
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
			if errors.Is(err, mes.ErrOperationNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}

		logger.Info().Str("operationId", op.ID.String()).Msg("gateway mes operation updated")
		return c.JSON(op)
	}
}

func listMesRoutes(svc *mes.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		limit := parseQueryLimit(c.Query("limit"), 50)
		routes, err := svc.ListRoutes(c.Context(), limit)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": routes})
	}
}

func createMesRoute(svc *mes.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req struct {
			Code        string `json:"code"`
			Name        string `json:"name"`
			Description string `json:"description"`
		}
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		route, err := svc.CreateRoute(c.Context(), mes.CreateRouteInput{
			Code:        req.Code,
			Name:        req.Name,
			Description: req.Description,
		})
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		logger.Info().Str("routeId", route.ID.String()).Msg("gateway mes route created")
		return c.Status(fiber.StatusCreated).JSON(route)
	}
}

func updateMesRoute(svc *mes.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid route id")
		}

		var payload map[string]any
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := mes.UpdateRouteInput{}
		if name, ok := payload["name"].(string); ok {
			value := strings.TrimSpace(name)
			input.Name = &value
		}
		if desc, ok := payload["description"].(string); ok {
			value := desc
			input.Description = &value
		}

		route, err := svc.UpdateRoute(c.Context(), id, input)
		if err != nil {
			status := fiber.StatusBadRequest
			if errors.Is(err, mes.ErrRouteNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}

		logger.Info().Str("routeId", route.ID.String()).Msg("gateway mes route updated")
		return c.JSON(route)
	}
}

func parseQueryLimit(raw string, fallback int) int {
	if strings.TrimSpace(raw) == "" {
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
