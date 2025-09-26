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
	Code           string         `json:"code"`
	Name           string         `json:"name"`
	EquipmentType  string         `json:"type"`
	Status         string         `json:"status"`
	Manufacturer   string         `json:"manufacturer"`
	SerialNumber   string         `json:"serialNumber"`
	Commissioning  *time.Time     `json:"commissioningDate"`
	Metadata       map[string]any `json:"metadata"`
	ActorID        string         `json:"actorId"`
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
		return uuid.Nil, fiber.NewError(fiber.StatusBadRequest, "invalid " + name)
	}
	return id, nil
}
