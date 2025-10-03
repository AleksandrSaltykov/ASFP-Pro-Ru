package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"asfppro/modules/montage/internal/entity"
	"asfppro/modules/montage/internal/repository"
)

// Service объединяет бизнес-логику монтажа.
type Service struct {
	repo   *repository.Repository
	logger zerolog.Logger
}

// New создаёт сервис.
func New(repo *repository.Repository, logger zerolog.Logger) *Service {
	return &Service{repo: repo, logger: logger.With().Str("component", "montage.service").Logger()}
}

// ListCrews возвращает бригады.
func (s *Service) ListCrews(ctx context.Context, limit int) ([]entity.Crew, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.ListCrews(ctx, limit)
}

// CreateCrew создаёт бригаду.
func (s *Service) CreateCrew(ctx context.Context, input entity.CrewCreateInput) (entity.Crew, error) {
	input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
	input.Name = strings.TrimSpace(input.Name)
	input.Specialization = strings.TrimSpace(input.Specialization)

	if input.Code == "" {
		return entity.Crew{}, fmt.Errorf("code is required")
	}
	if input.Name == "" {
		return entity.Crew{}, fmt.Errorf("name is required")
	}

	crew, err := s.repo.CreateCrew(ctx, input)
	if err != nil {
		return entity.Crew{}, err
	}

	s.logger.Info().Str("crewId", crew.ID).Msg("montage crew created")
	return crew, nil
}

// UpdateCrew обновляет бригаду.
func (s *Service) UpdateCrew(ctx context.Context, id uuid.UUID, input entity.CrewUpdateInput) (entity.Crew, error) {
	if input.Name != nil {
		trim := strings.TrimSpace(*input.Name)
		if trim == "" {
			return entity.Crew{}, fmt.Errorf("name cannot be empty")
		}
		input.Name = &trim
	}
	if input.Specialization != nil {
		trim := strings.TrimSpace(*input.Specialization)
		input.Specialization = &trim
	}

	crew, err := s.repo.UpdateCrew(ctx, id, input)
	if err != nil {
		return entity.Crew{}, err
	}

	s.logger.Info().Str("crewId", crew.ID).Msg("montage crew updated")
	return crew, nil
}

// ListVehicles возвращает транспорт.
func (s *Service) ListVehicles(ctx context.Context, limit int) ([]entity.Vehicle, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.ListVehicles(ctx, limit)
}

// CreateVehicle создаёт транспорт.
func (s *Service) CreateVehicle(ctx context.Context, input entity.VehicleCreateInput) (entity.Vehicle, error) {
	input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
	input.Name = strings.TrimSpace(input.Name)
	input.Plate = strings.TrimSpace(strings.ToUpper(input.Plate))
	input.Capacity = strings.TrimSpace(input.Capacity)

	if input.Code == "" {
		return entity.Vehicle{}, fmt.Errorf("code is required")
	}
	if input.Name == "" {
		return entity.Vehicle{}, fmt.Errorf("name is required")
	}

	vehicle, err := s.repo.CreateVehicle(ctx, input)
	if err != nil {
		return entity.Vehicle{}, err
	}

	s.logger.Info().Str("vehicleId", vehicle.ID).Msg("montage vehicle created")
	return vehicle, nil
}

// UpdateVehicle обновляет транспорт.
func (s *Service) UpdateVehicle(ctx context.Context, id uuid.UUID, input entity.VehicleUpdateInput) (entity.Vehicle, error) {
	if input.Name != nil {
		trim := strings.TrimSpace(*input.Name)
		if trim == "" {
			return entity.Vehicle{}, fmt.Errorf("name cannot be empty")
		}
		input.Name = &trim
	}
	if input.Plate != nil {
		trim := strings.TrimSpace(strings.ToUpper(*input.Plate))
		input.Plate = &trim
	}
	if input.Capacity != nil {
		trim := strings.TrimSpace(*input.Capacity)
		input.Capacity = &trim
	}

	vehicle, err := s.repo.UpdateVehicle(ctx, id, input)
	if err != nil {
		return entity.Vehicle{}, err
	}

	s.logger.Info().Str("vehicleId", vehicle.ID).Msg("montage vehicle updated")
	return vehicle, nil
}

// ListTasks возвращает задачи.
func (s *Service) ListTasks(ctx context.Context, limit int) ([]entity.Task, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.repo.ListTasks(ctx, limit)
}

// CreateTask создаёт задачу.
func (s *Service) CreateTask(ctx context.Context, input entity.TaskCreateInput) (entity.Task, error) {
	input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
	input.Title = strings.TrimSpace(input.Title)
	input.Location = strings.TrimSpace(input.Location)

	if input.Code == "" {
		return entity.Task{}, fmt.Errorf("code is required")
	}
	if input.Title == "" {
		return entity.Task{}, fmt.Errorf("title is required")
	}

	var scheduled *time.Time
	if strings.TrimSpace(input.ScheduledAt) != "" {
		parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(input.ScheduledAt))
		if err != nil {
			return entity.Task{}, fmt.Errorf("invalid scheduledAt")
		}
		scheduled = &parsed
	}

	task, err := s.repo.CreateTask(ctx, input, scheduled)
	if err != nil {
		return entity.Task{}, err
	}

	s.logger.Info().Str("taskId", task.ID).Msg("montage task created")
	return task, nil
}

// UpdateTask обновляет задачу.
func (s *Service) UpdateTask(ctx context.Context, id uuid.UUID, input entity.TaskUpdateInput) (entity.Task, error) {
	if input.Title != nil {
		trim := strings.TrimSpace(*input.Title)
		if trim == "" {
			return entity.Task{}, fmt.Errorf("title cannot be empty")
		}
		input.Title = &trim
	}
	if input.Status != nil {
		trim := strings.TrimSpace(strings.ToLower(*input.Status))
		if trim == "" {
			return entity.Task{}, fmt.Errorf("status cannot be empty")
		}
		input.Status = &trim
	}
	var scheduled *time.Time
	if input.ScheduledAt != nil {
		trim := strings.TrimSpace(*input.ScheduledAt)
		if trim == "" {
			scheduled = nil
		} else {
			parsed, err := time.Parse(time.RFC3339, trim)
			if err != nil {
				return entity.Task{}, fmt.Errorf("invalid scheduledAt")
			}
			scheduled = &parsed
		}
	}
	if input.Location != nil {
		trim := strings.TrimSpace(*input.Location)
		input.Location = &trim
	}

	task, err := s.repo.UpdateTask(ctx, id, input, scheduled)
	if err != nil {
		return entity.Task{}, err
	}

	s.logger.Info().Str("taskId", task.ID).Msg("montage task updated")
	return task, nil
}
