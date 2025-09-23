package config

import (
	"testing"
)

func TestLoadDefaults(t *testing.T) {
	t.Setenv("SERVICE_DATABASE_URL", "postgres://user:pass@localhost:5432/app?sslmode=disable")
	cfg, err := Load("SERVICE")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if cfg.HTTPPort != "8080" {
		t.Fatalf("expected default http port 8080, got %s", cfg.HTTPPort)
	}

	if cfg.S3Bucket != "asfp-files" {
		t.Fatalf("unexpected bucket: %s", cfg.S3Bucket)
	}
}

func TestLoadMissingDatabase(t *testing.T) {
	t.Setenv("BROKEN_DATABASE_URL", "")
	if _, err := Load("BROKEN"); err == nil {
		t.Fatal("want error for missing database url")
	}
}
