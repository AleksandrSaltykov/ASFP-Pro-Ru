// Package auth provides gateway authentication services.
package auth

import (
	"context"
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

// User represents authenticated principal.
type User struct {
	ID       uuid.UUID
	Email    string
	FullName string
	Roles    []string
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
SELECT u.id, u.email, u.full_name, u.password_hash, u.is_active,
       COALESCE(array_agg(ur.role_code ORDER BY ur.role_code)
                FILTER (WHERE ur.role_code IS NOT NULL), '{}')
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
		roles        []string
	)

	if err := row.Scan(&id, &dbEmail, &fullName, &passwordHash, &isActive, &roles); err != nil {
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

	if roles == nil {
		roles = make([]string, 0)
	}

	return User{
		ID:       id,
		Email:    dbEmail,
		FullName: fullName,
		Roles:    roles,
	}, nil
}
