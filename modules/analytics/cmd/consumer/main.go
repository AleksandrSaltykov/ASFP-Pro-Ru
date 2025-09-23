// Package main runs the analytics queue consumer.
package main

import (
	"context"
	stdlog "log"
	"os"
	"os/signal"
	"syscall"

	"asfppro/modules/analytics/internal/handler"
	"asfppro/modules/analytics/internal/repository"
	"asfppro/pkg/config"
	"asfppro/pkg/db"
	logpkg "asfppro/pkg/log"
	"asfppro/pkg/queue"
)

func main() {
	cfg, err := config.Load("ANALYTICS")
	if err != nil {
		stdlog.Fatalf("load config: %v", err)
	}

	logger := logpkg.Init(cfg.Env)

	queueConsumer, err := queue.NewConsumer(cfg.TarantoolAddr, cfg.TarantoolQueue)
	if err != nil {
		logger.Fatal().Err(err).Msg("tarantool connect")
	}
	defer func() { queueConsumer.Close() }()

	click, err := db.NewClickHouse(context.Background(), cfg.ClickHouseDSN)
	if err != nil {
		logger.Fatal().Err(err).Msg("clickhouse connect")
	}
	defer func() { _ = click.Close() }()

	repo := repository.NewEventRepository(click)
	worker := handler.NewConsumer(queueConsumer, repo, logger)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go worker.Run(ctx)

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	<-sigs
	logger.Info().Msg("shutting down analytics consumer")
	cancel()
}

