package entity

import (
	"time"

	"github.com/google/uuid"
)

// Receipt represents inbound goods receipt document.
type Receipt struct {
	ID                uuid.UUID      `json:"id"`
	Code              string         `json:"code"`
	ExternalReference string         `json:"externalReference,omitempty"`
	Status            string         `json:"status"`
	WarehouseID       uuid.UUID      `json:"warehouseId"`
	WarehouseName     string         `json:"warehouseName,omitempty"`
	SupplierID        *uuid.UUID     `json:"supplierId,omitempty"`
	SupplierName      string         `json:"supplierName"`
	SupplierInn       string         `json:"supplierInn,omitempty"`
	Currency          string         `json:"currency"`
	ExpectedAt        *time.Time     `json:"expectedAt,omitempty"`
	ReceivedAt        *time.Time     `json:"receivedAt,omitempty"`
	TotalAmount       float64        `json:"totalAmount"`
	TotalVat          float64        `json:"totalVat"`
	LinesCount        int            `json:"linesCount"`
	Notes             string         `json:"notes,omitempty"`
	Metadata          map[string]any `json:"metadata,omitempty"`
	CreatedBy         *uuid.UUID     `json:"createdBy,omitempty"`
	UpdatedBy         *uuid.UUID     `json:"updatedBy,omitempty"`
	CreatedAt         time.Time      `json:"createdAt"`
	UpdatedAt         time.Time      `json:"updatedAt"`
}

// ReceiptDetails extends Receipt with document level meta and lines.
type ReceiptDetails struct {
	Receipt
	Lines []ReceiptLine `json:"lines"`
}

// ReceiptLine represents item line within receipt document.
type ReceiptLine struct {
	ID               uuid.UUID      `json:"id"`
	ReceiptID        uuid.UUID      `json:"receiptId"`
	ItemID           uuid.UUID      `json:"itemId"`
	SKU              string         `json:"sku"`
	ItemName         string         `json:"itemName"`
	UnitID           uuid.UUID      `json:"unitId"`
	UnitCode         string         `json:"unitCode"`
	Quantity         float64        `json:"quantity"`
	ExpectedQuantity float64        `json:"expectedQuantity"`
	ReceivedQuantity float64        `json:"receivedQuantity"`
	UnitCost         float64        `json:"unitCost"`
	VatRate          *float64       `json:"vatRate,omitempty"`
	VatAmount        float64        `json:"vatAmount"`
	TotalCost        float64        `json:"totalCost"`
	BatchNumber      string         `json:"batchNumber,omitempty"`
	ProductionDate   *time.Time     `json:"productionDate,omitempty"`
	ExpirationDate   *time.Time     `json:"expirationDate,omitempty"`
	Metadata         map[string]any `json:"metadata,omitempty"`
	CreatedAt        time.Time      `json:"createdAt"`
	UpdatedAt        time.Time      `json:"updatedAt"`
}

// ReceiptInput describes payload accepted for create / update operations.
type ReceiptInput struct {
	Code              string             `json:"code"`
	ExternalReference string             `json:"externalReference"`
	Status            string             `json:"status"`
	WarehouseID       uuid.UUID          `json:"warehouseId"`
	SupplierID        *uuid.UUID         `json:"supplierId"`
	SupplierName      string             `json:"supplierName"`
	SupplierInn       string             `json:"supplierInn"`
	Currency          string             `json:"currency"`
	ExpectedAt        *time.Time         `json:"expectedAt"`
	ReceivedAt        *time.Time         `json:"receivedAt"`
	Notes             string             `json:"notes"`
	Metadata          map[string]any     `json:"metadata"`
	Lines             []ReceiptLineInput `json:"lines"`
	ActorID           *uuid.UUID         `json:"actorId"`
}

// ReceiptLineInput describes single line payload.
type ReceiptLineInput struct {
	ID               *uuid.UUID     `json:"id"`
	ItemID           uuid.UUID      `json:"itemId"`
	UnitID           uuid.UUID      `json:"unitId"`
	Quantity         float64        `json:"quantity"`
	ExpectedQuantity *float64       `json:"expectedQuantity"`
	ReceivedQuantity *float64       `json:"receivedQuantity"`
	UnitCost         float64        `json:"unitCost"`
	VatRate          *float64       `json:"vatRate"`
	BatchNumber      string         `json:"batchNumber"`
	ProductionDate   *time.Time     `json:"productionDate"`
	ExpirationDate   *time.Time     `json:"expirationDate"`
	Metadata         map[string]any `json:"metadata"`
}

// ReceiptFilter represents filters for listing operations.
type ReceiptFilter struct {
	WarehouseID *uuid.UUID
	Status      string
	Search      string
	Limit       int
}
