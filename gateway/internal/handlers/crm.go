package handlers

import (
	"encoding/json"
	"errors"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"asfppro/gateway/internal/crm"
)

// RegisterCRMRoutes wires minimal CRM endpoints.
func RegisterCRMRoutes(router fiber.Router, svc *crm.Service, guard func(resource, action string) fiber.Handler, logger zerolog.Logger) {
	if router == nil || svc == nil {
		return
	}
	if guard == nil {
		guard = func(_, _ string) fiber.Handler {
			return func(c *fiber.Ctx) error { return c.Next() }
		}
	}

	router.Get("/api/v1/crm/customers", guard("crm.customer", "read"), listCustomersHandler(svc))
	router.Post("/api/v1/crm/customers", guard("crm.customer", "write"), createCustomerHandler(svc, logger))
	router.Put("/api/v1/crm/customers/:id", guard("crm.customer", "write"), updateCustomerHandler(svc, logger))

	router.Get("/api/v1/crm/deals", guard("crm.deal", "read"), listDealsHandler(svc))
	router.Post("/api/v1/crm/deals", guard("crm.deal", "write"), createDealHandler(svc, logger))
	router.Put("/api/v1/crm/deals/:id", guard("crm.deal", "write"), updateDealHandler(svc, logger))
	router.Get("/api/v1/crm/deals/:id/history", guard("crm.deal", "read"), dealHistoryHandler(svc))
}

type customerRequest struct {
	Name string `json:"name"`
	INN  string `json:"inn"`
	KPP  string `json:"kpp"`
}

type dealRequest struct {
	Title       string  `json:"title"`
	CustomerID  string  `json:"customerId"`
	Stage       string  `json:"stage"`
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"`
	CreatedBy   string  `json:"createdBy"`
	OrgUnitCode string  `json:"orgUnitCode"`
}

func listCustomersHandler(svc *crm.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		customers, err := svc.ListCustomers(c.Context())
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": customers})
	}
}

func createCustomerHandler(svc *crm.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req customerRequest
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := crm.CreateCustomerInput{
			Name: req.Name,
			INN:  req.INN,
			KPP:  req.KPP,
		}

		customer, err := svc.CreateCustomer(c.Context(), extractActorID(c), input)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		logger.Info().Str("customerId", customer.ID.String()).Msg("crm customer created")
		return c.Status(fiber.StatusCreated).JSON(customer)
	}
}

func updateCustomerHandler(svc *crm.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid customer id")
		}

		var req customerRequest
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := crm.UpdateCustomerInput{}
		if strings.TrimSpace(req.Name) != "" {
			name := req.Name
			input.Name = &name
		}
		if req.INN != "" {
			inn := req.INN
			input.INN = &inn
		}
		if req.KPP != "" {
			kpp := req.KPP
			input.KPP = &kpp
		}

		customer, err := svc.UpdateCustomer(c.Context(), extractActorID(c), id, input)
		if err != nil {
			return mapCRMError(err)
		}

		logger.Info().Str("customerId", customer.ID.String()).Msg("crm customer updated")
		return c.JSON(customer)
	}
}

func listDealsHandler(svc *crm.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		limit, _ := strconv.Atoi(c.Query("limit", "20"))
		filter := crm.ListDealsFilter{
			Stage: c.Query("stage"),
			Limit: limit,
		}
		subject, _ := currentSubject(c)
		deals, err := svc.ListDeals(c.Context(), subject, filter)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": deals})
	}
}

func createDealHandler(svc *crm.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req dealRequest
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		customerID, err := uuid.Parse(strings.TrimSpace(req.CustomerID))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid customerId")
		}

		input := crm.CreateDealInput{
			Title:       req.Title,
			CustomerID:  customerID,
			Stage:       req.Stage,
			Amount:      req.Amount,
			Currency:    req.Currency,
			CreatedBy:   req.CreatedBy,
			OrgUnitCode: req.OrgUnitCode,
		}

		subject, _ := currentSubject(c)
		deal, err := svc.CreateDeal(c.Context(), extractActorID(c), subject, input)
		if err != nil {
			return mapCRMError(err)
		}

		logger.Info().Str("dealId", deal.ID.String()).Msg("crm deal created")
		return c.Status(fiber.StatusCreated).JSON(deal)
	}
}

func updateDealHandler(svc *crm.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid deal id")
		}

		var req map[string]any
		if err := json.Unmarshal(c.Body(), &req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := crm.UpdateDealInput{}
		if title, ok := req["title"].(string); ok {
			input.Title = &title
		}
		if customer, ok := req["customerId"].(string); ok && strings.TrimSpace(customer) != "" {
			cid, err := uuid.Parse(customer)
			if err != nil {
				return fiber.NewError(fiber.StatusBadRequest, "invalid customerId")
			}
			input.CustomerID = &cid
		}
		if stage, ok := req["stage"].(string); ok {
			input.Stage = &stage
		}
		if amountRaw, ok := req["amount"]; ok {
			switch v := amountRaw.(type) {
			case float64:
				input.Amount = &v
			case string:
				parsed, err := strconv.ParseFloat(strings.TrimSpace(v), 64)
				if err != nil {
					return fiber.NewError(fiber.StatusBadRequest, "invalid amount")
				}
				input.Amount = &parsed
			default:
				return fiber.NewError(fiber.StatusBadRequest, "invalid amount")
			}
		}
		if currency, ok := req["currency"].(string); ok {
			input.Currency = &currency
		}

		subject, _ := currentSubject(c)
		deal, err := svc.UpdateDeal(c.Context(), extractActorID(c), subject, id, input)
		if err != nil {
			return mapCRMError(err)
		}

		logger.Info().Str("dealId", deal.ID.String()).Msg("crm deal updated")
		return c.JSON(deal)
	}
}

func dealHistoryHandler(svc *crm.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		dealID, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid deal id")
		}
		limit, _ := strconv.Atoi(c.Query("limit", "20"))

		subject, _ := currentSubject(c)
		events, err := svc.ListDealEvents(c.Context(), subject, dealID, limit)
		if err != nil {
			if errors.Is(err, crm.ErrForbidden) {
				return fiber.ErrForbidden
			}
			if errors.Is(err, crm.ErrDealNotFound) {
				return fiber.NewError(fiber.StatusNotFound, "deal not found")
			}
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": events})
	}
}

func mapCRMError(err error) error {
	switch err {
	case nil:
		return nil
	case crm.ErrCustomerNotFound:
		return fiber.NewError(fiber.StatusNotFound, "customer not found")
	case crm.ErrDealNotFound:
		return fiber.NewError(fiber.StatusNotFound, "deal not found")
	case crm.ErrForbidden:
		return fiber.ErrForbidden
	default:
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
}
