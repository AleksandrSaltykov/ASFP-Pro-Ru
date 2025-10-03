package handlers

import (
	"encoding/json"
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog"

	docspkg "asfppro/gateway/internal/docs"
)

// RegisterDocsRoutes подключает Docs минимальный API на gateway.
func RegisterDocsRoutes(router fiber.Router, svc *docspkg.Service, guard func(resource, action string) fiber.Handler, logger zerolog.Logger) {
	if router == nil || svc == nil {
		return
	}
	if guard == nil {
		guard = func(_, _ string) fiber.Handler {
			return func(c *fiber.Ctx) error { return c.Next() }
		}
	}

	api := router.Group("/api/v1/docs")
	api.Get("/templates", guard("docs.template", "read"), listDocsTemplates(svc))
	api.Post("/templates", guard("docs.template", "write"), createDocsTemplate(svc, logger))
	api.Put("/templates/:id", guard("docs.template", "write"), updateDocsTemplate(svc, logger))

	api.Get("/signers", guard("docs.signer", "read"), listDocsSigners(svc))
	api.Post("/signers", guard("docs.signer", "write"), createDocsSigner(svc, logger))
	api.Put("/signers/:id", guard("docs.signer", "write"), updateDocsSigner(svc, logger))

	api.Get("/documents", guard("docs.document", "read"), listDocsDocuments(svc))
	api.Post("/documents", guard("docs.document", "write"), createDocsDocument(svc, logger))
	api.Put("/documents/:id", guard("docs.document", "write"), updateDocsDocument(svc, logger))
}

func listDocsTemplates(svc *docspkg.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		limit := parseQueryLimit(c.Query("limit"), 50)
		templates, err := svc.ListTemplates(c.Context(), limit)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": templates})
	}
}

func createDocsTemplate(svc *docspkg.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req docspkg.CreateTemplateInput
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		tpl, err := svc.CreateTemplate(c.Context(), req)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		logger.Info().Str("templateId", tpl.ID.String()).Msg("gateway docs template created")
		return c.Status(fiber.StatusCreated).JSON(tpl)
	}
}

func updateDocsTemplate(svc *docspkg.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid template id")
		}

		var payload map[string]json.RawMessage
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := docspkg.UpdateTemplateInput{}
		if raw, ok := payload["name"]; ok {
			var val string
			if err := json.Unmarshal(raw, &val); err != nil {
				return fiber.NewError(fiber.StatusBadRequest, "invalid name")
			}
			input.Name = &val
		}
		if raw, ok := payload["description"]; ok {
			var val string
			if err := json.Unmarshal(raw, &val); err != nil {
				return fiber.NewError(fiber.StatusBadRequest, "invalid description")
			}
			input.Description = &val
		}
		if raw, ok := payload["body"]; ok {
			clone := make(json.RawMessage, len(raw))
			copy(clone, raw)
			input.Body = &clone
		}
		if raw, ok := payload["version"]; ok {
			var val int
			if err := json.Unmarshal(raw, &val); err != nil {
				return fiber.NewError(fiber.StatusBadRequest, "invalid version")
			}
			input.Version = &val
		}

		tpl, err := svc.UpdateTemplate(c.Context(), id, input)
		if err != nil {
			status := fiber.StatusBadRequest
			if errors.Is(err, docspkg.ErrTemplateNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}
		logger.Info().Str("templateId", tpl.ID.String()).Msg("gateway docs template updated")
		return c.JSON(tpl)
	}
}

func listDocsSigners(svc *docspkg.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		limit := parseQueryLimit(c.Query("limit"), 50)
		signers, err := svc.ListSigners(c.Context(), limit)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": signers})
	}
}

func createDocsSigner(svc *docspkg.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req docspkg.CreateSignerInput
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		signer, err := svc.CreateSigner(c.Context(), req)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		logger.Info().Str("signerId", signer.ID.String()).Msg("gateway docs signer created")
		return c.Status(fiber.StatusCreated).JSON(signer)
	}
}

func updateDocsSigner(svc *docspkg.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid signer id")
		}

		var payload map[string]string
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := docspkg.UpdateSignerInput{}
		if val, ok := payload["fullName"]; ok {
			trimmed := strings.TrimSpace(val)
			input.FullName = &trimmed
		}
		if val, ok := payload["position"]; ok {
			trimmed := strings.TrimSpace(val)
			input.Position = &trimmed
		}
		if val, ok := payload["email"]; ok {
			trimmed := strings.TrimSpace(val)
			input.Email = &trimmed
		}
		if val, ok := payload["phone"]; ok {
			trimmed := strings.TrimSpace(val)
			input.Phone = &trimmed
		}

		signer, err := svc.UpdateSigner(c.Context(), id, input)
		if err != nil {
			status := fiber.StatusBadRequest
			if errors.Is(err, docspkg.ErrSignerNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}
		logger.Info().Str("signerId", signer.ID.String()).Msg("gateway docs signer updated")
		return c.JSON(signer)
	}
}

func listDocsDocuments(svc *docspkg.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		limit := parseQueryLimit(c.Query("limit"), 50)
		status := strings.TrimSpace(c.Query("status"))
		docs, err := svc.ListDocuments(c.Context(), docspkg.DocumentListFilter{Limit: limit, Status: status})
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		return c.JSON(fiber.Map{"items": docs})
	}
}

func createDocsDocument(svc *docspkg.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req docspkg.CreateDocumentInput
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		doc, err := svc.CreateDocument(c.Context(), req)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		logger.Info().Str("documentId", doc.ID.String()).Msg("gateway docs document created")
		return c.Status(fiber.StatusCreated).JSON(doc)
	}
}

func updateDocsDocument(svc *docspkg.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid document id")
		}

		var payload struct {
			Title   *string                             `json:"title"`
			Status  *string                             `json:"status"`
			Payload *json.RawMessage                    `json:"payload"`
			Signers []docspkg.DocumentSignerStatusInput `json:"signers"`
		}
		if err := c.BodyParser(&payload); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := docspkg.UpdateDocumentInput{
			Title:          payload.Title,
			Status:         payload.Status,
			Payload:        payload.Payload,
			SignerStatuses: payload.Signers,
		}

		doc, err := svc.UpdateDocument(c.Context(), id, input)
		if err != nil {
			status := fiber.StatusBadRequest
			if errors.Is(err, docspkg.ErrDocumentNotFound) {
				status = fiber.StatusNotFound
			}
			return fiber.NewError(status, err.Error())
		}
		logger.Info().Str("documentId", doc.ID.String()).Msg("gateway docs document updated")
		return c.JSON(doc)
	}
}
