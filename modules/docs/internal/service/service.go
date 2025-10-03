package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"asfppro/modules/docs/internal/entity"
	"asfppro/modules/docs/internal/repository"
)

var (
	allowedDocStatuses = map[string]struct{}{
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

// Service инкапсулирует бизнес-логику Docs.
type Service struct {
	repo   *repository.Repository
	logger zerolog.Logger
}

// New создаёт сервис.
func New(repo *repository.Repository, logger zerolog.Logger) *Service {
	return &Service{repo: repo, logger: logger.With().Str("component", "docs.service").Logger()}
}

// ListTemplates возвращает список шаблонов.
func (s *Service) ListTemplates(ctx context.Context, limit int) ([]entity.Template, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	return s.repo.ListTemplates(ctx, limit)
}

// CreateTemplate добавляет шаблон.
func (s *Service) CreateTemplate(ctx context.Context, input entity.TemplateCreateInput) (entity.Template, error) {
	input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
	input.Name = strings.TrimSpace(input.Name)
	input.Description = strings.TrimSpace(input.Description)
	if input.Code == "" {
		return entity.Template{}, fmt.Errorf("code is required")
	}
	if input.Name == "" {
		return entity.Template{}, fmt.Errorf("name is required")
	}
	if len(input.Body) > 0 && !json.Valid(input.Body) {
		return entity.Template{}, fmt.Errorf("body must be valid json")
	}
	if len(input.Body) == 0 {
		input.Body = json.RawMessage(`{}`)
	}

	tpl, err := s.repo.CreateTemplate(ctx, input)
	if err != nil {
		return entity.Template{}, err
	}
	s.logger.Info().Str("templateId", tpl.ID).Msg("docs template created")
	return tpl, nil
}

// UpdateTemplate изменяет шаблон.
func (s *Service) UpdateTemplate(ctx context.Context, id uuid.UUID, input entity.TemplateUpdateInput) (entity.Template, error) {
	if input.Name != nil {
		trim := strings.TrimSpace(*input.Name)
		if trim == "" {
			return entity.Template{}, fmt.Errorf("name cannot be empty")
		}
		input.Name = &trim
	}
	if input.Description != nil {
		trim := strings.TrimSpace(*input.Description)
		input.Description = &trim
	}
	if input.Body != nil {
		if len(*input.Body) > 0 && !json.Valid(*input.Body) {
			return entity.Template{}, fmt.Errorf("body must be valid json")
		}
		if len(*input.Body) == 0 {
			empty := json.RawMessage(`{}`)
			input.Body = &empty
		}
	}
	if input.Version != nil && *input.Version <= 0 {
		return entity.Template{}, fmt.Errorf("version must be positive")
	}

	tpl, err := s.repo.UpdateTemplate(ctx, id, input)
	if err != nil {
		return entity.Template{}, err
	}
	s.logger.Info().Str("templateId", tpl.ID).Msg("docs template updated")
	return tpl, nil
}

// ListSigners возвращает подписантов.
func (s *Service) ListSigners(ctx context.Context, limit int) ([]entity.Signer, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	return s.repo.ListSigners(ctx, limit)
}

// CreateSigner добавляет подписанта.
func (s *Service) CreateSigner(ctx context.Context, input entity.SignerCreateInput) (entity.Signer, error) {
	input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
	input.FullName = strings.TrimSpace(input.FullName)
	input.Position = strings.TrimSpace(input.Position)
	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	input.Phone = strings.TrimSpace(input.Phone)

	if input.Code == "" {
		return entity.Signer{}, fmt.Errorf("code is required")
	}
	if input.FullName == "" {
		return entity.Signer{}, fmt.Errorf("fullName is required")
	}

	signer, err := s.repo.CreateSigner(ctx, input)
	if err != nil {
		return entity.Signer{}, err
	}
	s.logger.Info().Str("signerId", signer.ID).Msg("docs signer created")
	return signer, nil
}

// UpdateSigner изменяет данные подписанта.
func (s *Service) UpdateSigner(ctx context.Context, id uuid.UUID, input entity.SignerUpdateInput) (entity.Signer, error) {
	if input.FullName != nil {
		trim := strings.TrimSpace(*input.FullName)
		if trim == "" {
			return entity.Signer{}, fmt.Errorf("fullName cannot be empty")
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
		return entity.Signer{}, err
	}
	s.logger.Info().Str("signerId", signer.ID).Msg("docs signer updated")
	return signer, nil
}

// ListDocuments возвращает документы с фильтрацией по статусу.
func (s *Service) ListDocuments(ctx context.Context, filter entity.DocumentListFilter) ([]entity.Document, error) {
	if filter.Limit <= 0 || filter.Limit > 100 {
		filter.Limit = 50
	}
	if filter.Status != "" {
		status := strings.TrimSpace(strings.ToLower(filter.Status))
		if _, ok := allowedDocStatuses[status]; !ok {
			return nil, fmt.Errorf("unsupported status")
		}
		filter.Status = status
	}
	return s.repo.ListDocuments(ctx, filter)
}

// CreateDocument выпускает документ.
func (s *Service) CreateDocument(ctx context.Context, input entity.DocumentCreateInput) (entity.Document, error) {
	input.TemplateID = strings.TrimSpace(input.TemplateID)
	input.SequenceCode = strings.TrimSpace(strings.ToUpper(input.SequenceCode))
	input.Title = strings.TrimSpace(input.Title)
	input.Status = strings.TrimSpace(strings.ToLower(input.Status))

	if input.TemplateID == "" {
		return entity.Document{}, fmt.Errorf("templateId is required")
	}
	if _, err := uuid.Parse(input.TemplateID); err != nil {
		return entity.Document{}, fmt.Errorf("invalid templateId")
	}
	if input.SequenceCode == "" {
		return entity.Document{}, fmt.Errorf("sequenceCode is required")
	}
	if input.Title == "" {
		return entity.Document{}, fmt.Errorf("title is required")
	}
	if len(input.Payload) > 0 && !json.Valid(input.Payload) {
		return entity.Document{}, fmt.Errorf("payload must be valid json")
	}
	if len(input.Payload) == 0 {
		input.Payload = json.RawMessage(`{}`)
	}
	if input.Status == "" {
		input.Status = "issued"
	}
	if _, ok := allowedDocStatuses[input.Status]; !ok {
		return entity.Document{}, fmt.Errorf("unsupported status")
	}

	cleanedSigners := make([]string, 0, len(input.SignerIDs))
	for _, signerID := range input.SignerIDs {
		trim := strings.TrimSpace(signerID)
		if trim == "" {
			continue
		}
		if _, err := uuid.Parse(trim); err != nil {
			return entity.Document{}, fmt.Errorf("invalid signerId %q", signerID)
		}
		cleanedSigners = append(cleanedSigners, trim)
	}
	input.SignerIDs = cleanedSigners

	doc, err := s.repo.CreateDocument(ctx, input)
	if err != nil {
		return entity.Document{}, err
	}
	s.logger.Info().Str("documentId", doc.ID).Msg("docs document issued")
	return doc, nil
}

// UpdateDocument изменяет документ и статусы подписантов.
func (s *Service) UpdateDocument(ctx context.Context, id uuid.UUID, input entity.DocumentUpdateInput) (entity.Document, error) {
	if input.Title != nil {
		trim := strings.TrimSpace(*input.Title)
		if trim == "" {
			return entity.Document{}, fmt.Errorf("title cannot be empty")
		}
		input.Title = &trim
	}
	if input.Payload != nil {
		if len(*input.Payload) > 0 && !json.Valid(*input.Payload) {
			return entity.Document{}, fmt.Errorf("payload must be valid json")
		}
		if len(*input.Payload) == 0 {
			empty := json.RawMessage(`{}`)
			input.Payload = &empty
		}
	}
	if input.Status != nil {
		status := strings.TrimSpace(strings.ToLower(*input.Status))
		if _, ok := allowedDocStatuses[status]; !ok {
			return entity.Document{}, fmt.Errorf("unsupported status")
		}
		input.Status = &status
	}
	if len(input.SignerStatuses) > 0 {
		for i := range input.SignerStatuses {
			trimID := strings.TrimSpace(input.SignerStatuses[i].SignerID)
			if _, err := uuid.Parse(trimID); err != nil {
				return entity.Document{}, fmt.Errorf("invalid signerId %q", input.SignerStatuses[i].SignerID)
			}
			status := strings.TrimSpace(strings.ToLower(input.SignerStatuses[i].Status))
			if _, ok := allowedSignerStatuses[status]; !ok {
				return entity.Document{}, fmt.Errorf("unsupported signer status")
			}
			input.SignerStatuses[i].SignerID = trimID
			input.SignerStatuses[i].Status = status
		}
	}

	doc, err := s.repo.UpdateDocument(ctx, id, input)
	if err != nil {
		return entity.Document{}, err
	}
	s.logger.Info().Str("documentId", doc.ID).Msg("docs document updated")
	return doc, nil
}
