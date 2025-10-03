package bpm

import (
    "context"
    "encoding/json"
    "fmt"
    "strings"
    "time"

    "github.com/google/uuid"
    "github.com/rs/zerolog"
)

var (
    allowedProcessStatuses = map[string]struct{}{
        "draft":     {},
        "published": {},
        "archived":  {},
    }
    allowedTaskStatuses = map[string]struct{}{
        "pending":     {},
        "in_progress": {},
        "completed":   {},
        "cancelled":   {},
    }
)

// Service инкапсулирует бизнес-логику BPM внутри gateway.
type Service struct {
    repo   *Repository
    logger zerolog.Logger
}

// NewService создает сервис.
func NewService(repo *Repository, logger zerolog.Logger) *Service {
    return &Service{repo: repo, logger: logger.With().Str("component", "gateway.bpm.service").Logger()}
}

// ListProcesses возвращает процессы.
func (s *Service) ListProcesses(ctx context.Context, filter ProcessListFilter) ([]ProcessDefinition, error) {
    if filter.Limit <= 0 || filter.Limit > 100 {
        filter.Limit = 50
    }
    status := strings.TrimSpace(strings.ToLower(filter.Status))
    if status != "" {
        if _, ok := allowedProcessStatuses[status]; !ok {
            return nil, fmt.Errorf("unsupported status")
        }
    }
    return s.repo.ListProcesses(ctx, filter.Limit, status)
}

// CreateProcess создает процесс.
func (s *Service) CreateProcess(ctx context.Context, input ProcessCreateInput) (ProcessDefinition, error) {
    input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
    input.Name = strings.TrimSpace(input.Name)
    input.Description = strings.TrimSpace(input.Description)
    if input.Code == "" {
        return ProcessDefinition{}, fmt.Errorf("code is required")
    }
    if input.Name == "" {
        return ProcessDefinition{}, fmt.Errorf("name is required")
    }
    if len(input.Definition) > 0 && !json.Valid(input.Definition) {
        return ProcessDefinition{}, fmt.Errorf("definition must be valid json")
    }
    if len(input.Definition) == 0 {
        input.Definition = json.RawMessage(`{}`)
    }

    proc, err := s.repo.CreateProcess(ctx, input)
    if err != nil {
        return ProcessDefinition{}, err
    }
    s.logger.Info().Str("processId", proc.ID.String()).Msg("bpm process created via gateway")
    return proc, nil
}

// UpdateProcess обновляет процесс.
func (s *Service) UpdateProcess(ctx context.Context, id uuid.UUID, input ProcessUpdateInput) (ProcessDefinition, error) {
    if input.Name != nil {
        trim := strings.TrimSpace(*input.Name)
        if trim == "" {
            return ProcessDefinition{}, fmt.Errorf("name cannot be empty")
        }
        input.Name = &trim
    }
    if input.Description != nil {
        trim := strings.TrimSpace(*input.Description)
        input.Description = &trim
    }
    if input.Status != nil {
        status := strings.TrimSpace(strings.ToLower(*input.Status))
        if status == "" {
            input.Status = nil
        } else {
            if _, ok := allowedProcessStatuses[status]; !ok {
                return ProcessDefinition{}, fmt.Errorf("unsupported status")
            }
            input.Status = &status
        }
    }
    if input.Definition != nil {
        if len(*input.Definition) > 0 && !json.Valid(*input.Definition) {
            return ProcessDefinition{}, fmt.Errorf("definition must be valid json")
        }
        if len(*input.Definition) == 0 {
            empty := json.RawMessage(`{}`)
            input.Definition = &empty
        }
    }
    if input.Version != nil && *input.Version <= 0 {
        return ProcessDefinition{}, fmt.Errorf("version must be positive")
    }

    proc, err := s.repo.UpdateProcess(ctx, id, input)
    if err != nil {
        return ProcessDefinition{}, err
    }
    s.logger.Info().Str("processId", proc.ID.String()).Msg("bpm process updated via gateway")
    return proc, nil
}

// ListForms возвращает формы.
func (s *Service) ListForms(ctx context.Context, limit int) ([]Form, error) {
    if limit <= 0 || limit > 100 {
        limit = 50
    }
    return s.repo.ListForms(ctx, limit)
}

// CreateForm добавляет форму.
func (s *Service) CreateForm(ctx context.Context, input FormCreateInput) (Form, error) {
    if input.ProcessID == uuid.Nil {
        return Form{}, fmt.Errorf("processId is required")
    }
    input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
    input.Name = strings.TrimSpace(input.Name)
    if input.Code == "" {
        return Form{}, fmt.Errorf("code is required")
    }
    if input.Name == "" {
        return Form{}, fmt.Errorf("name is required")
    }
    if len(input.Schema) > 0 && !json.Valid(input.Schema) {
        return Form{}, fmt.Errorf("schema must be valid json")
    }
    if len(input.Schema) == 0 {
        input.Schema = json.RawMessage(`{}`)
    }
    if len(input.UISchema) > 0 && !json.Valid(input.UISchema) {
        return Form{}, fmt.Errorf("uiSchema must be valid json")
    }
    if len(input.UISchema) == 0 {
        input.UISchema = json.RawMessage(`{}`)
    }

    form, err := s.repo.CreateForm(ctx, input)
    if err != nil {
        return Form{}, err
    }
    s.logger.Info().Str("formId", form.ID.String()).Msg("bpm form created via gateway")
    return form, nil
}

// UpdateForm обновляет форму.
func (s *Service) UpdateForm(ctx context.Context, id uuid.UUID, input FormUpdateInput) (Form, error) {
    if input.Name != nil {
        trim := strings.TrimSpace(*input.Name)
        if trim == "" {
            return Form{}, fmt.Errorf("name cannot be empty")
        }
        input.Name = &trim
    }
    if input.Version != nil && *input.Version <= 0 {
        return Form{}, fmt.Errorf("version must be positive")
    }
    if input.Schema != nil {
        if len(*input.Schema) > 0 && !json.Valid(*input.Schema) {
            return Form{}, fmt.Errorf("schema must be valid json")
        }
        if len(*input.Schema) == 0 {
            empty := json.RawMessage(`{}`)
            input.Schema = &empty
        }
    }
    if input.UISchema != nil {
        if len(*input.UISchema) > 0 && !json.Valid(*input.UISchema) {
            return Form{}, fmt.Errorf("uiSchema must be valid json")
        }
        if len(*input.UISchema) == 0 {
            empty := json.RawMessage(`{}`)
            input.UISchema = &empty
        }
    }

    form, err := s.repo.UpdateForm(ctx, id, input)
    if err != nil {
        return Form{}, err
    }
    s.logger.Info().Str("formId", form.ID.String()).Msg("bpm form updated via gateway")
    return form, nil
}

// ListTasks возвращает задачи.
func (s *Service) ListTasks(ctx context.Context, filter TaskListFilter) ([]Task, error) {
    if filter.Limit <= 0 || filter.Limit > 100 {
        filter.Limit = 50
    }
    status := strings.TrimSpace(strings.ToLower(filter.Status))
    if status != "" {
        if _, ok := allowedTaskStatuses[status]; !ok {
            return nil, fmt.Errorf("unsupported status")
        }
    }
    return s.repo.ListTasks(ctx, TaskListFilter{Limit: filter.Limit, Status: status})
}

// CreateTask создает задачу.
func (s *Service) CreateTask(ctx context.Context, input TaskCreateInput) (Task, error) {
    if input.ProcessID == uuid.Nil {
        return Task{}, fmt.Errorf("processId is required")
    }
    input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
    input.Title = strings.TrimSpace(input.Title)
    input.Assignee = strings.TrimSpace(input.Assignee)
    if input.Code == "" {
        return Task{}, fmt.Errorf("code is required")
    }
    if input.Title == "" {
        return Task{}, fmt.Errorf("title is required")
    }
    if len(input.Payload) > 0 && !json.Valid(input.Payload) {
        return Task{}, fmt.Errorf("payload must be valid json")
    }
    if len(input.Payload) == 0 {
        input.Payload = json.RawMessage(`{}`)
    }
    if strings.TrimSpace(input.DueAt) != "" {
        if _, err := time.Parse(time.RFC3339, strings.TrimSpace(input.DueAt)); err != nil {
            return Task{}, fmt.Errorf("invalid dueAt")
        }
    }

    task, err := s.repo.CreateTask(ctx, input)
    if err != nil {
        return Task{}, err
    }
    s.logger.Info().Str("taskId", task.ID.String()).Msg("bpm task created via gateway")
    return task, nil
}

// UpdateTask обновляет задачу.
func (s *Service) UpdateTask(ctx context.Context, id uuid.UUID, input TaskUpdateInput) (Task, error) {
    if input.Title != nil {
        trim := strings.TrimSpace(*input.Title)
        if trim == "" {
            return Task{}, fmt.Errorf("title cannot be empty")
        }
        input.Title = &trim
    }
    if input.Status != nil {
        status := strings.TrimSpace(strings.ToLower(*input.Status))
        if _, ok := allowedTaskStatuses[status]; !ok {
            return Task{}, fmt.Errorf("unsupported status")
        }
        input.Status = &status
    }
    if input.Assignee != nil {
        trim := strings.TrimSpace(*input.Assignee)
        input.Assignee = &trim
    }
    if input.DueAt != nil {
        trim := strings.TrimSpace(*input.DueAt)
        if trim == "" {
            input.DueAt = &trim
        } else {
            if _, err := time.Parse(time.RFC3339, trim); err != nil {
                return Task{}, fmt.Errorf("invalid dueAt")
            }
            input.DueAt = &trim
        }
    }
    if input.Payload != nil {
        if len(*input.Payload) > 0 && !json.Valid(*input.Payload) {
            return Task{}, fmt.Errorf("payload must be valid json")
        }
        if len(*input.Payload) == 0 {
            empty := json.RawMessage(`{}`)
            input.Payload = &empty
        }
    }

    task, err := s.repo.UpdateTask(ctx, id, input)
    if err != nil {
        return Task{}, err
    }
    s.logger.Info().Str("taskId", task.ID.String()).Msg("bpm task updated via gateway")
    return task, nil
}
