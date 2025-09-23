// Package queue integrates Tarantool-based messaging.
package queue

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	tar "github.com/tarantool/go-tarantool/v2"
)

const (
	defaultRequestTimeout = 5 * time.Second
	defaultReconnectDelay = 2 * time.Second
)

// Publisher wraps Tarantool queue operations.
type Publisher struct {
	conn *tar.Connection
	tube string
}

// NewPublisher establishes a connection and ensures queue space exists.
func NewPublisher(addr, tube string) (*Publisher, error) {
	conn, err := connect(addr)
	if err != nil {
		return nil, fmt.Errorf("connect tarantool: %w", err)
	}

	return &Publisher{conn: conn, tube: tube}, nil
}

// Publish sends a JSON payload to queue.
func (p *Publisher) Publish(ctx context.Context, eventType string, payload any) error {
	if p.conn == nil {
		return errors.New("publisher connection is nil")
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal payload: %w", err)
	}

	expr := fmt.Sprintf("return queue.tube.%s:put(...)", p.tube)
	req := tar.NewEvalRequest(expr).
		Args([]any{map[string]any{
			"event_type": eventType,
			"payload":    string(body),
		}}).
		Context(ctx)

	if _, err := p.conn.Do(req).Get(); err != nil {
		return fmt.Errorf("publish event: %w", err)
	}

	return nil
}

// Close terminates the underlying connection.
func (p *Publisher) Close() {
	if p.conn != nil {
		_ = p.conn.Close()
	}
}

// Consumer pulls messages and converts them to strongly typed events.
type Consumer struct {
	conn    *tar.Connection
	tube    string
	timeout time.Duration
}

// NewConsumer returns a queue consumer.
func NewConsumer(addr, tube string) (*Consumer, error) {
	conn, err := connect(addr)
	if err != nil {
		return nil, fmt.Errorf("connect tarantool: %w", err)
	}

	return &Consumer{conn: conn, tube: tube, timeout: 2 * time.Second}, nil
}

// Next fetches one job and acknowledges it.
func (c *Consumer) Next(ctx context.Context, out any) (string, error) {
	if c.conn == nil {
		return "", errors.New("consumer connection is nil")
	}

	expr := fmt.Sprintf("return queue.tube.%s:take(...)", c.tube)
	takeReq := tar.NewEvalRequest(expr).
		Args([]any{c.timeout.Seconds()}).
		Context(ctx)

	resp, err := c.conn.Do(takeReq).Get()
	if err != nil {
		return "", fmt.Errorf("take job: %w", err)
	}

	if len(resp) == 0 {
		return "", nil
	}

	job, ok := resp[0].([]any)
	if !ok || len(job) < 3 {
		return "", fmt.Errorf("unexpected job payload: %v", resp)
	}

	jobID := fmt.Sprintf("%v", job[0])

	meta, ok := job[2].(map[string]any)
	if ok && out != nil {
		if payload, hasPayload := meta["payload"].(string); hasPayload {
			if err := json.Unmarshal([]byte(payload), out); err != nil {
				return "", fmt.Errorf("decode payload: %w", err)
			}
		}
	}

	ackExpr := fmt.Sprintf("return queue.tube.%s:ack(...)", c.tube)
	ackReq := tar.NewEvalRequest(ackExpr).
		Args([]any{job[0]}).
		Context(ctx)
	if _, err := c.conn.Do(ackReq).Get(); err != nil {
		return "", fmt.Errorf("ack job: %w", err)
	}

	return jobID, nil
}

// Close stops consumer.
func (c *Consumer) Close() {
	if c.conn != nil {
		_ = c.conn.Close()
	}
}

func connect(addr string) (*tar.Connection, error) {
	dialer := tar.NetDialer{Address: addr}

	opts := tar.Opts{
		Timeout:       defaultRequestTimeout,
		Reconnect:     defaultReconnectDelay,
		MaxReconnects: 5,
		SkipSchema:    true,
	}

	conn, err := tar.Connect(context.Background(), dialer, opts)
	if err != nil {
		return nil, err
	}

	return conn, nil
}
