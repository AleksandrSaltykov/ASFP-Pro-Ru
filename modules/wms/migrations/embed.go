package migrations

import "embed"

// Files embeds SQL migration files for WMS service.
//
//go:embed *.sql
var Files embed.FS
