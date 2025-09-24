// Package main boots the API gateway service.
package main

import (
	"context"
	stdlog "log"

	"asfppro/gateway/internal/auth"
	"asfppro/gateway/internal/http"
	"asfppro/pkg/config"
	"asfppro/pkg/db"
	logpkg "asfppro/pkg/log"
	"asfppro/pkg/s3"
)

func main() {
	cfg, err := config.Load("GATEWAY")
	if err != nil {
		stdlog.Fatalf("config load: %v", err)
	}

	logger := logpkg.Init(cfg.Env)

	pool, err := db.NewPostgresPool(context.Background(), cfg.DatabaseURL)
	if err != nil {
		logger.Fatal().Err(err).Msg("init postgres")
	}
	defer pool.Close()

	storage, err := s3.New(cfg.S3Endpoint, cfg.S3Region, cfg.S3AccessKey, cfg.S3SecretKey, cfg.S3Bucket, cfg.S3UseSSL)
	if err != nil {
		logger.Fatal().Err(err).Msg("init s3")
	}

	authService := auth.NewService(pool)

	server, err := http.NewServer(cfg, logger, pool, storage, authService)
	if err != nil {
		logger.Fatal().Err(err).Msg("init server")
	}

	if err := server.Run(); err != nil {
		logger.Fatal().Err(err).Msg("server stopped")
	}
}
