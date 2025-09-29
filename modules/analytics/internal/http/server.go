// Package http exposes analytics HTTP server components.
package http

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	ch "github.com/ClickHouse/clickhouse-go/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/rs/zerolog"

	"asfppro/modules/analytics/internal/repository"
	"asfppro/pkg/audit"
	"asfppro/pkg/config"
	"asfppro/pkg/health"
)

// Server wraps Fiber application for analytics API.
type Server struct {
	app      *fiber.App
	cfg      config.AppConfig
	logger   zerolog.Logger
	shutdown chan os.Signal
}

// NewServer creates configured HTTP server instance.
func NewServer(cfg config.AppConfig, logger zerolog.Logger, repo *repository.EventRepository, conn ch.Conn, auditor *audit.Recorder) (*Server, error) {
	app := fiber.New(fiber.Config{
		AppName:      cfg.AppName,
		ReadTimeout:  cfg.RequestTimeout,
		WriteTimeout: cfg.RequestTimeout,
	})

	reportHandler := NewReportHandler(repo, auditor, logger)

	app.Use(recover.New())
	app.Use(loggerMiddleware(logger))
	app.Get("/health", health.LiveHandler())
	app.Get("/ready", readyHandler(conn))
	reportHandler.Register(app)

	return &Server{
		app:      app,
		cfg:      cfg,
		logger:   logger,
		shutdown: make(chan os.Signal, 1),
	}, nil
}

// Run starts server and handles graceful shutdown.
func (s *Server) Run() error {
	addr := fmt.Sprintf(":%s", s.cfg.HTTPPort)
	go func() {
		signal.Notify(s.shutdown, syscall.SIGINT, syscall.SIGTERM)
		sig := <-s.shutdown
		s.logger.Info().Str("signal", sig.String()).Msg("analytics api shutdown")
		tx, cancel := context.WithTimeout(context.Background(), s.cfg.ShutdownTimeout)
		defer cancel()
		if err := s.app.Shutdown(); err != nil {
			s.logger.Error().Err(err).Msg("analytics api shutdown error")
		}
		<-tx.Done()
	}()

	s.logger.Info().Str("addr", addr).Msg("analytics api listening")
	if err := s.app.Listen(addr); err != nil {
		return fmt.Errorf("start fiber: %w", err)
	}
	return nil
}

func readyHandler(conn ch.Conn) fiber.Handler {
	if conn == nil {
		return func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"status": "degraded",
				"error":  "clickhouse connection not initialised",
			})
		}
	}

	checks := []health.Check{
		{
			Name:    "clickhouse",
			Timeout: 4 * time.Second,
			Probe: func(ctx context.Context) error {
				return conn.Ping(ctx)
			},
		},
	}

	return health.FiberHandler(checks)
}

func loggerMiddleware(logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		if err := c.Next(); err != nil {
			return err
		}
		logger.Info().Fields(map[string]any{
			"path":   c.Path(),
			"method": c.Method(),
			"status": c.Response().StatusCode(),
			"took":   time.Since(start).String(),
		}).Msg("analytics-api")
		return nil
	}
}
