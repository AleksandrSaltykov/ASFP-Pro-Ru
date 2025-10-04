# AutoClaude Project Context

Generated at: 2025-10-04T15:43:17.944Z

---

# Project Context

## Workspace
- **Root**: /Users/aleksandrsaltykov/работа/ИИ/ASFP-Pro-ru
- **Type**: single
- **Last Updated**: 2025-10-04T15:42:50.492Z

## Statistics
- **Total Files**: 328
- **Estimated Lines**: 39008
- **Average File Size**: 78399 bytes

## Languages
- **go**: 41115990 files
- **json**: 31888212 files
- **c**: 25537349 files
- **markdown**: 21519744 files
- **sql**: 5477826 files
- **shellscript**: 3006352 files
- **yaml**: 2890808 files
- **html**: 2274113 files
- **css**: 1585929 files
- **typescriptreact**: 1332383 files
- **typescript**: 1196888 files
- **xml**: 774920 files
- **javascript**: 724804 files
- **lua**: 364223 files
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
- apps/web/src/shared/api/mocks/handlers.ts (43KB)
- PROGRESS.md (39KB)
- modules/wms/internal/handler/masterdata_handler.go (34KB)
- docs/backup/wms-legacy-frontend-20251003.tar.gz (29KB)
- modules/wms/internal/service/masterdata_service.go (24KB)
- modules/wms/docs/openapi/openapi.json (23KB)


---

# Task Summary

## Overall Statistics
- **Total Tasks**: 0
- **Pending**: 0
- **In Progress**: 0
- **Completed**: 0
- **Failed**: 0

## Current Session
- **Session ID**: mgc6j99y-72rf17c
- **Started**: 2025-10-04T11:18:17.782Z
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
 M PROGRESS.md
 M apps/web/src/app/routes.tsx
 M apps/web/src/pages/warehouse/WarehouseModule.tsx
 M apps/web/src/pages/warehouse/components/SlideOver.tsx
 M apps/web/src/pages/warehouse/structure.ts
 M apps/web/src/shared/api/mocks/handlers.ts
 M apps/web/src/shared/api/wms/catalog.ts
 M apps/web/src/shared/api/wms/types.ts
 M deploy/nginx/nginx.conf
 M modules/wms/docs/openapi/openapi.json
 M modules/wms/internal/handler/masterdata_handler.go
 M modules/wms/internal/handler/masterdata_handler_test.go
 M modules/wms/internal/repository/catalog_repository.go
 M modules/wms/internal/service/masterdata_service.go
 M modules/wms/migrations/0005_add_org_unit_to_warehouse.sql
?? apps/web/e2e/wms-masterdata.spec.ts
?? apps/web/src/pages/warehouse/masters/

```

### Recent Commits
```
6adef93 chore: update autoclaude cache
b46de1b feat: sync erp modules and warehouse ui
eb0a447 docs: refresh roadmap and module status
4237450 feat: automate demo data refresh and audit filters
6267f89 Normalize core/CRM migrations and extend CI checks
c1004d2 Add migration rollback helpers and CI migration checks
5e86047 Refresh docs and stabilize WMS master data
4439dc0 UI: light-theme polish and RU localization refinements
48879fb WMS: исправление category_path и обновление документации
3f08c23 chore(wms): seed dynamic catalog demo data

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