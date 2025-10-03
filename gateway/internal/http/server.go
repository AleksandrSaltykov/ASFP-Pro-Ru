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
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"

	analyticspkg "asfppro/gateway/internal/analytics"
	"asfppro/gateway/internal/auth"
	bpmpkg "asfppro/gateway/internal/bpm"
	corepkg "asfppro/gateway/internal/core"
	crmpkg "asfppro/gateway/internal/crm"
	docpkg "asfppro/gateway/internal/docs"
	"asfppro/gateway/internal/handlers"
	mespkg "asfppro/gateway/internal/mes"
	montagepkg "asfppro/gateway/internal/montage"
	wmspkg "asfppro/gateway/internal/wms"
	"asfppro/pkg/audit"
	"asfppro/pkg/config"
	"asfppro/pkg/s3"
)

// Server wraps Fiber app with graceful shutdown.
type Server struct {
	app      *fiber.App
	cfg      config.AppConfig
	logger   zerolog.Logger
	shutdown chan os.Signal
}

// NewServer constructs HTTP server with base middlewares.
func NewServer(cfg config.AppConfig, logger zerolog.Logger, pool *pgxpool.Pool, storage *s3.Client, clickhouse ch.Conn, authSvc *auth.Service, auditor *audit.Recorder) (*Server, error) {
	openapi, err := readOpenAPI("gateway/docs/openapi/openapi.json", "GATEWAY_OPENAPI_PATH")
	if err != nil {
		return nil, fmt.Errorf("load openapi: %w", err)
	}

	app := fiber.New(fiber.Config{
		AppName:      cfg.AppName,
		ReadTimeout:  cfg.RequestTimeout,
		WriteTimeout: cfg.RequestTimeout,
	})

	app.Use(recover.New())
	app.Use(loggerMiddleware(logger))
	app.Use(requestIDMiddleware)

	app.Get("/", handlers.Home())
	app.Get("/health", handlers.Health())
	app.Get("/ready", handlers.Ready(pool, storage, clickhouse))
	app.Get("/openapi.json", handlers.OpenAPI(openapi))

	protected := app.Group("", authMiddleware(authSvc, logger))
	coreRepo := corepkg.NewRepository(pool)
	coreSvc := corepkg.NewService(coreRepo, auditor, logger)
	guardian := permissionGuard(coreSvc, logger)
	protected.Get("/api/v1/auth/me", handlers.CurrentUserHandler())
	wmsRepo := wmspkg.NewRepository(pool)
	wmsSvc := wmspkg.NewService(wmsRepo, auditor, logger)
	mesRepo := mespkg.NewRepository(pool)
	mesSvc := mespkg.NewService(mesRepo, logger)
	montageRepo := montagepkg.NewRepository(pool)
	montageSvc := montagepkg.NewService(montageRepo, logger)
	docRepo := docpkg.NewRepository(pool)
	docSvc := docpkg.NewService(docRepo, logger)
	bpmRepo := bpmpkg.NewRepository(pool)
	bpmSvc := bpmpkg.NewService(bpmRepo, logger)
	crmRepo := crmpkg.NewRepository(pool)
	crmSvc := crmpkg.NewService(crmRepo, auditor, logger)
	analyticsRepo := analyticspkg.NewRepository(clickhouse)
	analyticsSvc := analyticspkg.NewService(analyticsRepo, logger)
	handlers.RegisterCoreRoutes(protected, coreSvc, guardian, logger)
	handlers.RegisterWMSRoutes(protected, wmsSvc, guardian, logger)
	handlers.RegisterMESRoutes(protected, mesSvc, guardian, logger)
	handlers.RegisterMontageRoutes(protected, montageSvc, guardian, logger)
	handlers.RegisterDocsRoutes(protected, docSvc, guardian, logger)
	handlers.RegisterBPMRoutes(protected, bpmSvc, guardian, logger)
	handlers.RegisterCRMRoutes(protected, crmSvc, guardian, logger)
	handlers.RegisterAnalyticsRoutes(protected, analyticsSvc, guardian)
	protected.Post("/api/v1/files", guardian("core.file", "write"), handlers.FileUploadHandler(storage, auditor, logger))
	protected.Get("/api/v1/audit", guardian("core.audit", "read"), handlers.AuditListHandler(auditor, logger))

	return &Server{
		app:      app,
		cfg:      cfg,
		logger:   logger,
		shutdown: make(chan os.Signal, 1),
	}, nil
}

// Run starts HTTP server and handles graceful shutdown.
func (s *Server) Run() error {
	addr := fmt.Sprintf(":%s", s.cfg.HTTPPort)
	go func() {
		signal.Notify(s.shutdown, syscall.SIGINT, syscall.SIGTERM)
		sig := <-s.shutdown
		s.logger.Info().Str("signal", sig.String()).Msg("shutdown signal received")
		tx, cancel := context.WithTimeout(context.Background(), s.cfg.ShutdownTimeout)
		defer cancel()
		if err := s.app.Shutdown(); err != nil {
			s.logger.Error().Err(err).Msg("server shutdown error")
		}
		s.clean(tx)
	}()

	s.logger.Info().Str("addr", addr).Msg("gateway listening")
	if err := s.app.Listen(addr); err != nil {
		return fmt.Errorf("start fiber: %w", err)
	}
	return nil
}

func (s *Server) clean(ctx context.Context) {
	// reserved for future cleanup tasks
	<-ctx.Done()
}

func loggerMiddleware(logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		if err := c.Next(); err != nil {
			return err
		}
		logger.Info().Fields(map[string]any{
			"path":      c.Path(),
			"method":    c.Method(),
			"status":    c.Response().StatusCode(),
			"duration":  time.Since(start).String(),
			"requestId": c.GetRespHeader("X-Request-ID"),
		}).Msg("http")
		return nil
	}
}

func requestIDMiddleware(c *fiber.Ctx) error {
	id := c.Get("X-Request-ID")
	if id == "" {
		id = uuid.NewString()
	}
	c.Set("X-Request-ID", id)
	return c.Next()
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
