package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	ch "github.com/ClickHouse/clickhouse-go/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"

	"asfppro/pkg/config"
	"asfppro/pkg/health"
	"asfppro/pkg/s3"
)

type systemStatusItem struct {
	ID      string  `json:"id"`
	Label   string  `json:"label"`
	Scope   string  `json:"scope"`
	Health  string  `json:"health"`
	Details *string `json:"details,omitempty"`
}

type systemStatusResponse struct {
	Services     []systemStatusItem `json:"services"`
	Dependencies []systemStatusItem `json:"dependencies"`
	UpdatedAt    time.Time          `json:"updatedAt"`
}

type readinessPayload struct {
	Status string            `json:"status"`
	Checks map[string]string `json:"checks"`
}

const (
	healthOnline   = "online"
	healthDegraded = "degraded"
	healthOffline  = "offline"
)

// SystemStatus aggregates readiness information for gateway and downstream services.
func SystemStatus(cfg config.AppConfig, pool *pgxpool.Pool, storage *s3.Client, clickhouse ch.Conn, logger zerolog.Logger) fiber.Handler {
	httpClient := &http.Client{
		Timeout: 5 * time.Second,
	}

	return func(c *fiber.Ctx) error {
		ctx := c.UserContext()
		if ctx == nil {
			ctx = context.Background()
		}

		var (
			services     []systemStatusItem
			dependencies []systemStatusItem
		)

		gatewayDeps, gatewayStatus := evaluateGateway(ctx, pool, storage, clickhouse)
		services = append(services, gatewayStatus)
		dependencies = append(dependencies, gatewayDeps...)

		crmServices, crmDeps := evaluateExternal(ctx, httpClient, cfg.CRMReadinessURL, "crm", "CRM", map[string]string{
			"postgres":  "CRM DB",
			"tarantool": "Tarantool Queue",
		}, logger)
		services = append(services, crmServices)
		dependencies = append(dependencies, crmDeps...)

		wmsServices, wmsDeps := evaluateExternal(ctx, httpClient, cfg.WMSReadinessURL, "wms", "WMS", map[string]string{
			"postgres": "WMS DB",
		}, logger)
		services = append(services, wmsServices)
		dependencies = append(dependencies, wmsDeps...)

		return c.JSON(systemStatusResponse{
			Services:     services,
			Dependencies: dependencies,
			UpdatedAt:    time.Now().UTC(),
		})
	}
}

func evaluateGateway(ctx context.Context, pool *pgxpool.Pool, storage *s3.Client, clickhouse ch.Conn) ([]systemStatusItem, systemStatusItem) {
	checks := []health.Check{
		{
			Name:    "postgres",
			Timeout: 3 * time.Second,
			Probe: func(ctx context.Context) error {
				return pool.Ping(ctx)
			},
		},
		{
			Name:    "s3",
			Timeout: 5 * time.Second,
			Probe: func(ctx context.Context) error {
				return storage.Ping(ctx)
			},
		},
	}

	if clickhouse != nil {
		checks = append(checks, health.Check{
			Name:    "clickhouse",
			Timeout: 3 * time.Second,
			Probe: func(ctx context.Context) error {
				return clickhouse.Ping(ctx)
			},
		})
	}

	results := health.Run(ctx, checks)
	depLabels := map[string]string{
		"postgres":   "Gateway DB",
		"s3":         "Object Storage",
		"clickhouse": "ClickHouse",
	}

	dependencies := make([]systemStatusItem, 0, len(results))
	serviceHealth := healthOnline
	var failureMessages []string

	for name, probeErr := range results {
		label := depLabels[name]
		if label == "" {
			label = strings.Title(name)
		}

		dependencyHealth := healthOnline
		var detailPtr *string
		if probeErr != nil {
			dependencyHealth = healthOffline
			msg := probeErr.Error()
			detailPtr = &msg
			failureMessages = append(failureMessages, fmt.Sprintf("%s: %s", label, msg))
			serviceHealth = healthOffline
		}

		dependencies = append(dependencies, systemStatusItem{
			ID:      fmt.Sprintf("gateway:%s", name),
			Label:   label,
			Scope:   "dependency",
			Health:  dependencyHealth,
			Details: detailPtr,
		})
	}

	var serviceDetails *string
	if len(failureMessages) > 0 {
		summary := strings.Join(failureMessages, "; ")
		serviceDetails = &summary
	}

	return dependencies, systemStatusItem{
		ID:      "gateway",
		Label:   "Gateway API",
		Scope:   "service",
		Health:  serviceHealth,
		Details: serviceDetails,
	}
}

func evaluateExternal(ctx context.Context, client *http.Client, url, id, label string, dependencyLabels map[string]string, logger zerolog.Logger) (systemStatusItem, []systemStatusItem) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return offlineService(id, label, fmt.Errorf("build request: %w", err)), nil
	}

	resp, err := client.Do(req)
	if err != nil {
		return offlineService(id, label, err), nil
	}
	defer resp.Body.Close()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return offlineService(id, label, fmt.Errorf("status %d", resp.StatusCode)), nil
	}

	var payload readinessPayload
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return offlineService(id, label, fmt.Errorf("decode readiness: %w", err)), nil
	}

	serviceHealth := healthOnline
	dependencies := make([]systemStatusItem, 0, len(payload.Checks))

	for name, result := range payload.Checks {
		dependencyHealth := healthOnline
		var detailPtr *string
		if !strings.EqualFold(result, "ok") {
			detail := result
			detailPtr = &detail
			dependencyHealth = healthOffline
			serviceHealth = healthOffline
		}

		labelText := dependencyLabels[name]
		if labelText == "" {
			labelText = strings.Title(name)
		}

		dependencies = append(dependencies, systemStatusItem{
			ID:      fmt.Sprintf("%s:%s", id, name),
			Label:   labelText,
			Scope:   "dependency",
			Health:  dependencyHealth,
			Details: detailPtr,
		})
	}

	// In case no checks reported, log warning to allow follow-up
	if len(payload.Checks) == 0 {
		logger.Warn().Str("service", id).Msg("readiness response missing dependency checks")
	}

	var serviceDetails *string
	if !strings.EqualFold(payload.Status, "ok") {
		msg := fmt.Sprintf("Readiness status: %s", payload.Status)
		serviceDetails = &msg
		if serviceHealth == healthOnline {
			serviceHealth = healthDegraded
		}
	}

	return systemStatusItem{
			ID:      id,
			Label:   fmt.Sprintf("%s Service", label),
			Scope:   "service",
			Health:  serviceHealth,
			Details: serviceDetails,
		},
		dependencies
}

func offlineService(id, label string, err error) systemStatusItem {
	detail := "service unreachable"
	if err != nil {
		detail = err.Error()
	}
	return systemStatusItem{
		ID:      id,
		Label:   fmt.Sprintf("%s Service", label),
		Scope:   "service",
		Health:  healthOffline,
		Details: &detail,
	}
}
