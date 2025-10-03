package analytics

import (
	"context"
	"encoding/base64"
	"encoding/csv"
	"fmt"
	"strings"
	"time"

	"github.com/rs/zerolog"
)

// Service contains analytics business logic exposed by gateway.
type Service struct {
	repo   *Repository
	logger zerolog.Logger
}

// NewService constructs analytics service.
func NewService(repo *Repository, logger zerolog.Logger) *Service {
	return &Service{repo: repo, logger: logger.With().Str("component", "gateway.analytics.service").Logger()}
}

// ConversionReport returns aggregated conversion data with computed rates.
func (s *Service) ConversionReport(ctx context.Context, bounds ReportRange) ([]ConversionRow, error) {
	rows, err := s.repo.ConversionReport(ctx, bounds.From, bounds.To)
	if err != nil {
		return nil, err
	}

	for i := range rows {
		if rows[i].TotalCount > 0 {
			rows[i].ConversionRate = float64(rows[i].WonCount) / float64(rows[i].TotalCount)
		}
	}

	return rows, nil
}

// ManagerLoadReport returns manager aggregation data.
func (s *Service) ManagerLoadReport(ctx context.Context, bounds ReportRange) ([]ManagerLoadRow, error) {
	return s.repo.ManagerLoad(ctx, bounds.From, bounds.To)
}

// ConversionExport builds CSV export for conversion metrics.
func (s *Service) ConversionExport(ctx context.Context, bounds ReportRange) (ExportFile, error) {
	rows, err := s.ConversionReport(ctx, bounds)
	if err != nil {
		return ExportFile{}, err
	}

	content, err := buildConversionCSV(rows)
	if err != nil {
		return ExportFile{}, err
	}

	return ExportFile{
		FileName:      fmt.Sprintf("conversion-%s-%s.csv", bounds.From.Format("20060102"), bounds.To.Format("20060102")),
		MimeType:      "text/csv",
		ContentBase64: base64.StdEncoding.EncodeToString([]byte(content)),
		GeneratedAt:   time.Now().UTC(),
	}, nil
}

// ManagerLoadExport builds CSV export for manager load metrics.
func (s *Service) ManagerLoadExport(ctx context.Context, bounds ReportRange) (ExportFile, error) {
	rows, err := s.ManagerLoadReport(ctx, bounds)
	if err != nil {
		return ExportFile{}, err
	}

	content, err := buildManagerLoadCSV(rows)
	if err != nil {
		return ExportFile{}, err
	}

	return ExportFile{
		FileName:      fmt.Sprintf("manager-load-%s-%s.csv", bounds.From.Format("20060102"), bounds.To.Format("20060102")),
		MimeType:      "text/csv",
		ContentBase64: base64.StdEncoding.EncodeToString([]byte(content)),
		GeneratedAt:   time.Now().UTC(),
	}, nil
}

func buildConversionCSV(rows []ConversionRow) (string, error) {
	var sb strings.Builder
	writer := csv.NewWriter(&sb)
	if err := writer.Write([]string{"period", "total_count", "won_count", "total_amount", "won_amount", "conversion_rate"}); err != nil {
		return "", err
	}
	for _, row := range rows {
		record := []string{
			row.Period.Format(time.RFC3339),
			fmt.Sprintf("%d", row.TotalCount),
			fmt.Sprintf("%d", row.WonCount),
			fmt.Sprintf("%.2f", row.TotalAmount),
			fmt.Sprintf("%.2f", row.WonAmount),
			fmt.Sprintf("%.4f", row.ConversionRate),
		}
		if err := writer.Write(record); err != nil {
			return "", err
		}
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		return "", err
	}
	return sb.String(), nil
}

func buildManagerLoadCSV(rows []ManagerLoadRow) (string, error) {
	var sb strings.Builder
	writer := csv.NewWriter(&sb)
	if err := writer.Write([]string{"manager", "total_count", "total_amount"}); err != nil {
		return "", err
	}
	for _, row := range rows {
		record := []string{
			row.Manager,
			fmt.Sprintf("%d", row.TotalCount),
			fmt.Sprintf("%.2f", row.TotalAmount),
		}
		if err := writer.Write(record); err != nil {
			return "", err
		}
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		return "", err
	}
	return sb.String(), nil
}
