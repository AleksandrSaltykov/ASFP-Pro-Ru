//go:build integration
// +build integration

package integration

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	tar "github.com/tarantool/go-tarantool/v2"

	"asfppro/pkg/db"
	"asfppro/pkg/queue"
)

func TestTarantoolQueueRoundTrip(t *testing.T) {
	addr := getenv("INTEGRATION_TARANTOOL_ADDR", "localhost:3301")
	tube := fmt.Sprintf("integration_%d", time.Now().UnixNano())

	conn, err := tar.Connect(
		context.Background(),
		tar.NetDialer{Address: addr},
		tar.Opts{
			Timeout:       5 * time.Second,
			Reconnect:     time.Second,
			MaxReconnects: 3,
			SkipSchema:    true,
		},
	)
	if err != nil {
		t.Fatalf("connect tarantool: %v", err)
	}
	t.Cleanup(func() {
		_ = conn.Close()
	})

	createTube := fmt.Sprintf(`
local queue = require('queue')
if not queue.tube['%[1]s'] then
  queue.create_tube('%[1]s', 'fifo', {temporary = true, if_not_exists = true})
end
return true
`, tube)
	if _, err := conn.Do(tar.NewEvalRequest(createTube)).Get(); err != nil {
		t.Fatalf("create temp tube: %v", err)
	}
	t.Cleanup(func() {
		drop := fmt.Sprintf(`
local queue = require('queue')
if queue.tube['%[1]s'] then
  queue.tube['%[1]s']:drop()
end
return true
`, tube)
		_, _ = conn.Do(tar.NewEvalRequest(drop)).Get()
	})

	pub, err := queue.NewPublisher(addr, tube)
	if err != nil {
		t.Fatalf("new publisher: %v", err)
	}
	t.Cleanup(pub.Close)

	consumer, err := queue.NewConsumer(addr, tube)
	if err != nil {
		t.Fatalf("new consumer: %v", err)
	}
	t.Cleanup(consumer.Close)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	payload := map[string]string{"id": "integration", "status": "ok"}
	if err := pub.Publish(ctx, "integration.test", payload); err != nil {
		t.Fatalf("publish payload: %v", err)
	}

	ctxTake, cancelTake := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelTake()

	var out map[string]string
	jobID, err := consumer.Next(ctxTake, &out)
	if err != nil {
		t.Fatalf("consume payload: %v", err)
	}
	if jobID == "" {
		t.Fatal("expected non-empty job id")
	}
	if out["status"] != "ok" || out["id"] != "integration" {
		t.Fatalf("unexpected payload: %#v", out)
	}
}

func TestClickHouseInsertSelect(t *testing.T) {
	dsn := getenv("INTEGRATION_CLICKHOUSE_DSN", "clickhouse://analytics:analytics123@localhost:9000/analytics")

	conn, err := db.NewClickHouse(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connect clickhouse: %v", err)
	}
	t.Cleanup(func() {
		_ = conn.Close()
	})

	table := fmt.Sprintf("integration_events_%d", time.Now().UnixNano())

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	createStmt := fmt.Sprintf("CREATE TABLE %s (id String, status String) ENGINE = Memory", table)
	if err := conn.Exec(ctx, createStmt); err != nil {
		t.Fatalf("create table: %v", err)
	}
	t.Cleanup(func() {
		ctxDrop, cancelDrop := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancelDrop()
		dropStmt := fmt.Sprintf("DROP TABLE IF EXISTS %s", table)
		_ = conn.Exec(ctxDrop, dropStmt)
	})

	id := uuid.NewString()
	insertStmt := fmt.Sprintf("INSERT INTO %s (id, status) VALUES (?, ?)", table)
	if err := conn.Exec(ctx, insertStmt, id, "ok"); err != nil {
		t.Fatalf("insert row: %v", err)
	}

	selectStmt := fmt.Sprintf("SELECT id, status FROM %s WHERE id = ?", table)
	rows, err := conn.Query(ctx, selectStmt, id)
	if err != nil {
		t.Fatalf("query row: %v", err)
	}
	defer rows.Close()

	if !rows.Next() {
		t.Fatal("expected at least one record")
	}

	var gotID, gotStatus string
	if err := rows.Scan(&gotID, &gotStatus); err != nil {
		t.Fatalf("scan row: %v", err)
	}
	if gotID != id || gotStatus != "ok" {
		t.Fatalf("unexpected result: id=%s status=%s", gotID, gotStatus)
	}
	if rows.Next() {
		t.Fatal("expected single row result")
	}
	if err := rows.Err(); err != nil {
		t.Fatalf("rows error: %v", err)
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
