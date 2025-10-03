// Package auth provides gateway authentication services.
package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

var (
	// ErrInvalidCredentials is returned when email or password do not match stored values.
	ErrInvalidCredentials = errors.New("invalid credentials")
	// ErrInactive indicates that the user exists but is disabled.
	ErrInactive = errors.New("user inactive")
)

// Role describes role grant with optional scope.
type Role struct {
	Code  string
	Scope string
}

// User represents authenticated principal.
type User struct {
	ID       uuid.UUID
	Email    string
	FullName string
	Roles    []Role
	OrgUnits []string
}

// Service provides authentication helpers backed by Postgres.
type Service struct {
	pool *pgxpool.Pool
}

// NewService instantiates auth service with pgx pool.
func NewService(pool *pgxpool.Pool) *Service {
	return &Service{pool: pool}
}

// Authenticate validates provided credentials and returns user information.
func (s *Service) Authenticate(ctx context.Context, email, password string) (User, error) {
	email = strings.TrimSpace(email)
	if email == "" || password == "" {
		return User{}, ErrInvalidCredentials
	}

	query := `
SELECT
  u.id,
  u.email,
  u.full_name,
  u.password_hash,
  u.is_active,
  COALESCE(
    json_agg(
      json_build_object(
        'code', ur.role_code,
        'scope', COALESCE(ur.warehouse_scope, '*')
      )
    ) FILTER (WHERE ur.role_code IS NOT NULL),
    '[]'::json
  ) AS roles
FROM core.users u
LEFT JOIN core.user_roles ur ON ur.user_id = u.id
WHERE LOWER(u.email) = LOWER($1)
GROUP BY u.id;
`

	row := s.pool.QueryRow(ctx, query, email)

	var (
		id           uuid.UUID
		dbEmail      string
		fullName     string
		passwordHash string
		isActive     bool
		rolesJSON    []byte
	)

	if err := row.Scan(&id, &dbEmail, &fullName, &passwordHash, &isActive, &rolesJSON); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return User{}, ErrInvalidCredentials
		}
		return User{}, fmt.Errorf("query user: %w", err)
	}

	if !isActive {
		return User{}, ErrInactive
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)); err != nil {
		return User{}, ErrInvalidCredentials
	}

	var roleEnvelope []struct {
		Code  string `json:"code"`
		Scope string `json:"scope"`
	}
	if len(rolesJSON) > 0 {
		if err := json.Unmarshal(rolesJSON, &roleEnvelope); err != nil {
			return User{}, fmt.Errorf("decode roles: %w", err)
		}
	}
	roles := make([]Role, 0, len(roleEnvelope))
	for _, role := range roleEnvelope {
		code := strings.TrimSpace(role.Code)
		if code == "" {
			continue
		}
		scope := strings.TrimSpace(role.Scope)
		if scope == "" {
			scope = "*"
		}
		roles = append(roles, Role{Code: code, Scope: scope})
	}

	orgUnits, err := s.fetchUserOrgUnits(ctx, id)
	if err != nil {
		return User{}, err
	}

	return User{
		ID:       id,
		Email:    dbEmail,
		FullName: fullName,
		Roles:    roles,
		OrgUnits: orgUnits,
	}, nil
}

func (s *Service) fetchUserOrgUnits(ctx context.Context, userID uuid.UUID) ([]string, error) {
	const query = `SELECT org_unit_code FROM core.user_org_units WHERE user_id = $1`
	rows, err := s.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("query user org units: %w", err)
	}
	defer rows.Close()

	units := make([]string, 0)
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err != nil {
			return nil, fmt.Errorf("scan org unit: %w", err)
		}
		units = append(units, strings.TrimSpace(code))
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("org unit rows: %w", err)
	}
	return units, nil
}
