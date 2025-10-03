package handlers

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"asfppro/gateway/internal/wms"
)

// RegisterWMSRoutes wires minimal WMS endpoints.
func RegisterWMSRoutes(router fiber.Router, svc *wms.Service, guard func(resource, action string) fiber.Handler, logger zerolog.Logger) {
	if router == nil || svc == nil {
		return
	}
	if guard == nil {
		guard = func(_, _ string) fiber.Handler {
			return func(c *fiber.Ctx) error { return c.Next() }
		}
	}

	router.Get("/api/v1/wms/catalog/:type", guard("wms.catalog", "read"), listCatalogHandler(svc))
	router.Post("/api/v1/wms/catalog/:type", guard("wms.catalog", "write"), createCatalogHandler(svc, logger))
	router.Put("/api/v1/wms/catalog/:type/:id", guard("wms.catalog", "write"), updateCatalogHandler(svc, logger))
	router.Delete("/api/v1/wms/catalog/:type/:id", guard("wms.catalog", "write"), deleteCatalogHandler(svc, logger))

	router.Get("/api/v1/wms/warehouses", guard("wms.warehouse", "read"), listWarehousesHandler(svc))
	router.Post("/api/v1/wms/warehouses", guard("wms.warehouse", "write"), createWarehouseHandler(svc, logger))
	router.Put("/api/v1/wms/warehouses/:id", guard("wms.warehouse", "write"), updateWarehouseHandler(svc, logger))
	router.Delete("/api/v1/wms/warehouses/:id", guard("wms.warehouse", "write"), deleteWarehouseHandler(svc, logger))

	router.Get("/api/v1/wms/stock", guard("wms.stock", "read"), listStockHandler(svc))
	router.Post("/api/v1/wms/stock", guard("wms.stock", "write"), upsertStockHandler(svc, logger))
}

type catalogRequest struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
	IsActive    *bool  `json:"isActive"`
}

type warehouseRequest struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Status      string `json:"status"`
	OrgUnitCode string `json:"orgUnitCode"`
}

type stockRequest struct {
	SKU       string  `json:"sku"`
	Warehouse string  `json:"warehouse"`
	Quantity  float64 `json:"quantity"`
	UOM       string  `json:"uom"`
}

func listCatalogHandler(svc *wms.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		typeParam := c.Params("type")
		nodes, err := svc.ListCatalogNodes(c.Context(), typeParam)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		return c.JSON(fiber.Map{"items": nodes})
	}
}

func createCatalogHandler(svc *wms.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		typeParam := c.Params("type")
		var req catalogRequest
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := wms.CreateCatalogInput{
			Type:        typeParam,
			Code:        req.Code,
			Name:        req.Name,
			Description: req.Description,
		}

		node, err := svc.CreateCatalogNode(c.Context(), extractActorID(c), input)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		logger.Info().Str("catalogType", node.Type).Str("code", node.Code).Msg("wms catalog created")
		return c.Status(fiber.StatusCreated).JSON(node)
	}
}

func updateCatalogHandler(svc *wms.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid catalog id")
		}

		var req catalogRequest
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := wms.UpdateCatalogInput{
			Name:        req.Name,
			Description: req.Description,
			IsActive:    req.IsActive,
		}

		node, err := svc.UpdateCatalogNode(c.Context(), extractActorID(c), id, input)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		logger.Info().Str("catalogId", id.String()).Msg("wms catalog updated")
		return c.JSON(node)
	}
}

func deleteCatalogHandler(svc *wms.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid catalog id")
		}

		if err := svc.DeleteCatalogNode(c.Context(), extractActorID(c), id); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		logger.Info().Str("catalogId", id.String()).Msg("wms catalog deleted")
		return c.SendStatus(fiber.StatusNoContent)
	}
}

func listWarehousesHandler(svc *wms.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		subject, _ := currentSubject(c)
		warehouses, err := svc.ListWarehouses(c.Context(), subject)
		if err != nil {
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
		return c.JSON(fiber.Map{"items": warehouses})
	}
}

func createWarehouseHandler(svc *wms.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req warehouseRequest
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := wms.CreateWarehouseInput{
			Code:        req.Code,
			Name:        req.Name,
			Description: req.Description,
			Status:      req.Status,
			OrgUnitCode: req.OrgUnitCode,
		}

		subject, _ := currentSubject(c)
		wh, err := svc.CreateWarehouse(c.Context(), extractActorID(c), subject, input)
		if err != nil {
			if errors.Is(err, wms.ErrForbidden) {
				return fiber.ErrForbidden
			}
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		logger.Info().Str("warehouseId", wh.ID.String()).Msg("wms warehouse created")
		return c.Status(fiber.StatusCreated).JSON(wh)
	}
}

func updateWarehouseHandler(svc *wms.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid warehouse id")
		}

		var req warehouseRequest
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := wms.UpdateWarehouseInput{}
		if req.Name != "" {
			name := req.Name
			input.Name = &name
		}
		if req.Description != "" {
			desc := req.Description
			input.Description = &desc
		}
		if req.Status != "" {
			status := req.Status
			input.Status = &status
		}

		subject, _ := currentSubject(c)
		wh, err := svc.UpdateWarehouse(c.Context(), extractActorID(c), subject, id, input)
		if err != nil {
			if errors.Is(err, wms.ErrForbidden) {
				return fiber.ErrForbidden
			}
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		logger.Info().Str("warehouseId", id.String()).Msg("wms warehouse updated")
		return c.JSON(wh)
	}
}

func deleteWarehouseHandler(svc *wms.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid warehouse id")
		}

		subject, _ := currentSubject(c)
		if err := svc.DeleteWarehouse(c.Context(), extractActorID(c), subject, id); err != nil {
			if errors.Is(err, wms.ErrForbidden) {
				return fiber.ErrForbidden
			}
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		logger.Info().Str("warehouseId", id.String()).Msg("wms warehouse deleted")
		return c.SendStatus(fiber.StatusNoContent)
	}
}

func listStockHandler(svc *wms.Service) fiber.Handler {
	return func(c *fiber.Ctx) error {
		sku := c.Query("sku")
		warehouse := c.Query("warehouse")

		subject, _ := currentSubject(c)
		records, err := svc.ListStock(c.Context(), subject, sku, warehouse)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		return c.JSON(fiber.Map{"items": records})
	}
}

func upsertStockHandler(svc *wms.Service, logger zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req stockRequest
		if err := c.BodyParser(&req); err != nil {
			return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
		}

		input := wms.UpsertStockInput{
			SKU:       req.SKU,
			Warehouse: req.Warehouse,
			Quantity:  req.Quantity,
			UOM:       req.UOM,
		}

		subject, _ := currentSubject(c)
		stock, err := svc.UpsertStock(c.Context(), extractActorID(c), subject, input)
		if err != nil {
			if errors.Is(err, wms.ErrForbidden) {
				return fiber.ErrForbidden
			}
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}

		logger.Info().Str("sku", stock.SKU).Str("warehouse", stock.Warehouse).
			Float64("quantity", stock.Quantity).Msg("wms stock upserted")
		return c.Status(fiber.StatusCreated).JSON(stock)
	}
}
