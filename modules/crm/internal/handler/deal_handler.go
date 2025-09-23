// Package handler exposes CRM HTTP handlers.
package handler

import (
	"context"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"asfppro/modules/crm/internal/service"
)

// DealHandler exposes HTTP endpoints for deals.
type DealHandler struct {
	service *service.DealService
}

// NewDealHandler constructs handler.
func NewDealHandler(service *service.DealService) *DealHandler {
	return &DealHandler{service: service}
}

// Register wires endpoints into router.
func (h *DealHandler) Register(app *fiber.App) {
	group := app.Group("/api/v1/deals")
	group.Get("/", h.list)
	group.Post("/", h.create)
	group.Get(":id/history", h.history)
}

func (h *DealHandler) list(c *fiber.Ctx) error {
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	deals, err := h.service.List(ctx, limit)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.JSON(fiber.Map{"items": deals})
}

func (h *DealHandler) create(c *fiber.Ctx) error {
	var input service.DealCreateInput
	if err := c.BodyParser(&input); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	deal, err := h.service.Create(ctx, input)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(deal)
}

func (h *DealHandler) history(c *fiber.Ctx) error {
	dealID := c.Params("id")
	if _, err := uuid.Parse(dealID); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid deal id")
	}

	limit, _ := strconv.Atoi(c.Query("limit", "50"))
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	events, err := h.service.History(ctx, dealID, limit)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.JSON(fiber.Map{"items": events})
}
