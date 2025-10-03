package mes

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

// Service orchestrates MES operations for gateway.
type Service struct {
	repo   *Repository
	logger zerolog.Logger
}

// NewService constructs Service.
func NewService(repo *Repository, logger zerolog.Logger) *Service {
	return &Service{repo: repo, logger: logger.With().Str("component", "gateway.mes.service").Logger()}
}

// ListWorkCenters returns work centers with optional limit.
func (s *Service) ListWorkCenters(ctx context.Context, limit int) ([]WorkCenter, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}
	return s.repo.ListWorkCenters(ctx, limit)
}

// CreateWorkCenter validates and persists work center.
func (s *Service) CreateWorkCenter(ctx context.Context, input CreateWorkCenterInput) (WorkCenter, error) {
	input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
	input.Name = strings.TrimSpace(input.Name)
	input.Description = strings.TrimSpace(input.Description)

	if input.Code == "" {
		return WorkCenter{}, fmt.Errorf("code is required")
	}
	if input.Name == "" {
		return WorkCenter{}, fmt.Errorf("name is required")
	}

	wc, err := s.repo.CreateWorkCenter(ctx, input)
	if err != nil {
		return WorkCenter{}, err
	}

	s.logger.Info().Str("workCenterId", wc.ID.String()).Msg("mes work center created via gateway")
	return wc, nil
}

// UpdateWorkCenter applies partial update.
func (s *Service) UpdateWorkCenter(ctx context.Context, id uuid.UUID, input UpdateWorkCenterInput) (WorkCenter, error) {
	if input.Name != nil {
		trim := strings.TrimSpace(*input.Name)
		if trim == "" {
			return WorkCenter{}, fmt.Errorf("name cannot be empty")
		}
		input.Name = &trim
	}
	if input.Description != nil {
		trim := strings.TrimSpace(*input.Description)
		input.Description = &trim
	}

	wc, err := s.repo.UpdateWorkCenter(ctx, id, input)
	if err != nil {
		return WorkCenter{}, err
	}

	s.logger.Info().Str("workCenterId", wc.ID.String()).Msg("mes work center updated via gateway")
	return wc, nil
}

// ListOperations returns operations list.
func (s *Service) ListOperations(ctx context.Context, limit int) ([]Operation, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}
	return s.repo.ListOperations(ctx, limit)
}

// CreateOperation validates and stores operation.
func (s *Service) CreateOperation(ctx context.Context, input CreateOperationInput) (Operation, error) {
	input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
	input.Name = strings.TrimSpace(input.Name)
	input.Description = strings.TrimSpace(input.Description)

	if input.Code == "" {
		return Operation{}, fmt.Errorf("code is required")
	}
	if input.Name == "" {
		return Operation{}, fmt.Errorf("name is required")
	}
	if input.DurationMin < 0 {
		return Operation{}, fmt.Errorf("defaultDurationMinutes cannot be negative")
	}

	op, err := s.repo.CreateOperation(ctx, input)
	if err != nil {
		return Operation{}, err
	}

	s.logger.Info().Str("operationId", op.ID.String()).Msg("mes operation created via gateway")
	return op, nil
}

// UpdateOperation applies partial update.
func (s *Service) UpdateOperation(ctx context.Context, id uuid.UUID, input UpdateOperationInput) (Operation, error) {
	if input.Name != nil {
		trim := strings.TrimSpace(*input.Name)
		if trim == "" {
			return Operation{}, fmt.Errorf("name cannot be empty")
		}
		input.Name = &trim
	}
	if input.Description != nil {
		trim := strings.TrimSpace(*input.Description)
		input.Description = &trim
	}
	if input.DurationMin != nil && *input.DurationMin < 0 {
		return Operation{}, fmt.Errorf("defaultDurationMinutes cannot be negative")
	}

	op, err := s.repo.UpdateOperation(ctx, id, input)
	if err != nil {
		return Operation{}, err
	}

	s.logger.Info().Str("operationId", op.ID.String()).Msg("mes operation updated via gateway")
	return op, nil
}

// ListRoutes returns registered routes.
func (s *Service) ListRoutes(ctx context.Context, limit int) ([]Route, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}
	return s.repo.ListRoutes(ctx, limit)
}

// CreateRoute validates and stores route.
func (s *Service) CreateRoute(ctx context.Context, input CreateRouteInput) (Route, error) {
	input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
	input.Name = strings.TrimSpace(input.Name)
	input.Description = strings.TrimSpace(input.Description)

	if input.Code == "" {
		return Route{}, fmt.Errorf("code is required")
	}
	if input.Name == "" {
		return Route{}, fmt.Errorf("name is required")
	}

	rt, err := s.repo.CreateRoute(ctx, input)
	if err != nil {
		return Route{}, err
	}

	s.logger.Info().Str("routeId", rt.ID.String()).Msg("mes route created via gateway")
	return rt, nil
}

// UpdateRoute updates allowed fields.
func (s *Service) UpdateRoute(ctx context.Context, id uuid.UUID, input UpdateRouteInput) (Route, error) {
	if input.Name != nil {
		trim := strings.TrimSpace(*input.Name)
		if trim == "" {
			return Route{}, fmt.Errorf("name cannot be empty")
		}
		input.Name = &trim
	}
	if input.Description != nil {
		trim := strings.TrimSpace(*input.Description)
		input.Description = &trim
	}

	rt, err := s.repo.UpdateRoute(ctx, id, input)
	if err != nil {
		return Route{}, err
	}

	s.logger.Info().Str("routeId", rt.ID.String()).Msg("mes route updated via gateway")
	return rt, nil
}
