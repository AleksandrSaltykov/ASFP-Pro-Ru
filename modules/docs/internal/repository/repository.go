package repository

import (
	"context"
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

	"asfppro/modules/docs/internal/entity"
)

var (
	// ErrTemplateNotFound возникает, когда шаблон не найден.
	ErrTemplateNotFound = errors.New("template not found")
	// ErrSignerNotFound возникает, когда подписант не найден.
	ErrSignerNotFound = errors.New("signer not found")
	// ErrDocumentNotFound возникает, когда документ не найден.
	ErrDocumentNotFound = errors.New("document not found")
	// ErrSequenceNotFound возникает, когда номерная последовательность не найдена.
	ErrSequenceNotFound = errors.New("number sequence not found")
)

// Repository инкапсулирует доступ к таблицам домена Docs.
type Repository struct {
	pool *pgxpool.Pool
}

// New создаёт репозиторий.
func New(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// ListTemplates возвращает шаблоны документов.
func (r *Repository) ListTemplates(ctx context.Context, limit int) ([]entity.Template, error) {
	const query = `SELECT id, code, name, COALESCE(description, ''), version, body, created_at, updated_at FROM docs.template ORDER BY created_at DESC LIMIT $1`
	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("list templates: %w", err)
	}
	defer rows.Close()

	var items []entity.Template
	for rows.Next() {
		var tpl entity.Template
		var (
			id   uuid.UUID
			body []byte
		)
		if err := rows.Scan(&id, &tpl.Code, &tpl.Name, &tpl.Description, &tpl.Version, &body, &tpl.CreatedAt, &tpl.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan template: %w", err)
		}
		tpl.ID = id.String()
		tpl.Body = cloneJSON(body)
		items = append(items, tpl)
	}
	return items, rows.Err()
}

// CreateTemplate добавляет шаблон.
func (r *Repository) CreateTemplate(ctx context.Context, input entity.TemplateCreateInput) (entity.Template, error) {
	const query = `INSERT INTO docs.template (id, code, name, description, version, body)
VALUES ($1, $2, $3, NULLIF($4, ''), 1, $5)
RETURNING id, code, name, COALESCE(description, ''), version, body, created_at, updated_at`

	id := uuid.New()
	var tpl entity.Template
	var body []byte
	if err := r.pool.QueryRow(ctx, query, id, input.Code, input.Name, strings.TrimSpace(input.Description), ensureJSON(input.Body)).
		Scan(&id, &tpl.Code, &tpl.Name, &tpl.Description, &tpl.Version, &body, &tpl.CreatedAt, &tpl.UpdatedAt); err != nil {
		return entity.Template{}, fmt.Errorf("insert template: %w", err)
	}
	tpl.ID = id.String()
	tpl.Body = cloneJSON(body)
	return tpl, nil
}

// UpdateTemplate обновляет шаблон.
func (r *Repository) UpdateTemplate(ctx context.Context, id uuid.UUID, input entity.TemplateUpdateInput) (entity.Template, error) {
	parts := make([]string, 0, 4)
	args := make([]any, 0, 5)
	idx := 1

	if input.Name != nil {
		parts = append(parts, fmt.Sprintf("name = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Name))
		idx++
	}
	if input.Description != nil {
		desc := strings.TrimSpace(*input.Description)
		if desc == "" {
			parts = append(parts, "description = NULL")
		} else {
			parts = append(parts, fmt.Sprintf("description = $%d", idx))
			args = append(args, desc)
			idx++
		}
	}
	if input.Body != nil {
		parts = append(parts, fmt.Sprintf("body = $%d", idx))
		args = append(args, ensureJSON(*input.Body))
		idx++
	}
	if input.Version != nil {
		parts = append(parts, fmt.Sprintf("version = $%d", idx))
		args = append(args, *input.Version)
		idx++
	}

	if len(parts) == 0 {
		return r.getTemplate(ctx, id)
	}

	parts = append(parts, "updated_at = NOW()")
	query := fmt.Sprintf("UPDATE docs.template SET %s WHERE id = $%d RETURNING id, code, name, COALESCE(description, ''), version, body, created_at, updated_at", strings.Join(parts, ", "), idx)
	args = append(args, id)

	var tpl entity.Template
	var (
		retID uuid.UUID
		body  []byte
	)
	if err := r.pool.QueryRow(ctx, query, args...).Scan(&retID, &tpl.Code, &tpl.Name, &tpl.Description, &tpl.Version, &body, &tpl.CreatedAt, &tpl.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.Template{}, ErrTemplateNotFound
		}
		return entity.Template{}, fmt.Errorf("update template: %w", err)
	}
	tpl.ID = retID.String()
	tpl.Body = cloneJSON(body)
	return tpl, nil
}

func (r *Repository) getTemplate(ctx context.Context, id uuid.UUID) (entity.Template, error) {
	const query = `SELECT id, code, name, COALESCE(description, ''), version, body, created_at, updated_at FROM docs.template WHERE id = $1`
	var tpl entity.Template
	var (
		retID uuid.UUID
		body  []byte
	)
	if err := r.pool.QueryRow(ctx, query, id).Scan(&retID, &tpl.Code, &tpl.Name, &tpl.Description, &tpl.Version, &body, &tpl.CreatedAt, &tpl.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.Template{}, ErrTemplateNotFound
		}
		return entity.Template{}, fmt.Errorf("get template: %w", err)
	}
	tpl.ID = retID.String()
	tpl.Body = cloneJSON(body)
	return tpl, nil
}

// ListSigners возвращает подписантов.
func (r *Repository) ListSigners(ctx context.Context, limit int) ([]entity.Signer, error) {
	const query = `SELECT id, code, full_name, COALESCE(position, ''), COALESCE(email, ''), COALESCE(phone, ''), created_at, updated_at FROM docs.signer ORDER BY created_at DESC LIMIT $1`
	rows, err := r.pool.Query(ctx, query, limit)
	if err != nil {
		return nil, fmt.Errorf("list signers: %w", err)
	}
	defer rows.Close()

	var items []entity.Signer
	for rows.Next() {
		var signer entity.Signer
		var id uuid.UUID
		if err := rows.Scan(&id, &signer.Code, &signer.FullName, &signer.Position, &signer.Email, &signer.Phone, &signer.CreatedAt, &signer.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan signer: %w", err)
		}
		signer.ID = id.String()
		items = append(items, signer)
	}
	return items, rows.Err()
}

// CreateSigner добавляет подписанта.
func (r *Repository) CreateSigner(ctx context.Context, input entity.SignerCreateInput) (entity.Signer, error) {
	const query = `INSERT INTO docs.signer (id, code, full_name, position, email, phone)
VALUES ($1, $2, $3, NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''))
RETURNING id, code, full_name, COALESCE(position, ''), COALESCE(email, ''), COALESCE(phone, ''), created_at, updated_at`

	id := uuid.New()
	var signer entity.Signer
	if err := r.pool.QueryRow(ctx, query, id, input.Code, input.FullName, strings.TrimSpace(input.Position), strings.TrimSpace(input.Email), strings.TrimSpace(input.Phone)).
		Scan(&id, &signer.Code, &signer.FullName, &signer.Position, &signer.Email, &signer.Phone, &signer.CreatedAt, &signer.UpdatedAt); err != nil {
		return entity.Signer{}, fmt.Errorf("insert signer: %w", err)
	}
	signer.ID = id.String()
	return signer, nil
}

// UpdateSigner обновляет подписанта.
func (r *Repository) UpdateSigner(ctx context.Context, id uuid.UUID, input entity.SignerUpdateInput) (entity.Signer, error) {
	parts := make([]string, 0, 4)
	args := make([]any, 0, 4)
	idx := 1

	if input.FullName != nil {
		parts = append(parts, fmt.Sprintf("full_name = $%d", idx))
		args = append(args, strings.TrimSpace(*input.FullName))
		idx++
	}
	if input.Position != nil {
		val := strings.TrimSpace(*input.Position)
		if val == "" {
			parts = append(parts, "position = NULL")
		} else {
			parts = append(parts, fmt.Sprintf("position = $%d", idx))
			args = append(args, val)
			idx++
		}
	}
	if input.Email != nil {
		val := strings.TrimSpace(*input.Email)
		if val == "" {
			parts = append(parts, "email = NULL")
		} else {
			parts = append(parts, fmt.Sprintf("email = $%d", idx))
			args = append(args, val)
			idx++
		}
	}
	if input.Phone != nil {
		val := strings.TrimSpace(*input.Phone)
		if val == "" {
			parts = append(parts, "phone = NULL")
		} else {
			parts = append(parts, fmt.Sprintf("phone = $%d", idx))
			args = append(args, val)
			idx++
		}
	}

	if len(parts) == 0 {
		return r.getSigner(ctx, id)
	}

	parts = append(parts, "updated_at = NOW()")
	query := fmt.Sprintf("UPDATE docs.signer SET %s WHERE id = $%d RETURNING id, code, full_name, COALESCE(position, ''), COALESCE(email, ''), COALESCE(phone, ''), created_at, updated_at", strings.Join(parts, ", "), idx)
	args = append(args, id)

	var signer entity.Signer
	var retID uuid.UUID
	if err := r.pool.QueryRow(ctx, query, args...).Scan(&retID, &signer.Code, &signer.FullName, &signer.Position, &signer.Email, &signer.Phone, &signer.CreatedAt, &signer.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.Signer{}, ErrSignerNotFound
		}
		return entity.Signer{}, fmt.Errorf("update signer: %w", err)
	}
	signer.ID = retID.String()
	return signer, nil
}

func (r *Repository) getSigner(ctx context.Context, id uuid.UUID) (entity.Signer, error) {
	const query = `SELECT id, code, full_name, COALESCE(position, ''), COALESCE(email, ''), COALESCE(phone, ''), created_at, updated_at FROM docs.signer WHERE id = $1`
	var signer entity.Signer
	var retID uuid.UUID
	if err := r.pool.QueryRow(ctx, query, id).Scan(&retID, &signer.Code, &signer.FullName, &signer.Position, &signer.Email, &signer.Phone, &signer.CreatedAt, &signer.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.Signer{}, ErrSignerNotFound
		}
		return entity.Signer{}, fmt.Errorf("get signer: %w", err)
	}
	signer.ID = retID.String()
	return signer, nil
}

// ListDocuments возвращает документы с подписантами.
func (r *Repository) ListDocuments(ctx context.Context, filter entity.DocumentListFilter) ([]entity.Document, error) {
	builder := strings.Builder{}
	builder.WriteString("SELECT id, template_id, sequence_id, number, title, status, payload, issued_at, signed_at, archived_at, created_at, updated_at FROM docs.document")
	args := make([]any, 0, 2)
	idx := 1
	if filter.Status != "" {
		builder.WriteString(fmt.Sprintf(" WHERE status = $%d", idx))
		args = append(args, strings.TrimSpace(filter.Status))
		idx++
	}
	builder.WriteString(" ORDER BY created_at DESC LIMIT $")
	builder.WriteString(fmt.Sprint(idx))
	args = append(args, filter.Limit)

	rows, err := r.pool.Query(ctx, builder.String(), args...)
	if err != nil {
		return nil, fmt.Errorf("list documents: %w", err)
	}
	defer rows.Close()

	docs, err := scanDocuments(rows)
	if err != nil {
		return nil, err
	}
	if err := r.attachSigners(ctx, r.pool, docs); err != nil {
		return nil, err
	}
	return toDocumentSlice(docs), nil
}

// CreateDocument создаёт документ и связывает подписантов.
func (r *Repository) CreateDocument(ctx context.Context, input entity.DocumentCreateInput) (entity.Document, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return entity.Document{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	sequenceID, number, err := r.nextNumber(ctx, tx, strings.TrimSpace(strings.ToUpper(input.SequenceCode)))
	if err != nil {
		return entity.Document{}, err
	}

	status := input.Status
	if status == "" {
		status = "issued"
	}

	const insertDoc = `INSERT INTO docs.document (id, template_id, sequence_id, number, title, status, payload, issued_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
RETURNING id, template_id, sequence_id, number, title, status, payload, issued_at, signed_at, archived_at, created_at, updated_at`

	docID := uuid.New()
	var (
		retID      uuid.UUID
		templateID uuid.UUID
		seqID      uuid.UUID
		payload    []byte
		issuedAt   pgtype.Timestamptz
		signedAt   pgtype.Timestamptz
		archived   pgtype.Timestamptz
		doc        entity.Document
	)
	if err := tx.QueryRow(ctx, insertDoc, docID, input.TemplateID, sequenceID, number, input.Title, status, ensureJSON(input.Payload)).
		Scan(&retID, &templateID, &seqID, &doc.Number, &doc.Title, &doc.Status, &payload, &issuedAt, &signedAt, &archived, &doc.CreatedAt, &doc.UpdatedAt); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			return entity.Document{}, fmt.Errorf("insert document: %w", pgErr)
		}
		return entity.Document{}, fmt.Errorf("insert document: %w", err)
	}
	doc.ID = retID.String()
	doc.TemplateID = templateID.String()
	doc.SequenceID = seqID.String()
	doc.Payload = cloneJSON(payload)
	doc.IssuedAt = timestamptzPtr(issuedAt)
	doc.SignedAt = timestamptzPtr(signedAt)
	doc.ArchivedAt = timestamptzPtr(archived)

	if len(input.SignerIDs) > 0 {
		if err := r.insertDocumentSigners(ctx, tx, retID, input.SignerIDs); err != nil {
			return entity.Document{}, err
		}
	}

	doc.Signers, err = r.loadSigners(ctx, tx, retID)
	if err != nil {
		return entity.Document{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return entity.Document{}, fmt.Errorf("commit tx: %w", err)
	}
	return doc, nil
}

// UpdateDocument обновляет реквизиты документа и статусы подписантов.
func (r *Repository) UpdateDocument(ctx context.Context, id uuid.UUID, input entity.DocumentUpdateInput) (entity.Document, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return entity.Document{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	if err := r.updateDocumentFields(ctx, tx, id, input); err != nil {
		return entity.Document{}, err
	}

	if len(input.SignerStatuses) > 0 {
		if err := r.updateSignerStatuses(ctx, tx, id, input.SignerStatuses); err != nil {
			return entity.Document{}, err
		}
	}

	doc, err := r.getDocumentTx(ctx, tx, id)
	if err != nil {
		return entity.Document{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return entity.Document{}, fmt.Errorf("commit tx: %w", err)
	}
	return doc, nil
}

func (r *Repository) updateDocumentFields(ctx context.Context, tx pgx.Tx, id uuid.UUID, input entity.DocumentUpdateInput) error {
	parts := make([]string, 0, 4)
	args := make([]any, 0, 4)
	idx := 1

	if input.Title != nil {
		parts = append(parts, fmt.Sprintf("title = $%d", idx))
		args = append(args, strings.TrimSpace(*input.Title))
		idx++
	}
	if input.Payload != nil {
		parts = append(parts, fmt.Sprintf("payload = $%d", idx))
		args = append(args, ensureJSON(*input.Payload))
		idx++
	}

	statusClause := ""
	if input.Status != nil {
		status := strings.TrimSpace(*input.Status)
		parts = append(parts, fmt.Sprintf("status = $%d", idx))
		args = append(args, status)
		idx++
		switch status {
		case "issued":
			statusClause = "issued_at = COALESCE(issued_at, NOW()), signed_at = NULL, archived_at = NULL"
		case "signed":
			statusClause = "signed_at = NOW(), archived_at = NULL"
		case "archived":
			statusClause = "archived_at = NOW()"
		case "draft":
			statusClause = "issued_at = NULL, signed_at = NULL, archived_at = NULL"
		default:
			statusClause = ""
		}
	}

	if len(parts) == 0 && statusClause == "" {
		return nil
	}

	parts = append(parts, "updated_at = NOW()")
	if statusClause != "" {
		parts = append(parts, statusClause)
	}
	query := fmt.Sprintf("UPDATE docs.document SET %s WHERE id = $%d", strings.Join(parts, ", "), idx)
	args = append(args, id)

	exec, err := tx.Exec(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("update document: %w", err)
	}
	if exec.RowsAffected() == 0 {
		return ErrDocumentNotFound
	}
	return nil
}

func (r *Repository) updateSignerStatuses(ctx context.Context, tx pgx.Tx, docID uuid.UUID, updates []entity.DocumentSignerStatusInput) error {
	const query = `UPDATE docs.document_signer SET status = $1, signed_at = CASE WHEN $1 = 'signed' THEN NOW() WHEN $1 = 'pending' THEN NULL ELSE signed_at END, updated_at = NOW() WHERE document_id = $2 AND signer_id = $3`
	for _, upd := range updates {
		signerID, err := uuid.Parse(strings.TrimSpace(upd.SignerID))
		if err != nil {
			return fmt.Errorf("parse signer id: %w", err)
		}
		exec, err := tx.Exec(ctx, query, strings.TrimSpace(upd.Status), docID, signerID)
		if err != nil {
			return fmt.Errorf("update signer status: %w", err)
		}
		if exec.RowsAffected() == 0 {
			return fmt.Errorf("signer %s not linked with document", signerID)
		}
	}
	return nil
}

func (r *Repository) getDocumentTx(ctx context.Context, q queryer, id uuid.UUID) (entity.Document, error) {
	const query = `SELECT id, template_id, sequence_id, number, title, status, payload, issued_at, signed_at, archived_at, created_at, updated_at FROM docs.document WHERE id = $1`
	rows, err := q.Query(ctx, query, id)
	if err != nil {
		return entity.Document{}, fmt.Errorf("get document: %w", err)
	}
	defer rows.Close()

	docs, err := scanDocuments(rows)
	if err != nil {
		return entity.Document{}, err
	}
	if len(docs) == 0 {
		return entity.Document{}, ErrDocumentNotFound
	}
	if err := r.attachSigners(ctx, q, docs); err != nil {
		return entity.Document{}, err
	}
	for _, doc := range docs {
		return *doc, nil
	}
	return entity.Document{}, ErrDocumentNotFound
}

func (r *Repository) attachSigners(ctx context.Context, q queryer, docs map[uuid.UUID]*entity.Document) error {
	if len(docs) == 0 {
		return nil
	}
	ids := make([]uuid.UUID, 0, len(docs))
	for id := range docs {
		ids = append(ids, id)
	}

	const query = `SELECT ds.id, ds.document_id, ds.signer_id, s.full_name, COALESCE(s.email, ''), ds.status, ds.order_no, ds.signed_at, ds.updated_at
FROM docs.document_signer ds
JOIN docs.signer s ON s.id = ds.signer_id
WHERE ds.document_id = ANY($1)
ORDER BY ds.order_no`

	rows, err := q.Query(ctx, query, ids)
	if err != nil {
		return fmt.Errorf("load document signers: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var signer entity.DocumentSigner
		var (
			rowID  uuid.UUID
			docID  uuid.UUID
			signID uuid.UUID
			signed pgtype.Timestamptz
		)
		if err := rows.Scan(&rowID, &docID, &signID, &signer.FullName, &signer.Email, &signer.Status, &signer.OrderNo, &signed, &signer.UpdatedAt); err != nil {
			return fmt.Errorf("scan document signer: %w", err)
		}
		signer.ID = rowID.String()
		signer.SignerID = signID.String()
		signer.SignedAt = timestamptzPtr(signed)
		if doc, ok := docs[docID]; ok {
			doc.Signers = append(doc.Signers, signer)
		}
	}
	return rows.Err()
}

func (r *Repository) insertDocumentSigners(ctx context.Context, tx pgx.Tx, docID uuid.UUID, signerIDs []string) error {
	const query = `INSERT INTO docs.document_signer (id, document_id, signer_id, status, order_no)
VALUES ($1, $2, $3, 'pending', $4)`
	for idx, signer := range signerIDs {
		signerUUID, err := uuid.Parse(strings.TrimSpace(signer))
		if err != nil {
			return fmt.Errorf("parse signer id: %w", err)
		}
		if _, err := tx.Exec(ctx, query, uuid.New(), docID, signerUUID, idx+1); err != nil {
			return fmt.Errorf("insert document signer: %w", err)
		}
	}
	return nil
}

func (r *Repository) loadSigners(ctx context.Context, tx pgx.Tx, docID uuid.UUID) ([]entity.DocumentSigner, error) {
	const query = `SELECT ds.id, ds.signer_id, s.full_name, COALESCE(s.email, ''), ds.status, ds.order_no, ds.signed_at, ds.updated_at
FROM docs.document_signer ds
JOIN docs.signer s ON s.id = ds.signer_id
WHERE ds.document_id = $1
ORDER BY ds.order_no`

	rows, err := tx.Query(ctx, query, docID)
	if err != nil {
		return nil, fmt.Errorf("load signers: %w", err)
	}
	defer rows.Close()

	var items []entity.DocumentSigner
	for rows.Next() {
		var signer entity.DocumentSigner
		var (
			rowID  uuid.UUID
			signID uuid.UUID
			signed pgtype.Timestamptz
		)
		if err := rows.Scan(&rowID, &signID, &signer.FullName, &signer.Email, &signer.Status, &signer.OrderNo, &signed, &signer.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan signer: %w", err)
		}
		signer.ID = rowID.String()
		signer.SignerID = signID.String()
		signer.SignedAt = timestamptzPtr(signed)
		items = append(items, signer)
	}
	return items, rows.Err()
}

func (r *Repository) nextNumber(ctx context.Context, tx pgx.Tx, code string) (uuid.UUID, string, error) {
	const query = `SELECT id, prefix, padding, current_value FROM docs.number_sequence WHERE code = $1 FOR UPDATE`
	var (
		seqID   uuid.UUID
		prefix  string
		padding int16
		current int64
	)
	if err := tx.QueryRow(ctx, query, code).Scan(&seqID, &prefix, &padding, &current); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return uuid.Nil, "", ErrSequenceNotFound
		}
		return uuid.Nil, "", fmt.Errorf("select sequence: %w", err)
	}

	next := current + 1
	formatted := fmt.Sprintf("%s%0*d", prefix, padding, next)

	if _, err := tx.Exec(ctx, `UPDATE docs.number_sequence SET current_value = $1, updated_at = NOW() WHERE id = $2`, next, seqID); err != nil {
		return uuid.Nil, "", fmt.Errorf("update sequence: %w", err)
	}
	return seqID, formatted, nil
}

func scanDocuments(rows pgx.Rows) (map[uuid.UUID]*entity.Document, error) {
	docs := make(map[uuid.UUID]*entity.Document)
	for rows.Next() {
		var (
			id         uuid.UUID
			templateID uuid.UUID
			sequenceID uuid.UUID
			payload    []byte
			issuedAt   pgtype.Timestamptz
			signedAt   pgtype.Timestamptz
			archived   pgtype.Timestamptz
		)
		var doc entity.Document
		if err := rows.Scan(&id, &templateID, &sequenceID, &doc.Number, &doc.Title, &doc.Status, &payload, &issuedAt, &signedAt, &archived, &doc.CreatedAt, &doc.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan document: %w", err)
		}
		doc.ID = id.String()
		doc.TemplateID = templateID.String()
		doc.SequenceID = sequenceID.String()
		doc.Payload = cloneJSON(payload)
		doc.IssuedAt = timestamptzPtr(issuedAt)
		doc.SignedAt = timestamptzPtr(signedAt)
		doc.ArchivedAt = timestamptzPtr(archived)
		docs[id] = &doc
	}
	return docs, rows.Err()
}

func toDocumentSlice(m map[uuid.UUID]*entity.Document) []entity.Document {
	items := make([]entity.Document, 0, len(m))
	for _, doc := range m {
		items = append(items, *doc)
	}
	return items
}

func ensureJSON(raw json.RawMessage) []byte {
	if len(raw) == 0 {
		return []byte("{}")
	}
	if !json.Valid(raw) {
		return []byte("{}")
	}
	dup := make([]byte, len(raw))
	copy(dup, raw)
	return dup
}

func cloneJSON(data []byte) json.RawMessage {
	if len(data) == 0 {
		return json.RawMessage([]byte("{}"))
	}
	dup := make([]byte, len(data))
	copy(dup, data)
	return json.RawMessage(dup)
}

func timestamptzPtr(ts pgtype.Timestamptz) *time.Time {
	if !ts.Valid {
		return nil
	}
	return &ts.Time
}

type queryer interface {
	Query(context.Context, string, ...any) (pgx.Rows, error)
}
