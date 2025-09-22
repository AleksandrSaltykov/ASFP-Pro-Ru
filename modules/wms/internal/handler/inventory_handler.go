package handler

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"

	"asfppro/modules/wms/internal/entity"
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
