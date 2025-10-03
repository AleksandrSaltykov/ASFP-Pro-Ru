package crm

import (
	"context"
	"fmt"
	"sort"
	"strings"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	corepkg "asfppro/gateway/internal/core"
	"asfppro/pkg/audit"
)

// Service handles CRM operations.
type Service struct {
	repo    *Repository
	auditor *audit.Recorder
	logger  zerolog.Logger
}

// NewService builds CRM service.
func NewService(repo *Repository, auditor *audit.Recorder, logger zerolog.Logger) *Service {
	return &Service{repo: repo, auditor: auditor, logger: logger.With().Str("component", "crm.service").Logger()}
}

// ListCustomers returns customers.
func (s *Service) ListCustomers(ctx context.Context) ([]Customer, error) {
	return s.repo.ListCustomers(ctx)
}

// CreateCustomer validates and inserts customer.
func (s *Service) CreateCustomer(ctx context.Context, actor uuid.UUID, input CreateCustomerInput) (Customer, error) {
	input.Name = strings.TrimSpace(input.Name)
	input.INN = strings.TrimSpace(input.INN)
	input.KPP = strings.TrimSpace(input.KPP)

	if input.Name == "" {
		return Customer{}, fmt.Errorf("name is required")
	}

	customer, err := s.repo.CreateCustomer(ctx, input)
	if err != nil {
		return Customer{}, err
	}

	s.recordAudit(ctx, actor, "crm.customer.create", customer.ID.String(), customer)
	return customer, nil
}

// UpdateCustomer updates customer fields.
func (s *Service) UpdateCustomer(ctx context.Context, actor uuid.UUID, id uuid.UUID, input UpdateCustomerInput) (Customer, error) {
	if input.Name != nil {
		trimmed := strings.TrimSpace(*input.Name)
		if trimmed == "" {
			return Customer{}, fmt.Errorf("name cannot be empty")
		}
		input.Name = &trimmed
	}
	if input.INN != nil {
		trimmed := strings.TrimSpace(*input.INN)
		input.INN = &trimmed
	}
	if input.KPP != nil {
		trimmed := strings.TrimSpace(*input.KPP)
		input.KPP = &trimmed
	}

	customer, err := s.repo.UpdateCustomer(ctx, id, input)
	if err != nil {
		return Customer{}, err
	}

	s.recordAudit(ctx, actor, "crm.customer.update", customer.ID.String(), customer)
	return customer, nil
}

// ListDeals returns deals with filter.
func (s *Service) ListDeals(ctx context.Context, subject corepkg.Subject, filter ListDealsFilter) ([]Deal, error) {
	filter.Stage = strings.TrimSpace(strings.ToLower(filter.Stage))
	allowAll, scopes := extractScopes(subject)
	return s.repo.ListDeals(ctx, scopes, allowAll, filter)
}

// CreateDeal inserts deal.
func (s *Service) CreateDeal(ctx context.Context, actor uuid.UUID, subject corepkg.Subject, input CreateDealInput) (Deal, error) {
	input.Title = strings.TrimSpace(input.Title)
	input.Stage = strings.TrimSpace(strings.ToLower(input.Stage))
	input.Currency = strings.TrimSpace(strings.ToUpper(input.Currency))
	if input.Title == "" {
		return Deal{}, fmt.Errorf("title is required")
	}
	if input.CustomerID == uuid.Nil {
		return Deal{}, fmt.Errorf("customerId is required")
	}
	if exists, err := s.repo.CustomerExists(ctx, input.CustomerID); err != nil {
		return Deal{}, err
	} else if !exists {
		return Deal{}, fmt.Errorf("customer not found")
	}

	if input.Stage == "" {
		input.Stage = "new"
	}
	if input.Currency == "" {
		input.Currency = "RUB"
	}
	allowAll, scopes := extractScopes(subject)
	input.OrgUnitCode = normalizeScopeValue(input.OrgUnitCode)
	if input.OrgUnitCode == "" {
		if allowAll {
			return Deal{}, fmt.Errorf("orgUnitCode is required when subject has global scope")
		}
		if len(scopes) == 1 {
			input.OrgUnitCode = scopes[0]
		} else {
			return Deal{}, fmt.Errorf("orgUnitCode is required")
		}
	}
	if !allowAll && !containsScope(scopes, input.OrgUnitCode) {
		return Deal{}, ErrForbidden
	}

	deal, err := s.repo.CreateDeal(ctx, input)
	if err != nil {
		return Deal{}, err
	}

	s.recordAudit(ctx, actor, "crm.deal.create", deal.ID.String(), deal)
	_ = s.repo.AppendDealEvent(ctx, deal.ID, "deal.created", map[string]any{"stage": deal.Stage, "title": deal.Title})
	return deal, nil
}

// UpdateDeal updates deal fields.
func (s *Service) UpdateDeal(ctx context.Context, actor uuid.UUID, subject corepkg.Subject, id uuid.UUID, input UpdateDealInput) (Deal, error) {
	deal, err := s.repo.findDeal(ctx, id)
	if err != nil {
		return Deal{}, err
	}
	allowAll, scopes := extractScopes(subject)
	if !allowAll && !containsScope(scopes, deal.OrgUnitCode) {
		return Deal{}, ErrForbidden
	}
	if input.Title != nil {
		trimmed := strings.TrimSpace(*input.Title)
		if trimmed == "" {
			return Deal{}, fmt.Errorf("title cannot be empty")
		}
		input.Title = &trimmed
	}
	if input.Stage != nil {
		trimmed := strings.TrimSpace(strings.ToLower(*input.Stage))
		if trimmed == "" {
			return Deal{}, fmt.Errorf("stage cannot be empty")
		}
		input.Stage = &trimmed
	}
	if input.Currency != nil {
		trimmed := strings.TrimSpace(strings.ToUpper(*input.Currency))
		if trimmed == "" {
			return Deal{}, fmt.Errorf("currency cannot be empty")
		}
		input.Currency = &trimmed
	}
	if input.CustomerID != nil && *input.CustomerID == uuid.Nil {
		return Deal{}, fmt.Errorf("customerId cannot be empty")
	}
	if input.CustomerID != nil {
		if exists, err := s.repo.CustomerExists(ctx, *input.CustomerID); err != nil {
			return Deal{}, err
		} else if !exists {
			return Deal{}, fmt.Errorf("customer not found")
		}
	}

	deal, err = s.repo.UpdateDeal(ctx, id, input)
	if err != nil {
		return Deal{}, err
	}

	s.recordAudit(ctx, actor, "crm.deal.update", deal.ID.String(), deal)
	if input.Stage != nil {
		_ = s.repo.AppendDealEvent(ctx, deal.ID, "deal.stage_change", map[string]any{"stage": deal.Stage})
	}
	return deal, nil
}

// ListDealEvents returns history.
func (s *Service) ListDealEvents(ctx context.Context, subject corepkg.Subject, dealID uuid.UUID, limit int) ([]DealEvent, error) {
	deal, err := s.repo.findDeal(ctx, dealID)
	if err != nil {
		return nil, err
	}
	allowAll, scopes := extractScopes(subject)
	if !allowAll && !containsScope(scopes, deal.OrgUnitCode) {
		return nil, ErrForbidden
	}
	return s.repo.ListDealEvents(ctx, dealID, limit)
}

func (s *Service) recordAudit(ctx context.Context, actor uuid.UUID, action, entityID string, payload any) {
	if s.auditor == nil {
		return
	}
	entry := audit.Entry{
		ActorID:  actor,
		Action:   action,
		Entity:   "crm.deal",
		EntityID: entityID,
		Payload:  payload,
	}
	if strings.HasPrefix(action, "crm.customer") {
		entry.Entity = "crm.customer"
	}
	if err := s.auditor.Record(ctx, entry); err != nil {
		s.logger.Error().Err(err).Msg("crm audit record")
	}
}

func extractScopes(subject corepkg.Subject) (bool, []string) {
	scopeSet := make(map[string]struct{})
	allowAll := false

	for _, role := range subject.Roles {
		scope := normalizeScopeValue(role.Scope)
		if scope == "" {
			continue
		}
		if scope == "*" {
			allowAll = true
			continue
		}
		scopeSet[scope] = struct{}{}
	}

	for _, unit := range subject.OrgUnits {
		scope := normalizeScopeValue(unit)
		if scope == "" {
			continue
		}
		if scope == "*" {
			allowAll = true
			continue
		}
		scopeSet[scope] = struct{}{}
	}

	scopes := make([]string, 0, len(scopeSet))
	for scope := range scopeSet {
		scopes = append(scopes, scope)
	}
	sort.Strings(scopes)
	return allowAll, scopes
}

func containsScope(scopes []string, target string) bool {
	for _, scope := range scopes {
		if scope == target {
			return true
		}
	}
	return false
}

func normalizeScopeValue(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return ""
	}
	if trimmed == "*" {
		return "*"
	}
	return strings.ToUpper(trimmed)
}
