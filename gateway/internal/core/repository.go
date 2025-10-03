package core

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository provides access to core.* tables.
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository builds repository instance backed by pgx pool.
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// ListRoles returns available roles.
func (r *Repository) ListRoles(ctx context.Context) ([]Role, error) {
	const query = `SELECT code, description FROM core.roles ORDER BY code`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query roles: %w", err)
	}
	defer rows.Close()

	var roles []Role
	for rows.Next() {
		var role Role
		if err := rows.Scan(&role.Code, &role.Description); err != nil {
			return nil, fmt.Errorf("scan role: %w", err)
		}
		roles = append(roles, role)
	}
	return roles, rows.Err()
}

// CreateRole inserts new role.
func (r *Repository) CreateRole(ctx context.Context, role Role) (Role, error) {
	const query = `INSERT INTO core.roles (code, description) VALUES ($1, $2) RETURNING code, description`
	var created Role
	if err := r.pool.QueryRow(ctx, query, role.Code, role.Description).Scan(&created.Code, &created.Description); err != nil {
		if pgErr, ok := err.(*pgconn.PgError); ok && pgErr.Code == "23505" {
			return Role{}, ErrDuplicateRole
		}
		return Role{}, fmt.Errorf("insert role: %w", err)
	}
	return created, nil
}

// ListUsers returns users with optional role filter.
func (r *Repository) ListUsers(ctx context.Context, filter ListUsersFilter) ([]User, error) {
	const usersQuery = `
SELECT u.id, u.email, u.full_name, u.is_active, u.created_at
FROM core.users u
WHERE ($1 = '' OR EXISTS (
    SELECT 1 FROM core.user_roles ur
    WHERE ur.user_id = u.id AND ur.role_code = $1
))
ORDER BY u.created_at DESC`

	rows, err := r.pool.Query(ctx, usersQuery, filter.Role)
	if err != nil {
		return nil, fmt.Errorf("query users: %w", err)
	}
	defer rows.Close()

	var (
		users []User
		ids   []uuid.UUID
	)

	for rows.Next() {
		var (
			user      User
			createdAt time.Time
		)
		if err := rows.Scan(&user.ID, &user.Email, &user.FullName, &user.IsActive, &createdAt); err != nil {
			return nil, fmt.Errorf("scan user: %w", err)
		}
		user.CreatedAt = createdAt.UTC()
		users = append(users, user)
		ids = append(ids, user.ID)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate users: %w", err)
	}

	if len(users) == 0 {
		return users, nil
	}

	roles, err := r.fetchUserRoles(ctx, ids)
	if err != nil {
		return nil, err
	}

	for i := range users {
		if assigned, ok := roles[users[i].ID]; ok {
			users[i].Roles = assigned
		} else {
			users[i].Roles = make([]UserRole, 0)
		}
	}

	return users, nil
}

func (r *Repository) fetchUserRoles(ctx context.Context, ids []uuid.UUID) (map[uuid.UUID][]UserRole, error) {
	const query = `
SELECT ur.user_id, ur.role_code, COALESCE(ur.warehouse_scope, ''), COALESCE(r.description, '')
FROM core.user_roles ur
LEFT JOIN core.roles r ON r.code = ur.role_code
WHERE ur.user_id = ANY($1)
ORDER BY ur.user_id, ur.role_code`

	rows, err := r.pool.Query(ctx, query, ids)
	if err != nil {
		return nil, fmt.Errorf("query user roles: %w", err)
	}
	defer rows.Close()

	result := make(map[uuid.UUID][]UserRole)
	for rows.Next() {
		var (
			userID      uuid.UUID
			code        string
			scope       string
			description string
		)
		if err := rows.Scan(&userID, &code, &scope, &description); err != nil {
			return nil, fmt.Errorf("scan user role: %w", err)
		}
		result[userID] = append(result[userID], UserRole{
			Code:           code,
			Description:    description,
			WarehouseScope: scope,
		})
	}
	return result, rows.Err()
}

// CreateUser persists user and assigned roles.
func (r *Repository) CreateUser(ctx context.Context, input CreateUserInput, passwordHash []byte) (User, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return User{}, fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	isActive := true
	if input.IsActive != nil {
		isActive = *input.IsActive
	}

	var (
		userID    uuid.UUID
		createdAt time.Time
	)

	insertQuery := `
INSERT INTO core.users (email, full_name, password_hash, is_active)
VALUES ($1, $2, $3, $4)
RETURNING id, email, full_name, is_active, created_at`
	var user User
	if err := tx.QueryRow(ctx, insertQuery, input.Email, input.FullName, string(passwordHash), isActive).
		Scan(&userID, &user.Email, &user.FullName, &user.IsActive, &createdAt); err != nil {
		if pgErr, ok := err.(*pgconn.PgError); ok && pgErr.Code == "23505" {
			return User{}, ErrDuplicateEmail
		}
		return User{}, fmt.Errorf("insert user: %w", err)
	}
	user.ID = userID
	user.CreatedAt = createdAt.UTC()

	if len(input.Roles) > 0 {
		if err := r.replaceUserRolesTx(ctx, tx, userID, input.Roles); err != nil {
			return User{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return User{}, fmt.Errorf("commit: %w", err)
	}

	if len(input.Roles) > 0 {
		roles, err := r.fetchUserRoles(ctx, []uuid.UUID{userID})
		if err != nil {
			return User{}, err
		}
		user.Roles = roles[userID]
	} else {
		user.Roles = make([]UserRole, 0)
	}

	return user, nil
}

// UpdateUser updates mutable attributes and optionally replaces roles.
func (r *Repository) UpdateUser(ctx context.Context, id uuid.UUID, input UpdateUserInput, passwordHash []byte) (User, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return User{}, fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	setParts := make([]string, 0, 3)
	args := make([]any, 0, 4)
	idx := 1

	if input.FullName != nil {
		setParts = append(setParts, fmt.Sprintf("full_name = $%d", idx))
		args = append(args, *input.FullName)
		idx++
	}
	if input.IsActive != nil {
		setParts = append(setParts, fmt.Sprintf("is_active = $%d", idx))
		args = append(args, *input.IsActive)
		idx++
	}
	if input.Password != nil {
		setParts = append(setParts, fmt.Sprintf("password_hash = $%d", idx))
		args = append(args, string(passwordHash))
		idx++
	}

	var user User
	if len(setParts) > 0 {
		query := fmt.Sprintf("UPDATE core.users SET %s WHERE id = $%d RETURNING id, email, full_name, is_active, created_at", strings.Join(setParts, ", "), idx)
		args = append(args, id)
		var createdAt time.Time
		if err := tx.QueryRow(ctx, query, args...).Scan(&user.ID, &user.Email, &user.FullName, &user.IsActive, &createdAt); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return User{}, ErrUserNotFound
			}
			return User{}, fmt.Errorf("update user: %w", err)
		}
		user.CreatedAt = createdAt.UTC()
	} else {
		// fetch current values if nothing updated directly
		var createdAt time.Time
		query := "SELECT id, email, full_name, is_active, created_at FROM core.users WHERE id = $1"
		if err := tx.QueryRow(ctx, query, id).Scan(&user.ID, &user.Email, &user.FullName, &user.IsActive, &createdAt); err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return User{}, ErrUserNotFound
			}
			return User{}, fmt.Errorf("load user: %w", err)
		}
		user.CreatedAt = createdAt.UTC()
	}

	if input.Roles != nil {
		if err := r.replaceUserRolesTx(ctx, tx, id, *input.Roles); err != nil {
			return User{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return User{}, fmt.Errorf("commit: %w", err)
	}

	roles, err := r.fetchUserRoles(ctx, []uuid.UUID{id})
	if err != nil {
		return User{}, err
	}
	user.Roles = roles[id]

	return user, nil
}

func (r *Repository) replaceUserRolesTx(ctx context.Context, tx pgx.Tx, userID uuid.UUID, roles []RoleAssignment) error {
	if len(roles) == 0 {
		if _, err := tx.Exec(ctx, "DELETE FROM core.user_roles WHERE user_id = $1", userID); err != nil {
			return fmt.Errorf("cleanup user roles: %w", err)
		}
		return nil
	}

	// ensure referenced roles exist
	codes := make([]string, 0, len(roles))
	for _, role := range roles {
		codes = append(codes, role.Code)
	}
	const validateQuery = `SELECT code FROM core.roles WHERE code = ANY($1)`
	rows, err := tx.Query(ctx, validateQuery, codes)
	if err != nil {
		return fmt.Errorf("validate roles: %w", err)
	}
	defer rows.Close()

	existing := make(map[string]struct{}, len(codes))
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err != nil {
			return fmt.Errorf("scan role code: %w", err)
		}
		existing[code] = struct{}{}
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("validate roles rows: %w", err)
	}

	for _, code := range codes {
		if _, ok := existing[code]; !ok {
			return ErrOrgUnitNotFound
		}
	}

	if _, err := tx.Exec(ctx, "DELETE FROM core.user_roles WHERE user_id = $1", userID); err != nil {
		return fmt.Errorf("delete old roles: %w", err)
	}

	for _, role := range roles {
		if _, err := tx.Exec(ctx,
			"INSERT INTO core.user_roles (user_id, role_code, warehouse_scope) VALUES ($1, $2, $3)",
			userID, role.Code, role.normalizedScope(),
		); err != nil {
			return fmt.Errorf("insert user role: %w", err)
		}
	}
	return nil
}

func (r *Repository) ListOrgUnits(ctx context.Context) ([]OrgUnit, error) {
	const query = `
SELECT id, parent_id, code, name, COALESCE(description, ''), path, level, is_active,
       COALESCE(metadata, '{}'::jsonb), created_at, updated_at
FROM core.org_units
ORDER BY path`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query org units: %w", err)
	}
	defer rows.Close()

	var units []OrgUnit
	for rows.Next() {
		unit, err := scanOrgUnitRow(rows)
		if err != nil {
			return nil, err
		}
		units = append(units, unit)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate org units: %w", err)
	}
	return units, nil
}

func (r *Repository) GetOrgUnitByCode(ctx context.Context, code string) (OrgUnit, error) {
	const query = `
SELECT id, parent_id, code, name, COALESCE(description, ''), path, level, is_active,
       COALESCE(metadata, '{}'::jsonb), created_at, updated_at
FROM core.org_units
WHERE code = $1`
	unit, err := scanOrgUnitRow(r.pool.QueryRow(ctx, query, code))
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return OrgUnit{}, ErrOrgUnitNotFound
		}
		return OrgUnit{}, fmt.Errorf("load org unit: %w", err)
	}
	return unit, nil
}

func (r *Repository) CreateOrgUnit(ctx context.Context, payload OrgUnit) (OrgUnit, error) {
	const query = `
INSERT INTO core.org_units (parent_id, code, name, description, path, level, is_active, metadata)
VALUES ($1, $2, $3, NULLIF($4, ''), $5, $6, $7, $8)
RETURNING id, parent_id, code, name, COALESCE(description, ''), path, level, is_active,
          COALESCE(metadata, '{}'::jsonb), created_at, updated_at`
	metadataBytes, err := normalizeMetadata(payload.Metadata)
	if err != nil {
		return OrgUnit{}, err
	}
	var parent any
	if payload.ParentID != nil {
		parent = *payload.ParentID
	}
	unit, err := scanOrgUnitRow(r.pool.QueryRow(ctx, query, parent, payload.Code, payload.Name, payload.Description, payload.Path, payload.Level, payload.IsActive, metadataBytes))
	if err != nil {
		if pgErr, ok := err.(*pgconn.PgError); ok && pgErr.Code == "23505" {
			return OrgUnit{}, ErrOrgUnitConflict
		}
		return OrgUnit{}, fmt.Errorf("insert org unit: %w", err)
	}
	return unit, nil
}

func (r *Repository) UpdateOrgUnit(ctx context.Context, code string, input UpdateOrgUnitInput) (OrgUnit, error) {
	setParts := make([]string, 0, 4)
	args := make([]any, 0, 4)
	idx := 1

	if input.Name != nil {
		setParts = append(setParts, fmt.Sprintf("name = $%d", idx))
		args = append(args, *input.Name)
		idx++
	}
	if input.Description != nil {
		setParts = append(setParts, fmt.Sprintf("description = NULLIF($%d, '')", idx))
		args = append(args, *input.Description)
		idx++
	}
	if input.IsActive != nil {
		setParts = append(setParts, fmt.Sprintf("is_active = $%d", idx))
		args = append(args, *input.IsActive)
		idx++
	}
	if input.Metadata != nil {
		metadataBytes, err := normalizeMetadata(*input.Metadata)
		if err != nil {
			return OrgUnit{}, err
		}
		setParts = append(setParts, fmt.Sprintf("metadata = $%d", idx))
		args = append(args, metadataBytes)
		idx++
	}

	if len(setParts) > 0 {
		setParts = append(setParts, "updated_at = NOW()")
		query := fmt.Sprintf("UPDATE core.org_units SET %s WHERE code = $%d RETURNING id, parent_id, code, name, COALESCE(description, ''), path, level, is_active, COALESCE(metadata, '{}'::jsonb), created_at, updated_at", strings.Join(setParts, ", "), idx)
		args = append(args, code)
		unit, err := scanOrgUnitRow(r.pool.QueryRow(ctx, query, args...))
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return OrgUnit{}, ErrOrgUnitNotFound
			}
			return OrgUnit{}, fmt.Errorf("update org unit: %w", err)
		}
		return unit, nil
	}

	return r.GetOrgUnitByCode(ctx, code)
}

func (r *Repository) DeleteOrgUnit(ctx context.Context, code string) error {
	const childrenQuery = `SELECT 1 FROM core.org_units WHERE parent_id = (SELECT id FROM core.org_units WHERE code = $1) LIMIT 1`
	var dummy int
	if err := r.pool.QueryRow(ctx, childrenQuery, code).Scan(&dummy); err == nil {
		return ErrOrgUnitHasChildren
	} else if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return fmt.Errorf("check org unit children: %w", err)
	}

	const deleteQuery = `DELETE FROM core.org_units WHERE code = $1`
	cmd, err := r.pool.Exec(ctx, deleteQuery, code)
	if err != nil {
		return fmt.Errorf("delete org unit: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return ErrOrgUnitNotFound
	}
	return nil
}

func (r *Repository) HasPermission(ctx context.Context, roleCodes []string, scopes []string, resource, action string) (bool, error) {
	if len(roleCodes) == 0 {
		return false, nil
	}
	const query = `
SELECT 1
FROM core.role_permissions
WHERE role_code = ANY($1)
  AND effect = 'allow'
  AND (resource = $2 OR resource = '*')
  AND (action = $3 OR action = '*')
  AND (scope = '*' OR scope = ANY($4))
LIMIT 1`
	var marker int
	if err := r.pool.QueryRow(ctx, query, roleCodes, resource, action, scopes).Scan(&marker); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, fmt.Errorf("check permission: %w", err)
	}
	return true, nil
}

func (r *Repository) RoleExists(ctx context.Context, code string) (bool, error) {
	const query = `SELECT 1 FROM core.roles WHERE code = $1`
	var dummy int
	if err := r.pool.QueryRow(ctx, query, code).Scan(&dummy); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, fmt.Errorf("check role: %w", err)
	}
	return true, nil
}

func (r *Repository) ListRolePermissions(ctx context.Context, roleCode string) ([]RolePermission, error) {
	const query = `
SELECT role_code, resource, action, scope, effect, COALESCE(metadata, '{}'::jsonb), created_at, updated_at
FROM core.role_permissions
WHERE role_code = $1
ORDER BY resource, action, scope`
	rows, err := r.pool.Query(ctx, query, roleCode)
	if err != nil {
		return nil, fmt.Errorf("query role permissions: %w", err)
	}
	defer rows.Close()

	var permissions []RolePermission
	for rows.Next() {
		var (
			perm      RolePermission
			raw       json.RawMessage
			createdAt time.Time
			updatedAt time.Time
		)
		if err := rows.Scan(&perm.RoleCode, &perm.Resource, &perm.Action, &perm.Scope, &perm.Effect, &raw, &createdAt, &updatedAt); err != nil {
			return nil, fmt.Errorf("scan permission: %w", err)
		}
		if len(raw) > 0 {
			if err := json.Unmarshal(raw, &perm.Metadata); err != nil {
				return nil, fmt.Errorf("decode permission metadata: %w", err)
			}
		}
		if perm.Metadata == nil {
			perm.Metadata = make(map[string]any)
		}
		perm.CreatedAt = createdAt.UTC()
		perm.UpdatedAt = updatedAt.UTC()
		permissions = append(permissions, perm)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate permissions: %w", err)
	}
	return permissions, nil
}

func (r *Repository) ReplaceRolePermissions(ctx context.Context, roleCode string, entries []RolePermissionInput) ([]RolePermission, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if _, err := tx.Exec(ctx, "DELETE FROM core.role_permissions WHERE role_code = $1", roleCode); err != nil {
		return nil, fmt.Errorf("cleanup permissions: %w", err)
	}

	for _, entry := range entries {
		metadataBytes, err := normalizeMetadata(entry.Metadata)
		if err != nil {
			return nil, err
		}
		if _, err := tx.Exec(ctx,
			"INSERT INTO core.role_permissions (role_code, resource, action, scope, effect, metadata) VALUES ($1, $2, $3, $4, $5, $6)",
			roleCode, entry.Resource, entry.Action, entry.Scope, entry.Effect, metadataBytes,
		); err != nil {
			return nil, fmt.Errorf("insert permission: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit permissions: %w", err)
	}

	return r.ListRolePermissions(ctx, roleCode)
}

func (r *Repository) CreateAPIToken(ctx context.Context, input CreateAPITokenInput, tokenHash string, createdBy uuid.UUID) (APIToken, error) {
	const query = `
INSERT INTO core.api_tokens (name, token_hash, role_code, scope, created_by)
VALUES ($1, $2, $3, $4, $5)
RETURNING id, name, role_code, scope, created_at, created_by, last_used_at, revoked_at`
	var creator any
	if createdBy != uuid.Nil {
		creator = createdBy
	}
	var (
		token        APIToken
		createdByCol pgtype.UUID
		lastUsed     pgtype.Timestamptz
		revoked      pgtype.Timestamptz
	)
	if err := r.pool.QueryRow(ctx, query, input.Name, tokenHash, input.RoleCode, input.Scope, creator).Scan(
		&token.ID, &token.Name, &token.RoleCode, &token.Scope, &token.CreatedAt, &createdByCol, &lastUsed, &revoked,
	); err != nil {
		if pgErr, ok := err.(*pgconn.PgError); ok && pgErr.Code == "23505" {
			return APIToken{}, ErrAPITokenConflict
		}
		return APIToken{}, fmt.Errorf("insert api token: %w", err)
	}
	assignOptionalUUID(createdByCol, &token.CreatedBy)
	assignOptionalTime(lastUsed, &token.LastUsedAt)
	assignOptionalTime(revoked, &token.RevokedAt)
	token.CreatedAt = token.CreatedAt.UTC()
	return token, nil
}

func (r *Repository) ListAPITokens(ctx context.Context) ([]APIToken, error) {
	const query = `
SELECT id, name, role_code, scope, created_at, created_by, last_used_at, revoked_at
FROM core.api_tokens
ORDER BY created_at DESC`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query api tokens: %w", err)
	}
	defer rows.Close()

	var tokens []APIToken
	for rows.Next() {
		var token APIToken
		var createdBy pgtype.UUID
		var lastUsed pgtype.Timestamptz
		var revoked pgtype.Timestamptz
		if err := rows.Scan(&token.ID, &token.Name, &token.RoleCode, &token.Scope, &token.CreatedAt, &createdBy, &lastUsed, &revoked); err != nil {
			return nil, fmt.Errorf("scan api token: %w", err)
		}
		assignOptionalUUID(createdBy, &token.CreatedBy)
		assignOptionalTime(lastUsed, &token.LastUsedAt)
		assignOptionalTime(revoked, &token.RevokedAt)
		token.CreatedAt = token.CreatedAt.UTC()
		tokens = append(tokens, token)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate api tokens: %w", err)
	}
	return tokens, nil
}

func (r *Repository) RevokeAPIToken(ctx context.Context, id uuid.UUID) (APIToken, error) {
	const query = `
UPDATE core.api_tokens
SET revoked_at = NOW()
WHERE id = $1 AND revoked_at IS NULL
RETURNING id, name, role_code, scope, created_at, created_by, last_used_at, revoked_at`
	var (
		token     APIToken
		createdBy pgtype.UUID
		lastUsed  pgtype.Timestamptz
		revoked   pgtype.Timestamptz
	)
	if err := r.pool.QueryRow(ctx, query, id).Scan(&token.ID, &token.Name, &token.RoleCode, &token.Scope, &token.CreatedAt, &createdBy, &lastUsed, &revoked); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return APIToken{}, ErrAPITokenNotFound
		}
		return APIToken{}, fmt.Errorf("revoke api token: %w", err)
	}
	assignOptionalUUID(createdBy, &token.CreatedBy)
	assignOptionalTime(lastUsed, &token.LastUsedAt)
	assignOptionalTime(revoked, &token.RevokedAt)
	token.CreatedAt = token.CreatedAt.UTC()
	return token, nil
}

func scanOrgUnitRow(row pgx.Row) (OrgUnit, error) {
	var (
		unit      OrgUnit
		parent    pgtype.UUID
		raw       json.RawMessage
		createdAt time.Time
		updatedAt time.Time
	)
	if err := row.Scan(&unit.ID, &parent, &unit.Code, &unit.Name, &unit.Description, &unit.Path, &unit.Level, &unit.IsActive, &raw, &createdAt, &updatedAt); err != nil {
		return OrgUnit{}, err
	}
	if parent.Valid {
		id, err := uuid.FromBytes(parent.Bytes[:])
		if err != nil {
			return OrgUnit{}, fmt.Errorf("assign parent: %w", err)
		}
		ptr := new(uuid.UUID)
		*ptr = id
		unit.ParentID = ptr
	}
	if len(raw) > 0 {
		if err := json.Unmarshal(raw, &unit.Metadata); err != nil {
			return OrgUnit{}, fmt.Errorf("decode metadata: %w", err)
		}
	}
	if unit.Metadata == nil {
		unit.Metadata = make(map[string]any)
	}
	unit.CreatedAt = createdAt.UTC()
	unit.UpdatedAt = updatedAt.UTC()
	return unit, nil
}

func normalizeMetadata(data map[string]any) ([]byte, error) {
	if data == nil {
		return []byte("{}"), nil
	}
	buf, err := json.Marshal(data)
	if err != nil {
		return nil, fmt.Errorf("marshal metadata: %w", err)
	}
	if string(buf) == "null" {
		return []byte("{}"), nil
	}
	return buf, nil
}

func assignOptionalUUID(value pgtype.UUID, dest **uuid.UUID) {
	if !value.Valid {
		*dest = nil
		return
	}
	id, err := uuid.FromBytes(value.Bytes[:])
	if err != nil {
		*dest = nil
		return
	}
	ptr := new(uuid.UUID)
	*ptr = id
	*dest = ptr
}

func assignOptionalTime(value pgtype.Timestamptz, dest **time.Time) {
	if !value.Valid {
		*dest = nil
		return
	}
	t := value.Time.UTC()
	ptr := new(time.Time)
	*ptr = t
	*dest = ptr
}
