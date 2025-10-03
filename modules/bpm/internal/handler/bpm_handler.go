package handler

import (
	"encoding/json"
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"asfppro/modules/bpm/internal/entity"
	"asfppro/modules/bpm/internal/repository"
	"asfppro/modules/bpm/internal/service"
)

// RegisterRoutes регистрирует BPM minimal API.
func RegisterRoutes(router fiber.Router, svc *service.Service, logger zerolog.Logger) {
	if router == nil || svc == nil {
		return
	}

	api := router.Group("/api/v1/bpm")
	api.Get("/processes", listProcesses(svc))
	api.Post("/processes", createProcess(svc, logger))
	api.Put("/processes/:id", updateProcess(svc, logger))

	api.Get("/forms", listForms(svc))
	api.Post("/forms", createForm(svc, logger))
	api.Put("/forms/:id", updateForm(svc, logger))

	api.Get("/tasks", listTasks(svc))
	api.Post("/tasks", createTask(svc, logger))
	api.Put("/tasks/:id", updateTask(svc, logger))
}

func listProcesses(svc *service.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		filter := entity.ProcessListFilter{
			Limit:  parseLimit(c.Query("limit"), 50),
			Status: c.Query("status"),
		}
		processes, err := svc.ListProcesses(c.Context(), filter)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		return c.JSON(fiber.Map{"items": processes})
	}
}

func createProcess(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req entity.ProcessCreateInput
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		proc, err := svc.CreateProcess(c.Context(), req)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		logger.Info().Str("processId", proc.ID).Msg("bpm process created")
		return c.Status(fiber.StatusCreated).JSON(proc)
	}
}

func updateProcess(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid process id")
		}

		var payload map[string]json.RawMessage
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := entity.ProcessUpdateInput{}
		if raw, ok := payload["name"]; ok {
			var name string
			if err := json.Unmarshal(raw, &name); err != nil {
				return fiber.NewError(fiber.StatusBadRequest, "invalid name")
			}
			input.Name = &name
		}
		if raw, ok := payload["description"]; ok {
			var desc string
			if err := json.Unmarshal(raw, &desc); err != nil {
				return fiber.NewError(fiber.StatusBadRequest, "invalid description")
			}
			input.Description = &desc
		}
		if raw, ok := payload["status"]; ok {
			var status string
			if err := json.Unmarshal(raw, &status); err != nil {
				return fiber.NewError(fiber.StatusBadRequest, "invalid status")
			}
			input.Status = &status
		}
		if raw, ok := payload["definition"]; ok {
			clone := make(json.RawMessage, len(raw))
			copy(clone, raw)
			input.Definition = &clone
		}
		if raw, ok := payload["version"]; ok {
			var version int
			if err := json.Unmarshal(raw, &version); err != nil {
				return fiber.NewError(fiber.StatusBadRequest, "invalid version")
			}
			input.Version = &version
		}

		proc, err := svc.UpdateProcess(c.Context(), id, input)
		if err != nil {
			status := fiber.StatusBadRequest
			if errors.Is(err, repository.ErrProcessNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}
		logger.Info().Str("processId", proc.ID).Msg("bpm process updated")
		return c.JSON(proc)
	}
}

func listForms(svc *service.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		forms, err := svc.ListForms(c.Context(), parseLimit(c.Query("limit"), 50))
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": forms})
	}
}

func createForm(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req entity.FormCreateInput
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		form, err := svc.CreateForm(c.Context(), req)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		logger.Info().Str("formId", form.ID).Msg("bpm form created")
		return c.Status(fiber.StatusCreated).JSON(form)
	}
}

func updateForm(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid form id")
		}

		var payload map[string]json.RawMessage
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := entity.FormUpdateInput{}
		if raw, ok := payload["name"]; ok {
			var name string
			if err := json.Unmarshal(raw, &name); err != nil {
				return fiber.NewError(fiber.StatusBadRequest, "invalid name")
			}
			input.Name = &name
		}
		if raw, ok := payload["version"]; ok {
			var version int
			if err := json.Unmarshal(raw, &version); err != nil {
				return fiber.NewError(fiber.StatusBadRequest, "invalid version")
			}
			input.Version = &version
		}
		if raw, ok := payload["schema"]; ok {
			clone := make(json.RawMessage, len(raw))
			copy(clone, raw)
			input.Schema = &clone
		}
		if raw, ok := payload["uiSchema"]; ok {
			clone := make(json.RawMessage, len(raw))
			copy(clone, raw)
			input.UISchema = &clone
		}

		form, err := svc.UpdateForm(c.Context(), id, input)
		if err != nil {
			status := fiber.StatusBadRequest
			if errors.Is(err, repository.ErrFormNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}
		logger.Info().Str("formId", form.ID).Msg("bpm form updated")
		return c.JSON(form)
	}
}

func listTasks(svc *service.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		filter := entity.TaskListFilter{
			Limit:  parseLimit(c.Query("limit"), 50),
			Status: c.Query("status"),
		}
		tasks, err := svc.ListTasks(c.Context(), filter)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
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
		logger.Info().Str("taskId", task.ID).Msg("bpm task created")
		return c.Status(fiber.StatusCreated).JSON(task)
	}
}

func updateTask(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid task id")
		}

		var payload struct {
			Title    *string          `json:"title"`
			Status   *string          `json:"status"`
			Assignee *string          `json:"assignee"`
			DueAt    *string          `json:"dueAt"`
			Payload  *json.RawMessage `json:"payload"`
		}
		if err := c.BodyParser(&payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := entity.TaskUpdateInput{
			Title:    payload.Title,
			Status:   payload.Status,
			Assignee: payload.Assignee,
			DueAt:    payload.DueAt,
			Payload:  payload.Payload,
		}

		task, err := svc.UpdateTask(c.Context(), id, input)
		if err != nil {
			status := fiber.StatusBadRequest
			if errors.Is(err, repository.ErrTaskNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}
		logger.Info().Str("taskId", task.ID).Msg("bpm task updated")
		return c.JSON(task)
	}
}

func parseLimit(raw string, fallback int) int {
	if raw == "" {
		return fallback
	}
	v, err := strconv.Atoi(raw)
	if err != nil || v <= 0 {
		return fallback
	}
	if v > 100 {
		return 100
	}
	return v
}
