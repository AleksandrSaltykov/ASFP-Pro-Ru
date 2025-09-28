package entity

import (
	"time"

	"github.com/google/uuid"
)

// AttributeDataType enumerates supported dynamic value types.
type AttributeDataType string

const (
	AttributeDataTypeString  AttributeDataType = "string"
	AttributeDataTypeNumber  AttributeDataType = "number"
	AttributeDataTypeBoolean AttributeDataType = "boolean"
	AttributeDataTypeJSON    AttributeDataType = "json"
)

// AttributeTemplate describes configurable dynamic attribute.
type AttributeTemplate struct {
	ID          uuid.UUID         `json:"id"`
	Code        string            `json:"code"`
	Name        string            `json:"name"`
	Description string            `json:"description,omitempty"`
	TargetType  string            `json:"targetType"`
	DataType    AttributeDataType `json:"dataType"`
	IsRequired  bool              `json:"isRequired"`
	Metadata    map[string]any    `json:"metadata,omitempty"`
	UISchema    map[string]any    `json:"uiSchema,omitempty"`
	Position    int               `json:"position"`
	CreatedAt   time.Time         `json:"createdAt"`
	UpdatedAt   time.Time         `json:"updatedAt"`
}

// AttributeValue captures concrete value for template.
type AttributeValue struct {
	Template  AttributeTemplate `json:"template"`
	OwnerType string            `json:"ownerType,omitempty"`
	OwnerID   uuid.UUID         `json:"ownerId,omitempty"`
	String    *string           `json:"stringValue,omitempty"`
	Number    *float64          `json:"numberValue,omitempty"`
	Boolean   *bool             `json:"booleanValue,omitempty"`
	JSON      map[string]any    `json:"jsonValue,omitempty"`
	UpdatedAt time.Time         `json:"updatedAt"`
}

// ItemAttributes represents list of dynamic values for item.
type ItemAttributes []AttributeValue

// AttributeValueUpsert represents incoming value for create/update flows.
type AttributeValueUpsert struct {
	TemplateID uuid.UUID      `json:"templateId"`
	String     *string        `json:"stringValue,omitempty"`
	Number     *float64       `json:"numberValue,omitempty"`
	Boolean    *bool          `json:"booleanValue,omitempty"`
	JSON       map[string]any `json:"jsonValue,omitempty"`
}
