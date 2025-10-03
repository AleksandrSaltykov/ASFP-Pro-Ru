package main

import (
	"context"
	"fmt"
	stdlog "log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"asfppro/modules/montage/internal/handler"
	"asfppro/modules/montage/internal/repository"
	"asfppro/modules/montage/internal/service"
	"asfppro/pkg/config"
	"asfppro/pkg/db"
	logpkg "asfppro/pkg/log"
)

func main() {
	cfg, err := config.Load("MONTAGE")
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

	repo := repository.New(pool)
	svc := service.New(repo, logger)

	openapi, err := readOpenAPI("modules/montage/docs/openapi/openapi.json", "MONTAGE_OPENAPI_PATH")
	if err != nil {
		logger.Fatal().Err(err).Msg("load openapi")
	}

	app := fiber.New(fiber.Config{AppName: cfg.AppName})
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
	}))
	app.Use(recover.New())
	app.Get("/health", handler.Health())
	app.Get("/ready", handler.Ready(pool))
	app.Get("/openapi.json", handler.OpenAPI(openapi))
	handler.RegisterRoutes(app, svc, logger)

	addr := ":" + cfg.HTTPPort
	logger.Info().Str("addr", addr).Msg("montage listening")
	if err := app.Listen(addr); err != nil {
		logger.Fatal().Err(err).Msg("montage stopped")
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
