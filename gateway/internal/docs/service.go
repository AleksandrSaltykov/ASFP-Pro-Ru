package docs

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

var (
	allowedStatuses = map[string]struct{}{
		"draft":    {},
		"issued":   {},
		"signed":   {},
		"archived": {},
	}
	allowedSignerStatuses = map[string]struct{}{
		"pending":  {},
		"signed":   {},
		"declined": {},
	}
)

// Service инкапсулирует бизнес-логику Docs для gateway.
type Service struct {
	repo   *Repository
	logger zerolog.Logger
}

// NewService создаёт сервис.
func NewService(repo *Repository, logger zerolog.Logger) *Service {
	return &Service{repo: repo, logger: logger.With().Str("component", "gateway.docs.service").Logger()}
}

// ListTemplates возвращает шаблоны.
func (s *Service) ListTemplates(ctx context.Context, limit int) ([]Template, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	return s.repo.ListTemplates(ctx, limit)
}

// CreateTemplate добавляет шаблон.
func (s *Service) CreateTemplate(ctx context.Context, input CreateTemplateInput) (Template, error) {
	input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
	input.Name = strings.TrimSpace(input.Name)
	input.Description = strings.TrimSpace(input.Description)

	if input.Code == "" {
		return Template{}, fmt.Errorf("code is required")
	}
	if input.Name == "" {
		return Template{}, fmt.Errorf("name is required")
	}
	if len(input.Body) > 0 && !json.Valid(input.Body) {
		return Template{}, fmt.Errorf("body must be valid json")
	}
	if len(input.Body) == 0 {
		input.Body = json.RawMessage(`{}`)
	}

	tpl, err := s.repo.CreateTemplate(ctx, input)
	if err != nil {
		return Template{}, err
	}
	s.logger.Info().Str("templateId", tpl.ID.String()).Msg("docs template created via gateway")
	return tpl, nil
}

// UpdateTemplate обновляет шаблон.
func (s *Service) UpdateTemplate(ctx context.Context, id uuid.UUID, input UpdateTemplateInput) (Template, error) {
	if input.Name != nil {
		trim := strings.TrimSpace(*input.Name)
		if trim == "" {
			return Template{}, fmt.Errorf("name cannot be empty")
		}
		input.Name = &trim
	}
	if input.Description != nil {
		trim := strings.TrimSpace(*input.Description)
		input.Description = &trim
	}
	if input.Body != nil {
		if len(*input.Body) > 0 && !json.Valid(*input.Body) {
			return Template{}, fmt.Errorf("body must be valid json")
		}
		if len(*input.Body) == 0 {
			empty := json.RawMessage(`{}`)
			input.Body = &empty
		}
	}
	if input.Version != nil && *input.Version <= 0 {
		return Template{}, fmt.Errorf("version must be positive")
	}

	tpl, err := s.repo.UpdateTemplate(ctx, id, input)
	if err != nil {
		return Template{}, err
	}
	s.logger.Info().Str("templateId", tpl.ID.String()).Msg("docs template updated via gateway")
	return tpl, nil
}

// ListSigners возвращает подписантов.
func (s *Service) ListSigners(ctx context.Context, limit int) ([]Signer, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	return s.repo.ListSigners(ctx, limit)
}

// CreateSigner добавляет подписанта.
func (s *Service) CreateSigner(ctx context.Context, input CreateSignerInput) (Signer, error) {
	input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
	input.FullName = strings.TrimSpace(input.FullName)
	input.Position = strings.TrimSpace(input.Position)
	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	input.Phone = strings.TrimSpace(input.Phone)

	if input.Code == "" {
		return Signer{}, fmt.Errorf("code is required")
	}
	if input.FullName == "" {
		return Signer{}, fmt.Errorf("fullName is required")
	}

	signer, err := s.repo.CreateSigner(ctx, input)
	if err != nil {
		return Signer{}, err
	}
	s.logger.Info().Str("signerId", signer.ID.String()).Msg("docs signer created via gateway")
	return signer, nil
}

// UpdateSigner изменяет данные подписанта.
func (s *Service) UpdateSigner(ctx context.Context, id uuid.UUID, input UpdateSignerInput) (Signer, error) {
	if input.FullName != nil {
		trim := strings.TrimSpace(*input.FullName)
		if trim == "" {
			return Signer{}, fmt.Errorf("fullName cannot be empty")
		}
		input.FullName = &trim
	}
	if input.Position != nil {
		trim := strings.TrimSpace(*input.Position)
		input.Position = &trim
	}
	if input.Email != nil {
		trim := strings.TrimSpace(strings.ToLower(*input.Email))
		input.Email = &trim
	}
	if input.Phone != nil {
		trim := strings.TrimSpace(*input.Phone)
		input.Phone = &trim
	}

	signer, err := s.repo.UpdateSigner(ctx, id, input)
	if err != nil {
		return Signer{}, err
	}
	s.logger.Info().Str("signerId", signer.ID.String()).Msg("docs signer updated via gateway")
	return signer, nil
}

// ListDocuments возвращает документы.
func (s *Service) ListDocuments(ctx context.Context, filter DocumentListFilter) ([]Document, error) {
	if filter.Limit <= 0 || filter.Limit > 100 {
		filter.Limit = 50
	}
	if filter.Status != "" {
		status := strings.TrimSpace(strings.ToLower(filter.Status))
		if _, ok := allowedStatuses[status]; !ok {
			return nil, fmt.Errorf("unsupported status")
		}
		filter.Status = status
	}
	return s.repo.ListDocuments(ctx, filter)
}

// CreateDocument выпускает документ.
func (s *Service) CreateDocument(ctx context.Context, input CreateDocumentInput) (Document, error) {
	input.SequenceCode = strings.TrimSpace(strings.ToUpper(input.SequenceCode))
	input.Title = strings.TrimSpace(input.Title)
	input.Status = strings.TrimSpace(strings.ToLower(input.Status))

	if input.TemplateID == uuid.Nil {
		return Document{}, fmt.Errorf("templateId is required")
	}
	if input.SequenceCode == "" {
		return Document{}, fmt.Errorf("sequenceCode is required")
	}
	if input.Title == "" {
		return Document{}, fmt.Errorf("title is required")
	}
	if len(input.Payload) > 0 && !json.Valid(input.Payload) {
		return Document{}, fmt.Errorf("payload must be valid json")
	}
	if len(input.Payload) == 0 {
		input.Payload = json.RawMessage(`{}`)
	}
	if input.Status == "" {
		input.Status = "issued"
	}
	if _, ok := allowedStatuses[input.Status]; !ok {
		return Document{}, fmt.Errorf("unsupported status")
	}

	cleaned := make([]uuid.UUID, 0, len(input.SignerIDs))
	for _, id := range input.SignerIDs {
		if id == uuid.Nil {
			continue
		}
		cleaned = append(cleaned, id)
	}
	input.SignerIDs = cleaned

	doc, err := s.repo.CreateDocument(ctx, input)
	if err != nil {
		return Document{}, err
	}
	s.logger.Info().Str("documentId", doc.ID.String()).Msg("docs document created via gateway")
	return doc, nil
}

// UpdateDocument изменяет документ и статусы подписантов.
func (s *Service) UpdateDocument(ctx context.Context, id uuid.UUID, input UpdateDocumentInput) (Document, error) {
	if input.Title != nil {
		trim := strings.TrimSpace(*input.Title)
		if trim == "" {
			return Document{}, fmt.Errorf("title cannot be empty")
		}
		input.Title = &trim
	}
	if input.Payload != nil {
		if len(*input.Payload) > 0 && !json.Valid(*input.Payload) {
			return Document{}, fmt.Errorf("payload must be valid json")
		}
		if len(*input.Payload) == 0 {
			empty := json.RawMessage(`{}`)
			input.Payload = &empty
		}
	}
	if input.Status != nil {
		status := strings.TrimSpace(strings.ToLower(*input.Status))
		if _, ok := allowedStatuses[status]; !ok {
			return Document{}, fmt.Errorf("unsupported status")
		}
		input.Status = &status
	}
	if len(input.SignerStatuses) > 0 {
		for i := range input.SignerStatuses {
			status := strings.TrimSpace(strings.ToLower(input.SignerStatuses[i].Status))
			if input.SignerStatuses[i].SignerID == uuid.Nil {
				return Document{}, fmt.Errorf("signerId is required")
			}
			if _, ok := allowedSignerStatuses[status]; !ok {
				return Document{}, fmt.Errorf("unsupported signer status")
			}
			input.SignerStatuses[i].Status = status
		}
	}

	doc, err := s.repo.UpdateDocument(ctx, id, input)
	if err != nil {
		return Document{}, err
	}
	s.logger.Info().Str("documentId", doc.ID.String()).Msg("docs document updated via gateway")
	return doc, nil
}
