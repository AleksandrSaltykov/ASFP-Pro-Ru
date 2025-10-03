package entity

import (
	"encoding/json"
	"time"
)

// ProcessDefinition describes BPM process.
type ProcessDefinition struct {
	ID          string          `json:"id"`
	Code        string          `json:"code"`
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Version     int             `json:"version"`
	Status      string          `json:"status"`
	Definition  json.RawMessage `json:"definition"`
	CreatedAt   time.Time       `json:"createdAt"`
	UpdatedAt   time.Time       `json:"updatedAt"`
}

// ProcessCreateInput describes payload to create process.
type ProcessCreateInput struct {
	Code        string          `json:"code"`
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Definition  json.RawMessage `json:"definition"`
}

// ProcessUpdateInput lists mutable fields.
type ProcessUpdateInput struct {
	Name        *string          `json:"name"`
	Description *string          `json:"description"`
	Status      *string          `json:"status"`
	Definition  *json.RawMessage `json:"definition"`
	Version     *int             `json:"version"`
}

// Form represents BPM form schema.
type Form struct {
	ID        string          `json:"id"`
	ProcessID string          `json:"processId"`
	Code      string          `json:"code"`
	Name      string          `json:"name"`
	Version   int             `json:"version"`
	Schema    json.RawMessage `json:"schema"`
	UISchema  json.RawMessage `json:"uiSchema"`
	CreatedAt time.Time       `json:"createdAt"`
	UpdatedAt time.Time       `json:"updatedAt"`
}

// FormCreateInput payload to create form.
type FormCreateInput struct {
	ProcessID string          `json:"processId"`
	Code      string          `json:"code"`
	Name      string          `json:"name"`
	Schema    json.RawMessage `json:"schema"`
	UISchema  json.RawMessage `json:"uiSchema"`
}

// FormUpdateInput mutable fields of form.
type FormUpdateInput struct {
	Name     *string          `json:"name"`
	Version  *int             `json:"version"`
	Schema   *json.RawMessage `json:"schema"`
	UISchema *json.RawMessage `json:"uiSchema"`
}

// Task represents workflow task.
type Task struct {
	ID        string          `json:"id"`
	ProcessID string          `json:"processId"`
	Code      string          `json:"code"`
	Title     string          `json:"title"`
	Status    string          `json:"status"`
	Assignee  string          `json:"assignee"`
	DueAt     *time.Time      `json:"dueAt,omitempty"`
	Payload   json.RawMessage `json:"payload"`
	CreatedAt time.Time       `json:"createdAt"`
	UpdatedAt time.Time       `json:"updatedAt"`
}

// TaskCreateInput payload to create task.
type TaskCreateInput struct {
	ProcessID string          `json:"processId"`
	Code      string          `json:"code"`
	Title     string          `json:"title"`
	Assignee  string          `json:"assignee"`
	DueAt     string          `json:"dueAt"`
	Payload   json.RawMessage `json:"payload"`
}

// TaskUpdateInput mutable fields.
type TaskUpdateInput struct {
	Title    *string          `json:"title"`
	Status   *string          `json:"status"`
	Assignee *string          `json:"assignee"`
	DueAt    *string          `json:"dueAt"`
	Payload  *json.RawMessage `json:"payload"`
}

// ProcessListFilter defines filters.
type ProcessListFilter struct {
	Limit  int
	Status string
}

// TaskListFilter defines filters for tasks.
type TaskListFilter struct {
	Limit  int
	Status string
}

// AssignmentRule describes automatic assignment setup.
type AssignmentRule struct {
	ID         string          `json:"id"`
	ProcessID  string          `json:"processId"`
	TaskCode   string          `json:"taskCode"`
	Priority   int             `json:"priority"`
	RuleType   string          `json:"ruleType"`
	RuleValue  string          `json:"ruleValue"`
	Conditions json.RawMessage `json:"conditions"`
	CreatedAt  time.Time       `json:"createdAt"`
	UpdatedAt  time.Time       `json:"updatedAt"`
}

// AssignmentRuleCreateInput payload to create assignment rule.
type AssignmentRuleCreateInput struct {
	ProcessID  string          `json:"processId"`
	TaskCode   string          `json:"taskCode"`
	Priority   int             `json:"priority"`
	RuleType   string          `json:"ruleType"`
	RuleValue  string          `json:"ruleValue"`
	Conditions json.RawMessage `json:"conditions"`
}

// AssignmentRuleUpdateInput mutable fields of assignment rule.
type AssignmentRuleUpdateInput struct {
	Priority   *int             `json:"priority"`
	RuleType   *string          `json:"ruleType"`
	RuleValue  *string          `json:"ruleValue"`
	Conditions *json.RawMessage `json:"conditions"`
}

// Escalation describes escalation policy for tasks.
type Escalation struct {
	ID               string          `json:"id"`
	TaskID           string          `json:"taskId"`
	ThresholdMinutes int             `json:"thresholdMinutes"`
	EscalateTo       string          `json:"escalateTo"`
	Policy           string          `json:"policy"`
	Metadata         json.RawMessage `json:"metadata"`
	CreatedAt        time.Time       `json:"createdAt"`
	UpdatedAt        time.Time       `json:"updatedAt"`
}

// EscalationCreateInput payload to create escalation rule.
type EscalationCreateInput struct {
	TaskID           string          `json:"taskId"`
	ThresholdMinutes int             `json:"thresholdMinutes"`
	EscalateTo       string          `json:"escalateTo"`
	Policy           string          `json:"policy"`
	Metadata         json.RawMessage `json:"metadata"`
}

// EscalationUpdateInput mutable fields of escalation.
type EscalationUpdateInput struct {
	ThresholdMinutes *int             `json:"thresholdMinutes"`
	EscalateTo       *string          `json:"escalateTo"`
	Policy           *string          `json:"policy"`
	Metadata         *json.RawMessage `json:"metadata"`
}
