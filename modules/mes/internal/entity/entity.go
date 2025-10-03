// Package entity defines MES domain models used by the service layer.
package entity

import "time"

// WorkCenter represents a production work center.
type WorkCenter struct {
	ID          string    `json:"id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// WorkCenterCreateInput captures payload for creating a work center.
type WorkCenterCreateInput struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

// WorkCenterUpdateInput captures updatable fields.
type WorkCenterUpdateInput struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
}

// Operation represents a production operation.
type Operation struct {
	ID          string    `json:"id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	DurationMin int       `json:"defaultDurationMinutes"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// OperationCreateInput describes payload for new operation.
type OperationCreateInput struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
	DurationMin int    `json:"defaultDurationMinutes"`
}

// OperationUpdateInput describes fields that can be updated.
type OperationUpdateInput struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	DurationMin *int    `json:"defaultDurationMinutes"`
}

// Route represents manufacturing route template.
type Route struct {
	ID          string    `json:"id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// RouteCreateInput describes payload for new route.
type RouteCreateInput struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

// RouteUpdateInput lists optional fields for update.
type RouteUpdateInput struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
}

// ListFilter is shared pagination/filter placeholder.
type ListFilter struct {
	Limit int
}
