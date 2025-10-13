package handler

import (
	"context"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"asfppro/modules/wms/internal/entity"
	"asfppro/modules/wms/internal/service"
)

// InboundHandler exposes inbound receipts HTTP endpoints.
type InboundHandler struct {
	service *service.InboundService
}

// NewInboundHandler constructs handler instance.
func NewInboundHandler(service *service.InboundService) *InboundHandler {
	return &InboundHandler{service: service}
}

// Register binds inbound routes to router.
func (h *InboundHandler) Register(app *fiber.App) {
	group := app.Group("/api/v1/inbound")

	group.Get("/receipts", h.listReceipts)
	group.Post("/receipts", h.createReceipt)
	group.Get("/receipts/:receiptID", h.getReceipt)
	group.Put("/receipts/:receiptID", h.updateReceipt)
	group.Delete("/receipts/:receiptID", h.deleteReceipt)
}

func (h *InboundHandler) listReceipts(c *fiber.Ctx) error {
	filter := entity.ReceiptFilter{
		Status: strings.TrimSpace(c.Query("status")),
		Search: strings.TrimSpace(c.Query("search")),
	}
	if limit := c.QueryInt("limit", 0); limit > 0 {
		filter.Limit = limit
	}
	if rawID := strings.TrimSpace(c.Query("warehouseId")); rawID != "" {
		warehouseID, err := uuid.Parse(rawID)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid warehouseId")
		}
		filter.WarehouseID = &warehouseID
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	receipts, err := h.service.ListReceipts(ctx, filter)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(fiber.Map{"items": receipts})
}

func (h *InboundHandler) getReceipt(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("receiptID"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid receipt id")
	}
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	receipt, err := h.service.GetReceipt(ctx, id)
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, err.Error())
	}
	return c.JSON(receipt)
}

func (h *InboundHandler) createReceipt(c *fiber.Ctx) error {
	var req receiptRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
	}

	input, err := req.toEntity()
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	receipt, err := h.service.CreateReceipt(ctx, input)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(receipt)
}

func (h *InboundHandler) updateReceipt(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("receiptID"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid receipt id")
	}

	var req receiptRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
	}

	input, err := req.toEntity()
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	receipt, err := h.service.UpdateReceipt(ctx, id, input)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(receipt)
}

func (h *InboundHandler) deleteReceipt(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("receiptID"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid receipt id")
	}

	var actor *uuid.UUID
	if raw := strings.TrimSpace(c.Query("actorId")); raw != "" {
		parsed, parseErr := uuid.Parse(raw)
		if parseErr != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid actorId")
		}
		actor = &parsed
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	if err := h.service.DeleteReceipt(ctx, id, actor); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.SendStatus(fiber.StatusNoContent)
}

type receiptRequest struct {
	Code              string               `json:"code"`
	ExternalReference string               `json:"externalReference"`
	Status            string               `json:"status"`
	WarehouseID       string               `json:"warehouseId"`
	SupplierID        string               `json:"supplierId"`
	SupplierName      string               `json:"supplierName"`
	SupplierInn       string               `json:"supplierInn"`
	Currency          string               `json:"currency"`
	ExpectedAt        *time.Time           `json:"expectedAt"`
	ReceivedAt        *time.Time           `json:"receivedAt"`
	Notes             string               `json:"notes"`
	Metadata          map[string]any       `json:"metadata"`
	Lines             []receiptLineRequest `json:"lines"`
	ActorID           string               `json:"actorId"`
}

type receiptLineRequest struct {
	ID               string         `json:"id"`
	ItemID           string         `json:"itemId"`
	UnitID           string         `json:"unitId"`
	Quantity         float64        `json:"quantity"`
	ExpectedQuantity *float64       `json:"expectedQuantity"`
	ReceivedQuantity *float64       `json:"receivedQuantity"`
	UnitCost         float64        `json:"unitCost"`
	VatRate          *float64       `json:"vatRate"`
	BatchNumber      string         `json:"batchNumber"`
	ProductionDate   *time.Time     `json:"productionDate"`
	ExpirationDate   *time.Time     `json:"expirationDate"`
	Metadata         map[string]any `json:"metadata"`
}

func (r receiptRequest) toEntity() (entity.ReceiptInput, error) {
	warehouseID, err := uuid.Parse(strings.TrimSpace(r.WarehouseID))
	if err != nil {
		return entity.ReceiptInput{}, fiber.NewError(fiber.StatusBadRequest, "invalid warehouseId")
	}

	var supplierID *uuid.UUID
	if raw := strings.TrimSpace(r.SupplierID); raw != "" {
		id, parseErr := uuid.Parse(raw)
		if parseErr != nil {
			return entity.ReceiptInput{}, fiber.NewError(fiber.StatusBadRequest, "invalid supplierId")
		}
		supplierID = &id
	}

	var actorID *uuid.UUID
	if raw := strings.TrimSpace(r.ActorID); raw != "" {
		id, parseErr := uuid.Parse(raw)
		if parseErr != nil {
			return entity.ReceiptInput{}, fiber.NewError(fiber.StatusBadRequest, "invalid actorId")
		}
		actorID = &id
	}

	lines := make([]entity.ReceiptLineInput, 0, len(r.Lines))
	for _, rawLine := range r.Lines {
		itemID, err := uuid.Parse(strings.TrimSpace(rawLine.ItemID))
		if err != nil {
			return entity.ReceiptInput{}, fiber.NewError(fiber.StatusBadRequest, "invalid line itemId")
		}

		var lineID *uuid.UUID
		if raw := strings.TrimSpace(rawLine.ID); raw != "" {
			id, parseErr := uuid.Parse(raw)
			if parseErr != nil {
				return entity.ReceiptInput{}, fiber.NewError(fiber.StatusBadRequest, "invalid line id")
			}
			lineID = &id
		}

		var unitID uuid.UUID
		if raw := strings.TrimSpace(rawLine.UnitID); raw != "" {
			id, parseErr := uuid.Parse(raw)
			if parseErr != nil {
				return entity.ReceiptInput{}, fiber.NewError(fiber.StatusBadRequest, "invalid line unitId")
			}
			unitID = id
		}

		lines = append(lines, entity.ReceiptLineInput{
			ID:               lineID,
			ItemID:           itemID,
			UnitID:           unitID,
			Quantity:         rawLine.Quantity,
			ExpectedQuantity: rawLine.ExpectedQuantity,
			ReceivedQuantity: rawLine.ReceivedQuantity,
			UnitCost:         rawLine.UnitCost,
			VatRate:          rawLine.VatRate,
			BatchNumber:      rawLine.BatchNumber,
			ProductionDate:   rawLine.ProductionDate,
			ExpirationDate:   rawLine.ExpirationDate,
			Metadata:         rawLine.Metadata,
		})
	}

	return entity.ReceiptInput{
		Code:              r.Code,
		ExternalReference: r.ExternalReference,
		Status:            r.Status,
		WarehouseID:       warehouseID,
		SupplierID:        supplierID,
		SupplierName:      r.SupplierName,
		SupplierInn:       r.SupplierInn,
		Currency:          r.Currency,
		ExpectedAt:        r.ExpectedAt,
		ReceivedAt:        r.ReceivedAt,
		Notes:             r.Notes,
		Metadata:          r.Metadata,
		Lines:             lines,
		ActorID:           actorID,
	}, nil
}
