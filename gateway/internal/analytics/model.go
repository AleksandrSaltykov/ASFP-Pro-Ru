package analytics

import "time"

// ConversionRow describes aggregated conversion metrics.
type ConversionRow struct {
	Period         time.Time
	TotalCount     uint64
	WonCount       uint64
	TotalAmount    float64
	WonAmount      float64
	ConversionRate float64
}

// ManagerLoadRow aggregates deal counts by manager.
type ManagerLoadRow struct {
	Manager     string
	TotalCount  uint64
	TotalAmount float64
}

// ExportFile represents generated export payload.
type ExportFile struct {
	FileName      string
	MimeType      string
	ContentBase64 string
	GeneratedAt   time.Time
}

// ReportRange bounds report time range.
type ReportRange struct {
	From time.Time
	To   time.Time
}
