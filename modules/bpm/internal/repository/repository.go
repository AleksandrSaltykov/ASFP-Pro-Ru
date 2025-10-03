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

    "asfppro/modules/bpm/internal/entity"
)

var (
    // ErrProcessNotFound returned when process missing.
    ErrProcessNotFound = errors.New("process not found")
    // ErrFormNotFound returned when form missing.
    ErrFormNotFound = errors.New("form not found")
    // ErrTaskNotFound returned when task missing.
    ErrTaskNotFound = errors.New("task not found")
)

// Repository provides BPM persistence.
type Repository struct {
    pool *pgxpool.Pool
}

// New creates repository.
func New(pool *pgxpool.Pool) *Repository {
    return &Repository{pool: pool}
}

// ListProcesses returns limited processes.
func (r *Repository) ListProcesses(ctx context.Context, limit int, status string) ([]entity.ProcessDefinition, error) {
    builder := strings.Builder{}
    builder.WriteString("SELECT id, code, name, COALESCE(description, ''), version, status, definition, created_at, updated_at FROM bpm.process_definition")
    args := make([]any, 0, 2)
    if status != "" {
        builder.WriteString(" WHERE status = $1")
        args = append(args, status)
    }
    if status != "" {
        builder.WriteString(" ORDER BY created_at DESC LIMIT $2")
        args = append(args, limit)
    } else {
        builder.WriteString(" ORDER BY created_at DESC LIMIT $1")
        args = append(args, limit)
    }

    rows, err := r.pool.Query(ctx, builder.String(), args...)
    if err != nil {
        return nil, fmt.Errorf("list processes: %w", err)
    }
    defer rows.Close()

    var items []entity.ProcessDefinition
    for rows.Next() {
        var proc entity.ProcessDefinition
        var def []byte
        if err := rows.Scan(&proc.ID, &proc.Code, &proc.Name, &proc.Description, &proc.Version, &proc.Status, &def, &proc.CreatedAt, &proc.UpdatedAt); err != nil {
            return nil, fmt.Errorf("scan process: %w", err)
        }
        proc.Definition = cloneJSON(def)
        items = append(items, proc)
    }
    return items, rows.Err()
}

// CreateProcess inserts process.
func (r *Repository) CreateProcess(ctx context.Context, input entity.ProcessCreateInput) (entity.ProcessDefinition, error) {
    const query = `INSERT INTO bpm.process_definition (id, code, name, description, definition)
VALUES ($1, $2, $3, NULLIF($4, ''), $5)
RETURNING id, code, name, COALESCE(description, ''), version, status, definition, created_at, updated_at`

    id := uuid.New()
    var proc entity.ProcessDefinition
    var def []byte
    if err := r.pool.QueryRow(ctx, query, id, input.Code, input.Name, strings.TrimSpace(input.Description), ensureJSON(input.Definition)).
        Scan(&proc.ID, &proc.Code, &proc.Name, &proc.Description, &proc.Version, &proc.Status, &def, &proc.CreatedAt, &proc.UpdatedAt); err != nil {
        var pgErr *pgconn.PgError
        if errors.As(err, &pgErr) {
            return entity.ProcessDefinition{}, fmt.Errorf("insert process: %w", pgErr)
        }
        return entity.ProcessDefinition{}, fmt.Errorf("insert process: %w", err)
    }
    proc.Definition = cloneJSON(def)
    return proc, nil
}

// UpdateProcess updates process fields.
func (r *Repository) UpdateProcess(ctx context.Context, id uuid.UUID, input entity.ProcessUpdateInput) (entity.ProcessDefinition, error) {
    parts := make([]string, 0, 5)
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
    if input.Status != nil {
        parts = append(parts, fmt.Sprintf("status = $%d", idx))
        args = append(args, strings.TrimSpace(*input.Status))
        idx++
    }
    if input.Definition != nil {
        parts = append(parts, fmt.Sprintf("definition = $%d", idx))
        args = append(args, ensureJSON(*input.Definition))
        idx++
    }
    if input.Version != nil {
        parts = append(parts, fmt.Sprintf("version = $%d", idx))
        args = append(args, *input.Version)
        idx++
    }

    if len(parts) == 0 {
        return r.getProcess(ctx, id)
    }

    parts = append(parts, "updated_at = NOW()")
    query := fmt.Sprintf("UPDATE bpm.process_definition SET %s WHERE id = $%d RETURNING id, code, name, COALESCE(description, ''), version, status, definition, created_at, updated_at", strings.Join(parts, ", "), idx)
    args = append(args, id)

    var proc entity.ProcessDefinition
    var def []byte
    if err := r.pool.QueryRow(ctx, query, args...).Scan(&proc.ID, &proc.Code, &proc.Name, &proc.Description, &proc.Version, &proc.Status, &def, &proc.CreatedAt, &proc.UpdatedAt); err != nil {
        if errors.Is(err, pgx.ErrNoRows) {
            return entity.ProcessDefinition{}, ErrProcessNotFound
        }
        return entity.ProcessDefinition{}, fmt.Errorf("update process: %w", err)
    }
    proc.Definition = cloneJSON(def)
    return proc, nil
}

func (r *Repository) getProcess(ctx context.Context, id uuid.UUID) (entity.ProcessDefinition, error) {
    const query = `SELECT id, code, name, COALESCE(description, ''), version, status, definition, created_at, updated_at FROM bpm.process_definition WHERE id = $1`
    var proc entity.ProcessDefinition
    var def []byte
    if err := r.pool.QueryRow(ctx, query, id).Scan(&proc.ID, &proc.Code, &proc.Name, &proc.Description, &proc.Version, &proc.Status, &def, &proc.CreatedAt, &proc.UpdatedAt); err != nil {
        if errors.Is(err, pgx.ErrNoRows) {
            return entity.ProcessDefinition{}, ErrProcessNotFound
        }
        return entity.ProcessDefinition{}, fmt.Errorf("get process: %w", err)
    }
    proc.Definition = cloneJSON(def)
    return proc, nil
}

// ListForms returns forms for processes.
func (r *Repository) ListForms(ctx context.Context, limit int) ([]entity.Form, error) {
    const query = `SELECT id, process_id, code, name, version, schema, ui_schema, created_at, updated_at FROM bpm.form ORDER BY created_at DESC LIMIT $1`
    rows, err := r.pool.Query(ctx, query, limit)
    if err != nil {
        return nil, fmt.Errorf("list forms: %w", err)
    }
    defer rows.Close()

    var items []entity.Form
    for rows.Next() {
        var form entity.Form
        var schema, ui []byte
        if err := rows.Scan(&form.ID, &form.ProcessID, &form.Code, &form.Name, &form.Version, &schema, &ui, &form.CreatedAt, &form.UpdatedAt); err != nil {
            return nil, fmt.Errorf("scan form: %w", err)
        }
        form.Schema = cloneJSON(schema)
        form.UISchema = cloneJSON(ui)
        items = append(items, form)
    }
    return items, rows.Err()
}

// CreateForm inserts form.
func (r *Repository) CreateForm(ctx context.Context, input entity.FormCreateInput) (entity.Form, error) {
    const query = `INSERT INTO bpm.form (id, process_id, code, name, schema, ui_schema)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, process_id, code, name, version, schema, ui_schema, created_at, updated_at`

    id := uuid.New()
    var form entity.Form
    var schema, ui []byte
    if err := r.pool.QueryRow(ctx, query, id, input.ProcessID, input.Code, input.Name, ensureJSON(input.Schema), ensureJSON(input.UISchema)).
        Scan(&form.ID, &form.ProcessID, &form.Code, &form.Name, &form.Version, &schema, &ui, &form.CreatedAt, &form.UpdatedAt); err != nil {
        var pgErr *pgconn.PgError
        if errors.As(err, &pgErr) {
            return entity.Form{}, fmt.Errorf("insert form: %w", pgErr)
        }
        return entity.Form{}, fmt.Errorf("insert form: %w", err)
    }
    form.Schema = cloneJSON(schema)
    form.UISchema = cloneJSON(ui)
    return form, nil
}

// UpdateForm updates existing form.
func (r *Repository) UpdateForm(ctx context.Context, id uuid.UUID, input entity.FormUpdateInput) (entity.Form, error) {
    parts := make([]string, 0, 4)
    args := make([]any, 0, 4)
    idx := 1

    if input.Name != nil {
        parts = append(parts, fmt.Sprintf("name = $%d", idx))
        args = append(args, strings.TrimSpace(*input.Name))
        idx++
    }
    if input.Version != nil {
        parts = append(parts, fmt.Sprintf("version = $%d", idx))
        args = append(args, *input.Version)
        idx++
    }
    if input.Schema != nil {
        parts = append(parts, fmt.Sprintf("schema = $%d", idx))
        args = append(args, ensureJSON(*input.Schema))
        idx++
    }
    if input.UISchema != nil {
        parts = append(parts, fmt.Sprintf("ui_schema = $%d", idx))
        args = append(args, ensureJSON(*input.UISchema))
        idx++
    }

    if len(parts) == 0 {
        return r.getForm(ctx, id)
    }

    parts = append(parts, "updated_at = NOW()")
    query := fmt.Sprintf("UPDATE bpm.form SET %s WHERE id = $%d RETURNING id, process_id, code, name, version, schema, ui_schema, created_at, updated_at", strings.Join(parts, ", "), idx)
    args = append(args, id)

    var form entity.Form
    var schema, ui []byte
    if err := r.pool.QueryRow(ctx, query, args...).Scan(&form.ID, &form.ProcessID, &form.Code, &form.Name, &form.Version, &schema, &ui, &form.CreatedAt, &form.UpdatedAt); err != nil {
        if errors.Is(err, pgx.ErrNoRows) {
            return entity.Form{}, ErrFormNotFound
        }
        return entity.Form{}, fmt.Errorf("update form: %w", err)
    }
    form.Schema = cloneJSON(schema)
    form.UISchema = cloneJSON(ui)
    return form, nil
}

func (r *Repository) getForm(ctx context.Context, id uuid.UUID) (entity.Form, error) {
    const query = `SELECT id, process_id, code, name, version, schema, ui_schema, created_at, updated_at FROM bpm.form WHERE id = $1`
    var form entity.Form
    var schema, ui []byte
    if err := r.pool.QueryRow(ctx, query, id).Scan(&form.ID, &form.ProcessID, &form.Code, &form.Name, &form.Version, &schema, &ui, &form.CreatedAt, &form.UpdatedAt); err != nil {
        if errors.Is(err, pgx.ErrNoRows) {
            return entity.Form{}, ErrFormNotFound
        }
        return entity.Form{}, fmt.Errorf("get form: %w", err)
    }
    form.Schema = cloneJSON(schema)
    form.UISchema = cloneJSON(ui)
    return form, nil
}

// ListTasks returns tasks.
func (r *Repository) ListTasks(ctx context.Context, filter entity.TaskListFilter) ([]entity.Task, error) {
    builder := strings.Builder{}
    builder.WriteString("SELECT id, process_id, code, title, status, COALESCE(assignee, ''), due_at, payload, created_at, updated_at FROM bpm.task")
    args := make([]any, 0, 2)
    idx := 1
    if filter.Status != "" {
        builder.WriteString(fmt.Sprintf(" WHERE status = $%d", idx))
        args = append(args, strings.TrimSpace(filter.Status))
        idx++
    }
    builder.WriteString(fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d", idx))
    args = append(args, filter.Limit)

    rows, err := r.pool.Query(ctx, builder.String(), args...)
    if err != nil {
        return nil, fmt.Errorf("list tasks: %w", err)
    }
    defer rows.Close()

    var items []entity.Task
    for rows.Next() {
        var task entity.Task
        var due pgtype.Timestamptz
        var payload []byte
        if err := rows.Scan(&task.ID, &task.ProcessID, &task.Code, &task.Title, &task.Status, &task.Assignee, &due, &payload, &task.CreatedAt, &task.UpdatedAt); err != nil {
            return nil, fmt.Errorf("scan task: %w", err)
        }
        task.DueAt = timestamptzPtr(due)
        task.Payload = cloneJSON(payload)
        items = append(items, task)
    }
    return items, rows.Err()
}

// CreateTask inserts task.
func (r *Repository) CreateTask(ctx context.Context, input entity.TaskCreateInput) (entity.Task, error) {
    const query = `INSERT INTO bpm.task (id, process_id, code, title, assignee, due_at, payload)
VALUES ($1, $2, $3, $4, NULLIF($5, ''), $6, $7)
RETURNING id, process_id, code, title, status, COALESCE(assignee, ''), due_at, payload, created_at, updated_at`

    id := uuid.New()
    var task entity.Task
    var due pgtype.Timestamptz
    var payload []byte
    var dueValue any
    if strings.TrimSpace(input.DueAt) != "" {
        t, err := time.Parse(time.RFC3339, strings.TrimSpace(input.DueAt))
        if err != nil {
            return entity.Task{}, fmt.Errorf("invalid dueAt")
        }
        dueValue = t
    }

    if err := r.pool.QueryRow(ctx, query, id, input.ProcessID, input.Code, input.Title, strings.TrimSpace(input.Assignee), dueValue, ensureJSON(input.Payload)).
        Scan(&task.ID, &task.ProcessID, &task.Code, &task.Title, &task.Status, &task.Assignee, &due, &payload, &task.CreatedAt, &task.UpdatedAt); err != nil {
        var pgErr *pgconn.PgError
        if errors.As(err, &pgErr) {
            return entity.Task{}, fmt.Errorf("insert task: %w", pgErr)
        }
        return entity.Task{}, fmt.Errorf("insert task: %w", err)
    }
    task.DueAt = timestamptzPtr(due)
    task.Payload = cloneJSON(payload)
    return task, nil
}

// UpdateTask updates task fields.
func (r *Repository) UpdateTask(ctx context.Context, id uuid.UUID, input entity.TaskUpdateInput) (entity.Task, error) {
    parts := make([]string, 0, 5)
    args := make([]any, 0, 5)
    idx := 1

    if input.Title != nil {
        parts = append(parts, fmt.Sprintf("title = $%d", idx))
        args = append(args, strings.TrimSpace(*input.Title))
        idx++
    }
    if input.Status != nil {
        parts = append(parts, fmt.Sprintf("status = $%d", idx))
        args = append(args, strings.TrimSpace(*input.Status))
        idx++
    }
    if input.Assignee != nil {
        val := strings.TrimSpace(*input.Assignee)
        if val == "" {
            parts = append(parts, "assignee = NULL")
        } else {
            parts = append(parts, fmt.Sprintf("assignee = $%d", idx))
            args = append(args, val)
            idx++
        }
    }
    if input.DueAt != nil {
        due := strings.TrimSpace(*input.DueAt)
        if due == "" {
            parts = append(parts, "due_at = NULL")
        } else {
            t, err := time.Parse(time.RFC3339, due)
            if err != nil {
                return entity.Task{}, fmt.Errorf("invalid dueAt")
            }
            parts = append(parts, fmt.Sprintf("due_at = $%d", idx))
            args = append(args, t)
            idx++
        }
    }
    if input.Payload != nil {
        parts = append(parts, fmt.Sprintf("payload = $%d", idx))
        args = append(args, ensureJSON(*input.Payload))
        idx++
    }

    if len(parts) == 0 {
        return r.getTask(ctx, id)
    }

    parts = append(parts, "updated_at = NOW()")
    query := fmt.Sprintf("UPDATE bpm.task SET %s WHERE id = $%d RETURNING id, process_id, code, title, status, COALESCE(assignee, ''), due_at, payload, created_at, updated_at", strings.Join(parts, ", "), idx)
    args = append(args, id)

    var task entity.Task
    var due pgtype.Timestamptz
    var payload []byte
    if err := r.pool.QueryRow(ctx, query, args...).Scan(&task.ID, &task.ProcessID, &task.Code, &task.Title, &task.Status, &task.Assignee, &due, &payload, &task.CreatedAt, &task.UpdatedAt); err != nil {
        if errors.Is(err, pgx.ErrNoRows) {
            return entity.Task{}, ErrTaskNotFound
        }
        return entity.Task{}, fmt.Errorf("update task: %w", err)
    }
    task.DueAt = timestamptzPtr(due)
    task.Payload = cloneJSON(payload)
    return task, nil
}

func (r *Repository) getTask(ctx context.Context, id uuid.UUID) (entity.Task, error) {
    const query = `SELECT id, process_id, code, title, status, COALESCE(assignee, ''), due_at, payload, created_at, updated_at FROM bpm.task WHERE id = $1`
    var task entity.Task
    var due pgtype.Timestamptz
    var payload []byte
    if err := r.pool.QueryRow(ctx, query, id).Scan(&task.ID, &task.ProcessID, &task.Code, &task.Title, &task.Status, &task.Assignee, &due, &payload, &task.CreatedAt, &task.UpdatedAt); err != nil {
        if errors.Is(err, pgx.ErrNoRows) {
            return entity.Task{}, ErrTaskNotFound
        }
        return entity.Task{}, fmt.Errorf("get task: %w", err)
    }
    task.DueAt = timestamptzPtr(due)
    task.Payload = cloneJSON(payload)
    return task, nil
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
