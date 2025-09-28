package handler

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"asfppro/modules/wms/internal/entity"
	"asfppro/modules/wms/internal/service"
)

// MasterDataHandler exposes endpoints for warehouse master data.
type MasterDataHandler struct {
	service *service.MasterDataService
}

// NewMasterDataHandler builds handler instance.
func NewMasterDataHandler(service *service.MasterDataService) *MasterDataHandler {
	return &MasterDataHandler{service: service}
}

// Register binds routes for master data.
func (h *MasterDataHandler) Register(app *fiber.App) {
	group := app.Group("/api/v1/master-data")

	group.Get("/catalog/:type", h.listCatalogNodes)
	group.Post("/catalog/:type", h.createCatalogNode)
	group.Put("/catalog/:type/:nodeID", h.updateCatalogNode)
	group.Delete("/catalog/:type/:nodeID", h.deleteCatalogNode)

	group.Get("/catalog-links/:leftType/:leftID", h.listCatalogLinks)
	group.Put("/catalog-links/:leftType/:leftID", h.replaceCatalogLinks)

	group.Get("/attribute-templates", h.listAttributeTemplates)

	group.Get("/items", h.listItems)
	group.Post("/items", h.createItem)
	group.Get("/items/:itemID", h.getItem)
	group.Put("/items/:itemID", h.updateItem)
	group.Delete("/items/:itemID", h.deleteItem)

	group.Get("/warehouses", h.listWarehouses)
	group.Post("/warehouses", h.createWarehouse)
	group.Get("/warehouses/:warehouseID", h.getWarehouse)
	group.Put("/warehouses/:warehouseID", h.updateWarehouse)
	group.Delete("/warehouses/:warehouseID", h.deleteWarehouse)

	group.Get("/warehouses/:warehouseID/zones", h.listZones)
	group.Post("/warehouses/:warehouseID/zones", h.createZone)
	group.Put("/warehouses/:warehouseID/zones/:zoneID", h.updateZone)
	group.Delete("/warehouses/:warehouseID/zones/:zoneID", h.deleteZone)

	group.Get("/warehouses/:warehouseID/zones/:zoneID/cells", h.listCells)
	group.Post("/warehouses/:warehouseID/zones/:zoneID/cells", h.createCell)
	group.Put("/warehouses/:warehouseID/zones/:zoneID/cells/:cellID", h.updateCell)
	group.Delete("/warehouses/:warehouseID/zones/:zoneID/cells/:cellID", h.deleteCell)
	group.Get("/warehouses/:warehouseID/equipment", h.listEquipment)
	group.Post("/warehouses/:warehouseID/equipment", h.createEquipment)
	group.Put("/warehouses/:warehouseID/equipment/:equipmentID", h.updateEquipment)
	group.Delete("/warehouses/:warehouseID/equipment/:equipmentID", h.deleteEquipment)

	group.Post("/cells/:cellID/equipment/:equipmentID", h.assignEquipment)
	group.Delete("/cells/:cellID/equipment/:equipmentID", h.unassignEquipment)
	group.Get("/cells/:cellID/history", h.cellHistory)
}

// listCatalogNodes returns catalog nodes of provided type.
func (h *MasterDataHandler) listCatalogNodes(c *fiber.Ctx) error {
	typ := c.Params("type")
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	nodes, err := h.service.ListCatalogNodes(ctx, typ)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(fiber.Map{"items": nodes})
}

// createCatalogNode adds catalog node.
func (h *MasterDataHandler) createCatalogNode(c *fiber.Ctx) error {
	typ := c.Params("type")
	var req catalogNodeRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
	}
	node, err := req.toEntity()
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	created, err := h.service.CreateCatalogNode(ctx, typ, node)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(created)
}

// updateCatalogNode updates catalog node.
func (h *MasterDataHandler) updateCatalogNode(c *fiber.Ctx) error {
	typ := c.Params("type")
	nodeID, err := parseUUIDParam(c, "nodeID")
	if err != nil {
		return err
	}
	var req catalogNodeRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
	}
	node, err := req.toEntity()
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	updated, err := h.service.UpdateCatalogNode(ctx, typ, nodeID, node)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.JSON(updated)
}

// deleteCatalogNode removes catalog node.
func (h *MasterDataHandler) deleteCatalogNode(c *fiber.Ctx) error {
	typ := c.Params("type")
	nodeID, err := parseUUIDParam(c, "nodeID")
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	if err := h.service.DeleteCatalogNode(ctx, typ, nodeID); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// listAttributeTemplates returns dynamic attribute templates.
func (h *MasterDataHandler) listAttributeTemplates(c *fiber.Ctx) error {
	target := c.Query("target", "item")
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	templates, err := h.service.ListAttributeTemplates(ctx, target)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(fiber.Map{"items": templates})
}

// listItems returns item master data.
func (h *MasterDataHandler) listItems(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	items, err := h.service.ListItems(ctx)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(fiber.Map{"items": items})
}

// getItem returns item by id.
func (h *MasterDataHandler) getItem(c *fiber.Ctx) error {
	itemID, err := parseUUIDParam(c, "itemID")
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	item, err := h.service.GetItem(ctx, itemID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrItemNotFound()):
			return fiber.NewError(fiber.StatusNotFound, "item not found")
		default:
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
	}
	return c.JSON(item)
}

// createItem creates item with dynamic attributes.
func (h *MasterDataHandler) createItem(c *fiber.Ctx) error {
	var req itemRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
	}

	item, attrs, err := req.toEntity()
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	created, err := h.service.CreateItem(ctx, item, attrs)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(created)
}

// updateItem updates item and its attributes.
func (h *MasterDataHandler) updateItem(c *fiber.Ctx) error {
	itemID, err := parseUUIDParam(c, "itemID")
	if err != nil {
		return err
	}

	var req itemRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
	}

	item, attrs, err := req.toEntity()
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	updated, err := h.service.UpdateItem(ctx, itemID, item, attrs)
	if err != nil {
		if errors.Is(err, service.ErrItemNotFound()) {
			return fiber.NewError(fiber.StatusNotFound, "item not found")
		}
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.JSON(updated)
}

// deleteItem removes item.
func (h *MasterDataHandler) deleteItem(c *fiber.Ctx) error {
	itemID, err := parseUUIDParam(c, "itemID")
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	if err := h.service.DeleteItem(ctx, itemID); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// listCatalogLinks returns relations for provided entity.
func (h *MasterDataHandler) listCatalogLinks(c *fiber.Ctx) error {
	leftType := c.Params("leftType")
	leftID, err := parseUUIDParam(c, "leftID")
	if err != nil {
		return err
	}
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	links, err := h.service.ListCatalogLinks(ctx, leftType, leftID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(fiber.Map{"items": links})
}

// replaceCatalogLinks updates relations for provided entity.
func (h *MasterDataHandler) replaceCatalogLinks(c *fiber.Ctx) error {
	leftType := c.Params("leftType")
	leftID, err := parseUUIDParam(c, "leftID")
	if err != nil {
		return err
	}
	var req []catalogLinkRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
	}

	links := make([]entity.CatalogLink, 0, len(req))
	for _, r := range req {
		link, err := r.toEntity(leftType, leftID)
		if err != nil {
			return fiber.NewError(fiber.StatusBadRequest, err.Error())
		}
		links = append(links, link)
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	if err := h.service.ReplaceCatalogLinks(ctx, leftType, leftID, links); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// listWarehouses returns warehouses.
func (h *MasterDataHandler) listWarehouses(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	warehouses, err := h.service.ListWarehouses(ctx)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(fiber.Map{"items": warehouses})
}

// getWarehouse returns warehouse details.
func (h *MasterDataHandler) getWarehouse(c *fiber.Ctx) error {
	warehouseID, err := parseUUIDParam(c, "warehouseID")
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	details, err := h.service.GetWarehouseDetails(ctx, warehouseID)
	if err != nil {
		switch err {
		case service.ErrWarehouseNotFound():
			return fiber.NewError(fiber.StatusNotFound, "warehouse not found")
		default:
			return fiber.NewError(fiber.StatusInternalServerError, err.Error())
		}
	}

	return c.JSON(details)
}

// createWarehouse handles warehouse creation.
func (h *MasterDataHandler) createWarehouse(c *fiber.Ctx) error {
	var req warehouseRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
	}

	model := req.toEntity()
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	warehouse, err := h.service.CreateWarehouse(ctx, model)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(warehouse)
}

// updateWarehouse updates warehouse info.
func (h *MasterDataHandler) updateWarehouse(c *fiber.Ctx) error {
	warehouseID, err := parseUUIDParam(c, "warehouseID")
	if err != nil {
		return err
	}

	var req warehouseRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
	}

	model := req.toEntity()
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	warehouse, err := h.service.UpdateWarehouse(ctx, warehouseID, model)
	if err != nil {
		if err == service.ErrWarehouseNotFound() {
			return fiber.NewError(fiber.StatusNotFound, "warehouse not found")
		}
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.JSON(warehouse)
}

// deleteWarehouse deletes warehouse.
func (h *MasterDataHandler) deleteWarehouse(c *fiber.Ctx) error {
	warehouseID, err := parseUUIDParam(c, "warehouseID")
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	if err := h.service.DeleteWarehouse(ctx, warehouseID); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *MasterDataHandler) listZones(c *fiber.Ctx) error {
	warehouseID, err := parseUUIDParam(c, "warehouseID")
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	zones, err := h.service.ListZones(ctx, warehouseID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(fiber.Map{"items": zones})
}

func (h *MasterDataHandler) createZone(c *fiber.Ctx) error {
	warehouseID, err := parseUUIDParam(c, "warehouseID")
	if err != nil {
		return err
	}

	var req zoneRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	zone, err := h.service.CreateZone(ctx, warehouseID, req.toEntity())
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(zone)
}

func (h *MasterDataHandler) updateZone(c *fiber.Ctx) error {
	warehouseID, err := parseUUIDParam(c, "warehouseID")
	if err != nil {
		return err
	}
	zoneID, err := parseUUIDParam(c, "zoneID")
	if err != nil {
		return err
	}

	var req zoneRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	zone, err := h.service.UpdateZone(ctx, warehouseID, zoneID, req.toEntity())
	if err != nil {
		if err == service.ErrZoneNotFound() {
			return fiber.NewError(fiber.StatusNotFound, "zone not found")
		}
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.JSON(zone)
}

func (h *MasterDataHandler) deleteZone(c *fiber.Ctx) error {
	warehouseID, err := parseUUIDParam(c, "warehouseID")
	if err != nil {
		return err
	}
	zoneID, err := parseUUIDParam(c, "zoneID")
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	if err := h.service.DeleteZone(ctx, warehouseID, zoneID); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *MasterDataHandler) listCells(c *fiber.Ctx) error {
	warehouseID, err := parseUUIDParam(c, "warehouseID")
	if err != nil {
		return err
	}
	zoneID, err := parseUUIDParam(c, "zoneID")
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	cells, err := h.service.ListCells(ctx, warehouseID, zoneID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(fiber.Map{"items": cells})
}

func (h *MasterDataHandler) createCell(c *fiber.Ctx) error {
	warehouseID, err := parseUUIDParam(c, "warehouseID")
	if err != nil {
		return err
	}
	zoneID, err := parseUUIDParam(c, "zoneID")
	if err != nil {
		return err
	}

	var req cellRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
	}

	model := req.toEntity()
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	cell, err := h.service.CreateCell(ctx, warehouseID, zoneID, model)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(cell)
}

func (h *MasterDataHandler) updateCell(c *fiber.Ctx) error {
	warehouseID, err := parseUUIDParam(c, "warehouseID")
	if err != nil {
		return err
	}
	zoneID, err := parseUUIDParam(c, "zoneID")
	if err != nil {
		return err
	}
	cellID, err := parseUUIDParam(c, "cellID")
	if err != nil {
		return err
	}

	var req cellRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	cell, err := h.service.UpdateCell(ctx, warehouseID, zoneID, cellID, req.toEntity())
	if err != nil {
		if err == service.ErrCellNotFound() {
			return fiber.NewError(fiber.StatusNotFound, "cell not found")
		}
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.JSON(cell)
}

func (h *MasterDataHandler) deleteCell(c *fiber.Ctx) error {
	warehouseID, err := parseUUIDParam(c, "warehouseID")
	if err != nil {
		return err
	}
	zoneID, err := parseUUIDParam(c, "zoneID")
	if err != nil {
		return err
	}
	cellID, err := parseUUIDParam(c, "cellID")
	if err != nil {
		return err
	}

	actorID := uuid.Nil
	if actor := c.Query("actorId"); actor != "" {
		if parsed, err := uuid.Parse(actor); err == nil {
			actorID = parsed
		}
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	if err := h.service.DeleteCell(ctx, warehouseID, zoneID, cellID, actorID); err != nil {
		if err == service.ErrCellNotFound() {
			return fiber.NewError(fiber.StatusNotFound, "cell not found")
		}
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *MasterDataHandler) listEquipment(c *fiber.Ctx) error {
	warehouseID, err := parseUUIDParam(c, "warehouseID")
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	equipment, err := h.service.ListEquipment(ctx, warehouseID)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}
	return c.JSON(fiber.Map{"items": equipment})
}

func (h *MasterDataHandler) createEquipment(c *fiber.Ctx) error {
	warehouseID, err := parseUUIDParam(c, "warehouseID")
	if err != nil {
		return err
	}

	var req equipmentRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
	}
	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	equipment, err := h.service.CreateEquipment(ctx, warehouseID, req.toEntity())
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.Status(fiber.StatusCreated).JSON(equipment)
}

func (h *MasterDataHandler) updateEquipment(c *fiber.Ctx) error {
	warehouseID, err := parseUUIDParam(c, "warehouseID")
	if err != nil {
		return err
	}
	equipmentID, err := parseUUIDParam(c, "equipmentID")
	if err != nil {
		return err
	}

	var req equipmentRequest
	if err := c.BodyParser(&req); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "invalid payload")
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	equipment, err := h.service.UpdateEquipment(ctx, warehouseID, equipmentID, req.toEntity())
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	return c.JSON(equipment)
}

func (h *MasterDataHandler) deleteEquipment(c *fiber.Ctx) error {
	warehouseID, err := parseUUIDParam(c, "warehouseID")
	if err != nil {
		return err
	}
	equipmentID, err := parseUUIDParam(c, "equipmentID")
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	if err := h.service.DeleteEquipment(ctx, warehouseID, equipmentID); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *MasterDataHandler) assignEquipment(c *fiber.Ctx) error {
	cellID, err := parseUUIDParam(c, "cellID")
	if err != nil {
		return err
	}
	equipmentID, err := parseUUIDParam(c, "equipmentID")
	if err != nil {
		return err
	}

	actorID := uuid.Nil
	if actor := c.Query("actorId"); actor != "" {
		if parsed, err := uuid.Parse(actor); err == nil {
			actorID = parsed
		}
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	if err := h.service.AssignEquipment(ctx, cellID, equipmentID, actorID); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *MasterDataHandler) unassignEquipment(c *fiber.Ctx) error {
	cellID, err := parseUUIDParam(c, "cellID")
	if err != nil {
		return err
	}
	equipmentID, err := parseUUIDParam(c, "equipmentID")
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	if err := h.service.UnassignEquipment(ctx, cellID, equipmentID); err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.SendStatus(fiber.StatusNoContent)
}

func (h *MasterDataHandler) cellHistory(c *fiber.Ctx) error {
	cellID, err := parseUUIDParam(c, "cellID")
	if err != nil {
		return err
	}
	limit := c.QueryInt("limit", 50)

	ctx, cancel := context.WithTimeout(c.Context(), 5*time.Second)
	defer cancel()

	history, err := h.service.ListCellHistory(ctx, cellID, limit)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.JSON(fiber.Map{"items": history})
}

// catalogNodeRequest describes catalog node payload.
type catalogNodeRequest struct {
	ParentID    string         `json:"parentId"`
	Code        string         `json:"code"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	SortOrder   *int           `json:"sortOrder"`
	IsActive    *bool          `json:"isActive"`
	Metadata    map[string]any `json:"metadata"`
}

func (r catalogNodeRequest) toEntity() (entity.CatalogNode, error) {
	node := entity.CatalogNode{
		Code:     strings.TrimSpace(r.Code),
		Name:     strings.TrimSpace(r.Name),
		Metadata: r.Metadata,
	}
	if node.Metadata == nil {
		node.Metadata = map[string]any{}
	}
	if r.SortOrder != nil {
		node.SortOrder = *r.SortOrder
	}
	if r.IsActive != nil {
		node.IsActive = *r.IsActive
	} else {
		node.IsActive = true
	}
	node.Description = strings.TrimSpace(r.Description)
	if parent := strings.TrimSpace(r.ParentID); parent != "" {
		id, err := uuid.Parse(parent)
		if err != nil {
			return entity.CatalogNode{}, fmt.Errorf("invalid parentId")
		}
		node.ParentID = &id
	}
	return node, nil
}

// attributeValueRequest describes dynamic attribute input.
type attributeValueRequest struct {
	TemplateID string         `json:"templateId"`
	String     *string        `json:"stringValue"`
	Number     *float64       `json:"numberValue"`
	Boolean    *bool          `json:"booleanValue"`
	JSON       map[string]any `json:"jsonValue"`
}

func (r attributeValueRequest) toUpsert() (entity.AttributeValueUpsert, error) {
	id, err := uuid.Parse(strings.TrimSpace(r.TemplateID))
	if err != nil {
		return entity.AttributeValueUpsert{}, fmt.Errorf("invalid attribute templateId")
	}
	return entity.AttributeValueUpsert{
		TemplateID: id,
		String:     r.String,
		Number:     r.Number,
		Boolean:    r.Boolean,
		JSON:       r.JSON,
	}, nil
}

// catalogLinkRequest describes catalog relation payload.
type catalogLinkRequest struct {
	RightID      string         `json:"rightId"`
	RightType    string         `json:"rightType"`
	RelationCode string         `json:"relationCode"`
	Metadata     map[string]any `json:"metadata"`
}

func (r catalogLinkRequest) toEntity(leftType string, leftID uuid.UUID) (entity.CatalogLink, error) {
	if strings.TrimSpace(r.RelationCode) == "" {
		return entity.CatalogLink{}, fmt.Errorf("relationCode is required")
	}
	rightID, err := uuid.Parse(strings.TrimSpace(r.RightID))
	if err != nil {
		return entity.CatalogLink{}, fmt.Errorf("invalid rightId")
	}
	metadata := r.Metadata
	if metadata == nil {
		metadata = map[string]any{}
	}
	return entity.CatalogLink{
		LeftID:       leftID,
		LeftType:     strings.TrimSpace(leftType),
		RightID:      rightID,
		RightType:    strings.TrimSpace(r.RightType),
		RelationCode: strings.TrimSpace(r.RelationCode),
		Metadata:     metadata,
	}, nil
}

// itemRequest describes item payload with dynamic attributes.
type itemRequest struct {
	SKU          string                  `json:"sku"`
	Name         string                  `json:"name"`
	Description  string                  `json:"description"`
	CategoryID   string                  `json:"categoryId"`
	UnitID       string                  `json:"unitId"`
	Barcode      string                  `json:"barcode"`
	WeightKg     *float64                `json:"weightKg"`
	VolumeM3     *float64                `json:"volumeM3"`
	WarehouseIDs []string                `json:"warehouseIds"`
	Metadata     map[string]any          `json:"metadata"`
	Attributes   []attributeValueRequest `json:"attributes"`
	ActorID      string                  `json:"actorId"`
}

func (r itemRequest) toEntity() (entity.Item, []entity.AttributeValueUpsert, error) {
	unitID, err := uuid.Parse(strings.TrimSpace(r.UnitID))
	if err != nil {
		return entity.Item{}, nil, fmt.Errorf("invalid unitId")
	}

	var categoryID *uuid.UUID
	if raw := strings.TrimSpace(r.CategoryID); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			return entity.Item{}, nil, fmt.Errorf("invalid categoryId")
		}
		categoryID = &id
	}

	warehouses := make([]uuid.UUID, 0, len(r.WarehouseIDs))
	for _, raw := range r.WarehouseIDs {
		raw = strings.TrimSpace(raw)
		if raw == "" {
			continue
		}
		id, err := uuid.Parse(raw)
		if err != nil {
			return entity.Item{}, nil, fmt.Errorf("invalid warehouseId: %s", raw)
		}
		warehouses = append(warehouses, id)
	}

	attrs := make([]entity.AttributeValueUpsert, 0, len(r.Attributes))
	for _, attrReq := range r.Attributes {
		upsert, err := attrReq.toUpsert()
		if err != nil {
			return entity.Item{}, nil, err
		}
		attrs = append(attrs, upsert)
	}

	metadata := r.Metadata
	if metadata == nil {
		metadata = map[string]any{}
	}

	item := entity.Item{
		SKU:         strings.TrimSpace(r.SKU),
		Name:        strings.TrimSpace(r.Name),
		Description: strings.TrimSpace(r.Description),
		UnitID:      unitID,
		Barcode:     strings.TrimSpace(r.Barcode),
		WeightKG:    r.WeightKg,
		VolumeM3:    r.VolumeM3,
		Metadata:    metadata,
		Warehouses:  warehouses,
	}
	if categoryID != nil {
		item.CategoryID = categoryID
	}
	if actorID := strings.TrimSpace(r.ActorID); actorID != "" {
		if actor, err := uuid.Parse(actorID); err == nil {
			item.CreatedBy = &actor
			item.UpdatedBy = &actor
		}
	}

	return item, attrs, nil
}

// warehouseRequest describes payload for warehouse operations.
type warehouseRequest struct {
	Code           string                  `json:"code"`
	Name           string                  `json:"name"`
	Description    string                  `json:"description"`
	Address        entity.WarehouseAddress `json:"address"`
	Timezone       string                  `json:"timezone"`
	Status         string                  `json:"status"`
	OperatingHours map[string]string       `json:"operatingHours"`
	Contact        entity.WarehouseContact `json:"contact"`
	Metadata       map[string]any          `json:"metadata"`
}

func (r warehouseRequest) toEntity() entity.Warehouse {
	return entity.Warehouse{
		Code:           r.Code,
		Name:           r.Name,
		Description:    r.Description,
		Address:        r.Address,
		Timezone:       r.Timezone,
		Status:         r.Status,
		OperatingHours: entity.WarehouseOperatingHours{Weekdays: r.OperatingHours},
		Contact:        r.Contact,
		Metadata:       r.Metadata,
	}
}

// zoneRequest describes zone payload.
type zoneRequest struct {
	Code               string         `json:"code"`
	Name               string         `json:"name"`
	ZoneType           string         `json:"zoneType"`
	IsBuffer           bool           `json:"isBuffer"`
	TemperatureMin     *float64       `json:"temperatureMin"`
	TemperatureMax     *float64       `json:"temperatureMax"`
	HazardClass        string         `json:"hazardClass"`
	AccessRestrictions []string       `json:"accessRestrictions"`
	Layout             map[string]any `json:"layout"`
	Metadata           map[string]any `json:"metadata"`
}

func (r zoneRequest) toEntity() entity.WarehouseZone {
	return entity.WarehouseZone{
		Code:               r.Code,
		Name:               r.Name,
		ZoneType:           r.ZoneType,
		IsBuffer:           r.IsBuffer,
		TemperatureMin:     r.TemperatureMin,
		TemperatureMax:     r.TemperatureMax,
		HazardClass:        r.HazardClass,
		AccessRestrictions: r.AccessRestrictions,
		Layout:             r.Layout,
		Metadata:           r.Metadata,
	}
}

// cellRequest describes cell payload.
type cellRequest struct {
	Code            string         `json:"code"`
	Label           string         `json:"label"`
	Address         map[string]any `json:"address"`
	CellType        string         `json:"cellType"`
	Status          string         `json:"status"`
	IsPickFace      bool           `json:"isPickFace"`
	LengthMM        *int           `json:"lengthMm"`
	WidthMM         *int           `json:"widthMm"`
	HeightMM        *int           `json:"heightMm"`
	MaxWeightKG     *float64       `json:"maxWeightKg"`
	MaxVolumeL      *float64       `json:"maxVolumeL"`
	AllowedHandling []string       `json:"allowedHandling"`
	TemperatureMin  *float64       `json:"temperatureMin"`
	TemperatureMax  *float64       `json:"temperatureMax"`
	HazardClasses   []string       `json:"hazardClasses"`
	Metadata        map[string]any `json:"metadata"`
	ActorID         string         `json:"actorId"`
}

func (r cellRequest) toEntity() entity.WarehouseCell {
	var createdBy uuid.UUID
	if id, err := uuid.Parse(strings.TrimSpace(r.ActorID)); err == nil {
		createdBy = id
	}
	return entity.WarehouseCell{
		Code:            r.Code,
		Label:           r.Label,
		Address:         r.Address,
		CellType:        r.CellType,
		Status:          r.Status,
		IsPickFace:      r.IsPickFace,
		LengthMM:        r.LengthMM,
		WidthMM:         r.WidthMM,
		HeightMM:        r.HeightMM,
		MaxWeightKG:     r.MaxWeightKG,
		MaxVolumeL:      r.MaxVolumeL,
		AllowedHandling: r.AllowedHandling,
		TemperatureMin:  r.TemperatureMin,
		TemperatureMax:  r.TemperatureMax,
		HazardClasses:   r.HazardClasses,
		Metadata:        r.Metadata,
		CreatedBy:       createdBy,
		UpdatedBy:       createdBy,
	}
}

// equipmentRequest describes equipment payload.
type equipmentRequest struct {
	Code          string         `json:"code"`
	Name          string         `json:"name"`
	EquipmentType string         `json:"type"`
	Status        string         `json:"status"`
	Manufacturer  string         `json:"manufacturer"`
	SerialNumber  string         `json:"serialNumber"`
	Commissioning *time.Time     `json:"commissioningDate"`
	Metadata      map[string]any `json:"metadata"`
	ActorID       string         `json:"actorId"`
}

func (r equipmentRequest) toEntity() entity.WarehouseEquipment {
	var actor uuid.UUID
	if id, err := uuid.Parse(strings.TrimSpace(r.ActorID)); err == nil {
		actor = id
	}
	return entity.WarehouseEquipment{
		Code:          r.Code,
		Name:          r.Name,
		EquipmentType: r.EquipmentType,
		Status:        r.Status,
		Manufacturer:  r.Manufacturer,
		SerialNumber:  r.SerialNumber,
		Commissioning: r.Commissioning,
		Metadata:      r.Metadata,
		CreatedBy:     actor,
		UpdatedBy:     actor,
	}
}

func parseUUIDParam(c *fiber.Ctx, name string) (uuid.UUID, error) {
	value := c.Params(name)
	id, err := uuid.Parse(value)
	if err != nil {
		return uuid.Nil, fiber.NewError(fiber.StatusBadRequest, "invalid "+name)
	}
	return id, nil
}
