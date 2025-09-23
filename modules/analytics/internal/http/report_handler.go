package http

import (
	"time"

	"github.com/gofiber/fiber/v2"

	"asfppro/modules/analytics/internal/repository"
)

// ReportHandler exposes analytics endpoints.
type ReportHandler struct {
	repo *repository.EventRepository
}

// NewReportHandler constructs handler.
func NewReportHandler(repo *repository.EventRepository) *ReportHandler {
	return &ReportHandler{repo: repo}
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
