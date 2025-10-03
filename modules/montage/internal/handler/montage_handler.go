package handler

import (
	"encoding/json"
	"errors"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"asfppro/modules/montage/internal/entity"
	"asfppro/modules/montage/internal/repository"
	"asfppro/modules/montage/internal/service"
)

// RegisterRoutes подключает REST-эндпоинты.
func RegisterRoutes(app *fiber.App, svc *service.Service, logger zerolog.Logger) {
	if app == nil || svc == nil {
		return
	}

	api := app.Group("/api/v1/montage")
	api.Get("/crews", listCrews(svc))
	api.Post("/crews", createCrew(svc, logger))
	api.Put("/crews/:id", updateCrew(svc, logger))

	api.Get("/vehicles", listVehicles(svc))
	api.Post("/vehicles", createVehicle(svc, logger))
	api.Put("/vehicles/:id", updateVehicle(svc, logger))

	api.Get("/tasks", listTasks(svc))
	api.Post("/tasks", createTask(svc, logger))
	api.Put("/tasks/:id", updateTask(svc, logger))
}

func listCrews(svc *service.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		limit := parseLimit(c.Query("limit"), 50)
		crews, err := svc.ListCrews(c.Context(), limit)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": crews})
	}
}

func createCrew(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req entity.CrewCreateInput
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		crew, err := svc.CreateCrew(c.Context(), req)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		logger.Info().Str("crewId", crew.ID).Msg("montage crew created")
		return c.Status(fiber.StatusCreated).JSON(crew)
	}
}

func updateCrew(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid crew id")
		}

		var payload map[string]any
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := entity.CrewUpdateInput{}
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
			if errors.Is(err, repository.ErrCrewNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}

		logger.Info().Str("crewId", crew.ID).Msg("montage crew updated")
		return c.JSON(crew)
	}
}

func listVehicles(svc *service.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		limit := parseLimit(c.Query("limit"), 50)
		vehicles, err := svc.ListVehicles(c.Context(), limit)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": vehicles})
	}
}

func createVehicle(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req entity.VehicleCreateInput
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		vehicle, err := svc.CreateVehicle(c.Context(), req)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		logger.Info().Str("vehicleId", vehicle.ID).Msg("montage vehicle created")
		return c.Status(fiber.StatusCreated).JSON(vehicle)
	}
}

func updateVehicle(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid vehicle id")
		}

		var payload map[string]any
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := entity.VehicleUpdateInput{}
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
			if errors.Is(err, repository.ErrVehicleNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}

		logger.Info().Str("vehicleId", vehicle.ID).Msg("montage vehicle updated")
		return c.JSON(vehicle)
	}
}

func listTasks(svc *service.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		limit := parseLimit(c.Query("limit"), 50)
		tasks, err := svc.ListTasks(c.Context(), limit)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": tasks})
	}
}

func createTask(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req entity.TaskCreateInput
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		task, err := svc.CreateTask(c.Context(), req)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		logger.Info().Str("taskId", task.ID).Msg("montage task created")
		return c.Status(fiber.StatusCreated).JSON(task)
	}
}

func updateTask(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid task id")
		}

		var payload map[string]any
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := entity.TaskUpdateInput{}
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
			if errors.Is(err, repository.ErrTaskNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}

		logger.Info().Str("taskId", task.ID).Msg("montage task updated")
		return c.JSON(task)
	}
}

func parseLimit(raw string, fallback int) int {
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
