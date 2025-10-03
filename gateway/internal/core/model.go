package core

import (
	"strings"
	"time"

	"github.com/google/uuid"
)

// Role represents entry from core.roles.
type Role struct {
	Code        string `json:"code"`
	Description string `json:"description"`
}

// UserRole describes mapping between user and role including optional scope.
type UserRole struct {
	Code           string `json:"code"`
	Description    string `json:"description"`
	WarehouseScope string `json:"warehouseScope,omitempty"`
}

// User aggregates core.users with associated roles.
type User struct {
	ID        uuid.UUID  `json:"id"`
	Email     string     `json:"email"`
	FullName  string     `json:"fullName"`
	IsActive  bool       `json:"isActive"`
	CreatedAt time.Time  `json:"createdAt"`
	Roles     []UserRole `json:"roles"`
}

// RoleAssignment represents requested role association for create/update operations.
type RoleAssignment struct {
	Code           string
	WarehouseScope string
}

// CreateUserInput captures information required to create a user.
type CreateUserInput struct {
	Email    string
	FullName string
	Password string
	IsActive *bool
	Roles    []RoleAssignment
}

// UpdateUserInput controls mutable user attributes.
type UpdateUserInput struct {
	FullName *string
	IsActive *bool
	Password *string
	Roles    *[]RoleAssignment
}

// ListUsersFilter narrows list users query.
type ListUsersFilter struct {
	Role string
}

func (r RoleAssignment) normalizedScope() string {
	scope := strings.TrimSpace(r.WarehouseScope)
	if scope == "" {
		return "*"
	}
	return scope
}

// OrgUnit represents hierarchical unit used for RBAC scoping.
type OrgUnit struct {
	ID          uuid.UUID      `json:"id"`
	ParentID    *uuid.UUID     `json:"parentId,omitempty"`
	Code        string         `json:"code"`
	Name        string         `json:"name"`
	Description string         `json:"description,omitempty"`
	Path        string         `json:"path"`
	Level       int            `json:"level"`
	IsActive    bool           `json:"isActive"`
	Metadata    map[string]any `json:"metadata"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
}

// CreateOrgUnitInput captures payload for new org unit creation.
type CreateOrgUnitInput struct {
	Code        string
	Name        string
	Description string
	ParentCode  string
	Metadata    map[string]any
}

// UpdateOrgUnitInput wraps mutable org unit fields.
type UpdateOrgUnitInput struct {
	Name        *string
	Description *string
	IsActive    *bool
	Metadata    *map[string]any
}

// RolePermission describes a single permission matrix entry.
type RolePermission struct {
	RoleCode  string         `json:"roleCode"`
	Resource  string         `json:"resource"`
	Action    string         `json:"action"`
	Scope     string         `json:"scope"`
	Effect    string         `json:"effect"`
	Metadata  map[string]any `json:"metadata"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
}

// RolePermissionInput is used when updating the permission matrix.
type RolePermissionInput struct {
	Resource string
	Action   string
	Scope    string
	Effect   string
	Metadata map[string]any
}

// APIToken stores metadata for issued API tokens.
type APIToken struct {
	ID         uuid.UUID  `json:"id"`
	Name       string     `json:"name"`
	RoleCode   string     `json:"roleCode"`
	Scope      string     `json:"scope"`
	CreatedAt  time.Time  `json:"createdAt"`
	CreatedBy  *uuid.UUID `json:"createdBy,omitempty"`
	LastUsedAt *time.Time `json:"lastUsedAt,omitempty"`
	RevokedAt  *time.Time `json:"revokedAt,omitempty"`
}

// APITokenWithSecret returns metadata along with the plaintext token.
type APITokenWithSecret struct {
	APIToken
	Token string `json:"token"`
}

// CreateAPITokenInput represents request to issue new API token.
type CreateAPITokenInput struct {
	Name     string
	RoleCode string
	Scope    string
}

// RoleGrant describes subject role and optional scope.
type RoleGrant struct {
	Code  string
	Scope string
}

// Subject represents authenticated principal for permission checks.
type Subject struct {
	ID       uuid.UUID
	Roles    []RoleGrant
	OrgUnits []string
}
