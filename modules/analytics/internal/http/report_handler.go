package http

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"asfppro/modules/analytics/internal/repository"
	"asfppro/pkg/audit"
)

// ReportHandler exposes analytics endpoints.
type ReportHandler struct {
	repo    *repository.EventRepository
	auditor *audit.Recorder
	logger  zerolog.Logger
}

// NewReportHandler constructs handler.
func NewReportHandler(repo *repository.EventRepository, auditor *audit.Recorder, logger zerolog.Logger) *ReportHandler {
	return &ReportHandler{repo: repo, auditor: auditor, logger: logger}
}

// Register wires endpoints.
func (h *ReportHandler) Register(app *fiber.App) {
	group := app.Group("/api/v1/reports")
	group.Get("/conversion", h.conversion)
	group.Get("/manager-load", h.managerLoad)
}

func (h *ReportHandler) conversion(c *fiber.Ctx) error {
	from, to, err := parseRange(c)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	rows, err := h.repo.ConversionReport(c.Context(), from, to)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	items := make([]fiber.Map, 0, len(rows))
	for _, row := range rows {
		conversionRate := 0.0
		if row.TotalCount > 0 {
			conversionRate = float64(row.WonCount) / float64(row.TotalCount)
		}
		items = append(items, fiber.Map{
			"period":         row.Period,
			"totalCount":     row.TotalCount,
			"wonCount":       row.WonCount,
			"totalAmount":    row.TotalAmount,
			"wonAmount":      row.WonAmount,
			"conversionRate": conversionRate,
		})
	}

	h.recordAudit(c, "analytics.report.conversion", map[string]any{
		"from":  from.Format(time.RFC3339),
		"to":    to.Format(time.RFC3339),
		"count": len(items),
	})

	return c.JSON(fiber.Map{"items": items})
}

func (h *ReportHandler) managerLoad(c *fiber.Ctx) error {
	from, to, err := parseRange(c)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	rows, err := h.repo.ManagerLoad(c.Context(), from, to)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	items := make([]fiber.Map, 0, len(rows))
	for _, row := range rows {
		items = append(items, fiber.Map{
			"manager":     row.Manager,
			"totalCount":  row.TotalCount,
			"totalAmount": row.TotalAmount,
		})
	}

	h.recordAudit(c, "analytics.report.manager_load", map[string]any{
		"from":  from.Format(time.RFC3339),
		"to":    to.Format(time.RFC3339),
		"count": len(items),
	})

	return c.JSON(fiber.Map{"items": items})
}

func parseRange(c *fiber.Ctx) (time.Time, time.Time, error) {
	const layout = time.RFC3339
	to := time.Now().UTC()
	if toParam := c.Query("to"); toParam != "" {
		parsed, err := time.Parse(layout, toParam)
		if err != nil {
			return time.Time{}, time.Time{}, err
		}
		to = parsed
	}

	from := to.Add(-30 * 24 * time.Hour)
	if fromParam := c.Query("from"); fromParam != "" {
		parsed, err := time.Parse(layout, fromParam)
		if err != nil {
			return time.Time{}, time.Time{}, err
		}
		from = parsed
	}

	return from, to, nil
}

func (h *ReportHandler) recordAudit(c *fiber.Ctx, action string, payload map[string]any) {
	if h.auditor == nil {
		return
	}

	ctx := userContext(c)
	if err := h.auditor.Record(ctx, audit.Entry{
		ActorID:  uuid.Nil,
		Action:   action,
		Entity:   "analytics.report",
		EntityID: action,
		Payload:  payload,
	}); err != nil {
		h.logger.Error().Err(err).Str("action", action).Msg("audit report request")
	}
}

func userContext(c *fiber.Ctx) context.Context {
	if ctx := c.UserContext(); ctx != nil {
		return ctx
	}
	return context.Background()
}
