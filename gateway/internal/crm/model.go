package crm

import (
	"time"

	"github.com/google/uuid"
)

// Customer represents crm.customers row.
type Customer struct {
	ID            uuid.UUID             `json:"id"`
	Name          string                `json:"name"`
	INN           string                `json:"inn,omitempty"`
	KPP           string                `json:"kpp,omitempty"`
	Comment       string                `json:"comment,omitempty"`
	Phone         string                `json:"phone,omitempty"`
	Email         string                `json:"email,omitempty"`
	Website       string                `json:"website,omitempty"`
	LegalAddress  string                `json:"legalAddress,omitempty"`
	ActualAddress string                `json:"actualAddress,omitempty"`
	CreatedAt     time.Time             `json:"createdAt"`
	UpdatedAt     time.Time             `json:"updatedAt"`
	BankAccounts  []CustomerBankAccount `json:"bankAccounts,omitempty"`
	Contacts      []CustomerContact     `json:"contacts,omitempty"`
}

// CustomerBankAccount represents crm.customer_bank_accounts row.
type CustomerBankAccount struct {
	ID            uuid.UUID `json:"id"`
	AccountName   string    `json:"accountName,omitempty"`
	BankName      string    `json:"bankName,omitempty"`
	AccountNumber string    `json:"accountNumber"`
	BIK           string    `json:"bik,omitempty"`
	CorrAccount   string    `json:"corrAccount,omitempty"`
	Comment       string    `json:"comment,omitempty"`
	IsDefault     bool      `json:"isDefault,omitempty"`
}

// CustomerContact represents crm.customer_contacts row.
type CustomerContact struct {
	ID       uuid.UUID `json:"id"`
	Name     string    `json:"name"`
	Position string    `json:"position,omitempty"`
	Phone    string    `json:"phone,omitempty"`
	Email    string    `json:"email,omitempty"`
	Comment  string    `json:"comment,omitempty"`
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
	Name          string
	Comment       string
	INN           string
	KPP           string
	Phone         string
	Email         string
	Website       string
	LegalAddress  string
	ActualAddress string
	BankAccounts  []CustomerBankAccountInput
	Contacts      []CustomerContactInput
}

// UpdateCustomerInput modifications.
type UpdateCustomerInput struct {
	Name          *string
	Comment       *string
	INN           *string
	KPP           *string
	Phone         *string
	Email         *string
	Website       *string
	LegalAddress  *string
	ActualAddress *string
	BankAccounts  []CustomerBankAccountInput
	Contacts      []CustomerContactInput
}

// CustomerBankAccountInput describes bank account payload.
type CustomerBankAccountInput struct {
	ID            uuid.UUID
	AccountName   string
	BankName      string
	AccountNumber string
	BIK           string
	CorrAccount   string
	Comment       string
	IsDefault     bool
}

// CustomerContactInput describes contact payload.
type CustomerContactInput struct {
	ID       uuid.UUID
	Name     string
	Position string
	Phone    string
	Email    string
	Comment  string
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
