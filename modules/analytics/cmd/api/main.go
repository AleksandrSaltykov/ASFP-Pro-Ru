// Package main boots the analytics HTTP API service.
package main

import (
	"context"
	"fmt"
	stdlog "log"
	"os"
	"time"

	analyticshttp "asfppro/modules/analytics/internal/http"
	"asfppro/modules/analytics/internal/repository"
	"asfppro/pkg/audit"
	"asfppro/pkg/config"
	"asfppro/pkg/db"
	logpkg "asfppro/pkg/log"
)

func main() {
	cfg, err := config.Load("ANALYTICS")
	if err != nil {
		stdlog.Fatalf("load config: %v", err)
	}

	logger := logpkg.Init(cfg.Env)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := db.NewPostgresPool(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Fatal().Err(err).Msg("postgres connect")
	}
	defer pool.Close()

	auditor := audit.NewRecorder(pool, logger)

	conn, err := db.NewClickHouse(context.Background(), cfg.ClickHouseDSN)
	if err != nil {
		logger.Fatal().Err(err).Msg("clickhouse connect")
	}
	defer func() { _ = conn.Close() }()

	repo := repository.NewEventRepository(conn)
	spec, err := readOpenAPI("modules/analytics/docs/openapi/openapi.json", "ANALYTICS_OPENAPI_PATH")
	if err != nil {
		logger.Fatal().Err(err).Msg("load openapi")
	}

	server, err := analyticshttp.NewServer(cfg, logger, repo, conn, auditor, spec)
	if err != nil {
		logger.Fatal().Err(err).Msg("init analytics api")
	}

	if err := server.Run(); err != nil {
		logger.Fatal().Err(err).Msg("analytics api stopped")
	}
}

func readOpenAPI(defaultPath, envVar string) ([]byte, error) {
	if override := os.Getenv(envVar); override != "" {
		if data, err := os.ReadFile(override); err == nil {
			return data, nil
		}
	}

	candidates := []string{defaultPath, "openapi.json"}
	for _, candidate := range candidates {
		if data, err := os.ReadFile(candidate); err == nil {
			return data, nil
		}
	}

	return nil, fmt.Errorf("openapi spec not found")
}
