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
	const query = `SELECT
    id,
    name,
    COALESCE(comment, ''),
    COALESCE(inn, ''),
    COALESCE(kpp, ''),
    COALESCE(phone, ''),
    COALESCE(email, ''),
    COALESCE(website, ''),
    COALESCE(legal_address, ''),
    COALESCE(actual_address, ''),
    created_at,
    updated_at
FROM crm.customers
ORDER BY created_at DESC`

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list customers: %w", err)
	}
	defer rows.Close()

	var customers []Customer
	for rows.Next() {
		var c Customer
		if err := rows.Scan(
			&c.ID,
			&c.Name,
			&c.Comment,
			&c.INN,
			&c.KPP,
			&c.Phone,
			&c.Email,
			&c.Website,
			&c.LegalAddress,
			&c.ActualAddress,
			&c.CreatedAt,
			&c.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan customer: %w", err)
		}
		c.CreatedAt = c.CreatedAt.UTC()
		c.UpdatedAt = c.UpdatedAt.UTC()
		customers = append(customers, c)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(customers) == 0 {
		return customers, nil
	}

	index := make(map[uuid.UUID]*Customer, len(customers))
	for i := range customers {
		index[customers[i].ID] = &customers[i]
	}
	if err := r.attachCustomerDetails(ctx, index); err != nil {
		return nil, err
	}

	return customers, nil
}

// CreateCustomer inserts customer.
func (r *Repository) CreateCustomer(ctx context.Context, input CreateCustomerInput) (Customer, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Customer{}, fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	const query = `INSERT INTO crm.customers (
    id,
    name,
    comment,
    inn,
    kpp,
    phone,
    email,
    website,
    legal_address,
    actual_address
) VALUES (
    $1,
    $2,
    NULLIF($3, ''),
    NULLIF($4, ''),
    NULLIF($5, ''),
    NULLIF($6, ''),
    NULLIF($7, ''),
    NULLIF($8, ''),
    NULLIF($9, ''),
    NULLIF($10, '')
) RETURNING
    id,
    name,
    COALESCE(comment, ''),
    COALESCE(inn, ''),
    COALESCE(kpp, ''),
    COALESCE(phone, ''),
    COALESCE(email, ''),
    COALESCE(website, ''),
    COALESCE(legal_address, ''),
    COALESCE(actual_address, ''),
    created_at,
    updated_at`

	customerID := uuid.New()
	var customer Customer
	if err := tx.QueryRow(
		ctx,
		query,
		customerID,
		input.Name,
		input.Comment,
		input.INN,
		input.KPP,
		input.Phone,
		input.Email,
		input.Website,
		input.LegalAddress,
		input.ActualAddress,
	).Scan(
		&customer.ID,
		&customer.Name,
		&customer.Comment,
		&customer.INN,
		&customer.KPP,
		&customer.Phone,
		&customer.Email,
		&customer.Website,
		&customer.LegalAddress,
		&customer.ActualAddress,
		&customer.CreatedAt,
		&customer.UpdatedAt,
	); err != nil {
		return Customer{}, fmt.Errorf("insert customer: %w", err)
	}

	if input.BankAccounts != nil {
		if _, err := r.replaceBankAccounts(ctx, tx, customer.ID, input.BankAccounts); err != nil {
			return Customer{}, err
		}
	}
	if input.Contacts != nil {
		if _, err := r.replaceContacts(ctx, tx, customer.ID, input.Contacts); err != nil {
			return Customer{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return Customer{}, fmt.Errorf("commit customer: %w", err)
	}

	customer.CreatedAt = customer.CreatedAt.UTC()
	customer.UpdatedAt = customer.UpdatedAt.UTC()
	if err := r.attachCustomerDetails(ctx, map[uuid.UUID]*Customer{customer.ID: &customer}); err != nil {
		return Customer{}, err
	}
	return customer, nil
}

// UpdateCustomer updates fields for existing customer.
func (r *Repository) UpdateCustomer(ctx context.Context, id uuid.UUID, input UpdateCustomerInput) (Customer, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Customer{}, fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	setParts := []string{"updated_at = NOW()"}
	args := make([]any, 0, 12)
	idx := 1

	if input.Name != nil {
		setParts = append(setParts, fmt.Sprintf("name = $%d", idx))
		args = append(args, *input.Name)
		idx++
	}
	if input.Comment != nil {
		setParts = append(setParts, fmt.Sprintf("comment = NULLIF($%d, '')", idx))
		args = append(args, *input.Comment)
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
	if input.Phone != nil {
		setParts = append(setParts, fmt.Sprintf("phone = NULLIF($%d, '')", idx))
		args = append(args, *input.Phone)
		idx++
	}
	if input.Email != nil {
		setParts = append(setParts, fmt.Sprintf("email = NULLIF($%d, '')", idx))
		args = append(args, *input.Email)
		idx++
	}
	if input.Website != nil {
		setParts = append(setParts, fmt.Sprintf("website = NULLIF($%d, '')", idx))
		args = append(args, *input.Website)
		idx++
	}
	if input.LegalAddress != nil {
		setParts = append(setParts, fmt.Sprintf("legal_address = NULLIF($%d, '')", idx))
		args = append(args, *input.LegalAddress)
		idx++
	}
	if input.ActualAddress != nil {
		setParts = append(setParts, fmt.Sprintf("actual_address = NULLIF($%d, '')", idx))
		args = append(args, *input.ActualAddress)
		idx++
	}

	query := fmt.Sprintf(`UPDATE crm.customers SET %s WHERE id = $%d
RETURNING
    id,
    name,
    COALESCE(comment, ''),
    COALESCE(inn, ''),
    COALESCE(kpp, ''),
    COALESCE(phone, ''),
    COALESCE(email, ''),
    COALESCE(website, ''),
    COALESCE(legal_address, ''),
    COALESCE(actual_address, ''),
    created_at,
    updated_at`, strings.Join(setParts, ", "), idx)
	args = append(args, id)

	var customer Customer
	if err := tx.QueryRow(ctx, query, args...).Scan(
		&customer.ID,
		&customer.Name,
		&customer.Comment,
		&customer.INN,
		&customer.KPP,
		&customer.Phone,
		&customer.Email,
		&customer.Website,
		&customer.LegalAddress,
		&customer.ActualAddress,
		&customer.CreatedAt,
		&customer.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Customer{}, ErrCustomerNotFound
		}
		return Customer{}, fmt.Errorf("update customer: %w", err)
	}

	if input.BankAccounts != nil {
		if _, err := r.replaceBankAccounts(ctx, tx, customer.ID, input.BankAccounts); err != nil {
			return Customer{}, err
		}
	}
	if input.Contacts != nil {
		if _, err := r.replaceContacts(ctx, tx, customer.ID, input.Contacts); err != nil {
			return Customer{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return Customer{}, fmt.Errorf("commit customer: %w", err)
	}

	customer.CreatedAt = customer.CreatedAt.UTC()
	customer.UpdatedAt = customer.UpdatedAt.UTC()
	if err := r.attachCustomerDetails(ctx, map[uuid.UUID]*Customer{customer.ID: &customer}); err != nil {
		return Customer{}, err
	}
	return customer, nil
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
	const query = `SELECT
    id,
    name,
    COALESCE(comment, ''),
    COALESCE(inn, ''),
    COALESCE(kpp, ''),
    COALESCE(phone, ''),
    COALESCE(email, ''),
    COALESCE(website, ''),
    COALESCE(legal_address, ''),
    COALESCE(actual_address, ''),
    created_at,
    updated_at
FROM crm.customers
WHERE id = $1`

	var customer Customer
	if err := r.pool.QueryRow(ctx, query, id).Scan(
		&customer.ID,
		&customer.Name,
		&customer.Comment,
		&customer.INN,
		&customer.KPP,
		&customer.Phone,
		&customer.Email,
		&customer.Website,
		&customer.LegalAddress,
		&customer.ActualAddress,
		&customer.CreatedAt,
		&customer.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return Customer{}, ErrCustomerNotFound
		}
		return Customer{}, fmt.Errorf("get customer: %w", err)
	}

	customer.CreatedAt = customer.CreatedAt.UTC()
	customer.UpdatedAt = customer.UpdatedAt.UTC()
	index := map[uuid.UUID]*Customer{customer.ID: &customer}
	if err := r.attachCustomerDetails(ctx, index); err != nil {
		return Customer{}, err
	}

	return customer, nil
}

func (r *Repository) attachCustomerDetails(ctx context.Context, customers map[uuid.UUID]*Customer) error {
	if len(customers) == 0 {
		return nil
	}

	ids := make([]uuid.UUID, 0, len(customers))
	for id := range customers {
		ids = append(ids, id)
	}

	accounts, err := r.fetchBankAccounts(ctx, ids)
	if err != nil {
		return err
	}
	for id, records := range accounts {
		if customer, ok := customers[id]; ok {
			customer.BankAccounts = records
		}
	}

	contacts, err := r.fetchContacts(ctx, ids)
	if err != nil {
		return err
	}
	for id, records := range contacts {
		if customer, ok := customers[id]; ok {
			customer.Contacts = records
		}
	}

	return nil
}

func (r *Repository) fetchBankAccounts(ctx context.Context, customerIDs []uuid.UUID) (map[uuid.UUID][]CustomerBankAccount, error) {
	const query = `SELECT
    id,
    customer_id,
    COALESCE(account_name, ''),
    COALESCE(bank_name, ''),
    account_number,
    COALESCE(bik, ''),
    COALESCE(corr_account, ''),
    COALESCE(comment, ''),
    is_default
FROM crm.customer_bank_accounts
WHERE customer_id = ANY($1::uuid[])
ORDER BY is_default DESC, created_at DESC`

	rows, err := r.pool.Query(ctx, query, customerIDs)
	if err != nil {
		return nil, fmt.Errorf("list bank accounts: %w", err)
	}
	defer rows.Close()

	result := make(map[uuid.UUID][]CustomerBankAccount)
	for rows.Next() {
		var account CustomerBankAccount
		var customerID uuid.UUID
		if err := rows.Scan(
			&account.ID,
			&customerID,
			&account.AccountName,
			&account.BankName,
			&account.AccountNumber,
			&account.BIK,
			&account.CorrAccount,
			&account.Comment,
			&account.IsDefault,
		); err != nil {
			return nil, fmt.Errorf("scan bank account: %w", err)
		}
		result[customerID] = append(result[customerID], account)
	}
	return result, rows.Err()
}

func (r *Repository) fetchContacts(ctx context.Context, customerIDs []uuid.UUID) (map[uuid.UUID][]CustomerContact, error) {
	const query = `SELECT
    id,
    customer_id,
    name,
    COALESCE(position, ''),
    COALESCE(phone, ''),
    COALESCE(email, ''),
    COALESCE(comment, '')
FROM crm.customer_contacts
WHERE customer_id = ANY($1::uuid[])
ORDER BY created_at DESC`

	rows, err := r.pool.Query(ctx, query, customerIDs)
	if err != nil {
		return nil, fmt.Errorf("list contacts: %w", err)
	}
	defer rows.Close()

	result := make(map[uuid.UUID][]CustomerContact)
	for rows.Next() {
		var contact CustomerContact
		var customerID uuid.UUID
		if err := rows.Scan(
			&contact.ID,
			&customerID,
			&contact.Name,
			&contact.Position,
			&contact.Phone,
			&contact.Email,
			&contact.Comment,
		); err != nil {
			return nil, fmt.Errorf("scan contact: %w", err)
		}
		result[customerID] = append(result[customerID], contact)
	}
	return result, rows.Err()
}

func (r *Repository) replaceBankAccounts(ctx context.Context, tx pgx.Tx, customerID uuid.UUID, accounts []CustomerBankAccountInput) ([]CustomerBankAccount, error) {
	if _, err := tx.Exec(ctx, `DELETE FROM crm.customer_bank_accounts WHERE customer_id = $1`, customerID); err != nil {
		return nil, fmt.Errorf("clear bank accounts: %w", err)
	}
	if len(accounts) == 0 {
		return nil, nil
	}

	const insert = `INSERT INTO crm.customer_bank_accounts (
    id,
    customer_id,
    account_name,
    bank_name,
    account_number,
    bik,
    corr_account,
    comment,
    is_default
) VALUES (
    $1,
    $2,
    NULLIF($3, ''),
    NULLIF($4, ''),
    $5,
    NULLIF($6, ''),
    NULLIF($7, ''),
    NULLIF($8, ''),
    $9
)`

	result := make([]CustomerBankAccount, 0, len(accounts))
	for _, record := range accounts {
		accountName := strings.TrimSpace(record.AccountName)
		bankName := strings.TrimSpace(record.BankName)
		accountNumber := strings.TrimSpace(record.AccountNumber)
		bik := strings.TrimSpace(record.BIK)
		corrAccount := strings.TrimSpace(record.CorrAccount)
		comment := strings.TrimSpace(record.Comment)

		if accountNumber == "" {
			return nil, fmt.Errorf("account number is required")
		}

		accountID := record.ID
		if accountID == uuid.Nil {
			accountID = uuid.New()
		}

		if _, err := tx.Exec(
			ctx,
			insert,
			accountID,
			customerID,
			accountName,
			bankName,
			accountNumber,
			bik,
			corrAccount,
			comment,
			record.IsDefault,
		); err != nil {
			return nil, fmt.Errorf("insert bank account: %w", err)
		}

		result = append(result, CustomerBankAccount{
			ID:            accountID,
			AccountName:   accountName,
			BankName:      bankName,
			AccountNumber: accountNumber,
			BIK:           bik,
			CorrAccount:   corrAccount,
			Comment:       comment,
			IsDefault:     record.IsDefault,
		})
	}

	return result, nil
}

func (r *Repository) replaceContacts(ctx context.Context, tx pgx.Tx, customerID uuid.UUID, contacts []CustomerContactInput) ([]CustomerContact, error) {
	if _, err := tx.Exec(ctx, `DELETE FROM crm.customer_contacts WHERE customer_id = $1`, customerID); err != nil {
		return nil, fmt.Errorf("clear contacts: %w", err)
	}
	if len(contacts) == 0 {
		return nil, nil
	}

	const insert = `INSERT INTO crm.customer_contacts (
    id,
    customer_id,
    name,
    position,
    phone,
    email,
    comment
) VALUES (
    $1,
    $2,
    $3,
    NULLIF($4, ''),
    NULLIF($5, ''),
    NULLIF($6, ''),
    NULLIF($7, '')
)`

	result := make([]CustomerContact, 0, len(contacts))
	for _, record := range contacts {
		name := strings.TrimSpace(record.Name)
		if name == "" {
			return nil, fmt.Errorf("contact name is required")
		}

		position := strings.TrimSpace(record.Position)
		phone := strings.TrimSpace(record.Phone)
		email := strings.TrimSpace(record.Email)
		comment := strings.TrimSpace(record.Comment)

		contactID := record.ID
		if contactID == uuid.Nil {
			contactID = uuid.New()
		}

		if _, err := tx.Exec(
			ctx,
			insert,
			contactID,
			customerID,
			name,
			position,
			phone,
			email,
			comment,
		); err != nil {
			return nil, fmt.Errorf("insert contact: %w", err)
		}

		result = append(result, CustomerContact{
			ID:       contactID,
			Name:     name,
			Position: position,
			Phone:    phone,
			Email:    email,
			Comment:  comment,
		})
	}

	return result, nil
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
