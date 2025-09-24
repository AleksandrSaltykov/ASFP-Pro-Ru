// Package main runs the CRM API service.
package main

import (
	"context"
	"fmt"
	stdlog "log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"asfppro/modules/crm/internal/handler"
	"asfppro/modules/crm/internal/repository"
	"asfppro/modules/crm/internal/service"
	"asfppro/pkg/config"
	"asfppro/pkg/db"
	logpkg "asfppro/pkg/log"
	"asfppro/pkg/queue"
)

func main() {
	cfg, err := config.Load("CRM")
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

	publisher, err := queue.NewPublisher(cfg.TarantoolAddr, cfg.TarantoolQueue)
	if err != nil {
		logger.Fatal().Err(err).Msg("tarantool connect")
	}
	defer publisher.Close()

	repo := repository.NewDealRepository(pool)
	service := service.NewDealService(repo, publisher, logger)
	h := handler.NewDealHandler(service)

	openapi, err := readOpenAPI("modules/crm/docs/openapi/openapi.json", "CRM_OPENAPI_PATH")
	if err != nil {
		logger.Fatal().Err(err).Msg("load openapi")
	}

	app := fiber.New(fiber.Config{AppName: cfg.AppName})
	app.Use(recover.New())
	app.Get("/health", handler.Health())
	app.Get("/ready", handler.Ready(pool, publisher))
	app.Get("/openapi.json", handler.OpenAPI(openapi))
	h.Register(app)

	addr := ":" + cfg.HTTPPort
	logger.Info().Str("addr", addr).Msg("crm listening")
	if err := app.Listen(addr); err != nil {
		logger.Fatal().Err(err).Msg("crm stopped")
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
