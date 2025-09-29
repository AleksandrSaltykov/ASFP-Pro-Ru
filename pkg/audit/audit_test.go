package audit

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/rs/zerolog"
)

type stubDB struct {
	execSQL  string
	execArgs []any
	execErr  error

	querySQL  string
	queryArgs []any
	rows      pgx.Rows
	queryErr  error
}

func (s *stubDB) Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error) {
	s.execSQL = sql
	s.execArgs = append([]any(nil), args...)
	if s.execErr != nil {
		return pgconn.CommandTag{}, s.execErr
	}
	return pgconn.NewCommandTag("INSERT 0 1"), nil
}

func (s *stubDB) Query(ctx context.Context, sql string, args ...any) (pgx.Rows, error) {
	s.querySQL = sql
	s.queryArgs = append([]any(nil), args...)
	if s.queryErr != nil {
		return nil, s.queryErr
	}
	return s.rows, nil
}

type fakeRow struct {
	id       int64
	occurred time.Time
	actor    pgtype.UUID
	action   string
	entity   string
	entityID sql.NullString
	payload  []byte
}

type fakeRows struct {
	rows []fakeRow
	idx  int
	err  error
}

func (r *fakeRows) Close() {}

func (r *fakeRows) Err() error { return r.err }

func (r *fakeRows) CommandTag() pgconn.CommandTag { return pgconn.CommandTag{} }

func (r *fakeRows) FieldDescriptions() []pgconn.FieldDescription { return nil }

func (r *fakeRows) Next() bool {
	if r.idx >= len(r.rows) {
		return false
	}
	r.idx++
	return true
}

func (r *fakeRows) Scan(dest ...any) error {
	if r.idx == 0 || r.idx > len(r.rows) {
		return fmt.Errorf("scan called without next")
	}
	row := r.rows[r.idx-1]
	if len(dest) != 7 {
		return fmt.Errorf("unexpected dest length: %d", len(dest))
	}
	if v, ok := dest[0].(*int64); ok {
		*v = row.id
	}
	if v, ok := dest[1].(*time.Time); ok {
		*v = row.occurred
	}
	if v, ok := dest[2].(*pgtype.UUID); ok {
		*v = row.actor
	}
	if v, ok := dest[3].(*string); ok {
		*v = row.action
	}
	if v, ok := dest[4].(*string); ok {
		*v = row.entity
	}
	if v, ok := dest[5].(*sql.NullString); ok {
		*v = row.entityID
	}
	if v, ok := dest[6].(*[]byte); ok {
		*v = append([]byte(nil), row.payload...)
	}
	return nil
}

func (r *fakeRows) Values() ([]any, error) { return nil, fmt.Errorf("not implemented") }

func (r *fakeRows) RawValues() [][]byte { return nil }

func (r *fakeRows) Conn() *pgx.Conn { return nil }

func TestRecorderRecord(t *testing.T) {
	db := &stubDB{}
	logger := zerolog.New(io.Discard)
	recorder := NewRecorderWithDB(db, logger)

	actorID := uuid.MustParse("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
	payload := map[string]any{"size": 123}

	if err := recorder.Record(context.Background(), Entry{
		ActorID:  actorID,
		Action:   "file.upload",
		Entity:   "file",
		EntityID: "uploads/sample.txt",
		Payload:  payload,
	}); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if db.execSQL != "INSERT INTO core.audit_log (actor_id, action, entity, entity_id, payload)\nVALUES ($1, $2, $3, $4, $5)" {
		t.Fatalf("unexpected exec sql: %s", db.execSQL)
	}

	if len(db.execArgs) != 5 {
		t.Fatalf("unexpected exec args len: %d", len(db.execArgs))
	}
	if got := db.execArgs[0]; got != actorID {
		t.Fatalf("unexpected actor arg: %#v", got)
	}
	if got := db.execArgs[1]; got != "file.upload" {
		t.Fatalf("unexpected action: %#v", got)
	}
	if got := db.execArgs[2]; got != "file" {
		t.Fatalf("unexpected entity: %#v", got)
	}
	if got := db.execArgs[3]; got != "uploads/sample.txt" {
		t.Fatalf("unexpected entity id: %#v", got)
	}
	if got, ok := db.execArgs[4].([]byte); !ok || string(got) != `{"size":123}` {
		t.Fatalf("unexpected payload arg: %#v", db.execArgs[4])
	}
}

func TestRecorderList(t *testing.T) {
	actorID := uuid.MustParse("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
	now := time.Now().UTC().Truncate(time.Second)

	rows := &fakeRows{
		rows: []fakeRow{
			{
				id:       10,
				occurred: now,
				actor:    pgtype.UUID{Bytes: actorID, Valid: true},
				action:   "crm.deal.create",
				entity:   "crm.deal",
				entityID: sql.NullString{String: "deal-1", Valid: true},
				payload:  json.RawMessage(`{"foo":"bar"}`),
			},
		},
	}

	db := &stubDB{rows: rows}
	logger := zerolog.New(io.Discard)
	recorder := NewRecorderWithDB(db, logger)

	records, err := recorder.List(context.Background(), Filter{ActorID: actorID, Limit: 20})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(records) != 1 {
		t.Fatalf("expected 1 record, got %d", len(records))
	}
	rec := records[0]
	if rec.ActorID == nil || *rec.ActorID != actorID {
		t.Fatalf("unexpected actor id: %+v", rec.ActorID)
	}
	if rec.EntityID == nil || *rec.EntityID != "deal-1" {
		t.Fatalf("unexpected entity id: %+v", rec.EntityID)
	}
	if string(rec.Payload) != `{"foo":"bar"}` {
		t.Fatalf("unexpected payload: %s", string(rec.Payload))
	}
}
