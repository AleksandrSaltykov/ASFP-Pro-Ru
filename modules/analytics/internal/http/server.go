// Package http exposes analytics HTTP server components.
package http

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/rs/zerolog"

	"asfppro/modules/analytics/internal/repository"
	"asfppro/pkg/config"
)

// Server wraps Fiber application for analytics API.
type Server struct {
	app      *fiber.App
	cfg      config.AppConfig
	logger   zerolog.Logger
	shutdown chan os.Signal
}

// NewServer creates configured HTTP server instance.
func NewServer(cfg config.AppConfig, logger zerolog.Logger, repo *repository.EventRepository) (*Server, error) {
	app := fiber.New(fiber.Config{
		AppName:      cfg.AppName,
		ReadTimeout:  cfg.RequestTimeout,
		WriteTimeout: cfg.RequestTimeout,
	})

	reportHandler := NewReportHandler(repo)

	app.Use(recover.New())
	app.Use(loggerMiddleware(logger))
	app.Get("/health", healthHandler)
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

func healthHandler(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{"status": "ok"})
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
