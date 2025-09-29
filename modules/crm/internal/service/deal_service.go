// Package service orchestrates CRM deal use cases.
package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"asfppro/modules/crm/internal/entity"
	"asfppro/modules/crm/internal/repository"
	"asfppro/pkg/audit"
	"asfppro/pkg/queue"
)

// DealCreateInput describes payload required to create deal.
type DealCreateInput struct {
	Title      string  `json:"title"`
	CustomerID string  `json:"customerId"`
	Stage      string  `json:"stage"`
	Amount     float64 `json:"amount"`
	Currency   string  `json:"currency"`
	CreatedBy  string  `json:"createdBy"`
}

// DealService wraps business logic around deals.
type DealService struct {
	repo      *repository.DealRepository
	publisher *queue.Publisher
	auditor   *audit.Recorder
	logger    zerolog.Logger
}

// NewDealService instantiates service.
func NewDealService(repo *repository.DealRepository, publisher *queue.Publisher, auditor *audit.Recorder, logger zerolog.Logger) *DealService {
	return &DealService{repo: repo, publisher: publisher, auditor: auditor, logger: logger}
}

// Create validates and persists deal data.
func (s *DealService) Create(ctx context.Context, input DealCreateInput) (entity.Deal, error) {
	if strings.TrimSpace(input.Title) == "" {
		return entity.Deal{}, fmt.Errorf("title must not be empty")
	}

	stage := strings.TrimSpace(input.Stage)
	if stage == "" {
		stage = "new"
	}

	deal := entity.Deal{
		ID:         uuid.NewString(),
		Title:      input.Title,
		CustomerID: input.CustomerID,
		Stage:      stage,
		Amount:     input.Amount,
		Currency:   strings.ToUpper(input.Currency),
		CreatedBy:  input.CreatedBy,
	}

	stored, err := s.repo.Create(ctx, deal)
	if err != nil {
		return entity.Deal{}, err
	}

	payload := struct {
		ID         string  `json:"id"`
		Stage      string  `json:"stage"`
		Title      string  `json:"title"`
		Amount     float64 `json:"amount"`
		Currency   string  `json:"currency"`
		CustomerID string  `json:"customerId"`
		CreatedBy  string  `json:"createdBy"`
		CreatedAt  string  `json:"createdAt"`
	}{
		ID:         stored.ID,
		Stage:      stored.Stage,
		Title:      stored.Title,
		Amount:     stored.Amount,
		Currency:   stored.Currency,
		CustomerID: stored.CustomerID,
		CreatedBy:  stored.CreatedBy,
		CreatedAt:  stored.CreatedAt.UTC().Format(time.RFC3339),
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		s.logger.Error().Err(err).Msg("marshal deal payload")
	} else {
		if err := s.repo.AppendEvent(ctx, entity.DealEvent{
			DealID:    stored.ID,
			EventType: "deal.created",
			Payload:   payloadBytes,
		}); err != nil {
			s.logger.Error().Err(err).Msg("store deal event")
		}
	}

	if err := s.publisher.Publish(ctx, "DealCreated", payload); err != nil {
		s.logger.Error().Err(err).Msg("publish deal created")
	}

	s.recordAudit(ctx, stored, input)

	return stored, nil
}

// List returns latest deals.
func (s *DealService) List(ctx context.Context, limit int) ([]entity.Deal, error) {
	if limit <= 0 {
		limit = 20
	}
	return s.repo.List(ctx, limit)
}

// History returns deal events with optional limit.
func (s *DealService) History(ctx context.Context, dealID string, limit int) ([]entity.DealEvent, error) {
	if _, err := uuid.Parse(dealID); err != nil {
		return nil, fmt.Errorf("invalid deal id")
	}
	if limit <= 0 {
		limit = 50
	}
	return s.repo.History(ctx, dealID, limit)
}

func (s *DealService) recordAudit(ctx context.Context, deal entity.Deal, input DealCreateInput) {
	if s.auditor == nil {
		return
	}

	actorID := uuid.Nil
	if id, err := uuid.Parse(strings.TrimSpace(input.CreatedBy)); err == nil {
		actorID = id
	} else if strings.TrimSpace(input.CreatedBy) != "" {
		s.logger.Warn().Str("createdBy", input.CreatedBy).Msg("deal audit actor parse failed")
	}

	payload := map[string]any{
		"dealId":     deal.ID,
		"title":      deal.Title,
		"customerId": deal.CustomerID,
		"amount":     deal.Amount,
		"currency":   deal.Currency,
		"stage":      deal.Stage,
	}

	if err := s.auditor.Record(ctx, audit.Entry{
		ActorID:  actorID,
		Action:   "crm.deal.create",
		Entity:   "crm.deal",
		EntityID: deal.ID,
		Payload:  payload,
	}); err != nil {
		s.logger.Error().Err(err).Msg("audit deal create")
	}
}
