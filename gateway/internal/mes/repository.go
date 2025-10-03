package mes

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	// ErrWorkCenterNotFound indicates missing work center row.
	ErrWorkCenterNotFound = errors.New("work center not found")
	// ErrOperationNotFound indicates missing operation row.
	ErrOperationNotFound = errors.New("operation not found")
	// ErrRouteNotFound indicates missing route row.
	ErrRouteNotFound = errors.New("route not found")
)

// Repository provides MES data access for gateway.
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository constructs repository.
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// ListWorkCenters returns work center rows.
func (r *Repository) ListWorkCenters(ctx context.Context, limit int) ([]WorkCenter, error) {
	const query = `SELECT id, code, name, description, created_at, updated_at FROM mes.work_center ORDER BY created_at DESC LIMIT $1`

	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("list work centers: %w", err)
	}
	defer rows.Close()

	var centers []WorkCenter
	for rows.Next() {
		var wc WorkCenter
		if err := rows.Scan(&wc.ID, &wc.Code, &wc.Name, &wc.Description, &wc.CreatedAt, &wc.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan work center: %w", err)
		}
		centers = append(centers, wc)
	}
	return centers, rows.Err()
}

// CreateWorkCenter inserts record.
func (r *Repository) CreateWorkCenter(ctx context.Context, input CreateWorkCenterInput) (WorkCenter, error) {
	const query = `INSERT INTO mes.work_center (id, code, name, description) VALUES ($1, $2, $3, $4)
RETURNING id, code, name, description, created_at, updated_at`

	id := uuid.New()
	var wc WorkCenter
	if err := r.pool.QueryRow(ctx, query, id, input.Code, input.Name, input.Description).
		Scan(&wc.ID, &wc.Code, &wc.Name, &wc.Description, &wc.CreatedAt, &wc.UpdatedAt); err != nil {
		return WorkCenter{}, fmt.Errorf("insert work center: %w", err)
	}
	return wc, nil
}

// UpdateWorkCenter updates existing record.
func (r *Repository) UpdateWorkCenter(ctx context.Context, id uuid.UUID, input UpdateWorkCenterInput) (WorkCenter, error) {
	setParts := make([]string, 0, 2)
	args := make([]any, 0, 3)
	idx := 1

	if input.Name != nil {
		setParts = append(setParts, fmt.Sprintf("name = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Name))
		idx++
	}
	if input.Description != nil {
		setParts = append(setParts, fmt.Sprintf("description = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Description))
		idx++
	}

	if len(setParts) == 0 {
		return r.getWorkCenter(ctx, id)
	}

	setParts = append(setParts, "updated_at = NOW()")
	query := fmt.Sprintf("UPDATE mes.work_center SET %s WHERE id = $%d RETURNING id, code, name, description, created_at, updated_at", strings.Join(setParts, ", "), idx)
	args = append(args, id)

	var wc WorkCenter
	if err := r.pool.QueryRow(ctx, query, args...).Scan(&wc.ID, &wc.Code, &wc.Name, &wc.Description, &wc.CreatedAt, &wc.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return WorkCenter{}, ErrWorkCenterNotFound
		}
		return WorkCenter{}, fmt.Errorf("update work center: %w", err)
	}
	return wc, nil
}

func (r *Repository) getWorkCenter(ctx context.Context, id uuid.UUID) (WorkCenter, error) {
	const query = `SELECT id, code, name, description, created_at, updated_at FROM mes.work_center WHERE id = $1`

	var wc WorkCenter
	if err := r.pool.QueryRow(ctx, query, id).Scan(&wc.ID, &wc.Code, &wc.Name, &wc.Description, &wc.CreatedAt, &wc.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return WorkCenter{}, ErrWorkCenterNotFound
		}
		return WorkCenter{}, fmt.Errorf("get work center: %w", err)
	}
	return wc, nil
}

// ListOperations returns operations.
func (r *Repository) ListOperations(ctx context.Context, limit int) ([]Operation, error) {
	const query = `SELECT id, code, name, description, default_duration_minutes, created_at, updated_at FROM mes.operation ORDER BY created_at DESC LIMIT $1`

	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("list operations: %w", err)
	}
	defer rows.Close()

	var ops []Operation
	for rows.Next() {
		var op Operation
		if err := rows.Scan(&op.ID, &op.Code, &op.Name, &op.Description, &op.DurationMin, &op.CreatedAt, &op.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan operation: %w", err)
		}
		ops = append(ops, op)
	}
	return ops, rows.Err()
}

// CreateOperation inserts record.
func (r *Repository) CreateOperation(ctx context.Context, input CreateOperationInput) (Operation, error) {
	const query = `INSERT INTO mes.operation (id, code, name, description, default_duration_minutes) VALUES ($1, $2, $3, $4, $5)
RETURNING id, code, name, description, default_duration_minutes, created_at, updated_at`

	id := uuid.New()
	var op Operation
	if err := r.pool.QueryRow(ctx, query, id, input.Code, input.Name, input.Description, input.DurationMin).
		Scan(&op.ID, &op.Code, &op.Name, &op.Description, &op.DurationMin, &op.CreatedAt, &op.UpdatedAt); err != nil {
		return Operation{}, fmt.Errorf("insert operation: %w", err)
	}
	return op, nil
}

// UpdateOperation updates record.
func (r *Repository) UpdateOperation(ctx context.Context, id uuid.UUID, input UpdateOperationInput) (Operation, error) {
	setParts := make([]string, 0, 3)
	args := make([]any, 0, 4)
	idx := 1

	if input.Name != nil {
		setParts = append(setParts, fmt.Sprintf("name = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Name))
		idx++
	}
	if input.Description != nil {
		setParts = append(setParts, fmt.Sprintf("description = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Description))
		idx++
	}
	if input.DurationMin != nil {
		setParts = append(setParts, fmt.Sprintf("default_duration_minutes = $%d", idx))
		args = append(args, *input.DurationMin)
		idx++
	}

	if len(setParts) == 0 {
		return r.getOperation(ctx, id)
	}

	setParts = append(setParts, "updated_at = NOW()")
	query := fmt.Sprintf("UPDATE mes.operation SET %s WHERE id = $%d RETURNING id, code, name, description, default_duration_minutes, created_at, updated_at", strings.Join(setParts, ", "), idx)
	args = append(args, id)

	var op Operation
	if err := r.pool.QueryRow(ctx, query, args...).Scan(&op.ID, &op.Code, &op.Name, &op.Description, &op.DurationMin, &op.CreatedAt, &op.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Operation{}, ErrOperationNotFound
		}
		return Operation{}, fmt.Errorf("update operation: %w", err)
	}
	return op, nil
}

func (r *Repository) getOperation(ctx context.Context, id uuid.UUID) (Operation, error) {
	const query = `SELECT id, code, name, description, default_duration_minutes, created_at, updated_at FROM mes.operation WHERE id = $1`

	var op Operation
	if err := r.pool.QueryRow(ctx, query, id).Scan(&op.ID, &op.Code, &op.Name, &op.Description, &op.DurationMin, &op.CreatedAt, &op.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Operation{}, ErrOperationNotFound
		}
		return Operation{}, fmt.Errorf("get operation: %w", err)
	}
	return op, nil
}

// ListRoutes returns route rows.
func (r *Repository) ListRoutes(ctx context.Context, limit int) ([]Route, error) {
	const query = `SELECT id, code, name, description, created_at, updated_at FROM mes.route ORDER BY created_at DESC LIMIT $1`

	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("list routes: %w", err)
	}
	defer rows.Close()

	var routes []Route
	for rows.Next() {
		var rt Route
		if err := rows.Scan(&rt.ID, &rt.Code, &rt.Name, &rt.Description, &rt.CreatedAt, &rt.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan route: %w", err)
		}
		routes = append(routes, rt)
	}
	return routes, rows.Err()
}

// CreateRoute inserts new route.
func (r *Repository) CreateRoute(ctx context.Context, input CreateRouteInput) (Route, error) {
	const query = `INSERT INTO mes.route (id, code, name, description) VALUES ($1, $2, $3, $4)
RETURNING id, code, name, description, created_at, updated_at`

	id := uuid.New()
	var rt Route
	if err := r.pool.QueryRow(ctx, query, id, input.Code, input.Name, input.Description).
		Scan(&rt.ID, &rt.Code, &rt.Name, &rt.Description, &rt.CreatedAt, &rt.UpdatedAt); err != nil {
		return Route{}, fmt.Errorf("insert route: %w", err)
	}
	return rt, nil
}

// UpdateRoute updates route row.
func (r *Repository) UpdateRoute(ctx context.Context, id uuid.UUID, input UpdateRouteInput) (Route, error) {
	setParts := make([]string, 0, 2)
	args := make([]any, 0, 3)
	idx := 1

	if input.Name != nil {
		setParts = append(setParts, fmt.Sprintf("name = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Name))
		idx++
	}
	if input.Description != nil {
		setParts = append(setParts, fmt.Sprintf("description = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Description))
		idx++
	}

	if len(setParts) == 0 {
		return r.getRoute(ctx, id)
	}

	setParts = append(setParts, "updated_at = NOW()")
	query := fmt.Sprintf("UPDATE mes.route SET %s WHERE id = $%d RETURNING id, code, name, description, created_at, updated_at", strings.Join(setParts, ", "), idx)
	args = append(args, id)

	var rt Route
	if err := r.pool.QueryRow(ctx, query, args...).Scan(&rt.ID, &rt.Code, &rt.Name, &rt.Description, &rt.CreatedAt, &rt.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Route{}, ErrRouteNotFound
		}
		return Route{}, fmt.Errorf("update route: %w", err)
	}
	return rt, nil
}

func (r *Repository) getRoute(ctx context.Context, id uuid.UUID) (Route, error) {
	const query = `SELECT id, code, name, description, created_at, updated_at FROM mes.route WHERE id = $1`

	var rt Route
	if err := r.pool.QueryRow(ctx, query, id).Scan(&rt.ID, &rt.Code, &rt.Name, &rt.Description, &rt.CreatedAt, &rt.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Route{}, ErrRouteNotFound
		}
		return Route{}, fmt.Errorf("get route: %w", err)
	}
	return rt, nil
}
