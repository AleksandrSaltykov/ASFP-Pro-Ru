package mes

import (
	"time"

	"github.com/google/uuid"
)

// WorkCenter mirrors mes.work_center row for gateway responses.
type WorkCenter struct {
	ID          uuid.UUID `json:"id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// CreateWorkCenterInput describes incoming payload.
type CreateWorkCenterInput struct {
	Code        string
	Name        string
	Description string
}

// UpdateWorkCenterInput supports partial updates.
type UpdateWorkCenterInput struct {
	Name        *string
	Description *string
}

// Operation mirrors mes.operation row.
type Operation struct {
	ID          uuid.UUID `json:"id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	DurationMin int       `json:"defaultDurationMinutes"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// CreateOperationInput describes create payload.
type CreateOperationInput struct {
	Code        string
	Name        string
	Description string
	DurationMin int
}

// UpdateOperationInput supports optional updates.
type UpdateOperationInput struct {
	Name        *string
	Description *string
	DurationMin *int
}

// Route represents manufacturing route template.
type Route struct {
	ID          uuid.UUID `json:"id"`
	Code        string    `json:"code"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// CreateRouteInput describes create payload.
type CreateRouteInput struct {
	Code        string
	Name        string
	Description string
}

// UpdateRouteInput supports optional updates.
type UpdateRouteInput struct {
	Name        *string
	Description *string
}
