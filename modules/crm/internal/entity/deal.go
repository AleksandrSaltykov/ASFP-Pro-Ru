package entity

import "time"

// Deal describes CRM deal entity.
type Deal struct {
	ID         string
	Title      string
	CustomerID string
	Stage      string
	Amount     float64
	Currency   string
	CreatedBy  string
	CreatedAt  time.Time
}
