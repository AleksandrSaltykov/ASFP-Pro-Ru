package migrations

import "embed"

// Files embeds SQL migration files for BPM service.
//
//go:embed *.sql
var Files embed.FS
