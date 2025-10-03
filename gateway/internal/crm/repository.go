package crm

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository provides access to crm tables.
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository constructs repository.
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// ListCustomers returns customers ordered by creation.
func (r *Repository) ListCustomers(ctx context.Context) ([]Customer, error) {
	const query = `SELECT id, name, COALESCE(inn, ''), COALESCE(kpp, ''), created_at
FROM crm.customers ORDER BY created_at DESC`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list customers: %w", err)
	}
	defer rows.Close()

	var customers []Customer
	for rows.Next() {
		var c Customer
		if err := rows.Scan(&c.ID, &c.Name, &c.INN, &c.KPP, &c.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan customer: %w", err)
		}
		c.CreatedAt = c.CreatedAt.UTC()
		customers = append(customers, c)
	}
	return customers, rows.Err()
}

// CreateCustomer inserts customer.
func (r *Repository) CreateCustomer(ctx context.Context, input CreateCustomerInput) (Customer, error) {
	const query = `INSERT INTO crm.customers (id, name, inn, kpp)
VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''))
RETURNING id, name, COALESCE(inn, ''), COALESCE(kpp, ''), created_at`

	var c Customer
	id := uuid.New()
	if err := r.pool.QueryRow(ctx, query, id, input.Name, input.INN, input.KPP).
		Scan(&c.ID, &c.Name, &c.INN, &c.KPP, &c.CreatedAt); err != nil {
		return Customer{}, fmt.Errorf("insert customer: %w", err)
	}
	c.CreatedAt = c.CreatedAt.UTC()
	return c, nil
}

// UpdateCustomer updates fields for existing customer.
func (r *Repository) UpdateCustomer(ctx context.Context, id uuid.UUID, input UpdateCustomerInput) (Customer, error) {
	setParts := make([]string, 0, 3)
	args := make([]any, 0, 4)
	idx := 1

	if input.Name != nil {
		setParts = append(setParts, fmt.Sprintf("name = $%d", idx))
		args = append(args, *input.Name)
		idx++
	}
	if input.INN != nil {
		setParts = append(setParts, fmt.Sprintf("inn = NULLIF($%d, '')", idx))
		args = append(args, *input.INN)
		idx++
	}
	if input.KPP != nil {
		setParts = append(setParts, fmt.Sprintf("kpp = NULLIF($%d, '')", idx))
		args = append(args, *input.KPP)
		idx++
	}

	if len(setParts) == 0 {
		return r.findCustomer(ctx, id)
	}

	query := fmt.Sprintf("UPDATE crm.customers SET %s WHERE id = $%d RETURNING id, name, COALESCE(inn, ''), COALESCE(kpp, ''), created_at", strings.Join(setParts, ", "), idx)
	args = append(args, id)

	var c Customer
	if err := r.pool.QueryRow(ctx, query, args...).Scan(&c.ID, &c.Name, &c.INN, &c.KPP, &c.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Customer{}, ErrCustomerNotFound
		}
		return Customer{}, fmt.Errorf("update customer: %w", err)
	}
	c.CreatedAt = c.CreatedAt.UTC()
	return c, nil
}

// ListDeals returns deals with optional stage filter.
func (r *Repository) ListDeals(ctx context.Context, scopes []string, allowAll bool, filter ListDealsFilter) ([]Deal, error) {
	if filter.Limit <= 0 {
		filter.Limit = 20
	}
	if !allowAll && len(scopes) == 0 {
		return []Deal{}, nil
	}

	query := `SELECT id, title, customer_id, stage, amount, currency, COALESCE(created_by, ''), created_at, org_unit_code
FROM crm.deals
WHERE ($1 = '' OR stage = $1)`
	args := []any{filter.Stage}
	if !allowAll {
		query += " AND org_unit_code = ANY($2)"
		args = append(args, scopes)
	}
	limitPlaceholder := fmt.Sprintf("$%d", len(args)+1)
	query += " ORDER BY created_at DESC LIMIT " + limitPlaceholder
	args = append(args, filter.Limit)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list deals: %w", err)
	}
	defer rows.Close()

	var deals []Deal
	for rows.Next() {
		var d Deal
		if err := rows.Scan(&d.ID, &d.Title, &d.CustomerID, &d.Stage, &d.Amount, &d.Currency, &d.CreatedBy, &d.CreatedAt, &d.OrgUnitCode); err != nil {
			return nil, fmt.Errorf("scan deal: %w", err)
		}
		d.CreatedAt = d.CreatedAt.UTC()
		deals = append(deals, d)
	}
	return deals, rows.Err()
}

// CreateDeal inserts deal row.
func (r *Repository) CreateDeal(ctx context.Context, input CreateDealInput) (Deal, error) {
	const query = `INSERT INTO crm.deals (id, title, customer_id, stage, amount, currency, created_by, org_unit_code)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING id, title, customer_id, stage, amount, currency, COALESCE(created_by, ''), created_at, org_unit_code`

	var d Deal
	id := uuid.New()
	if err := r.pool.QueryRow(ctx, query, id, input.Title, input.CustomerID, input.Stage, input.Amount, input.Currency, input.CreatedBy, input.OrgUnitCode).
		Scan(&d.ID, &d.Title, &d.CustomerID, &d.Stage, &d.Amount, &d.Currency, &d.CreatedBy, &d.CreatedAt, &d.OrgUnitCode); err != nil {
		return Deal{}, fmt.Errorf("insert deal: %w", err)
	}
	d.CreatedAt = d.CreatedAt.UTC()
	return d, nil
}

// UpdateDeal updates deal fields.
func (r *Repository) UpdateDeal(ctx context.Context, id uuid.UUID, input UpdateDealInput) (Deal, error) {
	setParts := make([]string, 0, 5)
	args := make([]any, 0, 6)
	idx := 1

	if input.Title != nil {
		setParts = append(setParts, fmt.Sprintf("title = $%d", idx))
		args = append(args, *input.Title)
		idx++
	}
	if input.CustomerID != nil {
		setParts = append(setParts, fmt.Sprintf("customer_id = $%d", idx))
		args = append(args, *input.CustomerID)
		idx++
	}
	if input.Stage != nil {
		setParts = append(setParts, fmt.Sprintf("stage = $%d", idx))
		args = append(args, *input.Stage)
		idx++
	}
	if input.Amount != nil {
		setParts = append(setParts, fmt.Sprintf("amount = $%d", idx))
		args = append(args, *input.Amount)
		idx++
	}
	if input.Currency != nil {
		setParts = append(setParts, fmt.Sprintf("currency = $%d", idx))
		args = append(args, *input.Currency)
		idx++
	}

	if len(setParts) == 0 {
		return r.findDeal(ctx, id)
	}

	query := fmt.Sprintf("UPDATE crm.deals SET %s WHERE id = $%d RETURNING id, title, customer_id, stage, amount, currency, COALESCE(created_by, ''), created_at, org_unit_code", strings.Join(setParts, ", "), idx)
	args = append(args, id)

	var d Deal
	if err := r.pool.QueryRow(ctx, query, args...).Scan(&d.ID, &d.Title, &d.CustomerID, &d.Stage, &d.Amount, &d.Currency, &d.CreatedBy, &d.CreatedAt, &d.OrgUnitCode); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Deal{}, ErrDealNotFound
		}
		return Deal{}, fmt.Errorf("update deal: %w", err)
	}
	d.CreatedAt = d.CreatedAt.UTC()
	return d, nil
}

// findCustomer fetches a customer by id or returns ErrCustomerNotFound.
func (r *Repository) findCustomer(ctx context.Context, id uuid.UUID) (Customer, error) {
	const query = `SELECT id, name, COALESCE(inn, ''), COALESCE(kpp, ''), created_at FROM crm.customers WHERE id = $1`

	var c Customer
	if err := r.pool.QueryRow(ctx, query, id).Scan(&c.ID, &c.Name, &c.INN, &c.KPP, &c.CreatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Customer{}, ErrCustomerNotFound
		}
		return Customer{}, fmt.Errorf("get customer: %w", err)
	}
	c.CreatedAt = c.CreatedAt.UTC()
	return c, nil
}

// findDeal fetches a deal by id or returns ErrDealNotFound.
func (r *Repository) findDeal(ctx context.Context, id uuid.UUID) (Deal, error) {
	const query = `SELECT id, title, customer_id, stage, amount, currency, COALESCE(created_by, ''), created_at, org_unit_code FROM crm.deals WHERE id = $1`

	var d Deal
	if err := r.pool.QueryRow(ctx, query, id).Scan(&d.ID, &d.Title, &d.CustomerID, &d.Stage, &d.Amount, &d.Currency, &d.CreatedBy, &d.CreatedAt, &d.OrgUnitCode); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Deal{}, ErrDealNotFound
		}
		return Deal{}, fmt.Errorf("get deal: %w", err)
	}
	d.CreatedAt = d.CreatedAt.UTC()
	return d, nil
}

// AppendDealEvent stores event entry.
func (r *Repository) AppendDealEvent(ctx context.Context, dealID uuid.UUID, eventType string, payload any) error {
	const query = `INSERT INTO crm.deal_events (deal_id, event_type, payload) VALUES ($1, $2, $3)`
	if _, err := r.pool.Exec(ctx, query, dealID, eventType, payload); err != nil {
		return fmt.Errorf("insert deal event: %w", err)
	}
	return nil
}

// ListDealEvents returns events for deal.
func (r *Repository) ListDealEvents(ctx context.Context, dealID uuid.UUID, limit int) ([]DealEvent, error) {
	if limit <= 0 {
		limit = 20
	}
	const query = `SELECT id, deal_id, event_type, payload, created_at
FROM crm.deal_events WHERE deal_id = $1 ORDER BY created_at DESC LIMIT $2`

	rows, err := r.pool.Query(ctx, query, dealID, limit)
	if err != nil {
		return nil, fmt.Errorf("list deal events: %w", err)
	}
	defer rows.Close()

	var events []DealEvent
	for rows.Next() {
		var (
			e       DealEvent
			payload map[string]any
		)
		if err := rows.Scan(&e.ID, &e.DealID, &e.EventType, &payload, &e.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan deal event: %w", err)
		}
		e.Payload = payload
		e.CreatedAt = e.CreatedAt.UTC()
		events = append(events, e)
	}
	return events, rows.Err()
}

// CustomerExists checks presence of customer.
func (r *Repository) CustomerExists(ctx context.Context, id uuid.UUID) (bool, error) {
	const query = `SELECT 1 FROM crm.customers WHERE id = $1`
	row := r.pool.QueryRow(ctx, query, id)
	var dummy int
	if err := row.Scan(&dummy); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, fmt.Errorf("check customer: %w", err)
	}
	return true, nil
}
