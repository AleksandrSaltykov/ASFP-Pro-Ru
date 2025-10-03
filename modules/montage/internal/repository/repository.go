package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"asfppro/modules/montage/internal/entity"
)

var (
	// ErrCrewNotFound возникает если бригада не найдена.
	ErrCrewNotFound = errors.New("crew not found")
	// ErrVehicleNotFound возникает если транспорт не найден.
	ErrVehicleNotFound = errors.New("vehicle not found")
	// ErrTaskNotFound возникает если задача не найдена.
	ErrTaskNotFound = errors.New("task not found")
)

// Repository инкапсулирует работу с Postgres.
type Repository struct {
	pool *pgxpool.Pool
}

// New создаёт репозиторий.
func New(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// ListCrews возвращает список бригад.
func (r *Repository) ListCrews(ctx context.Context, limit int) ([]entity.Crew, error) {
	const query = `SELECT id, code, name, specialization, created_at, updated_at FROM montage.crew ORDER BY created_at DESC LIMIT $1`
	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("list crews: %w", err)
	}
	defer rows.Close()

	var items []entity.Crew
	for rows.Next() {
		var row entity.Crew
		if err := rows.Scan(&row.ID, &row.Code, &row.Name, &row.Specialization, &row.CreatedAt, &row.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan crew: %w", err)
		}
		items = append(items, row)
	}
	return items, rows.Err()
}

// CreateCrew добавляет бригаду.
func (r *Repository) CreateCrew(ctx context.Context, input entity.CrewCreateInput) (entity.Crew, error) {
	const query = `INSERT INTO montage.crew (id, code, name, specialization) VALUES ($1, $2, $3, $4)
RETURNING id, code, name, specialization, created_at, updated_at`

	id := uuid.New()
	var crew entity.Crew
	if err := r.pool.QueryRow(ctx, query, id, input.Code, input.Name, input.Specialization).
		Scan(&crew.ID, &crew.Code, &crew.Name, &crew.Specialization, &crew.CreatedAt, &crew.UpdatedAt); err != nil {
		return entity.Crew{}, fmt.Errorf("insert crew: %w", err)
	}
	return crew, nil
}

// UpdateCrew обновляет бригаду.
func (r *Repository) UpdateCrew(ctx context.Context, id uuid.UUID, input entity.CrewUpdateInput) (entity.Crew, error) {
	parts := make([]string, 0, 2)
	args := make([]any, 0, 3)
	idx := 1

	if input.Name != nil {
		parts = append(parts, fmt.Sprintf("name = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Name))
		idx++
	}
	if input.Specialization != nil {
		parts = append(parts, fmt.Sprintf("specialization = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Specialization))
		idx++
	}

	if len(parts) == 0 {
		return r.getCrew(ctx, id)
	}

	parts = append(parts, "updated_at = NOW()")
	query := fmt.Sprintf("UPDATE montage.crew SET %s WHERE id = $%d RETURNING id, code, name, specialization, created_at, updated_at", strings.Join(parts, ", "), idx)
	args = append(args, id)

	var crew entity.Crew
	if err := r.pool.QueryRow(ctx, query, args...).Scan(&crew.ID, &crew.Code, &crew.Name, &crew.Specialization, &crew.CreatedAt, &crew.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.Crew{}, ErrCrewNotFound
		}
		return entity.Crew{}, fmt.Errorf("update crew: %w", err)
	}
	return crew, nil
}

func (r *Repository) getCrew(ctx context.Context, id uuid.UUID) (entity.Crew, error) {
	const query = `SELECT id, code, name, specialization, created_at, updated_at FROM montage.crew WHERE id = $1`
	var crew entity.Crew
	if err := r.pool.QueryRow(ctx, query, id).Scan(&crew.ID, &crew.Code, &crew.Name, &crew.Specialization, &crew.CreatedAt, &crew.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.Crew{}, ErrCrewNotFound
		}
		return entity.Crew{}, fmt.Errorf("get crew: %w", err)
	}
	return crew, nil
}

// ListVehicles возвращает транспорт.
func (r *Repository) ListVehicles(ctx context.Context, limit int) ([]entity.Vehicle, error) {
	const query = `SELECT id, code, name, plate, capacity, created_at, updated_at FROM montage.vehicle ORDER BY created_at DESC LIMIT $1`
	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("list vehicles: %w", err)
	}
	defer rows.Close()

	var items []entity.Vehicle
	for rows.Next() {
		var row entity.Vehicle
		if err := rows.Scan(&row.ID, &row.Code, &row.Name, &row.Plate, &row.Capacity, &row.CreatedAt, &row.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan vehicle: %w", err)
		}
		items = append(items, row)
	}
	return items, rows.Err()
}

// CreateVehicle добавляет транспорт.
func (r *Repository) CreateVehicle(ctx context.Context, input entity.VehicleCreateInput) (entity.Vehicle, error) {
	const query = `INSERT INTO montage.vehicle (id, code, name, plate, capacity) VALUES ($1, $2, $3, $4, $5)
RETURNING id, code, name, plate, capacity, created_at, updated_at`

	id := uuid.New()
	var vehicle entity.Vehicle
	if err := r.pool.QueryRow(ctx, query, id, input.Code, input.Name, input.Plate, input.Capacity).
		Scan(&vehicle.ID, &vehicle.Code, &vehicle.Name, &vehicle.Plate, &vehicle.Capacity, &vehicle.CreatedAt, &vehicle.UpdatedAt); err != nil {
		return entity.Vehicle{}, fmt.Errorf("insert vehicle: %w", err)
	}
	return vehicle, nil
}

// UpdateVehicle изменяет транспорт.
func (r *Repository) UpdateVehicle(ctx context.Context, id uuid.UUID, input entity.VehicleUpdateInput) (entity.Vehicle, error) {
	parts := make([]string, 0, 3)
	args := make([]any, 0, 4)
	idx := 1

	if input.Name != nil {
		parts = append(parts, fmt.Sprintf("name = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Name))
		idx++
	}
	if input.Plate != nil {
		parts = append(parts, fmt.Sprintf("plate = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Plate))
		idx++
	}
	if input.Capacity != nil {
		parts = append(parts, fmt.Sprintf("capacity = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Capacity))
		idx++
	}

	if len(parts) == 0 {
		return r.getVehicle(ctx, id)
	}

	parts = append(parts, "updated_at = NOW()")
	query := fmt.Sprintf("UPDATE montage.vehicle SET %s WHERE id = $%d RETURNING id, code, name, plate, capacity, created_at, updated_at", strings.Join(parts, ", "), idx)
	args = append(args, id)

	var vehicle entity.Vehicle
	if err := r.pool.QueryRow(ctx, query, args...).Scan(&vehicle.ID, &vehicle.Code, &vehicle.Name, &vehicle.Plate, &vehicle.Capacity, &vehicle.CreatedAt, &vehicle.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.Vehicle{}, ErrVehicleNotFound
		}
		return entity.Vehicle{}, fmt.Errorf("update vehicle: %w", err)
	}
	return vehicle, nil
}

func (r *Repository) getVehicle(ctx context.Context, id uuid.UUID) (entity.Vehicle, error) {
	const query = `SELECT id, code, name, plate, capacity, created_at, updated_at FROM montage.vehicle WHERE id = $1`
	var vehicle entity.Vehicle
	if err := r.pool.QueryRow(ctx, query, id).Scan(&vehicle.ID, &vehicle.Code, &vehicle.Name, &vehicle.Plate, &vehicle.Capacity, &vehicle.CreatedAt, &vehicle.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.Vehicle{}, ErrVehicleNotFound
		}
		return entity.Vehicle{}, fmt.Errorf("get vehicle: %w", err)
	}
	return vehicle, nil
}

// ListTasks возвращает задачи.
func (r *Repository) ListTasks(ctx context.Context, limit int) ([]entity.Task, error) {
	const query = `SELECT id, code, title, status, COALESCE(crew_id::text, ''), COALESCE(vehicle_id::text, ''), COALESCE(scheduled_at, '1970-01-01'), location, created_at, updated_at
FROM montage.task ORDER BY created_at DESC LIMIT $1`

	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("list tasks: %w", err)
	}
	defer rows.Close()

	var items []entity.Task
	for rows.Next() {
		var (
			crewID    string
			vehicleID string
			scheduled time.Time
			row       entity.Task
		)
		if err := rows.Scan(&row.ID, &row.Code, &row.Title, &row.Status, &crewID, &vehicleID, &scheduled, &row.Location, &row.CreatedAt, &row.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan task: %w", err)
		}
		row.CrewID = crewID
		row.VehicleID = vehicleID
		row.ScheduledAt = scheduled
		items = append(items, row)
	}
	return items, rows.Err()
}

// CreateTask добавляет задачу.
func (r *Repository) CreateTask(ctx context.Context, input entity.TaskCreateInput, scheduled *time.Time) (entity.Task, error) {
	const query = `INSERT INTO montage.task (id, code, title, status, crew_id, vehicle_id, scheduled_at, location)
VALUES ($1, $2, $3, 'planned', $4, $5, $6, $7)
RETURNING id, code, title, status, COALESCE(crew_id::text, ''), COALESCE(vehicle_id::text, ''), COALESCE(scheduled_at, '1970-01-01'), location, created_at, updated_at`

	id := uuid.New()
	var task entity.Task
	var crew any
	if strings.TrimSpace(input.CrewID) != "" {
		u, err := uuid.Parse(strings.TrimSpace(input.CrewID))
		if err != nil {
			return entity.Task{}, fmt.Errorf("invalid crew id")
		}
		crew = u
	}
	var vehicle any
	if strings.TrimSpace(input.VehicleID) != "" {
		u, err := uuid.Parse(strings.TrimSpace(input.VehicleID))
		if err != nil {
			return entity.Task{}, fmt.Errorf("invalid vehicle id")
		}
		vehicle = u
	}
	var scheduledArg any
	if scheduled != nil {
		scheduledArg = *scheduled
	}

	if err := r.pool.QueryRow(ctx, query, id, input.Code, input.Title, crew, vehicle, scheduledArg, input.Location).Scan(&task.ID, &task.Code, &task.Title, &task.Status, &task.CrewID, &task.VehicleID, &task.ScheduledAt, &task.Location, &task.CreatedAt, &task.UpdatedAt); err != nil {
		return entity.Task{}, fmt.Errorf("insert task: %w", err)
	}
	return task, nil
}

// UpdateTask обновляет поля задачи.
func (r *Repository) UpdateTask(ctx context.Context, id uuid.UUID, input entity.TaskUpdateInput, scheduled *time.Time) (entity.Task, error) {
	parts := make([]string, 0, 6)
	args := make([]any, 0, 7)
	idx := 1

	if input.Title != nil {
		parts = append(parts, fmt.Sprintf("title = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Title))
		idx++
	}
	if input.Status != nil {
		parts = append(parts, fmt.Sprintf("status = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Status))
		idx++
	}
	if input.CrewID != nil {
		crew := strings.TrimSpace(*input.CrewID)
		if crew == "" {
			parts = append(parts, fmt.Sprintf("crew_id = NULL"))
		} else {
			u, err := uuid.Parse(crew)
			if err != nil {
				return entity.Task{}, fmt.Errorf("invalid crew id")
			}
			parts = append(parts, fmt.Sprintf("crew_id = $%d", idx))
			args = append(args, u)
			idx++
		}
	}
	if input.VehicleID != nil {
		vehicle := strings.TrimSpace(*input.VehicleID)
		if vehicle == "" {
			parts = append(parts, fmt.Sprintf("vehicle_id = NULL"))
		} else {
			u, err := uuid.Parse(vehicle)
			if err != nil {
				return entity.Task{}, fmt.Errorf("invalid vehicle id")
			}
			parts = append(parts, fmt.Sprintf("vehicle_id = $%d", idx))
			args = append(args, u)
			idx++
		}
	}
	if scheduled != nil {
		parts = append(parts, fmt.Sprintf("scheduled_at = $%d", idx))
		args = append(args, *scheduled)
		idx++
	}
	if input.Location != nil {
		parts = append(parts, fmt.Sprintf("location = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Location))
		idx++
	}

	if len(parts) == 0 {
		return r.getTask(ctx, id)
	}

	parts = append(parts, "updated_at = NOW()")
	query := fmt.Sprintf("UPDATE montage.task SET %s WHERE id = $%d RETURNING id, code, title, status, COALESCE(crew_id::text, ''), COALESCE(vehicle_id::text, ''), COALESCE(scheduled_at, '1970-01-01'), location, created_at, updated_at", strings.Join(parts, ", "), idx)
	args = append(args, id)

	var task entity.Task
	if err := r.pool.QueryRow(ctx, query, args...).Scan(&task.ID, &task.Code, &task.Title, &task.Status, &task.CrewID, &task.VehicleID, &task.ScheduledAt, &task.Location, &task.CreatedAt, &task.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.Task{}, ErrTaskNotFound
		}
		return entity.Task{}, fmt.Errorf("update task: %w", err)
	}
	return task, nil
}

func (r *Repository) getTask(ctx context.Context, id uuid.UUID) (entity.Task, error) {
	const query = `SELECT id, code, title, status, COALESCE(crew_id::text, ''), COALESCE(vehicle_id::text, ''), COALESCE(scheduled_at, '1970-01-01'), location, created_at, updated_at FROM montage.task WHERE id = $1`
	var task entity.Task
	if err := r.pool.QueryRow(ctx, query, id).Scan(&task.ID, &task.Code, &task.Title, &task.Status, &task.CrewID, &task.VehicleID, &task.ScheduledAt, &task.Location, &task.CreatedAt, &task.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.Task{}, ErrTaskNotFound
		}
		return entity.Task{}, fmt.Errorf("get task: %w", err)
	}
	return task, nil
}
