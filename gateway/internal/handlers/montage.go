package handlers

import (
	"encoding/json"
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"asfppro/gateway/internal/montage"
)

// RegisterMontageRoutes регистрирует минимальные маршруты монтажа.
func RegisterMontageRoutes(router fiber.Router, svc *montage.Service, guard func(resource, action string) fiber.Handler, logger zerolog.Logger) {
	if router == nil || svc == nil {
		return
	}
	if guard == nil {
		guard = func(_, _ string) fiber.Handler {
			return func(c *fiber.Ctx) error { return c.Next() }
		}
	}

	router.Get("/api/v1/montage/crews", guard("montage.crew", "read"), listMontageCrews(svc))
	router.Post("/api/v1/montage/crews", guard("montage.crew", "write"), createMontageCrew(svc, logger))
	router.Put("/api/v1/montage/crews/:id", guard("montage.crew", "write"), updateMontageCrew(svc, logger))

	router.Get("/api/v1/montage/vehicles", guard("montage.vehicle", "read"), listMontageVehicles(svc))
	router.Post("/api/v1/montage/vehicles", guard("montage.vehicle", "write"), createMontageVehicle(svc, logger))
	router.Put("/api/v1/montage/vehicles/:id", guard("montage.vehicle", "write"), updateMontageVehicle(svc, logger))

	router.Get("/api/v1/montage/tasks", guard("montage.task", "read"), listMontageTasks(svc))
	router.Post("/api/v1/montage/tasks", guard("montage.task", "write"), createMontageTask(svc, logger))
	router.Put("/api/v1/montage/tasks/:id", guard("montage.task", "write"), updateMontageTask(svc, logger))
}

func listMontageCrews(svc *montage.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		limit := parseQueryLimit(c.Query("limit"), 50)
		crews, err := svc.ListCrews(c.Context(), limit)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": crews})
	}
}

func createMontageCrew(svc *montage.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req struct {
			Code           string `json:"code"`
			Name           string `json:"name"`
			Specialization string `json:"specialization"`
		}
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		crew, err := svc.CreateCrew(c.Context(), montage.CreateCrewInput{
			Code:           req.Code,
			Name:           req.Name,
			Specialization: req.Specialization,
		})
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		logger.Info().Str("crewId", crew.ID.String()).Msg("gateway montage crew created")
		return c.Status(fiber.StatusCreated).JSON(crew)
	}
}

func updateMontageCrew(svc *montage.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid crew id")
		}

		var payload map[string]any
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := montage.UpdateCrewInput{}
		if name, ok := payload["name"].(string); ok {
			trim := strings.TrimSpace(name)
			input.Name = &trim
		}
		if spec, ok := payload["specialization"].(string); ok {
			trim := strings.TrimSpace(spec)
			input.Specialization = &trim
		}

		crew, err := svc.UpdateCrew(c.Context(), id, input)
		if err != nil {
			status := fiber.StatusBadRequest
			if errors.Is(err, montage.ErrCrewNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}

		logger.Info().Str("crewId", crew.ID.String()).Msg("gateway montage crew updated")
		return c.JSON(crew)
	}
}

func listMontageVehicles(svc *montage.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		limit := parseQueryLimit(c.Query("limit"), 50)
		vehicles, err := svc.ListVehicles(c.Context(), limit)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": vehicles})
	}
}

func createMontageVehicle(svc *montage.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req struct {
			Code     string `json:"code"`
			Name     string `json:"name"`
			Plate    string `json:"plate"`
			Capacity string `json:"capacity"`
		}
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		vehicle, err := svc.CreateVehicle(c.Context(), montage.CreateVehicleInput{
			Code:     req.Code,
			Name:     req.Name,
			Plate:    req.Plate,
			Capacity: req.Capacity,
		})
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		logger.Info().Str("vehicleId", vehicle.ID.String()).Msg("gateway montage vehicle created")
		return c.Status(fiber.StatusCreated).JSON(vehicle)
	}
}

func updateMontageVehicle(svc *montage.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid vehicle id")
		}

		var payload map[string]any
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := montage.UpdateVehicleInput{}
		if name, ok := payload["name"].(string); ok {
			trim := strings.TrimSpace(name)
			input.Name = &trim
		}
		if plate, ok := payload["plate"].(string); ok {
			trim := strings.TrimSpace(plate)
			input.Plate = &trim
		}
		if capacity, ok := payload["capacity"].(string); ok {
			trim := strings.TrimSpace(capacity)
			input.Capacity = &trim
		}

		vehicle, err := svc.UpdateVehicle(c.Context(), id, input)
		if err != nil {
			status := fiber.StatusBadRequest
			if errors.Is(err, montage.ErrVehicleNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}

		logger.Info().Str("vehicleId", vehicle.ID.String()).Msg("gateway montage vehicle updated")
		return c.JSON(vehicle)
	}
}

func listMontageTasks(svc *montage.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		limit := parseQueryLimit(c.Query("limit"), 50)
		tasks, err := svc.ListTasks(c.Context(), limit)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": tasks})
	}
}

func createMontageTask(svc *montage.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req montage.CreateTaskInput
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		task, err := svc.CreateTask(c.Context(), req)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		logger.Info().Str("taskId", task.ID.String()).Msg("gateway montage task created")
		return c.Status(fiber.StatusCreated).JSON(task)
	}
}

func updateMontageTask(svc *montage.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid task id")
		}

		var payload map[string]any
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := montage.UpdateTaskInput{}
		if title, ok := payload["title"].(string); ok {
			trim := strings.TrimSpace(title)
			input.Title = &trim
		}
		if status, ok := payload["status"].(string); ok {
			trim := strings.TrimSpace(status)
			input.Status = &trim
		}
		if crew, ok := payload["crewId"].(string); ok {
			trim := strings.TrimSpace(crew)
			input.CrewID = &trim
		}
		if vehicle, ok := payload["vehicleId"].(string); ok {
			trim := strings.TrimSpace(vehicle)
			input.VehicleID = &trim
		}
		if scheduled, ok := payload["scheduledAt"].(string); ok {
			trim := strings.TrimSpace(scheduled)
			input.ScheduledAt = &trim
		}
		if location, ok := payload["location"].(string); ok {
			trim := strings.TrimSpace(location)
			input.Location = &trim
		}

		task, err := svc.UpdateTask(c.Context(), id, input)
		if err != nil {
			status := fiber.StatusBadRequest
			if errors.Is(err, montage.ErrTaskNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}

		logger.Info().Str("taskId", task.ID.String()).Msg("gateway montage task updated")
		return c.JSON(task)
	}
}
