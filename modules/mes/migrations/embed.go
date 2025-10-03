package migrations

import "embed"

// Files embeds SQL migration files for MES service.
//
//go:embed *.sql
var Files embed.FS
