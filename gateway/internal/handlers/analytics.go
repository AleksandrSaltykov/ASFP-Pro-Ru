package handlers

import (
	"time"

	"github.com/gofiber/fiber/v2"

	analyticspkg "asfppro/gateway/internal/analytics"
)

// RegisterAnalyticsRoutes wires minimal analytics endpoints.
func RegisterAnalyticsRoutes(router fiber.Router, svc *analyticspkg.Service, guard func(resource, action string) fiber.Handler) {
	if router == nil || svc == nil {
		return
	}
	if guard == nil {
		guard = func(_, _ string) fiber.Handler {
			return func(c *fiber.Ctx) error { return c.Next() }
		}
	}

	group := router.Group("/api/v1/analytics")
	group.Get("/reports/conversion", guard("analytics.report", "read"), analyticsConversion(svc))
	group.Get("/reports/manager-load", guard("analytics.report", "read"), analyticsManagerLoad(svc))
	group.Get("/exports/conversion", guard("analytics.export", "read"), analyticsConversionExport(svc))
	group.Get("/exports/manager-load", guard("analytics.export", "read"), analyticsManagerLoadExport(svc))
}

func analyticsConversion(svc *analyticspkg.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		bounds, err := parseAnalyticsRange(c)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid date range")
		}

		rows, err := svc.ConversionReport(c.Context(), bounds)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		items := make([]fiber.Map, 0, len(rows))
		for _, row := range rows {
			items = append(items, fiber.Map{
				"period":         row.Period,
				"totalCount":     row.TotalCount,
				"wonCount":       row.WonCount,
				"totalAmount":    row.TotalAmount,
				"wonAmount":      row.WonAmount,
				"conversionRate": row.ConversionRate,
			})
		}

		return c.JSON(fiber.Map{"items": items})
	}
}

func analyticsManagerLoad(svc *analyticspkg.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		bounds, err := parseAnalyticsRange(c)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid date range")
		}

		rows, err := svc.ManagerLoadReport(c.Context(), bounds)
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
}

func analyticsConversionExport(svc *analyticspkg.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		bounds, err := parseAnalyticsRange(c)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid date range")
		}

		file, err := svc.ConversionExport(c.Context(), bounds)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		return c.JSON(file)
	}
}

func analyticsManagerLoadExport(svc *analyticspkg.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		bounds, err := parseAnalyticsRange(c)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid date range")
		}

		file, err := svc.ManagerLoadExport(c.Context(), bounds)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}

		return c.JSON(file)
	}
}

func parseAnalyticsRange(c *fiber.Ctx) (analyticspkg.ReportRange, error) {
	const layout = time.RFC3339
	to := time.Now().UTC()
	if v := c.Query("to"); v != "" {
		parsed, err := time.Parse(layout, v)
		if err != nil {
			return analyticspkg.ReportRange{}, err
		}
		to = parsed
	}

	from := to.Add(-30 * 24 * time.Hour)
	if v := c.Query("from"); v != "" {
		parsed, err := time.Parse(layout, v)
		if err != nil {
			return analyticspkg.ReportRange{}, err
		}
		from = parsed
	}

	return analyticspkg.ReportRange{From: from, To: to}, nil
}
