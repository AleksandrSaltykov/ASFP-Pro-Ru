// Package health provides reusable dependency health check helpers.
package health

import (
	"context"
	"time"
)

// Check represents one dependency probe.
type Check struct {
	Name    string
	Timeout time.Duration
	Probe   func(context.Context) error
}

// Run executes probes and returns a map with results keyed by check name.
// The resulting map stores nil on success or concrete errors on failure.
func Run(ctx context.Context, checks []Check) map[string]error {
	results := make(map[string]error, len(checks))
	for _, check := range checks {
		if check.Probe == nil {
			continue
		}

		probeCtx := ctx
		if check.Timeout > 0 {
			var cancel context.CancelFunc
			probeCtx, cancel = context.WithTimeout(ctx, check.Timeout)
			err := check.Probe(probeCtx)
			cancel()
			results[check.Name] = err
			continue
		}

		results[check.Name] = check.Probe(probeCtx)
	}
	return results
}

// Healthy reports whether all checks succeeded.
func Healthy(results map[string]error) bool {
	for _, err := range results {
		if err != nil {
			return false
		}
	}
	return true
}
