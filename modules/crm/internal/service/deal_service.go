package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"asfppro/modules/crm/internal/entity"
	"asfppro/modules/crm/internal/repository"
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
	logger    zerolog.Logger
}

// NewDealService instantiates service.
func NewDealService(repo *repository.DealRepository, publisher *queue.Publisher, logger zerolog.Logger) *DealService {
	return &DealService{repo: repo, publisher: publisher, logger: logger}
}

// Create validates and persists deal data.
func (s *DealService) Create(ctx context.Context, input DealCreateInput) (entity.Deal, error) {
	if strings.TrimSpace(input.Title) == "" {
		return entity.Deal{}, fmt.Errorf("title must not be empty")
	}

	deal := entity.Deal{
		ID:         uuid.NewString(),
		Title:      input.Title,
		CustomerID: input.CustomerID,
		Stage:      input.Stage,
		Amount:     input.Amount,
		Currency:   strings.ToUpper(input.Currency),
		CreatedBy:  input.CreatedBy,
	}

	stored, err := s.repo.Create(ctx, deal)
	if err != nil {
		return entity.Deal{}, err
	}

	event := struct {
		ID         string  `json:"id"`
		Title      string  `json:"title"`
		Amount     float64 `json:"amount"`
		Currency   string  `json:"currency"`
		CustomerID string  `json:"customerId"`
		CreatedAt  string  `json:"createdAt"`
	}{
		ID:         stored.ID,
		Title:      stored.Title,
		Amount:     stored.Amount,
		Currency:   stored.Currency,
		CustomerID: stored.CustomerID,
		CreatedAt:  stored.CreatedAt.UTC().Format(time.RFC3339),
	}

	if err := s.publisher.Publish(ctx, "DealCreated", event); err != nil {
		s.logger.Error().Err(err).Msg("publish deal created")
	}

	return stored, nil
}

// List returns latest deals.
func (s *DealService) List(ctx context.Context, limit int) ([]entity.Deal, error) {
	if limit <= 0 {
		limit = 20
	}
	return s.repo.List(ctx, limit)
}
