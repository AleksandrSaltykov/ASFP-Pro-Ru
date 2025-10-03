// Package entity contains warehouse master data models.
package entity

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// WarehouseAddress describes physical location of a warehouse.
type WarehouseAddress struct {
	Country    string   `json:"country,omitempty"`
	Region     string   `json:"region,omitempty"`
	City       string   `json:"city,omitempty"`
	Street     string   `json:"street,omitempty"`
	Building   string   `json:"building,omitempty"`
	PostalCode string   `json:"postalCode,omitempty"`
	Latitude   *float64 `json:"latitude,omitempty"`
	Longitude  *float64 `json:"longitude,omitempty"`
}

// WarehouseOperatingHours defines working schedule rules.
type WarehouseOperatingHours struct {
	Weekdays map[string]string `json:"weekdays,omitempty"`
	Notes    string            `json:"notes,omitempty"`
}

// WarehouseContact stores main contact information.
type WarehouseContact struct {
	Phone   string `json:"phone,omitempty"`
	Email   string `json:"email,omitempty"`
	Manager string `json:"manager,omitempty"`
	Comment string `json:"comment,omitempty"`
}

// Warehouse is a top-level storage facility.
type Warehouse struct {
	ID             uuid.UUID               `json:"id"`
	Code           string                  `json:"code"`
	Name           string                  `json:"name"`
	Description    string                  `json:"description,omitempty"`
	Address        WarehouseAddress        `json:"address"`
	Timezone       string                  `json:"timezone"`
	Status         string                  `json:"status"`
	OperatingHours WarehouseOperatingHours `json:"operatingHours"`
	Contact        WarehouseContact        `json:"contact"`
	Metadata       map[string]any          `json:"metadata,omitempty"`
	OrgUnitCode    string                  `json:"orgUnitCode"`
	CreatedBy      uuid.UUID               `json:"createdBy,omitempty"`
	UpdatedBy      uuid.UUID               `json:"updatedBy,omitempty"`
	CreatedAt      time.Time               `json:"createdAt"`
	UpdatedAt      time.Time               `json:"updatedAt"`
}

// WarehouseZone describes functional zone inside a warehouse.
type WarehouseZone struct {
	ID                 uuid.UUID      `json:"id"`
	WarehouseID        uuid.UUID      `json:"warehouseId"`
	Code               string         `json:"code"`
	Name               string         `json:"name"`
	ZoneType           string         `json:"zoneType"`
	IsBuffer           bool           `json:"isBuffer"`
	TemperatureMin     *float64       `json:"temperatureMin,omitempty"`
	TemperatureMax     *float64       `json:"temperatureMax,omitempty"`
	HazardClass        string         `json:"hazardClass,omitempty"`
	AccessRestrictions []string       `json:"accessRestrictions,omitempty"`
	Layout             map[string]any `json:"layout,omitempty"`
	Metadata           map[string]any `json:"metadata,omitempty"`
	CreatedBy          uuid.UUID      `json:"createdBy,omitempty"`
	UpdatedBy          uuid.UUID      `json:"updatedBy,omitempty"`
	CreatedAt          time.Time      `json:"createdAt"`
	UpdatedAt          time.Time      `json:"updatedAt"`
}

// WarehouseCell defines an addressable storage location.
type WarehouseCell struct {
	ID              uuid.UUID      `json:"id"`
	WarehouseID     uuid.UUID      `json:"warehouseId"`
	ZoneID          uuid.UUID      `json:"zoneId"`
	Code            string         `json:"code"`
	Label           string         `json:"label,omitempty"`
	Address         map[string]any `json:"address"`
	CellType        string         `json:"cellType"`
	Status          string         `json:"status"`
	IsPickFace      bool           `json:"isPickFace"`
	LengthMM        *int           `json:"lengthMm,omitempty"`
	WidthMM         *int           `json:"widthMm,omitempty"`
	HeightMM        *int           `json:"heightMm,omitempty"`
	MaxWeightKG     *float64       `json:"maxWeightKg,omitempty"`
	MaxVolumeL      *float64       `json:"maxVolumeL,omitempty"`
	AllowedHandling []string       `json:"allowedHandling,omitempty"`
	TemperatureMin  *float64       `json:"temperatureMin,omitempty"`
	TemperatureMax  *float64       `json:"temperatureMax,omitempty"`
	HazardClasses   []string       `json:"hazardClasses,omitempty"`
	Metadata        map[string]any `json:"metadata,omitempty"`
	CreatedBy       uuid.UUID      `json:"createdBy,omitempty"`
	UpdatedBy       uuid.UUID      `json:"updatedBy,omitempty"`
	CreatedAt       time.Time      `json:"createdAt"`
	UpdatedAt       time.Time      `json:"updatedAt"`
}

// WarehouseEquipment describes equipment assigned to zones or cells.
type WarehouseEquipment struct {
	ID            uuid.UUID      `json:"id"`
	WarehouseID   uuid.UUID      `json:"warehouseId"`
	Code          string         `json:"code"`
	Name          string         `json:"name"`
	EquipmentType string         `json:"type"`
	Status        string         `json:"status"`
	Manufacturer  string         `json:"manufacturer,omitempty"`
	SerialNumber  string         `json:"serialNumber,omitempty"`
	Commissioning *time.Time     `json:"commissioningDate,omitempty"`
	Metadata      map[string]any `json:"metadata,omitempty"`
	CreatedBy     uuid.UUID      `json:"createdBy,omitempty"`
	UpdatedBy     uuid.UUID      `json:"updatedBy,omitempty"`
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
}

// CellEquipmentAssignment represents equipment attached to a cell.
type CellEquipmentAssignment struct {
	CellID      uuid.UUID `json:"cellId"`
	EquipmentID uuid.UUID `json:"equipmentId"`
	AssignedAt  time.Time `json:"assignedAt"`
	AssignedBy  uuid.UUID `json:"assignedBy,omitempty"`
}

// WarehouseCellHistory keeps audit history of changes.
type WarehouseCellHistory struct {
	ID         int64           `json:"id"`
	CellID     uuid.UUID       `json:"cellId"`
	ChangedAt  time.Time       `json:"changedAt"`
	ChangedBy  uuid.UUID       `json:"changedBy,omitempty"`
	ChangeType string          `json:"changeType"`
	Payload    json.RawMessage `json:"payload,omitempty"`
}

// WarehouseDetails aggregates warehouse with zones and cells.
type WarehouseDetails struct {
	Warehouse Warehouse            `json:"warehouse"`
	Zones     []WarehouseZone      `json:"zones"`
	Cells     []WarehouseCell      `json:"cells"`
	Equipment []WarehouseEquipment `json:"equipment"`
}
