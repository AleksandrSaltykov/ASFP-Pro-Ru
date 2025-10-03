# AutoClaude Project Context

Generated at: 2025-10-03T15:24:39.155Z

---

# Project Context

## Workspace
- **Root**: /Users/aleksandrsaltykov/работа/ИИ/ASFP-Pro-ru
- **Type**: single
- **Last Updated**: 2025-10-03T15:23:39.148Z

## Statistics
- **Total Files**: 326
- **Estimated Lines**: 39737
- **Average File Size**: 78945 bytes

## Languages
- **go**: 40861698 files
- **json**: 31832838 files
- **c**: 25537349 files
- **markdown**: 21488454 files
- **sql**: 5411074 files
- **shellscript**: 2977148 files
- **yaml**: 2880378 files
- **html**: 2269941 files
- **css**: 1583843 files
- **typescriptreact**: 1253980 files
- **typescript**: 1103293 files
- **xml**: 774920 files
- **javascript**: 722718 files
- **lua**: 362137 files
- **cpp**: 88239 files
- **python**: 25949 files

## Project Structure
- **Main Languages**: Not detected
- **Frameworks**: None detected
- **Test Frameworks**: None detected
- **Build Tools**: None detected

## Configuration Files



## Largest Files
- gateway/bin/gateway (23413KB)
- pnpm-lock.yaml (144KB)
- gateway/docs/openapi/openapi.json (127KB)
- tests/smoke/smoke_test.go (61KB)
- apps/web/src/pages/wms/InventoryPage.tsx (40KB)
- PROGRESS.md (37KB)
- modules/wms/internal/handler/masterdata_handler.go (31KB)
- docs/backup/wms-legacy-frontend-20251003.tar.gz (29KB)
- apps/web/src/pages/wms/components/WarehouseMasterData.tsx (29KB)
- apps/web/src/pages/wms/useInventoryDashboardData.ts (23KB)


---

# Task Summary

## Overall Statistics
- **Total Tasks**: 0
- **Pending**: 0
- **In Progress**: 0
- **Completed**: 0
- **Failed**: 0

## Current Session
- **Session ID**: mgazw7wh-v0p0vpo
- **Started**: 2025-10-03T15:24:39.041Z
- **Tasks in Session**: 0

## Recent Tasks



---

## Unfinished Tasks
No unfinished tasks

---

## Recent Changes

### Git Status
```
 M .autoclaude/CLAUDE_CONTEXT.md
 M .autoclaude/cache/project-index.json
 M .autoclaude/tasks/sessions.json
 M Makefile
MM PROGRESS.md
 M README.md
 M apps/web/README.md
A  apps/web/e2e/admin-rbac.spec.ts
A  apps/web/e2e/crm-deals.spec.ts
 M apps/web/src/app/routes.tsx
 M apps/web/src/main.tsx
AM apps/web/src/pages/admin/ApiTokensPage.tsx
 M apps/web/src/pages/admin/AuditLogPage.tsx
AM apps/web/src/pages/admin/OrgUnitsPage.tsx
 M apps/web/src/pages/crm/DealsPage.tsx
 M apps/web/src/pages/files/FilesPage.tsx
 M apps/web/src/pages/services/ServicesPage.tsx
 M apps/web/src/pages/tasks/TasksProjectsPage.tsx
 D apps/web/src/pages/wms/InventoryPage.tsx
 D apps/web/src/pages/wms/components/CellForm.tsx
 D apps/web/src/pages/wms/components/WarehouseForm.tsx
 D apps/web/src/pages/wms/components/WarehouseMasterData.tsx
 D apps/web/src/pages/wms/components/ZoneForm.tsx
 D apps/web/src/pages/wms/useInventoryDashboardData.ts
AM apps/web/src/shared/api/basic-auth.ts
AM apps/web/src/shared/api/core/index.ts
 M apps/web/src/shared/api/http-client.ts
 M apps/web/src/shared/api/index.ts
 M apps/web/src/shared/api/mocks/browser.ts
AM apps/web/src/shared/api/mocks/handlers.ts
 M apps/web/src/shared/api/wms/inventory.ts
 M apps/web/src/shared/api/wms/types.ts
 M apps/web/src/shared/state/ui-slice.ts
 M apps/web/src/widgets/layout/AppSidebar.tsx
 M apps/web/src/widgets/stepper/OrderStepper.test.tsx
 M apps/web/vitest.config.ts
 M deploy/.env.example
 M deploy/docker-compose.yml
 M deploy/init/clickhouse/00_create_tables.sql
M  deploy/init/postgres/10_core_schema.sql
 M deploy/init/postgres/20_crm_schema.sql
 M deploy/init/postgres/30_wms_schema.sql
MM deploy/init/postgres/seed/10_core.sql
 M deploy/init/postgres/seed/20_crm.sql
 M deploy/init/postgres/seed/30_wms.sql
 M docs/frontend/README.md
M  docs/roadmap.md
 M gateway/cmd/gateway/main.go
MM gateway/docs/openapi/openapi.json
 M gateway/internal/auth/service.go
A  gateway/internal/core/errors.go
AM gateway/internal/core/model.go
AM gateway/internal/core/repository.go
AM gateway/internal/core/service.go
 M gateway/internal/handlers/audit.go
 M gateway/internal/handlers/auth_context.go
AM gateway/internal/handlers/core.go
 M gateway/internal/handlers/health.go
AM gateway/internal/http/permission_middleware.go
 M gateway/internal/http/server.go
 M modules/analytics/Dockerfile
 M modules/analytics/cmd/api/main.go
 M modules/analytics/internal/http/report_handler.go
 M modules/analytics/internal/http/server.go
 M modules/crm/internal/entity/deal.go
 M modules/crm/internal/repository/deal_repository.go
 M modules/crm/internal/service/deal_service.go
 M modules/crm/migrations/0002_seed_demo.sql
 M modules/wms/internal/entity/warehouse.go
 M modules/wms/internal/repository/masterdata_repository.go
 M modules/wms/internal/service/masterdata_service.go
A  pkg/db/migrations/core/0004_add_rbac_structures.sql
 M tests/smoke/demo_data_test.go
MM tests/smoke/smoke_test.go
?? apps/web/.env.example
?? apps/web/e2e/auth-me.spec.ts
?? apps/web/e2e/rbac-forbidden.spec.ts
?? apps/web/src/pages/warehouse/
?? apps/web/src/shared/api/analytics/
?? apps/web/src/shared/api/bpm/
?? apps/web/src/shared/api/crm/
?? apps/web/src/shared/api/docs/
?? apps/web/src/shared/api/gateway/
?? apps/web/src/shared/api/wms/stock.ts
?? apps/web/src/shared/hooks/
?? apps/web/src/shared/ui/PermissionGuard.tsx
?? deploy/init/clickhouse/10_seed_demo.sql
?? deploy/init/postgres/40_mes_schema.sql
?? deploy/init/postgres/50_montage_schema.sql
?? deploy/init/postgres/60_docs_schema.sql
?? deploy/init/postgres/70_bpm_schema.sql
?? deploy/init/postgres/seed/40_mes.sql
?? deploy/init/postgres/seed/50_montage.sql
?? deploy/init/postgres/seed/60_docs.sql
?? deploy/init/postgres/seed/70_bpm.sql
?? docs/backup/
?? docs/masterdata/
?? gateway/bin/
?? gateway/internal/analytics/
?? gateway/internal/bpm/
?? gateway/internal/crm/
?? gateway/internal/docs/
?? gateway/internal/handlers/analytics.go
?? gateway/internal/handlers/auth.go
?? gateway/internal/handlers/bpm.go
?? gateway/internal/handlers/crm.go
?? gateway/internal/handlers/docs.go
?? gateway/internal/handlers/mes.go
?? gateway/internal/handlers/montage.go
?? gateway/internal/handlers/wms.go
?? gateway/internal/mes/
?? gateway/internal/montage/
?? gateway/internal/wms/
?? modules/analytics/docs/
?? modules/analytics/internal/http/openapi.go
?? modules/bpm/Dockerfile
?? modules/bpm/cmd/
?? modules/bpm/docs/
?? modules/bpm/internal/
?? modules/bpm/migrations/
?? modules/crm/migrations/0003_add_org_unit_to_deals.sql
?? modules/docs/Dockerfile
?? modules/docs/cmd/
?? modules/docs/docs/
?? modules/docs/internal/
?? modules/docs/migrations/
?? modules/mes/Dockerfile
?? modules/mes/cmd/
?? modules/mes/docs/
?? modules/mes/internal/
?? modules/mes/migrations/
?? modules/montage/Dockerfile
?? modules/montage/cmd/
?? modules/montage/docs/
?? modules/montage/internal/
?? modules/montage/migrations/
?? modules/wms/migrations/0005_add_org_unit_to_warehouse.sql
?? testfile.txt

```

### Recent Commits
```
eb0a447 docs: refresh roadmap and module status
4237450 feat: automate demo data refresh and audit filters
6267f89 Normalize core/CRM migrations and extend CI checks
c1004d2 Add migration rollback helpers and CI migration checks
5e86047 Refresh docs and stabilize WMS master data
4439dc0 UI: light-theme polish and RU localization refinements
48879fb WMS: исправление category_path и обновление документации
3f08c23 chore(wms): seed dynamic catalog demo data
c96480d feat: add dynamic master data scaffolding
0d0bfed Add WMS master data module and tooling updates

```

---

## Current File Context
# File Context: deploy/init/postgres/30_wms_schema.sql

- **Size**: 2724 bytes
- **Language**: sql
- **Last Modified**: 2025-09-30T18:14:04.594Z
- **Hash**: fa39cec96ec76fa4de0abd6f555ffa2d


### Visible Content (first 50 lines)
```sql
CREATE SCHEMA IF NOT EXISTS wms;

CREATE TABLE IF NOT EXISTS wms.warehouse (
    id UUID PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    address JSONB NOT NULL DEFAULT '{}'::jsonb,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    status TEXT NOT NULL DEFAULT 'active',
    operating_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
    contact JSONB NOT NULL DEFAULT '{}'::jsonb,
    org_unit_code TEXT NOT NULL REFERENCES core.org_units(code),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wms.warehouse_zone (
    id UUID PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES wms.warehouse(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    zone_type TEXT NOT NULL,
    is_buffer BOOLEAN NOT NULL DEFAULT FALSE,
    temperature_min NUMERIC(10,2),
    temperature_max NUMERIC(10,2),
    hazard_class TEXT,
    access_restrictions JSONB NOT NULL DEFAULT '[]'::jsonb,
    layout JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (warehouse_id, code)
);

CREATE TABLE IF NOT EXISTS wms.warehouse_cell (
    id UUID PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES wms.warehouse(id) ON DELETE CASCADE,
    zone_id UUID NOT NULL REFERENCES wms.warehouse_zone(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    label TEXT,
    address JSONB NOT NULL DEFAULT '{}'::jsonb,
    cell_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    is_pick_face BOOLEAN NOT NULL DEFAULT FALSE,
```