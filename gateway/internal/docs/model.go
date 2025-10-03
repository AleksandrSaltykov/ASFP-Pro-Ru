package docs

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// Template описывает шаблон документа для gateway.
type Template struct {
	ID          uuid.UUID       `json:"id"`
	Code        string          `json:"code"`
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Version     int             `json:"version"`
	Body        json.RawMessage `json:"body"`
	CreatedAt   time.Time       `json:"createdAt"`
	UpdatedAt   time.Time       `json:"updatedAt"`
}

// CreateTemplateInput входные данные для создания шаблона.
type CreateTemplateInput struct {
	Code        string
	Name        string
	Description string
	Body        json.RawMessage
}

// UpdateTemplateInput изменяемые поля шаблона.
type UpdateTemplateInput struct {
	Name        *string
	Description *string
	Body        *json.RawMessage
	Version     *int
}

// Signer описывает подписанта.
type Signer struct {
	ID        uuid.UUID `json:"id"`
	Code      string    `json:"code"`
	FullName  string    `json:"fullName"`
	Position  string    `json:"position"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// CreateSignerInput входные данные для создания подписанта.
type CreateSignerInput struct {
	Code     string
	FullName string
	Position string
	Email    string
	Phone    string
}

// UpdateSignerInput изменяемые поля подписанта.
type UpdateSignerInput struct {
	FullName *string
	Position *string
	Email    *string
	Phone    *string
}

// DocumentSigner отражает статус подписанта.
type DocumentSigner struct {
	ID        uuid.UUID  `json:"id"`
	SignerID  uuid.UUID  `json:"signerId"`
	FullName  string     `json:"fullName"`
	Email     string     `json:"email"`
	Status    string     `json:"status"`
	Order     int        `json:"order"`
	SignedAt  *time.Time `json:"signedAt,omitempty"`
	UpdatedAt time.Time  `json:"updatedAt"`
}

// Document описывает документ.
type Document struct {
	ID         uuid.UUID        `json:"id"`
	TemplateID uuid.UUID        `json:"templateId"`
	SequenceID uuid.UUID        `json:"sequenceId"`
	Number     string           `json:"number"`
	Title      string           `json:"title"`
	Status     string           `json:"status"`
	Payload    json.RawMessage  `json:"payload"`
	IssuedAt   *time.Time       `json:"issuedAt,omitempty"`
	SignedAt   *time.Time       `json:"signedAt,omitempty"`
	ArchivedAt *time.Time       `json:"archivedAt,omitempty"`
	CreatedAt  time.Time        `json:"createdAt"`
	UpdatedAt  time.Time        `json:"updatedAt"`
	Signers    []DocumentSigner `json:"signers"`
}

// CreateDocumentInput входные данные для выпуска документа.
type CreateDocumentInput struct {
	TemplateID   uuid.UUID
	SequenceCode string
	Title        string
	Payload      json.RawMessage
	SignerIDs    []uuid.UUID
	Status       string
}

// UpdateDocumentInput изменяемые поля документа.
type UpdateDocumentInput struct {
	Title          *string
	Status         *string
	Payload        *json.RawMessage
	SignerStatuses []DocumentSignerStatusInput
}

// DocumentSignerStatusInput позволяет обновить статус подписанта.
type DocumentSignerStatusInput struct {
	SignerID uuid.UUID
	Status   string
}

// DocumentListFilter параметры фильтрации документов.
type DocumentListFilter struct {
	Limit  int
	Status string
}
