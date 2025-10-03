package core

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/rs/zerolog"
	"golang.org/x/crypto/bcrypt"

	"asfppro/pkg/audit"
)

// Service contains business logic for core domain operations.
type Service struct {
	repo    *Repository
	auditor *audit.Recorder
	logger  zerolog.Logger
}

// NewService creates service instance.
func NewService(repo *Repository, auditor *audit.Recorder, logger zerolog.Logger) *Service {
	return &Service{repo: repo, auditor: auditor, logger: logger.With().Str("component", "core.service").Logger()}
}

// ListRoles returns existing roles.
func (s *Service) ListRoles(ctx context.Context) ([]Role, error) {
	return s.repo.ListRoles(ctx)
}

// CreateRole inserts a new role.
func (s *Service) CreateRole(ctx context.Context, actor uuid.UUID, role Role) (Role, error) {
	role.Code = strings.TrimSpace(role.Code)
	role.Description = strings.TrimSpace(role.Description)
	if role.Code == "" || role.Description == "" {
		return Role{}, fmt.Errorf("code and description are required")
	}

	created, err := s.repo.CreateRole(ctx, role)
	if err != nil {
		return Role{}, err
	}

	s.recordAudit(ctx, actor, "core.role.create", created.Code, map[string]any{
		"code":        created.Code,
		"description": created.Description,
	})
	return created, nil
}

// ListUsers returns users with optional filter.
func (s *Service) ListUsers(ctx context.Context, filter ListUsersFilter) ([]User, error) {
	filter.Role = strings.TrimSpace(filter.Role)
	return s.repo.ListUsers(ctx, filter)
}

// CreateUser creates a new user and assigns roles.
func (s *Service) CreateUser(ctx context.Context, actor uuid.UUID, input CreateUserInput) (User, error) {
	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	input.FullName = strings.TrimSpace(input.FullName)
	input.Password = strings.TrimSpace(input.Password)

	if input.Email == "" || !strings.Contains(input.Email, "@") {
		return User{}, fmt.Errorf("valid email is required")
	}
	if input.FullName == "" {
		return User{}, fmt.Errorf("fullName is required")
	}
	if input.Password == "" {
		return User{}, fmt.Errorf("password is required")
	}
	if len(input.Roles) == 0 {
		return User{}, fmt.Errorf("at least one role must be provided")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return User{}, fmt.Errorf("hash password: %w", err)
	}

	user, err := s.repo.CreateUser(ctx, input, hash)
	if err != nil {
		return User{}, err
	}

	s.recordAudit(ctx, actor, "core.user.create", user.ID.String(), map[string]any{
		"email":    user.Email,
		"fullName": user.FullName,
		"roles":    user.Roles,
	})

	return user, nil
}

// UpdateUser updates fields and role assignments.
func (s *Service) UpdateUser(ctx context.Context, actor uuid.UUID, id uuid.UUID, input UpdateUserInput) (User, error) {
	if input.FullName != nil {
		trimmed := strings.TrimSpace(*input.FullName)
		input.FullName = &trimmed
		if *input.FullName == "" {
			return User{}, fmt.Errorf("fullName cannot be empty")
		}
	}

	var passwordHash []byte
	if input.Password != nil {
		trimmed := strings.TrimSpace(*input.Password)
		if trimmed == "" {
			return User{}, fmt.Errorf("password cannot be empty")
		}
		hashed, err := bcrypt.GenerateFromPassword([]byte(trimmed), bcrypt.DefaultCost)
		if err != nil {
			return User{}, fmt.Errorf("hash password: %w", err)
		}
		passwordHash = hashed
		input.Password = &trimmed
	}

	user, err := s.repo.UpdateUser(ctx, id, input, passwordHash)
	if err != nil {
		return User{}, err
	}

	payload := map[string]any{
		"email":    user.Email,
		"fullName": user.FullName,
		"isActive": user.IsActive,
		"roles":    user.Roles,
	}
	s.recordAudit(ctx, actor, "core.user.update", user.ID.String(), payload)

	return user, nil
}

func (s *Service) recordAudit(ctx context.Context, actor uuid.UUID, action, entityID string, payload any) {
	if s.auditor == nil {
		return
	}
	entity := "core.user"
	switch {
	case strings.HasPrefix(action, "core.role"):
		entity = "core.role"
	case strings.HasPrefix(action, "core.org_unit"):
		entity = "core.org_unit"
	case strings.HasPrefix(action, "core.permission"):
		entity = "core.permission"
	case strings.HasPrefix(action, "core.api_token"):
		entity = "core.api_token"
	}
	entry := audit.Entry{
		ActorID:  actor,
		Action:   action,
		Entity:   entity,
		EntityID: entityID,
		Payload:  payload,
	}
	if err := s.auditor.Record(ctx, entry); err != nil {
		s.logger.Error().Err(err).Msg("audit record")
	}
}

func (s *Service) ListOrgUnits(ctx context.Context) ([]OrgUnit, error) {
	return s.repo.ListOrgUnits(ctx)
}

func (s *Service) CreateOrgUnit(ctx context.Context, actor uuid.UUID, input CreateOrgUnitInput) (OrgUnit, error) {
	code := strings.TrimSpace(strings.ToUpper(input.Code))
	name := strings.TrimSpace(input.Name)
	if code == "" {
		return OrgUnit{}, fmt.Errorf("code is required")
	}
	if name == "" {
		return OrgUnit{}, fmt.Errorf("name is required")
	}

	var (
		parentID *uuid.UUID
		parent   *OrgUnit
		err      error
	)
	parentCode := strings.TrimSpace(strings.ToUpper(input.ParentCode))
	if parentCode != "" {
		unit, err := s.repo.GetOrgUnitByCode(ctx, parentCode)
		if err != nil {
			return OrgUnit{}, err
		}
		parent = &unit
		parentID = &unit.ID
	}

	path := code
	level := 0
	if parent != nil {
		path = parent.Path + "." + code
		level = parent.Level + 1
	}

	created, err := s.repo.CreateOrgUnit(ctx, OrgUnit{
		ParentID:    parentID,
		Code:        code,
		Name:        name,
		Description: strings.TrimSpace(input.Description),
		Path:        path,
		Level:       level,
		IsActive:    true,
		Metadata:    input.Metadata,
	})
	if err != nil {
		return OrgUnit{}, err
	}

	s.recordAudit(ctx, actor, "core.org_unit.create", created.Code, map[string]any{
		"code":   code,
		"name":   name,
		"parent": parentCode,
	})
	return created, nil
}

func (s *Service) UpdateOrgUnit(ctx context.Context, actor uuid.UUID, code string, input UpdateOrgUnitInput) (OrgUnit, error) {
	normalized := strings.TrimSpace(strings.ToUpper(code))
	if normalized == "" {
		return OrgUnit{}, fmt.Errorf("code is required")
	}
	if input.Metadata != nil && *input.Metadata == nil {
		empty := make(map[string]any)
		input.Metadata = &empty
	}

	updated, err := s.repo.UpdateOrgUnit(ctx, normalized, input)
	if err != nil {
		return OrgUnit{}, err
	}

	s.recordAudit(ctx, actor, "core.org_unit.update", updated.Code, map[string]any{
		"code":     updated.Code,
		"name":     updated.Name,
		"isActive": updated.IsActive,
	})
	return updated, nil
}

func (s *Service) DeleteOrgUnit(ctx context.Context, actor uuid.UUID, code string) error {
	normalized := strings.TrimSpace(strings.ToUpper(code))
	if normalized == "" {
		return fmt.Errorf("code is required")
	}
	if err := s.repo.DeleteOrgUnit(ctx, normalized); err != nil {
		return err
	}
	s.recordAudit(ctx, actor, "core.org_unit.delete", normalized, nil)
	return nil
}

func (s *Service) ListRolePermissions(ctx context.Context, roleCode string) ([]RolePermission, error) {
	normalized := strings.TrimSpace(roleCode)
	if normalized == "" {
		return nil, fmt.Errorf("role code is required")
	}
	exists, err := s.repo.RoleExists(ctx, normalized)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrRoleNotFound
	}
	return s.repo.ListRolePermissions(ctx, normalized)
}

func (s *Service) UpdateRolePermissions(ctx context.Context, actor uuid.UUID, roleCode string, entries []RolePermissionInput) ([]RolePermission, error) {
	normalized := strings.TrimSpace(roleCode)
	if normalized == "" {
		return nil, fmt.Errorf("role code is required")
	}
	exists, err := s.repo.RoleExists(ctx, normalized)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrRoleNotFound
	}

	processed := make([]RolePermissionInput, 0, len(entries))
	for _, entry := range entries {
		resource := strings.TrimSpace(entry.Resource)
		action := strings.TrimSpace(entry.Action)
		if resource == "" || action == "" {
			return nil, fmt.Errorf("resource and action are required")
		}
		scope, err := s.normalizeScope(ctx, entry.Scope)
		if err != nil {
			return nil, err
		}
		effect := strings.TrimSpace(entry.Effect)
		if effect == "" {
			effect = "allow"
		}
		processed = append(processed, RolePermissionInput{
			Resource: resource,
			Action:   action,
			Scope:    scope,
			Effect:   effect,
			Metadata: entry.Metadata,
		})
	}

	updated, err := s.repo.ReplaceRolePermissions(ctx, normalized, processed)
	if err != nil {
		return nil, err
	}

	s.recordAudit(ctx, actor, "core.permission.update", normalized, map[string]any{
		"count": len(updated),
	})
	return updated, nil
}

func (s *Service) ListAPITokens(ctx context.Context) ([]APIToken, error) {
	return s.repo.ListAPITokens(ctx)
}

func (s *Service) CreateAPIToken(ctx context.Context, actor uuid.UUID, input CreateAPITokenInput) (APITokenWithSecret, error) {
	name := strings.TrimSpace(input.Name)
	role := strings.TrimSpace(input.RoleCode)
	if name == "" {
		return APITokenWithSecret{}, fmt.Errorf("name is required")
	}
	if role == "" {
		return APITokenWithSecret{}, fmt.Errorf("role code is required")
	}

	exists, err := s.repo.RoleExists(ctx, role)
	if err != nil {
		return APITokenWithSecret{}, err
	}
	if !exists {
		return APITokenWithSecret{}, ErrRoleNotFound
	}

	scope, err := s.normalizeScope(ctx, input.Scope)
	if err != nil {
		return APITokenWithSecret{}, err
	}

	tokenValue, err := generateTokenSecret()
	if err != nil {
		return APITokenWithSecret{}, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(tokenValue), bcrypt.DefaultCost)
	if err != nil {
		return APITokenWithSecret{}, fmt.Errorf("hash token: %w", err)
	}

	created, err := s.repo.CreateAPIToken(ctx, CreateAPITokenInput{
		Name:     name,
		RoleCode: role,
		Scope:    scope,
	}, string(hash), actor)
	if err != nil {
		return APITokenWithSecret{}, err
	}

	s.recordAudit(ctx, actor, "core.api_token.create", created.ID.String(), map[string]any{
		"name":     created.Name,
		"roleCode": created.RoleCode,
		"scope":    created.Scope,
	})

	return APITokenWithSecret{APIToken: created, Token: tokenValue}, nil
}

func (s *Service) RevokeAPIToken(ctx context.Context, actor uuid.UUID, id uuid.UUID) (APIToken, error) {
	revoked, err := s.repo.RevokeAPIToken(ctx, id)
	if err != nil {
		return APIToken{}, err
	}
	s.recordAudit(ctx, actor, "core.api_token.revoke", revoked.ID.String(), map[string]any{
		"name": revoked.Name,
	})
	return revoked, nil
}

// CheckPermission verifies whether subject has access to resource/action within provided scopes.
func (s *Service) CheckPermission(ctx context.Context, subject Subject, resource, action string) (bool, error) {
	resource = strings.TrimSpace(resource)
	action = strings.TrimSpace(action)
	if resource == "" || action == "" {
		return false, fmt.Errorf("resource and action are required")
	}

	roleCodes := make([]string, 0, len(subject.Roles))
	scopeSet := make(map[string]struct{})
	for _, grant := range subject.Roles {
		code := strings.TrimSpace(strings.ToLower(grant.Code))
		if code == "" {
			continue
		}
		roleCodes = append(roleCodes, code)
		scope := normalizeScope(grant.Scope)
		if scope != "" {
			scopeSet[scope] = struct{}{}
		}
	}
	for _, unit := range subject.OrgUnits {
		scope := normalizeScope(unit)
		if scope != "" {
			scopeSet[scope] = struct{}{}
		}
	}

	if len(roleCodes) == 0 {
		return false, nil
	}

	scopes := make([]string, 0, len(scopeSet))
	for scope := range scopeSet {
		scopes = append(scopes, scope)
	}

	allowed, err := s.repo.HasPermission(ctx, roleCodes, scopes, resource, action)
	if err != nil {
		return false, err
	}
	return allowed, nil
}

func normalizeScope(value string) string {
	scope := strings.TrimSpace(value)
	if scope == "" {
		return ""
	}
	if scope == "*" {
		return "*"
	}
	return strings.ToUpper(scope)
}

func (s *Service) normalizeScope(ctx context.Context, scope string) (string, error) {
	trimmed := strings.TrimSpace(scope)
	if trimmed == "" || trimmed == "*" {
		return "*", nil
	}
	normalized := strings.ToUpper(trimmed)
	if _, err := s.repo.GetOrgUnitByCode(ctx, normalized); err != nil {
		if errors.Is(err, ErrOrgUnitNotFound) {
			return "", fmt.Errorf("org unit %s not found", normalized)
		}
		return "", err
	}
	return normalized, nil
}

func generateTokenSecret() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", fmt.Errorf("generate token: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}
