// Package service contains MES application logic.
package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"asfppro/modules/mes/internal/entity"
	"asfppro/modules/mes/internal/repository"
)

// Service aggregates MES use cases.
type Service struct {
	repo   *repository.Repository
	logger zerolog.Logger
}

// New creates Service instance.
func New(repo *repository.Repository, logger zerolog.Logger) *Service {
	return &Service{
		repo:   repo,
		logger: logger.With().Str("component", "mes.service").Logger(),
	}
}

// ListWorkCenters returns limited list of work centers.
func (s *Service) ListWorkCenters(ctx context.Context, limit int) ([]entity.WorkCenter, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.ListWorkCenters(ctx, limit)
}

// CreateWorkCenter validates and stores new work center.
func (s *Service) CreateWorkCenter(ctx context.Context, input entity.WorkCenterCreateInput) (entity.WorkCenter, error) {
	input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
	input.Name = strings.TrimSpace(input.Name)
	input.Description = strings.TrimSpace(input.Description)

	if input.Code == "" {
		return entity.WorkCenter{}, fmt.Errorf("code is required")
	}
	if input.Name == "" {
		return entity.WorkCenter{}, fmt.Errorf("name is required")
	}

	wc, err := s.repo.CreateWorkCenter(ctx, input)
	if err != nil {
		return entity.WorkCenter{}, err
	}

	s.logger.Info().Str("workCenterId", wc.ID).Msg("mes work center created")
	return wc, nil
}

// UpdateWorkCenter updates allowed fields.
func (s *Service) UpdateWorkCenter(ctx context.Context, id uuid.UUID, input entity.WorkCenterUpdateInput) (entity.WorkCenter, error) {
	if input.Name != nil {
		trimmed := strings.TrimSpace(*input.Name)
		if trimmed == "" {
			return entity.WorkCenter{}, fmt.Errorf("name cannot be empty")
		}
		input.Name = &trimmed
	}
	if input.Description != nil {
		trimmed := strings.TrimSpace(*input.Description)
		input.Description = &trimmed
	}

	wc, err := s.repo.UpdateWorkCenter(ctx, id, input)
	if err != nil {
		return entity.WorkCenter{}, err
	}

	s.logger.Info().Str("workCenterId", wc.ID).Msg("mes work center updated")
	return wc, nil
}

// ListOperations returns limited operations list.
func (s *Service) ListOperations(ctx context.Context, limit int) ([]entity.Operation, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.ListOperations(ctx, limit)
}

// CreateOperation validates and stores operation.
func (s *Service) CreateOperation(ctx context.Context, input entity.OperationCreateInput) (entity.Operation, error) {
	input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
	input.Name = strings.TrimSpace(input.Name)
	input.Description = strings.TrimSpace(input.Description)

	if input.Code == "" {
		return entity.Operation{}, fmt.Errorf("code is required")
	}
	if input.Name == "" {
		return entity.Operation{}, fmt.Errorf("name is required")
	}
	if input.DurationMin < 0 {
		return entity.Operation{}, fmt.Errorf("defaultDurationMinutes cannot be negative")
	}

	op, err := s.repo.CreateOperation(ctx, input)
	if err != nil {
		return entity.Operation{}, err
	}

	s.logger.Info().Str("operationId", op.ID).Msg("mes operation created")
	return op, nil
}

// UpdateOperation updates allowed operation fields.
func (s *Service) UpdateOperation(ctx context.Context, id uuid.UUID, input entity.OperationUpdateInput) (entity.Operation, error) {
	if input.Name != nil {
		trimmed := strings.TrimSpace(*input.Name)
		if trimmed == "" {
			return entity.Operation{}, fmt.Errorf("name cannot be empty")
		}
		input.Name = &trimmed
	}
	if input.Description != nil {
		trimmed := strings.TrimSpace(*input.Description)
		input.Description = &trimmed
	}
	if input.DurationMin != nil && *input.DurationMin < 0 {
		return entity.Operation{}, fmt.Errorf("defaultDurationMinutes cannot be negative")
	}

	op, err := s.repo.UpdateOperation(ctx, id, input)
	if err != nil {
		return entity.Operation{}, err
	}

	s.logger.Info().Str("operationId", op.ID).Msg("mes operation updated")
	return op, nil
}

// ListRoutes returns manufacturing routes.
func (s *Service) ListRoutes(ctx context.Context, limit int) ([]entity.Route, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.ListRoutes(ctx, limit)
}

// CreateRoute validates and stores new route.
func (s *Service) CreateRoute(ctx context.Context, input entity.RouteCreateInput) (entity.Route, error) {
	input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
	input.Name = strings.TrimSpace(input.Name)
	input.Description = strings.TrimSpace(input.Description)

	if input.Code == "" {
		return entity.Route{}, fmt.Errorf("code is required")
	}
	if input.Name == "" {
		return entity.Route{}, fmt.Errorf("name is required")
	}

	rt, err := s.repo.CreateRoute(ctx, input)
	if err != nil {
		return entity.Route{}, err
	}

	s.logger.Info().Str("routeId", rt.ID).Msg("mes route created")
	return rt, nil
}

// UpdateRoute updates route fields.
func (s *Service) UpdateRoute(ctx context.Context, id uuid.UUID, input entity.RouteUpdateInput) (entity.Route, error) {
	if input.Name != nil {
		trimmed := strings.TrimSpace(*input.Name)
		if trimmed == "" {
			return entity.Route{}, fmt.Errorf("name cannot be empty")
		}
		input.Name = &trimmed
	}
	if input.Description != nil {
		trimmed := strings.TrimSpace(*input.Description)
		input.Description = &trimmed
	}

	rt, err := s.repo.UpdateRoute(ctx, id, input)
	if err != nil {
		return entity.Route{}, err
	}

	s.logger.Info().Str("routeId", rt.ID).Msg("mes route updated")
	return rt, nil
}
