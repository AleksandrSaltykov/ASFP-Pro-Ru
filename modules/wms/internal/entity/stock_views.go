package entity

import (
	"time"

	"github.com/google/uuid"
)

// StockBalance represents enriched stock information used by the UI.
type StockBalance struct {
	ID        uuid.UUID `json:"id"`
	ItemCode  string    `json:"itemCode"`
	ItemName  string    `json:"itemName,omitempty"`
	Category  string    `json:"category,omitempty"`
	Warehouse string    `json:"warehouse"`
	Zone      string    `json:"zone,omitempty"`
	Bin       string    `json:"bin,omitempty"`
	OnHand    float64   `json:"onHand"`
	UOM       string    `json:"uom"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// StockAvailability represents stock availability aggregates.
type StockAvailability struct {
	ID        uuid.UUID `json:"id"`
	ItemCode  string    `json:"itemCode"`
	ItemName  string    `json:"itemName,omitempty"`
	Category  string    `json:"category,omitempty"`
	Warehouse string    `json:"warehouse"`
	OnHand    float64   `json:"onHand"`
	Reserved  float64   `json:"reserved"`
	OnOrder   float64   `json:"onOrder"`
	Available float64   `json:"available"`
	UOM       string    `json:"uom"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// EndlessPolicyKind describes endless aisle policy type.
type EndlessPolicyKind string

const (
	// EndlessPolicyNone means no special policy is configured.
	EndlessPolicyNone EndlessPolicyKind = "NONE"
	// EndlessPolicyMinMax represents min/max thresholds.
	EndlessPolicyMinMax EndlessPolicyKind = "MINMAX"
	// EndlessPolicyROP represents reorder point settings.
	EndlessPolicyROP EndlessPolicyKind = "ROP"
)

// EndlessPolicy represents endless-aisle configuration per SKU/warehouse.
type EndlessPolicy struct {
	ID           uuid.UUID         `json:"id"`
	ItemCode     string            `json:"itemCode"`
	ItemName     string            `json:"itemName,omitempty"`
	Warehouse    string            `json:"warehouse"`
	Policy       EndlessPolicyKind `json:"policy"`
	Min          *float64          `json:"min,omitempty"`
	Max          *float64          `json:"max,omitempty"`
	ReorderPoint *float64          `json:"reorderPoint,omitempty"`
	SafetyStock  *float64          `json:"safetyStock,omitempty"`
	Note         string            `json:"note,omitempty"`
	Available    float64           `json:"available"`
	UpdatedAt    time.Time         `json:"updatedAt"`
	UOM          string            `json:"uom"`
}

// EndlessPolicyUpdate represents update payload for endless policies.
type EndlessPolicyUpdate struct {
	ItemCode     string            `json:"itemCode"`
	Warehouse    string            `json:"warehouse"`
	Policy       EndlessPolicyKind `json:"policy"`
	Min          *float64          `json:"min,omitempty"`
	Max          *float64          `json:"max,omitempty"`
	ReorderPoint *float64          `json:"reorderPoint,omitempty"`
	SafetyStock  *float64          `json:"safetyStock,omitempty"`
	Note         string            `json:"note,omitempty"`
}

// EndlessPolicyReset represents reset payload for endless policies.
type EndlessPolicyReset struct {
	ItemCode  string `json:"itemCode"`
	Warehouse string `json:"warehouse"`
}

// StockMovementType enumerates movement kinds.
type StockMovementType string

const (
	// MovementReceipt indicates inbound receipt.
	MovementReceipt StockMovementType = "RECEIPT"
	// MovementAdjust indicates inventory adjustment.
	MovementAdjust StockMovementType = "ADJUST"
	// MovementMove indicates internal move.
	MovementMove StockMovementType = "MOVE"
)

// StockMovement represents recent warehouse movements.
type StockMovement struct {
	ID            uuid.UUID         `json:"id"`
	OccurredAt    time.Time         `json:"occurredAt"`
	Type          StockMovementType `json:"type"`
	ItemCode      string            `json:"itemCode"`
	ItemName      string            `json:"itemName,omitempty"`
	FromWarehouse string            `json:"fromWarehouse,omitempty"`
	FromZone      string            `json:"fromZone,omitempty"`
	FromBin       string            `json:"fromBin,omitempty"`
	ToWarehouse   string            `json:"toWarehouse,omitempty"`
	ToZone        string            `json:"toZone,omitempty"`
	ToBin         string            `json:"toBin,omitempty"`
	Quantity      float64           `json:"quantity"`
	UOM           string            `json:"uom"`
	Reference     string            `json:"reference,omitempty"`
	Actor         string            `json:"actor,omitempty"`
	Note          string            `json:"note,omitempty"`
}

// DeterministicUUID builds a UUID based on provided parts.
func DeterministicUUID(parts ...string) uuid.UUID {
	base := uuid.NameSpaceOID
	for _, part := range parts {
		base = uuid.NewSHA1(base, []byte(part))
	}
	return base
}
