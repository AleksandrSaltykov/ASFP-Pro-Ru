// Package db holds shared database helpers.
package db

import (
	"context"
	"fmt"
	"time"

	ch "github.com/ClickHouse/clickhouse-go/v2"
)

// NewClickHouse returns a configured native ClickHouse connection.
func NewClickHouse(ctx context.Context, dsn string) (ch.Conn, error) {
	options, err := ch.ParseDSN(dsn)
	if err != nil {
		return nil, fmt.Errorf("parse clickhouse dsn: %w", err)
	}

	options.MaxOpenConns = 10
	options.MaxIdleConns = 5
	options.ConnMaxLifetime = time.Hour

	conn, err := ch.Open(options)
	if err != nil {
		return nil, fmt.Errorf("connect clickhouse: %w", err)
	}

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := conn.Ping(ctx); err != nil {
		return nil, fmt.Errorf("ping clickhouse: %w", err)
	}

	return conn, nil
}
