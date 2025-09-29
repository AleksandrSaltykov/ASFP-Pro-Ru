package audit

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
)

var (
	// ErrRecorderNotConfigured indicates missing database connection.
	ErrRecorderNotConfigured = errors.New("audit recorder not configured")
	// ErrInvalidEntry indicates required fields are missing.
	ErrInvalidEntry = errors.New("invalid audit entry")
)

// Entry describes payload to persist in audit_log.
type Entry struct {
	ActorID  uuid.UUID
	Action   string
	Entity   string
	EntityID string
	Payload  any
}

// Filter narrows audit log queries.
type Filter struct {
	ActorID      uuid.UUID
	Action       string
	Entity       string
	EntityID     string
	AfterID      int64
	Limit        int
	OccurredFrom *time.Time
	OccurredTo   *time.Time
}

// Record represents stored audit log row.
type Record struct {
	ID         int64           `json:"id"`
	OccurredAt time.Time       `json:"occurredAt"`
	ActorID    *uuid.UUID      `json:"actorId,omitempty"`
	Action     string          `json:"action"`
	Entity     string          `json:"entity"`
	EntityID   *string         `json:"entityId,omitempty"`
	Payload    json.RawMessage `json:"payload,omitempty"`
}

type execQuerier interface {
	Exec(context.Context, string, ...any) (pgconn.CommandTag, error)
	Query(context.Context, string, ...any) (pgx.Rows, error)
}

// Recorder encapsulates audit log persistence and retrieval.
type Recorder struct {
	db     execQuerier
	logger *zerolog.Logger
}

// NewRecorder constructs Recorder bound to pgx pool.
func NewRecorder(pool *pgxpool.Pool, logger zerolog.Logger) *Recorder {
	return NewRecorderWithDB(pool, logger)
}

// NewRecorderWithDB constructs Recorder for custom Exec/Query provider.
func NewRecorderWithDB(db execQuerier, logger zerolog.Logger) *Recorder {
	l := logger.With().Str("component", "audit").Logger()
	return &Recorder{db: db, logger: &l}
}

// Record persists audit entry in core.audit_log.
func (r *Recorder) Record(ctx context.Context, entry Entry) error {
	if r == nil || r.db == nil {
		return ErrRecorderNotConfigured
	}

	if err := validateEntry(entry); err != nil {
		return err
	}

	payload, err := marshalPayload(entry.Payload)
	if err != nil {
		r.logError("marshal payload", err)
	}

	const query = `INSERT INTO core.audit_log (actor_id, action, entity, entity_id, payload)
VALUES ($1, $2, $3, $4, $5)`

	_, execErr := r.db.Exec(ctx, query,
		nullUUID(entry.ActorID),
		strings.TrimSpace(entry.Action),
		strings.TrimSpace(entry.Entity),
		nullString(entry.EntityID),
		payload,
	)
	if execErr != nil {
		r.logError("insert audit log", execErr)
		return fmt.Errorf("insert audit log: %w", execErr)
	}

	return nil
}

// List returns audit records ordered by newest first.
func (r *Recorder) List(ctx context.Context, filter Filter) ([]Record, error) {
	if r == nil || r.db == nil {
		return nil, ErrRecorderNotConfigured
	}

	limit := filter.Limit
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}

	var (
		clauses []string
		args    []any
		idx     = 1
	)

	if filter.ActorID != uuid.Nil {
		clauses = append(clauses, fmt.Sprintf("actor_id = $%d", idx))
		args = append(args, filter.ActorID)
		idx++
	}
	if action := strings.TrimSpace(filter.Action); action != "" {
		clauses = append(clauses, fmt.Sprintf("action = $%d", idx))
		args = append(args, action)
		idx++
	}
	if entity := strings.TrimSpace(filter.Entity); entity != "" {
		clauses = append(clauses, fmt.Sprintf("entity = $%d", idx))
		args = append(args, entity)
		idx++
	}
	if entityID := strings.TrimSpace(filter.EntityID); entityID != "" {
		clauses = append(clauses, fmt.Sprintf("entity_id = $%d", idx))
		args = append(args, entityID)
		idx++
	}
	if filter.AfterID > 0 {
		clauses = append(clauses, fmt.Sprintf("id < $%d", idx))
		args = append(args, filter.AfterID)
		idx++
	}
	if filter.OccurredFrom != nil {
		clauses = append(clauses, fmt.Sprintf("occurred_at >= $%d", idx))
		args = append(args, *filter.OccurredFrom)
		idx++
	}
	if filter.OccurredTo != nil {
		clauses = append(clauses, fmt.Sprintf("occurred_at <= $%d", idx))
		args = append(args, *filter.OccurredTo)
		idx++
	}

	query := `SELECT id, occurred_at, actor_id, action, entity, entity_id, payload FROM core.audit_log`
	if len(clauses) > 0 {
		query += " WHERE " + strings.Join(clauses, " AND ")
	}
	query += fmt.Sprintf(" ORDER BY occurred_at DESC, id DESC LIMIT $%d", idx)
	args = append(args, limit)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query audit log: %w", err)
	}
	defer rows.Close()

	var records []Record
	for rows.Next() {
		var (
			record   Record
			actorID  pgtype.UUID
			entityID sql.NullString
			payload  []byte
		)

		if err := rows.Scan(&record.ID, &record.OccurredAt, &actorID, &record.Action, &record.Entity, &entityID, &payload); err != nil {
			return nil, fmt.Errorf("scan audit log: %w", err)
		}

		if actorID.Valid {
			id := uuid.UUID(actorID.Bytes)
			record.ActorID = &id
		}
		if entityID.Valid {
			value := entityID.String
			record.EntityID = &value
		}
		if len(payload) > 0 {
			record.Payload = json.RawMessage(payload)
		}

		records = append(records, record)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("audit rows error: %w", err)
	}

	return records, nil
}

func validateEntry(entry Entry) error {
	if strings.TrimSpace(entry.Action) == "" || strings.TrimSpace(entry.Entity) == "" {
		return ErrInvalidEntry
	}
	return nil
}

func marshalPayload(payload any) ([]byte, error) {
	if payload == nil {
		return nil, nil
	}
	data, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	if string(data) == "null" {
		return nil, nil
	}
	return data, nil
}

func nullUUID(id uuid.UUID) any {
	if id == uuid.Nil {
		return nil
	}
	return id
}

func nullString(value string) any {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	return trimmed
}

func (r *Recorder) logError(message string, err error) {
	if r.logger == nil {
		return
	}
	r.logger.Error().Err(err).Msg(message)
}
