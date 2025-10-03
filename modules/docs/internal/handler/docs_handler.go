package handler

import (
	"encoding/json"
	"errors"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"asfppro/modules/docs/internal/entity"
	"asfppro/modules/docs/internal/repository"
	"asfppro/modules/docs/internal/service"
)

// RegisterRoutes подключает REST-эндпоинты Docs.
func RegisterRoutes(app *fiber.App, svc *service.Service, logger zerolog.Logger) {
	if app == nil || svc == nil {
		return
	}

	api := app.Group("/api/v1/docs")
	api.Get("/templates", listTemplates(svc))
	api.Post("/templates", createTemplate(svc, logger))
	api.Put("/templates/:id", updateTemplate(svc, logger))

	api.Get("/signers", listSigners(svc))
	api.Post("/signers", createSigner(svc, logger))
	api.Put("/signers/:id", updateSigner(svc, logger))

	api.Get("/documents", listDocuments(svc))
	api.Post("/documents", createDocument(svc, logger))
	api.Put("/documents/:id", updateDocument(svc, logger))
}

func listTemplates(svc *service.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		limit := parseLimit(c.Query("limit"), 50)
		templates, err := svc.ListTemplates(c.Context(), limit)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": templates})
	}
}

func createTemplate(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req entity.TemplateCreateInput
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		template, err := svc.CreateTemplate(c.Context(), req)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		logger.Info().Str("templateId", template.ID).Msg("docs template created")
		return c.Status(fiber.StatusCreated).JSON(template)
	}
}

func updateTemplate(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid template id")
		}

		var payload map[string]json.RawMessage
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := entity.TemplateUpdateInput{}
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
		if raw, ok := payload["body"]; ok {
			clone := make(json.RawMessage, len(raw))
			copy(clone, raw)
			input.Body = &clone
		}
		if raw, ok := payload["version"]; ok {
			var version int
			if err := json.Unmarshal(raw, &version); err != nil {
				return fiber.NewError(fiber.StatusBadRequest, "invalid version")
			}
			input.Version = &version
		}

		template, err := svc.UpdateTemplate(c.Context(), id, input)
		if err != nil {
			status := fiber.StatusBadRequest
			if errors.Is(err, repository.ErrTemplateNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}
		logger.Info().Str("templateId", template.ID).Msg("docs template updated")
		return c.JSON(template)
	}
}

func listSigners(svc *service.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		limit := parseLimit(c.Query("limit"), 50)
		signers, err := svc.ListSigners(c.Context(), limit)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": signers})
	}
}

func createSigner(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req entity.SignerCreateInput
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		signer, err := svc.CreateSigner(c.Context(), req)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		logger.Info().Str("signerId", signer.ID).Msg("docs signer created")
		return c.Status(fiber.StatusCreated).JSON(signer)
	}
}

func updateSigner(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid signer id")
		}

		var payload map[string]string
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := entity.SignerUpdateInput{}
		if val, ok := payload["fullName"]; ok {
			input.FullName = ptrString(val)
		}
		if val, ok := payload["position"]; ok {
			input.Position = ptrString(val)
		}
		if val, ok := payload["email"]; ok {
			input.Email = ptrString(val)
		}
		if val, ok := payload["phone"]; ok {
			input.Phone = ptrString(val)
		}

		signer, err := svc.UpdateSigner(c.Context(), id, input)
		if err != nil {
			status := fiber.StatusBadRequest
			if errors.Is(err, repository.ErrSignerNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}
		logger.Info().Str("signerId", signer.ID).Msg("docs signer updated")
		return c.JSON(signer)
	}
}

func listDocuments(svc *service.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		limit := parseLimit(c.Query("limit"), 50)
		status := strings.TrimSpace(c.Query("status"))
		docs, err := svc.ListDocuments(c.Context(), entity.DocumentListFilter{Limit: limit, Status: status})
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		return c.JSON(fiber.Map{"items": docs})
	}
}

func createDocument(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	type request struct {
		TemplateID   string          `json:"templateId"`
		SequenceCode string          `json:"sequenceCode"`
		Title        string          `json:"title"`
		Payload      json.RawMessage `json:"payload"`
		SignerIDs    []string        `json:"signerIds"`
		Status       string          `json:"status"`
	}

	return func(c *fiber.Ctx) error {
		var req request
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := entity.DocumentCreateInput{
			TemplateID:   req.TemplateID,
			SequenceCode: req.SequenceCode,
			Title:        req.Title,
			Payload:      req.Payload,
			SignerIDs:    req.SignerIDs,
			Status:       req.Status,
		}

		doc, err := svc.CreateDocument(c.Context(), input)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		logger.Info().Str("documentId", doc.ID).Msg("docs document created")
		return c.Status(fiber.StatusCreated).JSON(doc)
	}
}

func updateDocument(svc *service.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid document id")
		}

		var payload struct {
			Title   *string          `json:"title"`
			Status  *string          `json:"status"`
			Payload *json.RawMessage `json:"payload"`
			Signers []struct {
				SignerID string `json:"signerId"`
				Status   string `json:"status"`
			} `json:"signers"`
		}
		if err := c.BodyParser(&payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := entity.DocumentUpdateInput{
			Title:   payload.Title,
			Status:  payload.Status,
			Payload: payload.Payload,
		}
		if len(payload.Signers) > 0 {
			statuses := make([]entity.DocumentSignerStatusInput, 0, len(payload.Signers))
			for _, signer := range payload.Signers {
				statuses = append(statuses, entity.DocumentSignerStatusInput{SignerID: signer.SignerID, Status: signer.Status})
			}
			input.SignerStatuses = statuses
		}

		doc, err := svc.UpdateDocument(c.Context(), id, input)
		if err != nil {
			status := fiber.StatusBadRequest
			if errors.Is(err, repository.ErrDocumentNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}
		logger.Info().Str("documentId", doc.ID).Msg("docs document updated")
		return c.JSON(doc)
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

func ptrString(v string) *string {
	val := strings.TrimSpace(v)
	return &val
}
