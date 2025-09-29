// Package main boots the analytics HTTP API service.
package main

import (
	"context"
	stdlog "log"
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
	server, err := analyticshttp.NewServer(cfg, logger, repo, conn, auditor)
	if err != nil {
		logger.Fatal().Err(err).Msg("init analytics api")
	}

	if err := server.Run(); err != nil {
		logger.Fatal().Err(err).Msg("analytics api stopped")
	}
}
