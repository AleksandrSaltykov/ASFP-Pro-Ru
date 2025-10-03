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

	"asfppro/modules/docs/internal/entity"
	"asfppro/modules/docs/internal/repository"
	"asfppro/modules/docs/internal/service"
	"asfppro/pkg/db"
)

func TestService_DocumentFlow(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping docs integration test in short mode")
	}

	dsn := os.Getenv("DOCS_DATABASE_URL")
	if dsn == "" {
		dsn = os.Getenv("DATABASE_URL")
	}
	if dsn == "" {
		t.Skip("DOCS_DATABASE_URL not configured")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := db.NewPostgresPool(ctx, dsn)
	require.NoError(t, err)
	defer pool.Close()

	cleanup(ctx, t, pool)
	seedSequence(ctx, t, pool)

	repo := repository.New(pool)
	logger := zerolog.New(os.Stdout).Level(zerolog.Disabled)
	svc := service.New(repo, logger)

	tpl, err := svc.CreateTemplate(ctx, entity.TemplateCreateInput{
		Code: "TEST_TEMPLATE",
		Name: "Test Template",
		Body: json.RawMessage(`{"fields":["name"]}`),
	})
	require.NoError(t, err)
	require.Equal(t, "TEST_TEMPLATE", tpl.Code)

	updatedName := "Test Template Updated"
	tpl, err = svc.UpdateTemplate(ctx, uuid.MustParse(tpl.ID), entity.TemplateUpdateInput{
		Name: &updatedName,
	})
	require.NoError(t, err)
	require.Equal(t, updatedName, tpl.Name)

	signer, err := svc.CreateSigner(ctx, entity.SignerCreateInput{
		Code:     "TEST_SIGNER",
		FullName: "QA Manager",
		Email:    "qa@example.com",
	})
	require.NoError(t, err)

	payload := json.RawMessage(`{"project":"Alpha"}`)
	doc, err := svc.CreateDocument(ctx, entity.DocumentCreateInput{
		TemplateID:   tpl.ID,
		SequenceCode: "DOC-TEST",
		Title:        "Alpha Document",
		Payload:      payload,
		SignerIDs:    []string{signer.ID},
	})
	require.NoError(t, err)
	require.Len(t, doc.Signers, 1)
	require.Equal(t, "pending", doc.Signers[0].Status)

	signerStatus := entity.DocumentSignerStatusInput{SignerID: signer.ID, Status: "signed"}
	newStatus := "signed"
	doc, err = svc.UpdateDocument(ctx, uuid.MustParse(doc.ID), entity.DocumentUpdateInput{
		Status:         &newStatus,
		SignerStatuses: []entity.DocumentSignerStatusInput{signerStatus},
	})
	require.NoError(t, err)
	require.Equal(t, "signed", doc.Status)
	require.Equal(t, "signed", doc.Signers[0].Status)

	docs, err := svc.ListDocuments(ctx, entity.DocumentListFilter{Limit: 10, Status: "signed"})
	require.NoError(t, err)
	require.Len(t, docs, 1)
	require.Equal(t, doc.ID, docs[0].ID)
}

func cleanup(ctx context.Context, t *testing.T, pool *pgxpool.Pool) {
	t.Helper()
	_, err := pool.Exec(ctx, `TRUNCATE docs.document_signer, docs.document, docs.signer, docs.template CASCADE`)
	require.NoError(t, err)
}

func seedSequence(ctx context.Context, t *testing.T, pool *pgxpool.Pool) {
	t.Helper()
	_, err := pool.Exec(ctx, `INSERT INTO docs.number_sequence (id, code, prefix, padding, current_value) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (code) DO UPDATE SET prefix = EXCLUDED.prefix`, uuid.New(), "DOC-TEST", "DT-", 4, 0)
	require.NoError(t, err)
}
