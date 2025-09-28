package entity

import (
	"time"

	"github.com/google/uuid"
)

// CatalogType identifies logical catalog buckets (e.g. category, unit, packaging).
type CatalogType string

const (
	CatalogTypeCategory CatalogType = "category"
	CatalogTypeUnit     CatalogType = "unit"
)

// CatalogNode describes a generic hierarchical catalog entry.
type CatalogNode struct {
	ID          uuid.UUID      `json:"id"`
	Type        CatalogType    `json:"type"`
	ParentID    *uuid.UUID     `json:"parentId,omitempty"`
	Code        string         `json:"code"`
	Name        string         `json:"name"`
	Description string         `json:"description,omitempty"`
	Level       int16          `json:"level"`
	Path        string         `json:"path"`
	Metadata    map[string]any `json:"metadata,omitempty"`
	SortOrder   int            `json:"sortOrder,omitempty"`
	IsActive    bool           `json:"isActive"`
	CreatedBy   *uuid.UUID     `json:"createdBy,omitempty"`
	UpdatedBy   *uuid.UUID     `json:"updatedBy,omitempty"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
}

// CatalogLink represents relation between catalog entities or other domain objects.
type CatalogLink struct {
	LeftID       uuid.UUID      `json:"leftId"`
	LeftType     string         `json:"leftType"`
	RightID      uuid.UUID      `json:"rightId"`
	RightType    string         `json:"rightType"`
	RelationCode string         `json:"relationCode"`
	Metadata     map[string]any `json:"metadata,omitempty"`
	CreatedAt    time.Time      `json:"createdAt"`
}
