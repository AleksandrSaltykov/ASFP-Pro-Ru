package handlers

import (
	"encoding/json"
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog"

	bpmpkg "asfppro/gateway/internal/bpm"
)

// RegisterBPMRoutes подключает BPM minimal API.
func RegisterBPMRoutes(router fiber.Router, svc *bpmpkg.Service, guard func(resource, action string) fiber.Handler, logger zerolog.Logger) {
	if router == nil || svc == nil {
		return
	}
	if guard == nil {
		guard = func(_, _ string) fiber.Handler {
			return func(c *fiber.Ctx) error { return c.Next() }
		}
	}

	api := router.Group("/api/v1/bpm")
	api.Get("/processes", guard("bpm.process", "read"), listBPMProcesses(svc))
	api.Post("/processes", guard("bpm.process", "write"), createBPMProcess(svc, logger))
	api.Put("/processes/:id", guard("bpm.process", "write"), updateBPMProcess(svc, logger))

	api.Get("/forms", guard("bpm.form", "read"), listBPMForms(svc))
	api.Post("/forms", guard("bpm.form", "write"), createBPMForm(svc, logger))
	api.Put("/forms/:id", guard("bpm.form", "write"), updateBPMForm(svc, logger))

	api.Get("/tasks", guard("bpm.task", "read"), listBPMTasks(svc))
	api.Post("/tasks", guard("bpm.task", "write"), createBPMTask(svc, logger))
	api.Put("/tasks/:id", guard("bpm.task", "write"), updateBPMTask(svc, logger))
}

func listBPMProcesses(svc *bpmpkg.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		filter := bpmpkg.ProcessListFilter{
			Limit:  parseQueryLimit(c.Query("limit"), 50),
			Status: c.Query("status"),
		}
		processes, err := svc.ListProcesses(c.Context(), filter)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		return c.JSON(fiber.Map{"items": processes})
	}
}

func createBPMProcess(svc *bpmpkg.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req bpmpkg.ProcessCreateInput
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		proc, err := svc.CreateProcess(c.Context(), req)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		logger.Info().Str("processId", proc.ID.String()).Msg("gateway bpm process created")
		return c.Status(fiber.StatusCreated).JSON(proc)
	}
}

func updateBPMProcess(svc *bpmpkg.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid process id")
		}

		var payload map[string]json.RawMessage
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := bpmpkg.ProcessUpdateInput{}
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
			if errors.Is(err, bpmpkg.ErrProcessNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}
		logger.Info().Str("processId", proc.ID.String()).Msg("gateway bpm process updated")
		return c.JSON(proc)
	}
}

func listBPMForms(svc *bpmpkg.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		forms, err := svc.ListForms(c.Context(), parseQueryLimit(c.Query("limit"), 50))
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": forms})
	}
}

func createBPMForm(svc *bpmpkg.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req struct {
			ProcessID string          `json:"processId"`
			Code      string          `json:"code"`
			Name      string          `json:"name"`
			Schema    json.RawMessage `json:"schema"`
			UISchema  json.RawMessage `json:"uiSchema"`
		}
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}
		processID, err := uuid.Parse(strings.TrimSpace(req.ProcessID))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid process id")
		}

		input := bpmpkg.FormCreateInput{
			ProcessID: processID,
			Code:      req.Code,
			Name:      req.Name,
			Schema:    req.Schema,
			UISchema:  req.UISchema,
		}
		form, err := svc.CreateForm(c.Context(), input)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		logger.Info().Str("formId", form.ID.String()).Msg("gateway bpm form created")
		return c.Status(fiber.StatusCreated).JSON(form)
	}
}

func updateBPMForm(svc *bpmpkg.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid form id")
		}

		var payload map[string]json.RawMessage
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := bpmpkg.FormUpdateInput{}
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
			if errors.Is(err, bpmpkg.ErrFormNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}
		logger.Info().Str("formId", form.ID.String()).Msg("gateway bpm form updated")
		return c.JSON(form)
	}
}

func listBPMTasks(svc *bpmpkg.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		filter := bpmpkg.TaskListFilter{
			Limit:  parseQueryLimit(c.Query("limit"), 50),
			Status: c.Query("status"),
		}
		tasks, err := svc.ListTasks(c.Context(), filter)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		return c.JSON(fiber.Map{"items": tasks})
	}
}

func createBPMTask(svc *bpmpkg.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req struct {
			ProcessID string          `json:"processId"`
			Code      string          `json:"code"`
			Title     string          `json:"title"`
			Assignee  string          `json:"assignee"`
			DueAt     string          `json:"dueAt"`
			Payload   json.RawMessage `json:"payload"`
		}
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		processID, err := uuid.Parse(strings.TrimSpace(req.ProcessID))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid process id")
		}

		input := bpmpkg.TaskCreateInput{
			ProcessID: processID,
			Code:      req.Code,
			Title:     req.Title,
			Assignee:  req.Assignee,
			DueAt:     req.DueAt,
			Payload:   req.Payload,
		}

		task, err := svc.CreateTask(c.Context(), input)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		logger.Info().Str("taskId", task.ID.String()).Msg("gateway bpm task created")
		return c.Status(fiber.StatusCreated).JSON(task)
	}
}

func updateBPMTask(svc *bpmpkg.Service, logger zerolog.Logger) fiber.Handler {
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

		input := bpmpkg.TaskUpdateInput{
			Title:    payload.Title,
			Status:   payload.Status,
			Assignee: payload.Assignee,
			DueAt:    payload.DueAt,
			Payload:  payload.Payload,
		}

		task, err := svc.UpdateTask(c.Context(), id, input)
		if err != nil {
			status := fiber.StatusBadRequest
			if errors.Is(err, bpmpkg.ErrTaskNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}
		logger.Info().Str("taskId", task.ID.String()).Msg("gateway bpm task updated")
		return c.JSON(task)
	}
}
