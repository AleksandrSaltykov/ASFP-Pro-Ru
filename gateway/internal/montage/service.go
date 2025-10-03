package montage

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog"
)

// Service инкапсулирует бизнес-логику Montage внутри gateway.
type Service struct {
	repo   *Repository
	logger zerolog.Logger
}

// NewService создаёт сервис.
func NewService(repo *Repository, logger zerolog.Logger) *Service {
	return &Service{repo: repo, logger: logger.With().Str("component", "gateway.montage.service").Logger()}
}

// ListCrews возвращает бригады.
func (s *Service) ListCrews(ctx context.Context, limit int) ([]Crew, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}
	return s.repo.ListCrews(ctx, limit)
}

// CreateCrew создаёт бригаду.
func (s *Service) CreateCrew(ctx context.Context, input CreateCrewInput) (Crew, error) {
	input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
	input.Name = strings.TrimSpace(input.Name)
	input.Specialization = strings.TrimSpace(input.Specialization)

	if input.Code == "" {
		return Crew{}, fmt.Errorf("code is required")
	}
	if input.Name == "" {
		return Crew{}, fmt.Errorf("name is required")
	}

	crew, err := s.repo.CreateCrew(ctx, input)
	if err != nil {
		return Crew{}, err
	}

	s.logger.Info().Str("crewId", crew.ID.String()).Msg("montage crew created via gateway")
	return crew, nil
}

// UpdateCrew обновляет бригаду.
func (s *Service) UpdateCrew(ctx context.Context, id uuid.UUID, input UpdateCrewInput) (Crew, error) {
	if input.Name != nil {
		trim := strings.TrimSpace(*input.Name)
		if trim == "" {
			return Crew{}, fmt.Errorf("name cannot be empty")
		}
		input.Name = &trim
	}
	if input.Specialization != nil {
		trim := strings.TrimSpace(*input.Specialization)
		input.Specialization = &trim
	}

	crew, err := s.repo.UpdateCrew(ctx, id, input)
	if err != nil {
		return Crew{}, err
	}

	s.logger.Info().Str("crewId", crew.ID.String()).Msg("montage crew updated via gateway")
	return crew, nil
}

// ListVehicles возвращает транспорт.
func (s *Service) ListVehicles(ctx context.Context, limit int) ([]Vehicle, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}
	return s.repo.ListVehicles(ctx, limit)
}

// CreateVehicle создаёт транспорт.
func (s *Service) CreateVehicle(ctx context.Context, input CreateVehicleInput) (Vehicle, error) {
	input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
	input.Name = strings.TrimSpace(input.Name)
	input.Plate = strings.TrimSpace(strings.ToUpper(input.Plate))
	input.Capacity = strings.TrimSpace(input.Capacity)

	if input.Code == "" {
		return Vehicle{}, fmt.Errorf("code is required")
	}
	if input.Name == "" {
		return Vehicle{}, fmt.Errorf("name is required")
	}

	vehicle, err := s.repo.CreateVehicle(ctx, input)
	if err != nil {
		return Vehicle{}, err
	}

	s.logger.Info().Str("vehicleId", vehicle.ID.String()).Msg("montage vehicle created via gateway")
	return vehicle, nil
}

// UpdateVehicle обновляет транспорт.
func (s *Service) UpdateVehicle(ctx context.Context, id uuid.UUID, input UpdateVehicleInput) (Vehicle, error) {
	if input.Name != nil {
		trim := strings.TrimSpace(*input.Name)
		if trim == "" {
			return Vehicle{}, fmt.Errorf("name cannot be empty")
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
		return Vehicle{}, err
	}

	s.logger.Info().Str("vehicleId", vehicle.ID.String()).Msg("montage vehicle updated via gateway")
	return vehicle, nil
}

// ListTasks возвращает задачи.
func (s *Service) ListTasks(ctx context.Context, limit int) ([]Task, error) {
	if limit <= 0 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}
	return s.repo.ListTasks(ctx, limit)
}

// CreateTask создаёт задачу.
func (s *Service) CreateTask(ctx context.Context, input CreateTaskInput) (Task, error) {
	input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
	input.Title = strings.TrimSpace(input.Title)
	input.Location = strings.TrimSpace(input.Location)

	if input.Code == "" {
		return Task{}, fmt.Errorf("code is required")
	}
	if input.Title == "" {
		return Task{}, fmt.Errorf("title is required")
	}

	var scheduled *time.Time
	if strings.TrimSpace(input.ScheduledAt) != "" {
		parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(input.ScheduledAt))
		if err != nil {
			return Task{}, fmt.Errorf("invalid scheduledAt")
		}
		scheduled = &parsed
	}

	task, err := s.repo.CreateTask(ctx, input, scheduled)
	if err != nil {
		return Task{}, err
	}

	s.logger.Info().Str("taskId", task.ID.String()).Msg("montage task created via gateway")
	return task, nil
}

// UpdateTask обновляет задачу.
func (s *Service) UpdateTask(ctx context.Context, id uuid.UUID, input UpdateTaskInput) (Task, error) {
	if input.Title != nil {
		trim := strings.TrimSpace(*input.Title)
		if trim == "" {
			return Task{}, fmt.Errorf("title cannot be empty")
		}
		input.Title = &trim
	}
	if input.Status != nil {
		trim := strings.TrimSpace(strings.ToLower(*input.Status))
		if trim == "" {
			return Task{}, fmt.Errorf("status cannot be empty")
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
				return Task{}, fmt.Errorf("invalid scheduledAt")
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
		return Task{}, err
	}

	s.logger.Info().Str("taskId", task.ID.String()).Msg("montage task updated via gateway")
	return task, nil
}
