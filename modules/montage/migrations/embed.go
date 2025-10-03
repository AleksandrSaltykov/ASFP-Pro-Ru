package migrations

import "embed"

// Files embeds SQL migration files for Montage service.
//
//go:embed *.sql
var Files embed.FS
