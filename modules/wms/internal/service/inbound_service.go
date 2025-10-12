package service

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog"

	"asfppro/modules/wms/internal/entity"
	"asfppro/modules/wms/internal/repository"
	"asfppro/pkg/audit"
	"asfppro/pkg/identifier"
)

var (
	errNoReceiptLines       = errors.New("at least one line is required")
	errWarehouseRequired    = errors.New("warehouseId is required")
	errSupplierNameRequired = errors.New("supplierName is required")
)

// InboundService orchestrates inbound receipt operations.
type InboundService struct {
	repo    *repository.InboundRepository
	auditor *audit.Recorder
	logger  zerolog.Logger
}

// NewInboundService builds inbound service.
func NewInboundService(repo *repository.InboundRepository, auditor *audit.Recorder, logger zerolog.Logger) *InboundService {
	return &InboundService{
		repo:    repo,
		auditor: auditor,
		logger:  logger.With().Str("component", "wms.inbound").Logger(),
	}
}

// ListReceipts returns receipts using provided filter.
func (s *InboundService) ListReceipts(ctx context.Context, filter entity.ReceiptFilter) ([]entity.Receipt, error) {
	return s.repo.ListReceipts(ctx, filter)
}

// GetReceipt returns receipt with lines.
func (s *InboundService) GetReceipt(ctx context.Context, id uuid.UUID) (entity.ReceiptDetails, error) {
	receipt, err := s.repo.GetReceipt(ctx, id)
	if err != nil {
		return entity.ReceiptDetails{}, err
	}
	return receipt, nil
}

// CreateReceipt stores new receipt.
func (s *InboundService) CreateReceipt(ctx context.Context, input entity.ReceiptInput) (entity.ReceiptDetails, error) {
	id := uuid.New()
	receipt, lines, err := s.normalizeInput(ctx, id, input, nil)
	if err != nil {
		return entity.ReceiptDetails{}, err
	}

	details, err := s.repo.CreateReceipt(ctx, receipt, lines)
	if err != nil {
		return entity.ReceiptDetails{}, err
	}

	s.recordAudit(ctx, receipt.CreatedBy, "wms.receipt.create", details.ID.String(), details)
	return details, nil
}

// UpdateReceipt updates existing receipt.
func (s *InboundService) UpdateReceipt(ctx context.Context, id uuid.UUID, input entity.ReceiptInput) (entity.ReceiptDetails, error) {
	existing, err := s.repo.GetReceipt(ctx, id)
	if err != nil {
		return entity.ReceiptDetails{}, err
	}

	receipt, lines, err := s.normalizeInput(ctx, id, input, &existing)
	if err != nil {
		return entity.ReceiptDetails{}, err
	}

	details, err := s.repo.UpdateReceipt(ctx, receipt, lines)
	if err != nil {
		return entity.ReceiptDetails{}, err
	}

	s.recordAudit(ctx, receipt.UpdatedBy, "wms.receipt.update", details.ID.String(), details)
	return details, nil
}

// DeleteReceipt removes receipt from storage.
func (s *InboundService) DeleteReceipt(ctx context.Context, id uuid.UUID, actor *uuid.UUID) error {
	if err := s.repo.DeleteReceipt(ctx, id); err != nil {
		return err
	}
	s.recordAudit(ctx, actor, "wms.receipt.delete", id.String(), nil)
	return nil
}

func (s *InboundService) normalizeInput(
	ctx context.Context,
	id uuid.UUID,
	input entity.ReceiptInput,
	existing *entity.ReceiptDetails,
) (entity.Receipt, []entity.ReceiptLine, error) {
	if id == uuid.Nil {
		id = uuid.New()
	}
	if input.WarehouseID == uuid.Nil {
		return entity.Receipt{}, nil, errWarehouseRequired
	}
	input.SupplierName = strings.TrimSpace(input.SupplierName)
	if input.SupplierName == "" {
		return entity.Receipt{}, nil, errSupplierNameRequired
	}
	if len(input.Lines) == 0 {
		return entity.Receipt{}, nil, errNoReceiptLines
	}

	code := strings.TrimSpace(input.Code)
	if code == "" {
		code = identifier.WithPrefix("RCPT")
	}

	const defaultStatus = "completed"
	status := defaultStatus

	currency := strings.TrimSpace(strings.ToUpper(input.Currency))
	if currency == "" {
		currency = "RUB"
	}

	notes := strings.TrimSpace(input.Notes)

	itemIDs := make([]uuid.UUID, 0, len(input.Lines))
	unitCandidates := make(map[uuid.UUID]struct{}, len(input.Lines))
	for _, line := range input.Lines {
		if line.ItemID == uuid.Nil {
			return entity.Receipt{}, nil, fmt.Errorf("line itemId is required")
		}
		itemIDs = append(itemIDs, line.ItemID)
		if line.UnitID != uuid.Nil {
			unitCandidates[line.UnitID] = struct{}{}
		}
	}

	itemCtx, err := s.repo.LoadItemsContext(ctx, dedupeUUIDs(itemIDs))
	if err != nil {
		return entity.Receipt{}, nil, err
	}
	for _, line := range input.Lines {
		if _, ok := itemCtx[line.ItemID]; !ok {
			return entity.Receipt{}, nil, fmt.Errorf("item %s not found", line.ItemID)
		}
	}

	unitIDs := make([]uuid.UUID, 0, len(unitCandidates))
	for id := range unitCandidates {
		unitIDs = append(unitIDs, id)
	}
	unitCodes, err := s.repo.LoadUnitCodes(ctx, unitIDs)
	if err != nil {
		return entity.Receipt{}, nil, err
	}

	lines := make([]entity.ReceiptLine, 0, len(input.Lines))
	var (
		totalNet float64
		totalVat float64
	)

	for idx, raw := range input.Lines {
		context := itemCtx[raw.ItemID]
		line := entity.ReceiptLine{
			ItemID: raw.ItemID,
		}

		if raw.ID != nil && *raw.ID != uuid.Nil {
			line.ID = *raw.ID
		} else {
			line.ID = uuid.New()
		}

		quantity := raw.Quantity
		if quantity <= 0 {
			return entity.Receipt{}, nil, fmt.Errorf("line %d quantity must be > 0", idx+1)
		}
		line.Quantity = quantity

		expected := quantity
		if raw.ExpectedQuantity != nil && *raw.ExpectedQuantity > 0 {
			expected = *raw.ExpectedQuantity
		}
		line.ExpectedQuantity = expected

		received := quantity
		if raw.ReceivedQuantity != nil && *raw.ReceivedQuantity > 0 {
			received = *raw.ReceivedQuantity
		}
		line.ReceivedQuantity = received

		cost := raw.UnitCost
		if cost < 0 {
			return entity.Receipt{}, nil, fmt.Errorf("line %d unitCost must be >= 0", idx+1)
		}
		line.UnitCost = round(cost, 4)

		if raw.VatRate != nil {
			if *raw.VatRate < 0 {
				return entity.Receipt{}, nil, fmt.Errorf("line %d vatRate must be >= 0", idx+1)
			}
			rate := round(*raw.VatRate, 2)
			line.VatRate = &rate
		}

		unitID := context.UnitID
		unitCode := context.UnitCode
		if raw.UnitID != uuid.Nil {
			unitID = raw.UnitID
			if code, ok := unitCodes[unitID]; ok {
				unitCode = code
			} else if context.UnitID == unitID {
				unitCode = context.UnitCode
			} else {
				return entity.Receipt{}, nil, fmt.Errorf("unit %s not found for line %d", unitID, idx+1)
			}
		}
		line.UnitID = unitID
		line.UnitCode = unitCode

		line.SKU = context.SKU
		line.ItemName = context.Name

		if batch := strings.TrimSpace(raw.BatchNumber); batch != "" {
			line.BatchNumber = batch
		}
		line.ProductionDate = normalizeDate(raw.ProductionDate)
		line.ExpirationDate = normalizeDate(raw.ExpirationDate)
		line.Metadata = ensureMetadata(raw.Metadata)

		gross := round(received*line.UnitCost, 2)
		net := gross
		vat := 0.0
		if line.VatRate != nil && *line.VatRate > 0 {
			divisor := 1 + (*line.VatRate / 100)
			net = round(gross/divisor, 2)
			vat = round(gross-net, 2)
		}
		line.VatAmount = vat
		line.TotalCost = gross

		totalNet += net
		totalVat += vat

		lines = append(lines, line)
	}

	totalAmount := round(totalNet+totalVat, 2)

	receipt := entity.Receipt{
		ID:                id,
		Code:              code,
		ExternalReference: strings.TrimSpace(input.ExternalReference),
		Status:            status,
		WarehouseID:       input.WarehouseID,
		SupplierID:        input.SupplierID,
		SupplierName:      input.SupplierName,
		SupplierInn:       strings.TrimSpace(input.SupplierInn),
		Currency:          currency,
		ExpectedAt:        normalizeTime(input.ExpectedAt),
		ReceivedAt:        normalizeTime(input.ReceivedAt),
		TotalAmount:       totalAmount,
		TotalVat:          round(totalVat, 2),
		LinesCount:        len(lines),
		Notes:             notes,
		Metadata:          ensureMetadata(input.Metadata),
	}

	actor := input.ActorID
	if existing == nil {
		receipt.CreatedBy = actor
		receipt.UpdatedBy = actor
	} else {
		receipt.CreatedBy = existing.CreatedBy
		receipt.UpdatedBy = actor
	}

	return receipt, lines, nil
}

func normalizeTime(value *time.Time) *time.Time {
	if value == nil {
		return nil
	}
	t := value.UTC()
	return &t
}

func normalizeDate(value *time.Time) *time.Time {
	if value == nil {
		return nil
	}
	t := value.UTC().Truncate(24 * time.Hour)
	return &t
}

func ensureMetadata(meta map[string]any) map[string]any {
	if meta == nil {
		return map[string]any{}
	}
	return meta
}

func round(value float64, precision int) float64 {
	factor := math.Pow(10, float64(precision))
	return math.Round(value*factor) / factor
}

func dedupeUUIDs(values []uuid.UUID) []uuid.UUID {
	seen := make(map[uuid.UUID]struct{}, len(values))
	result := make([]uuid.UUID, 0, len(values))
	for _, id := range values {
		if id == uuid.Nil {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		result = append(result, id)
	}
	return result
}

func (s *InboundService) recordAudit(ctx context.Context, actor *uuid.UUID, action, entityID string, payload any) {
	if s.auditor == nil {
		return
	}

	var actorID uuid.UUID
	if actor != nil {
		actorID = *actor
	}

	entry := audit.Entry{
		ActorID:  actorID,
		Action:   action,
		Entity:   "wms.receipt",
		EntityID: entityID,
		Payload:  payload,
	}
	if err := s.auditor.Record(ctx, entry); err != nil {
		s.logger.Error().Err(err).Msg("record receipt audit")
	}
}
