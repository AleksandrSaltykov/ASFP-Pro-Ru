package migrations

import "embed"

// Files embeds SQL migration files for Docs service.
//
//go:embed *.sql
var Files embed.FS
