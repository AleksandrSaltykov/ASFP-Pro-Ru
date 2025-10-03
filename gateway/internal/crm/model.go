package crm

import (
	"time"

	"github.com/google/uuid"
)

// Customer represents crm.customers row.
type Customer struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	INN       string    `json:"inn,omitempty"`
	KPP       string    `json:"kpp,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

// Deal represents crm.deals row.
type Deal struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	CustomerID  uuid.UUID `json:"customerId"`
	Stage       string    `json:"stage"`
	Amount      float64   `json:"amount"`
	Currency    string    `json:"currency"`
	CreatedBy   string    `json:"createdBy,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	OrgUnitCode string    `json:"orgUnitCode"`
}

// DealEvent describes crm.deal_events entry.
type DealEvent struct {
	ID        int64     `json:"id"`
	DealID    uuid.UUID `json:"dealId"`
	EventType string    `json:"eventType"`
	Payload   any       `json:"payload,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}

// CreateCustomerInput data.
type CreateCustomerInput struct {
	Name string
	INN  string
	KPP  string
}

// UpdateCustomerInput modifications.
type UpdateCustomerInput struct {
	Name *string
	INN  *string
	KPP  *string
}

// ListDealsFilter filters deals list.
type ListDealsFilter struct {
	Stage string
	Limit int
}

// CreateDealInput payload for new deal.
type CreateDealInput struct {
	Title       string
	CustomerID  uuid.UUID
	Stage       string
	Amount      float64
	Currency    string
	CreatedBy   string
	OrgUnitCode string
}

// UpdateDealInput payload for deal update.
type UpdateDealInput struct {
	Title      *string
	CustomerID *uuid.UUID
	Stage      *string
	Amount     *float64
	Currency   *string
}
