#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT"

echo "▶️  Checking gofmt"
GO_SOURCES=$(git ls-files -z -- '*.go' ':!:vendor/*')
if [[ -n "$GO_SOURCES" ]]; then
  NEED_FORMAT=$(printf "%s" "$GO_SOURCES" | xargs -0 gofmt -l)
  if [[ -n "$NEED_FORMAT" ]]; then
    echo "The following Go files need formatting:"
    echo "$NEED_FORMAT"
    exit 1
  fi
else
  echo "No Go sources found, skipping gofmt"
fi

echo "▶️  Running golangci-lint"
if ! command -v golangci-lint >/dev/null 2>&1; then
  echo "golangci-lint not found. Install with: go install github.com/golangci/golangci-lint/cmd/golangci-lint@v1.61.0"
  exit 1
fi
golangci-lint run ./...

echo "▶️  Running go test ./..."
go test ./...

echo "▶️  Installing frontend dependencies (pnpm)"
corepack enable >/dev/null 2>&1 || true
pnpm install

echo "▶️  Building frontend"
pnpm --filter web build

echo "✅  Local CI checks finished successfully."
