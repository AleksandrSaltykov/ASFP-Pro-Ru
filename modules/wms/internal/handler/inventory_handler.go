package handler

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"

	"asfppro/modules/wms/internal/entity"
	"asfppro/modules/wms/internal/repository"
	"asfppro/modules/wms/internal/service"
)

// InventoryHandler exposes REST endpoints.
type InventoryHandler struct {
	service *service.InventoryService
}

// NewInventoryHandler returns handler instance.
func NewInventoryHandler(service *service.InventoryService) *InventoryHandler {
	return &InventoryHandler{service: service}
}

// Register binds routes.
func (h *InventoryHandler) Register(app *fiber.App) {
	group := app.Group("/api/v1/stock")
	group.Get("/", h.list)
	group.Post("/", h.upsert)
	group.Get("/balances", h.listBalances)
	group.Get("/availability", h.listAvailability)
	group.Get("/endless", h.listEndlessPolicies)
	group.Put("/endless", h.updateEndlessPolicy)
	group.Post("/endless/reset", h.resetEndlessPolicy)
	group.Get("/history", h.listHistory)
}

func (h *InventoryHandler) list(c *fiber.Ctx) error {
	warehouse := c.Query("warehouse")
	limit := c.QueryInt("limit", 50)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	items, err := h.service.List(ctx, warehouse, limit)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.JSON(fiber.Map{"items": items})
}

func (h *InventoryHandler) upsert(c *fiber.Ctx) error {
	var item entity.StockItem
	if err := c.BodyParser(&item); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	stored, err := h.service.Upsert(ctx, item)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(stored)
}

func (h *InventoryHandler) listBalances(c *fiber.Ctx) error {
	warehouse := c.Query("warehouse")
	sku := c.Query("sku")
	limit := c.QueryInt("limit", 0)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	data, err := h.service.Balances(ctx, warehouse, sku, limit)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(fiber.Map{"items": data})
}

func (h *InventoryHandler) listAvailability(c *fiber.Ctx) error {
	warehouse := c.Query("warehouse")
	sku := c.Query("sku")
	limit := c.QueryInt("limit", 0)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	data, err := h.service.Availability(ctx, warehouse, sku, limit)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(fiber.Map{"items": data})
}

func (h *InventoryHandler) listEndlessPolicies(c *fiber.Ctx) error {
	warehouse := c.Query("warehouse")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	data, err := h.service.EndlessPolicies(ctx, warehouse)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(fiber.Map{"items": data})
}

func (h *InventoryHandler) updateEndlessPolicy(c *fiber.Ctx) error {
	var req endlessPolicyRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
	}

	policyStr := strings.ToUpper(strings.TrimSpace(req.Policy))
	if policyStr == "" {
		policyStr = string(entity.EndlessPolicyNone)
	}
	policy := entity.EndlessPolicyKind(policyStr)

	input := entity.EndlessPolicyUpdate{
		ItemCode:     strings.TrimSpace(req.ItemCode),
		Warehouse:    strings.TrimSpace(req.Warehouse),
		Policy:       policy,
		Min:          req.Min,
		Max:          req.Max,
		ReorderPoint: req.ReorderPoint,
		SafetyStock:  req.SafetyStock,
		Note:         req.Note,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	updated, err := h.service.UpdateEndlessPolicy(ctx, input)
	if err != nil {
		if errors.Is(err, repository.ErrEndlessPolicyNotFound) {
			return fiber.ErrNotFound
		}
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(updated)
}

func (h *InventoryHandler) resetEndlessPolicy(c *fiber.Ctx) error {
	var req endlessPolicyResetRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
	}

	input := entity.EndlessPolicyReset{
		ItemCode:  strings.TrimSpace(req.ItemCode),
		Warehouse: strings.TrimSpace(req.Warehouse),
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	updated, err := h.service.ResetEndlessPolicy(ctx, input)
	if err != nil {
		if errors.Is(err, repository.ErrEndlessPolicyNotFound) {
			return fiber.ErrNotFound
		}
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(updated)
}

func (h *InventoryHandler) listHistory(c *fiber.Ctx) error {
	warehouse := c.Query("warehouse")
	limit := c.QueryInt("limit", 0)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	data, err := h.service.Movements(ctx, warehouse, limit)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(fiber.Map{"items": data})
}

type endlessPolicyRequest struct {
	ItemCode     string   `json:"itemCode"`
	Warehouse    string   `json:"warehouse"`
	Policy       string   `json:"policy"`
	Min          *float64 `json:"min"`
	Max          *float64 `json:"max"`
	ReorderPoint *float64 `json:"reorderPoint"`
	SafetyStock  *float64 `json:"safetyStock"`
	Note         string   `json:"note"`
}

type endlessPolicyResetRequest struct {
	ItemCode  string `json:"itemCode"`
	Warehouse string `json:"warehouse"`
}
