package entity

import (
	"encoding/json"
	"time"
)

// Template описывает шаблон документа.
type Template struct {
	ID          string          `json:"id"`
	Code        string          `json:"code"`
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Version     int             `json:"version"`
	Body        json.RawMessage `json:"body"`
	CreatedAt   time.Time       `json:"createdAt"`
	UpdatedAt   time.Time       `json:"updatedAt"`
}

// TemplateCreateInput входные данные для создания шаблона.
type TemplateCreateInput struct {
	Code        string          `json:"code"`
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Body        json.RawMessage `json:"body"`
}

// TemplateUpdateInput содержит изменяемые поля шаблона.
type TemplateUpdateInput struct {
	Name        *string          `json:"name"`
	Description *string          `json:"description"`
	Body        *json.RawMessage `json:"body"`
	Version     *int             `json:"version"`
}

// Signer описывает участника согласования.
type Signer struct {
	ID        string    `json:"id"`
	Code      string    `json:"code"`
	FullName  string    `json:"fullName"`
	Position  string    `json:"position"`
	Email     string    `json:"email"`
	Phone     string    `json:"phone"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// SignerCreateInput входные данные для создания подписанта.
type SignerCreateInput struct {
	Code     string `json:"code"`
	FullName string `json:"fullName"`
	Position string `json:"position"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
}

// SignerUpdateInput содержит изменяемые поля подписанта.
type SignerUpdateInput struct {
	FullName *string `json:"fullName"`
	Position *string `json:"position"`
	Email    *string `json:"email"`
	Phone    *string `json:"phone"`
}

// Document описывает выпущенный документ.
type Document struct {
	ID         string           `json:"id"`
	TemplateID string           `json:"templateId"`
	SequenceID string           `json:"sequenceId"`
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

// DocumentSigner отражает статус подписанта по документу.
type DocumentSigner struct {
	ID        string     `json:"id"`
	SignerID  string     `json:"signerId"`
	FullName  string     `json:"fullName"`
	Email     string     `json:"email"`
	Status    string     `json:"status"`
	OrderNo   int        `json:"order"`
	SignedAt  *time.Time `json:"signedAt,omitempty"`
	UpdatedAt time.Time  `json:"updatedAt"`
}

// DocumentCreateInput задаёт параметры выпуска документа.
type DocumentCreateInput struct {
	TemplateID   string          `json:"templateId"`
	SequenceCode string          `json:"sequenceCode"`
	Title        string          `json:"title"`
	Payload      json.RawMessage `json:"payload"`
	SignerIDs    []string        `json:"signerIds"`
	Status       string          `json:"status"`
}

// DocumentUpdateInput описывает изменяемые поля документа.
type DocumentUpdateInput struct {
	Title          *string                     `json:"title"`
	Status         *string                     `json:"status"`
	Payload        *json.RawMessage            `json:"payload"`
	SignerStatuses []DocumentSignerStatusInput `json:"signers"`
}

// DocumentSignerStatusInput позволяет обновить статус подписанта.
type DocumentSignerStatusInput struct {
	SignerID string `json:"signerId"`
	Status   string `json:"status"`
}

// DocumentListFilter содержит параметры фильтрации документов.
type DocumentListFilter struct {
	Limit  int
	Status string
}

// TemplateListFilter переиспользуемый фильтр по лимиту.
type TemplateListFilter struct {
	Limit int
}

// SignerListFilter переиспользуемый фильтр по лимиту.
type SignerListFilter struct {
	Limit int
}
