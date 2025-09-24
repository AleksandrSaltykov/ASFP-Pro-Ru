// Package main starts the WMS HTTP API service.
package main

import (
	"context"
	"fmt"
	stdlog "log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"asfppro/modules/wms/internal/handler"
	"asfppro/modules/wms/internal/repository"
	"asfppro/modules/wms/internal/service"
	"asfppro/pkg/config"
	"asfppro/pkg/db"
	logpkg "asfppro/pkg/log"
)

func main() {
	cfg, err := config.Load("WMS")
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

	repo := repository.NewInventoryRepository(pool)
	service := service.NewInventoryService(repo, logger)
	h := handler.NewInventoryHandler(service)

	openapi, err := readOpenAPI("modules/wms/docs/openapi/openapi.json", "WMS_OPENAPI_PATH")
	if err != nil {
		logger.Fatal().Err(err).Msg("load openapi")
	}

	app := fiber.New(fiber.Config{AppName: cfg.AppName})
	app.Use(recover.New())
	app.Get("/health", handler.Health())
	app.Get("/ready", handler.Ready(pool))
	app.Get("/openapi.json", handler.OpenAPI(openapi))
	h.Register(app)

	addr := ":" + cfg.HTTPPort
	logger.Info().Str("addr", addr).Msg("wms listening")
	if err := app.Listen(addr); err != nil {
		logger.Fatal().Err(err).Msg("wms stopped")
	}
}

func readOpenAPI(defaultPath, envVar string) ([]byte, error) {
	if override := os.Getenv(envVar); override != "" {
		if data, err := os.ReadFile(override); err == nil {
			return data, nil
		}
	}

	paths := []string{defaultPath, "openapi.json"}
	for _, p := range paths {
		if data, err := os.ReadFile(p); err == nil {
			return data, nil
		}
	}

	return nil, fmt.Errorf("openapi spec not found")
}
