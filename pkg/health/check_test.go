package health

import (
	"context"
	"errors"
	"testing"
	"time"
)

func TestRun(t *testing.T) {
	t.Parallel()

	checks := []Check{
		{
			Name:    "ok",
			Timeout: time.Second,
			Probe: func(ctx context.Context) error {
				return nil
			},
		},
		{
			Name: "fail",
			Probe: func(ctx context.Context) error {
				return errors.New("boom")
			},
		},
	}

	results := Run(context.Background(), checks)
	if len(results) != len(checks) {
		t.Fatalf("unexpected result size: %d", len(results))
	}

	if err := results["ok"]; err != nil {
		t.Fatalf("expected success for ok check, got %v", err)
	}

	if err := results["fail"]; err == nil || err.Error() != "boom" {
		t.Fatalf("expected failure for fail check, got %v", err)
	}

	if Healthy(results) {
		t.Fatalf("expected unhealthy due to failing check")
	}

	if Healthy(map[string]error{"ok": nil}) == false {
		t.Fatalf("expected healthy when no errors")
	}
}
