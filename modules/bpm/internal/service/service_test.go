package service_test

import (
	"context"
	"encoding/json"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/require"

	"asfppro/modules/bpm/internal/entity"
	"asfppro/modules/bpm/internal/repository"
	"asfppro/modules/bpm/internal/service"
	"asfppro/pkg/db"
)

func TestService_BPMFlow(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping bpm integration test in short mode")
	}

	dsn := os.Getenv("BPM_DATABASE_URL")
	if dsn == "" {
		dsn = os.Getenv("DATABASE_URL")
	}
	if dsn == "" {
		t.Skip("BPM_DATABASE_URL not configured")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := db.NewPostgresPool(ctx, dsn)
	require.NoError(t, err)
	defer pool.Close()

	cleanup(ctx, t, pool)

	repo := repository.New(pool)
	logger := zerolog.New(os.Stdout).Level(zerolog.Disabled)
	svc := service.New(repo, logger)

	proc, err := svc.CreateProcess(ctx, entity.ProcessCreateInput{
		Code:        "ONBOARD_AUTO",
		Name:        "Авто-процесс",
		Description: "Автоматический тестовый процесс",
		Definition:  json.RawMessage(`{"steps":["a","b"]}`),
	})
	require.NoError(t, err)
	require.Equal(t, "ONBOARD_AUTO", proc.Code)

	newStatus := "published"
	proc, err = svc.UpdateProcess(ctx, uuid.MustParse(proc.ID), entity.ProcessUpdateInput{Status: &newStatus})
	require.NoError(t, err)
	require.Equal(t, "published", proc.Status)

	form, err := svc.CreateForm(ctx, entity.FormCreateInput{
		ProcessID: proc.ID,
		Code:      "AUTO_FORM",
		Name:      "Форма",
		Schema:    json.RawMessage(`{"fields":["x"]}`),
		UISchema:  json.RawMessage(`{"layout":"single"}`),
	})
	require.NoError(t, err)
	require.Equal(t, "AUTO_FORM", form.Code)

	newVersion := 2
	form, err = svc.UpdateForm(ctx, uuid.MustParse(form.ID), entity.FormUpdateInput{Version: &newVersion})
	require.NoError(t, err)
	require.Equal(t, 2, form.Version)

	task, err := svc.CreateTask(ctx, entity.TaskCreateInput{
		ProcessID: proc.ID,
		Code:      "AUTO_TASK",
		Title:     "Выполнить шаг",
		Assignee:  "user1",
		DueAt:     time.Now().Add(24 * time.Hour).UTC().Format(time.RFC3339),
		Payload:   json.RawMessage(`{"attempt":1}`),
	})
	require.NoError(t, err)
	require.Equal(t, "user1", task.Assignee)

	statusCompleted := "completed"
	task, err = svc.UpdateTask(ctx, uuid.MustParse(task.ID), entity.TaskUpdateInput{Status: &statusCompleted})
	require.NoError(t, err)
	require.Equal(t, "completed", task.Status)

	tasks, err := svc.ListTasks(ctx, entity.TaskListFilter{Limit: 10, Status: "completed"})
	require.NoError(t, err)
	require.Len(t, tasks, 1)
}

func cleanup(ctx context.Context, t *testing.T, pool *pgxpool.Pool) {
	t.Helper()
	_, err := pool.Exec(ctx, `TRUNCATE bpm.escalation, bpm.assignment_rule, bpm.task, bpm.form, bpm.process_definition CASCADE`)
	require.NoError(t, err)
}
