package bpm

import (
    "encoding/json"
    "time"

    "github.com/google/uuid"
)

// ProcessDefinition описывает процесс в gateway.
type ProcessDefinition struct {
    ID          uuid.UUID       `json:"id"`
    Code        string          `json:"code"`
    Name        string          `json:"name"`
    Description string          `json:"description"`
    Version     int             `json:"version"`
    Status      string          `json:"status"`
    Definition  json.RawMessage `json:"definition"`
    CreatedAt   time.Time       `json:"createdAt"`
    UpdatedAt   time.Time       `json:"updatedAt"`
}

// ProcessCreateInput входные данные для создания процесса.
type ProcessCreateInput struct {
    Code        string
    Name        string
    Description string
    Definition  json.RawMessage
}

// ProcessUpdateInput изменяемые поля процесса.
type ProcessUpdateInput struct {
    Name        *string
    Description *string
    Status      *string
    Definition  *json.RawMessage
    Version     *int
}

// Form описывает форму процесса.
type Form struct {
    ID        uuid.UUID       `json:"id"`
    ProcessID uuid.UUID       `json:"processId"`
    Code      string          `json:"code"`
    Name      string          `json:"name"`
    Version   int             `json:"version"`
    Schema    json.RawMessage `json:"schema"`
    UISchema  json.RawMessage `json:"uiSchema"`
    CreatedAt time.Time       `json:"createdAt"`
    UpdatedAt time.Time       `json:"updatedAt"`
}

// FormCreateInput входные данные.
type FormCreateInput struct {
    ProcessID uuid.UUID
    Code      string
    Name      string
    Schema    json.RawMessage
    UISchema  json.RawMessage
}

// FormUpdateInput изменяемые поля формы.
type FormUpdateInput struct {
    Name     *string
    Version  *int
    Schema   *json.RawMessage
    UISchema *json.RawMessage
}

// Task описывает задачу BPM.
type Task struct {
    ID        uuid.UUID       `json:"id"`
    ProcessID uuid.UUID       `json:"processId"`
    Code      string          `json:"code"`
    Title     string          `json:"title"`
    Status    string          `json:"status"`
    Assignee  string          `json:"assignee"`
    DueAt     *time.Time      `json:"dueAt,omitempty"`
    Payload   json.RawMessage `json:"payload"`
    CreatedAt time.Time       `json:"createdAt"`
    UpdatedAt time.Time       `json:"updatedAt"`
}

// TaskCreateInput входные данные для создания задачи.
type TaskCreateInput struct {
    ProcessID uuid.UUID
    Code      string
    Title     string
    Assignee  string
    DueAt     string
    Payload   json.RawMessage
}

// TaskUpdateInput изменяемые поля задачи.
type TaskUpdateInput struct {
    Title    *string
    Status   *string
    Assignee *string
    DueAt    *string
    Payload  *json.RawMessage
}

// ProcessListFilter фильтры процессов.
type ProcessListFilter struct {
    Limit  int
    Status string
}

// TaskListFilter фильтры задач.
type TaskListFilter struct {
    Limit  int
    Status string
}
