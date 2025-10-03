# How-To: extend WMS directories without migrations

This guide explains how to add new directories (catalog nodes) and dynamic attributes to WMS
without shipping additional goose migrations. The workflow relies on modular seed SQL files
consumed by `make seed`, `make refresh-demo`, and CI.

## Prerequisites
- PostgreSQL with the `uuid-ossp` extension (initialised by the docker compose stack).
- `DATABASE_URL` exported so that `make migrate-*` and `make seed` can reach the database.
- Seed entry point `deploy/init/postgres/99_seed.sql` is used as the default target for `make seed`.

## Adding a new directory
1. Decide on the logical `catalog_type` and stable `code`. For brand new types add a constant
   in `modules/wms/internal/entity/catalog.go` and handle it in `normalizeCatalogType` inside
   `modules/wms/internal/service/masterdata_service.go`.
2. Append the seed SQL to `deploy/init/postgres/seed/30_wms.sql` or create a dedicated file
   such as `deploy/init/postgres/seed/35_wms_catalogs.sql`. Remember to reference the new file
   in `deploy/init/postgres/99_seed.sql` via `\ir seed/35_wms_catalogs.sql`.
3. Use `INSERT ... ON CONFLICT DO UPDATE` together with `uuid_generate_v4()` or deterministic
   UUIDs to keep seeds idempotent. Example snippet:
   ```sql
   INSERT INTO wms.catalog_node (catalog_type, parent_id, code, name, description, level, path, metadata, sort_order, is_active)
   VALUES ('category', root.id, 'SIGNAGE', 'Signage', 'Root category for signage', 1,
           root.path || '.SIGNAGE', '{"system": false}'::jsonb, 10, TRUE)
   ON CONFLICT (catalog_type, code) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       metadata = EXCLUDED.metadata,
       sort_order = EXCLUDED.sort_order,
       is_active = EXCLUDED.is_active,
       updated_at = NOW();
   ```
4. Run `make seed` or `make refresh-demo` to apply the change locally. Both commands execute
   inside the postgres container and load every file under `seed/*.sql` in order.
5. Commit the updated seed file. Goose migrations stay untouched.

## Adding dynamic attributes without migrations
1. Reuse `deploy/init/postgres/seed/30_wms.sql` or add a new module file such as
   `deploy/init/postgres/seed/36_wms_attributes.sql`.
2. Insert templates into `wms.attribute_templates` with an `ON CONFLICT` guard on
   `(target_type, code)`:
   ```sql
   INSERT INTO wms.attribute_templates (
       id, code, name, description, target_type, data_type, is_required, metadata, ui_schema, position
   ) VALUES (
       '30000000-0000-0000-0000-000000000001', 'material', 'Material', 'Base material', 'item', 'string', TRUE,
       '{"example": "ACP"}'::jsonb, '{"component": "Select", "options": ["ACP", "PVC", "Plastic"]}'::jsonb, 50
   )
   ON CONFLICT (target_type, code) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       metadata = EXCLUDED.metadata,
       ui_schema = EXCLUDED.ui_schema,
       position = EXCLUDED.position,
       updated_at = NOW();
   ```
   Add demo values to `wms.attribute_values` in the same seed when you need sample data.
   Stick to deterministic UUIDs so tests can reference them.
3. Extend `docs/masterdata/dynamic-attributes.md` if new `metadata` or `uiSchema` conventions appear.
4. Run `make seed` and `make check-demo` to ensure the demo checks succeed with the new data.

## Minimum testing requirements
- **Unit and integration (Go)**: `go test ./modules/...` must stay green. When handlers or services change,
  extend tests in `modules/wms/internal/service` or `modules/wms/internal/handler` (see `masterdata_handler_test.go`).
- **Repository and SQL checks**: when seeds introduce new entities, add coverage in
  `tests/smoke/demo_data_test.go` or create an additional smoke test that queries the HTTP API.
- **Smoke**: run `make smoke` locally or rely on the GitHub Actions `smoke` job. Add explicit
  assertions for newly seeded directories or attributes.
- **E2E/Playwright**: update `apps/web/e2e/master-data.spec.ts` (or add a new spec) if the UI needs to display
  the new directory or attribute.
- **Linters**: keep `make lint`, `go fmt`, and `pnpm lint` clean whenever related code changes.

## Pre-PR checklist
1. `make refresh-demo`
2. `make check-demo`
3. `go test ./...`
4. `make smoke` (optional but recommended)
5. `pnpm lint` / `pnpm test` inside `apps/web` when UI logic is affected

Document the results in `PROGRESS.md` together with the roadmap reference.
