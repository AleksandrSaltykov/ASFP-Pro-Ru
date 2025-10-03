// Package entity exposes CRM aggregates.
package entity

import (
	"encoding/json"
	"time"
)

// Deal describes CRM deal entity.
type Deal struct {
	ID          string
	Title       string
	CustomerID  string
	Stage       string
	Amount      float64
	Currency    string
	CreatedBy   string
	CreatedAt   time.Time
	OrgUnitCode string
}

// DealEvent represents change log entry for a deal.
type DealEvent struct {
	ID        int64           `json:"id"`
	DealID    string          `json:"dealId"`
	EventType string          `json:"eventType"`
	Payload   json.RawMessage `json:"payload"`
	CreatedAt time.Time       `json:"createdAt"`
}
