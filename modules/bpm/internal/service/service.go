package service

import (
    "context"
    "encoding/json"
    "fmt"
    "strings"
    "time"

    "github.com/google/uuid"
    "github.com/rs/zerolog"

    "asfppro/modules/bpm/internal/entity"
    "asfppro/modules/bpm/internal/repository"
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

// Service содержит бизнес-логику BPM.
type Service struct {
    repo   *repository.Repository
    logger zerolog.Logger
}

// New создает сервис.
func New(repo *repository.Repository, logger zerolog.Logger) *Service {
    return &Service{repo: repo, logger: logger.With().Str("component", "bpm.service").Logger()}
}

// ListProcesses возвращает процессы по фильтрам.
func (s *Service) ListProcesses(ctx context.Context, filter entity.ProcessListFilter) ([]entity.ProcessDefinition, error) {
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

// CreateProcess создает новый процесс.
func (s *Service) CreateProcess(ctx context.Context, input entity.ProcessCreateInput) (entity.ProcessDefinition, error) {
    input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
    input.Name = strings.TrimSpace(input.Name)
    input.Description = strings.TrimSpace(input.Description)
    if input.Code == "" {
        return entity.ProcessDefinition{}, fmt.Errorf("code is required")
    }
    if input.Name == "" {
        return entity.ProcessDefinition{}, fmt.Errorf("name is required")
    }
    if len(input.Definition) > 0 && !json.Valid(input.Definition) {
        return entity.ProcessDefinition{}, fmt.Errorf("definition must be valid json")
    }
    if len(input.Definition) == 0 {
        input.Definition = json.RawMessage(`{}`)
    }

    proc, err := s.repo.CreateProcess(ctx, input)
    if err != nil {
        return entity.ProcessDefinition{}, err
    }
    s.logger.Info().Str("processId", proc.ID).Msg("bpm process created")
    return proc, nil
}

// UpdateProcess обновляет процесс.
func (s *Service) UpdateProcess(ctx context.Context, id uuid.UUID, input entity.ProcessUpdateInput) (entity.ProcessDefinition, error) {
    if input.Name != nil {
        trim := strings.TrimSpace(*input.Name)
        if trim == "" {
            return entity.ProcessDefinition{}, fmt.Errorf("name cannot be empty")
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
                return entity.ProcessDefinition{}, fmt.Errorf("unsupported status")
            }
            input.Status = &status
        }
    }
    if input.Definition != nil {
        if len(*input.Definition) > 0 && !json.Valid(*input.Definition) {
            return entity.ProcessDefinition{}, fmt.Errorf("definition must be valid json")
        }
        if len(*input.Definition) == 0 {
            empty := json.RawMessage(`{}`)
            input.Definition = &empty
        }
    }
    if input.Version != nil && *input.Version <= 0 {
        return entity.ProcessDefinition{}, fmt.Errorf("version must be positive")
    }

    proc, err := s.repo.UpdateProcess(ctx, id, input)
    if err != nil {
        return entity.ProcessDefinition{}, err
    }
    s.logger.Info().Str("processId", proc.ID).Msg("bpm process updated")
    return proc, nil
}

// ListForms возвращает формы.
func (s *Service) ListForms(ctx context.Context, limit int) ([]entity.Form, error) {
    if limit <= 0 || limit > 100 {
        limit = 50
    }
    return s.repo.ListForms(ctx, limit)
}

// CreateForm добавляет форму.
func (s *Service) CreateForm(ctx context.Context, input entity.FormCreateInput) (entity.Form, error) {
    input.ProcessID = strings.TrimSpace(input.ProcessID)
    input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
    input.Name = strings.TrimSpace(input.Name)
    if input.ProcessID == "" {
        return entity.Form{}, fmt.Errorf("processId is required")
    }
    if _, err := uuid.Parse(input.ProcessID); err != nil {
        return entity.Form{}, fmt.Errorf("invalid processId")
    }
    if input.Code == "" {
        return entity.Form{}, fmt.Errorf("code is required")
    }
    if input.Name == "" {
        return entity.Form{}, fmt.Errorf("name is required")
    }
    if len(input.Schema) > 0 && !json.Valid(input.Schema) {
        return entity.Form{}, fmt.Errorf("schema must be valid json")
    }
    if len(input.Schema) == 0 {
        input.Schema = json.RawMessage(`{}`)
    }
    if len(input.UISchema) > 0 && !json.Valid(input.UISchema) {
        return entity.Form{}, fmt.Errorf("uiSchema must be valid json")
    }
    if len(input.UISchema) == 0 {
        input.UISchema = json.RawMessage(`{}`)
    }

    form, err := s.repo.CreateForm(ctx, input)
    if err != nil {
        return entity.Form{}, err
    }
    s.logger.Info().Str("formId", form.ID).Msg("bpm form created")
    return form, nil
}

// UpdateForm обновляет форму.
func (s *Service) UpdateForm(ctx context.Context, id uuid.UUID, input entity.FormUpdateInput) (entity.Form, error) {
    if input.Name != nil {
        trim := strings.TrimSpace(*input.Name)
        if trim == "" {
            return entity.Form{}, fmt.Errorf("name cannot be empty")
        }
        input.Name = &trim
    }
    if input.Version != nil && *input.Version <= 0 {
        return entity.Form{}, fmt.Errorf("version must be positive")
    }
    if input.Schema != nil {
        if len(*input.Schema) > 0 && !json.Valid(*input.Schema) {
            return entity.Form{}, fmt.Errorf("schema must be valid json")
        }
        if len(*input.Schema) == 0 {
            empty := json.RawMessage(`{}`)
            input.Schema = &empty
        }
    }
    if input.UISchema != nil {
        if len(*input.UISchema) > 0 && !json.Valid(*input.UISchema) {
            return entity.Form{}, fmt.Errorf("uiSchema must be valid json")
        }
        if len(*input.UISchema) == 0 {
            empty := json.RawMessage(`{}`)
            input.UISchema = &empty
        }
    }

    form, err := s.repo.UpdateForm(ctx, id, input)
    if err != nil {
        return entity.Form{}, err
    }
    s.logger.Info().Str("formId", form.ID).Msg("bpm form updated")
    return form, nil
}

// ListTasks возвращает задачи.
func (s *Service) ListTasks(ctx context.Context, filter entity.TaskListFilter) ([]entity.Task, error) {
    if filter.Limit <= 0 || filter.Limit > 100 {
        filter.Limit = 50
    }
    status := strings.TrimSpace(strings.ToLower(filter.Status))
    if status != "" {
        if _, ok := allowedTaskStatuses[status]; !ok {
            return nil, fmt.Errorf("unsupported status")
        }
    }
    return s.repo.ListTasks(ctx, entity.TaskListFilter{Limit: filter.Limit, Status: status})
}

// CreateTask создает задачу.
func (s *Service) CreateTask(ctx context.Context, input entity.TaskCreateInput) (entity.Task, error) {
    input.ProcessID = strings.TrimSpace(input.ProcessID)
    input.Code = strings.TrimSpace(strings.ToUpper(input.Code))
    input.Title = strings.TrimSpace(input.Title)
    input.Assignee = strings.TrimSpace(input.Assignee)

    if input.ProcessID == "" {
        return entity.Task{}, fmt.Errorf("processId is required")
    }
    if _, err := uuid.Parse(input.ProcessID); err != nil {
        return entity.Task{}, fmt.Errorf("invalid processId")
    }
    if input.Code == "" {
        return entity.Task{}, fmt.Errorf("code is required")
    }
    if input.Title == "" {
        return entity.Task{}, fmt.Errorf("title is required")
    }
    if len(input.Payload) > 0 && !json.Valid(input.Payload) {
        return entity.Task{}, fmt.Errorf("payload must be valid json")
    }
    if len(input.Payload) == 0 {
        input.Payload = json.RawMessage(`{}`)
    }
    if strings.TrimSpace(input.DueAt) != "" {
        if _, err := time.Parse(time.RFC3339, strings.TrimSpace(input.DueAt)); err != nil {
            return entity.Task{}, fmt.Errorf("invalid dueAt")
        }
    }

    task, err := s.repo.CreateTask(ctx, input)
    if err != nil {
        return entity.Task{}, err
    }
    s.logger.Info().Str("taskId", task.ID).Msg("bpm task created")
    return task, nil
}

// UpdateTask обновляет задачу.
func (s *Service) UpdateTask(ctx context.Context, id uuid.UUID, input entity.TaskUpdateInput) (entity.Task, error) {
    if input.Title != nil {
        trim := strings.TrimSpace(*input.Title)
        if trim == "" {
            return entity.Task{}, fmt.Errorf("title cannot be empty")
        }
        input.Title = &trim
    }
    if input.Status != nil {
        status := strings.TrimSpace(strings.ToLower(*input.Status))
        if _, ok := allowedTaskStatuses[status]; !ok {
            return entity.Task{}, fmt.Errorf("unsupported status")
        }
        input.Status = &status
    }
    if input.Assignee != nil {
        trim := strings.TrimSpace(*input.Assignee)
        input.Assignee = &trim
    }
    if input.DueAt != nil {
        trim := strings.TrimSpace(*input.DueAt)
        if trim != "" {
            if _, err := time.Parse(time.RFC3339, trim); err != nil {
                return entity.Task{}, fmt.Errorf("invalid dueAt")
            }
        }
        input.DueAt = &trim
    }
    if input.Payload != nil {
        if len(*input.Payload) > 0 && !json.Valid(*input.Payload) {
            return entity.Task{}, fmt.Errorf("payload must be valid json")
        }
        if len(*input.Payload) == 0 {
            empty := json.RawMessage(`{}`)
            input.Payload = &empty
        }
    }

    task, err := s.repo.UpdateTask(ctx, id, input)
    if err != nil {
        return entity.Task{}, err
    }
    s.logger.Info().Str("taskId", task.ID).Msg("bpm task updated")
    return task, nil
}
