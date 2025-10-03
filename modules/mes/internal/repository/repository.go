// Package repository provides database access for MES domain entities.
package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"asfppro/modules/mes/internal/entity"
)

var (
	// ErrWorkCenterNotFound signals missing work center.
	ErrWorkCenterNotFound = errors.New("work center not found")
	// ErrOperationNotFound signals missing operation.
	ErrOperationNotFound = errors.New("operation not found")
	// ErrRouteNotFound signals missing route.
	ErrRouteNotFound = errors.New("route not found")
)

// Repository wraps Postgres access for MES tables.
type Repository struct {
	pool *pgxpool.Pool
}

// New creates repository instance.
func New(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// ListWorkCenters returns work centers ordered by creation date.
func (r *Repository) ListWorkCenters(ctx context.Context, limit int) ([]entity.WorkCenter, error) {
	const query = `SELECT id, code, name, description, created_at, updated_at FROM mes.work_center ORDER BY created_at DESC LIMIT $1`

	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("list work centers: %w", err)
	}
	defer rows.Close()

	var centers []entity.WorkCenter
	for rows.Next() {
		var c entity.WorkCenter
		if err := rows.Scan(&c.ID, &c.Code, &c.Name, &c.Description, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan work center: %w", err)
		}
		centers = append(centers, c)
	}
	return centers, rows.Err()
}

// CreateWorkCenter inserts work center row and returns stored entity.
func (r *Repository) CreateWorkCenter(ctx context.Context, input entity.WorkCenterCreateInput) (entity.WorkCenter, error) {
	const query = `INSERT INTO mes.work_center (id, code, name, description) VALUES ($1, $2, $3, $4)
RETURNING id, code, name, description, created_at, updated_at`

	id := uuid.New()
	var wc entity.WorkCenter
	if err := r.pool.QueryRow(ctx, query, id, input.Code, input.Name, input.Description).
		Scan(&wc.ID, &wc.Code, &wc.Name, &wc.Description, &wc.CreatedAt, &wc.UpdatedAt); err != nil {
		return entity.WorkCenter{}, fmt.Errorf("insert work center: %w", err)
	}
	return wc, nil
}

// UpdateWorkCenter updates provided fields.
func (r *Repository) UpdateWorkCenter(ctx context.Context, id uuid.UUID, input entity.WorkCenterUpdateInput) (entity.WorkCenter, error) {
	parts := make([]string, 0, 2)
	args := make([]any, 0, 3)
	idx := 1

	if input.Name != nil {
		parts = append(parts, fmt.Sprintf("name = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Name))
		idx++
	}
	if input.Description != nil {
		parts = append(parts, fmt.Sprintf("description = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Description))
		idx++
	}

	if len(parts) == 0 {
		return r.getWorkCenter(ctx, id)
	}
	parts = append(parts, "updated_at = NOW()")

	query := fmt.Sprintf("UPDATE mes.work_center SET %s WHERE id = $%d RETURNING id, code, name, description, created_at, updated_at", strings.Join(parts, ", "), idx)
	args = append(args, id)

	var wc entity.WorkCenter
	if err := r.pool.QueryRow(ctx, query, args...).Scan(&wc.ID, &wc.Code, &wc.Name, &wc.Description, &wc.CreatedAt, &wc.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.WorkCenter{}, ErrWorkCenterNotFound
		}
		return entity.WorkCenter{}, fmt.Errorf("update work center: %w", err)
	}
	return wc, nil
}

func (r *Repository) getWorkCenter(ctx context.Context, id uuid.UUID) (entity.WorkCenter, error) {
	const query = `SELECT id, code, name, description, created_at, updated_at FROM mes.work_center WHERE id = $1`

	var wc entity.WorkCenter
	if err := r.pool.QueryRow(ctx, query, id).Scan(&wc.ID, &wc.Code, &wc.Name, &wc.Description, &wc.CreatedAt, &wc.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.WorkCenter{}, ErrWorkCenterNotFound
		}
		return entity.WorkCenter{}, fmt.Errorf("get work center: %w", err)
	}
	return wc, nil
}

// ListOperations returns operations ordered by creation date.
func (r *Repository) ListOperations(ctx context.Context, limit int) ([]entity.Operation, error) {
	const query = `SELECT id, code, name, description, default_duration_minutes, created_at, updated_at
FROM mes.operation ORDER BY created_at DESC LIMIT $1`

	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("list operations: %w", err)
	}
	defer rows.Close()

	var ops []entity.Operation
	for rows.Next() {
		var op entity.Operation
		if err := rows.Scan(&op.ID, &op.Code, &op.Name, &op.Description, &op.DurationMin, &op.CreatedAt, &op.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan operation: %w", err)
		}
		ops = append(ops, op)
	}
	return ops, rows.Err()
}

// CreateOperation inserts operation row.
func (r *Repository) CreateOperation(ctx context.Context, input entity.OperationCreateInput) (entity.Operation, error) {
	const query = `INSERT INTO mes.operation (id, code, name, description, default_duration_minutes)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, code, name, description, default_duration_minutes, created_at, updated_at`

	id := uuid.New()
	var op entity.Operation
	if err := r.pool.QueryRow(ctx, query, id, input.Code, input.Name, input.Description, input.DurationMin).
		Scan(&op.ID, &op.Code, &op.Name, &op.Description, &op.DurationMin, &op.CreatedAt, &op.UpdatedAt); err != nil {
		return entity.Operation{}, fmt.Errorf("insert operation: %w", err)
	}
	return op, nil
}

// UpdateOperation updates operation fields.
func (r *Repository) UpdateOperation(ctx context.Context, id uuid.UUID, input entity.OperationUpdateInput) (entity.Operation, error) {
	parts := make([]string, 0, 3)
	args := make([]any, 0, 4)
	idx := 1

	if input.Name != nil {
		parts = append(parts, fmt.Sprintf("name = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Name))
		idx++
	}
	if input.Description != nil {
		parts = append(parts, fmt.Sprintf("description = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Description))
		idx++
	}
	if input.DurationMin != nil {
		parts = append(parts, fmt.Sprintf("default_duration_minutes = $%d", idx))
		args = append(args, *input.DurationMin)
		idx++
	}

	if len(parts) == 0 {
		return r.getOperation(ctx, id)
	}
	parts = append(parts, "updated_at = NOW()")

	query := fmt.Sprintf("UPDATE mes.operation SET %s WHERE id = $%d RETURNING id, code, name, description, default_duration_minutes, created_at, updated_at", strings.Join(parts, ", "), idx)
	args = append(args, id)

	var op entity.Operation
	if err := r.pool.QueryRow(ctx, query, args...).Scan(&op.ID, &op.Code, &op.Name, &op.Description, &op.DurationMin, &op.CreatedAt, &op.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.Operation{}, ErrOperationNotFound
		}
		return entity.Operation{}, fmt.Errorf("update operation: %w", err)
	}
	return op, nil
}

func (r *Repository) getOperation(ctx context.Context, id uuid.UUID) (entity.Operation, error) {
	const query = `SELECT id, code, name, description, default_duration_minutes, created_at, updated_at FROM mes.operation WHERE id = $1`

	var op entity.Operation
	if err := r.pool.QueryRow(ctx, query, id).Scan(&op.ID, &op.Code, &op.Name, &op.Description, &op.DurationMin, &op.CreatedAt, &op.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.Operation{}, ErrOperationNotFound
		}
		return entity.Operation{}, fmt.Errorf("get operation: %w", err)
	}
	return op, nil
}

// ListRoutes returns manufacturing routes.
func (r *Repository) ListRoutes(ctx context.Context, limit int) ([]entity.Route, error) {
	const query = `SELECT id, code, name, description, created_at, updated_at FROM mes.route ORDER BY created_at DESC LIMIT $1`

	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("list routes: %w", err)
	}
	defer rows.Close()

	var routes []entity.Route
	for rows.Next() {
		var rt entity.Route
		if err := rows.Scan(&rt.ID, &rt.Code, &rt.Name, &rt.Description, &rt.CreatedAt, &rt.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan route: %w", err)
		}
		routes = append(routes, rt)
	}
	return routes, rows.Err()
}

// CreateRoute inserts route row.
func (r *Repository) CreateRoute(ctx context.Context, input entity.RouteCreateInput) (entity.Route, error) {
	const query = `INSERT INTO mes.route (id, code, name, description) VALUES ($1, $2, $3, $4)
RETURNING id, code, name, description, created_at, updated_at`

	id := uuid.New()
	var rt entity.Route
	if err := r.pool.QueryRow(ctx, query, id, input.Code, input.Name, input.Description).
		Scan(&rt.ID, &rt.Code, &rt.Name, &rt.Description, &rt.CreatedAt, &rt.UpdatedAt); err != nil {
		return entity.Route{}, fmt.Errorf("insert route: %w", err)
	}
	return rt, nil
}

// UpdateRoute updates route fields.
func (r *Repository) UpdateRoute(ctx context.Context, id uuid.UUID, input entity.RouteUpdateInput) (entity.Route, error) {
	parts := make([]string, 0, 2)
	args := make([]any, 0, 3)
	idx := 1

	if input.Name != nil {
		parts = append(parts, fmt.Sprintf("name = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Name))
		idx++
	}
	if input.Description != nil {
		parts = append(parts, fmt.Sprintf("description = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Description))
		idx++
	}

	if len(parts) == 0 {
		return r.getRoute(ctx, id)
	}
	parts = append(parts, "updated_at = NOW()")

	query := fmt.Sprintf("UPDATE mes.route SET %s WHERE id = $%d RETURNING id, code, name, description, created_at, updated_at", strings.Join(parts, ", "), idx)
	args = append(args, id)

	var rt entity.Route
	if err := r.pool.QueryRow(ctx, query, args...).Scan(&rt.ID, &rt.Code, &rt.Name, &rt.Description, &rt.CreatedAt, &rt.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.Route{}, ErrRouteNotFound
		}
		return entity.Route{}, fmt.Errorf("update route: %w", err)
	}
	return rt, nil
}

func (r *Repository) getRoute(ctx context.Context, id uuid.UUID) (entity.Route, error) {
	const query = `SELECT id, code, name, description, created_at, updated_at FROM mes.route WHERE id = $1`

	var rt entity.Route
	if err := r.pool.QueryRow(ctx, query, id).Scan(&rt.ID, &rt.Code, &rt.Name, &rt.Description, &rt.CreatedAt, &rt.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.Route{}, ErrRouteNotFound
		}
		return entity.Route{}, fmt.Errorf("get route: %w", err)
	}
	return rt, nil
}
