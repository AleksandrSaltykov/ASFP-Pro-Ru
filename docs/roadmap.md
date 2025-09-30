# ASFP-Pro Roadmap

## Как пользоваться документом
1. Перед новой сессией прочитайте раздел **Текущая позиция** и **Следующий чекпоинт**.
2. После завершения задачи отметьте чекбокс в соответствующей фазе и добавьте запись в `PROGRESS.md`.
3. При отклонении от плана зафиксируйте решение здесь (под фазой) и в `PROGRESS.md`.

---

## Текущая позиция
- **Фаза:** Сервисные пласты (доменные API)
- **Акцент:** подготовка расширенного RBAC/аудита и BI-витрин поверх реализованных API.
- **Готовность по фазам:**
  - Фаза 1 (Фундамент): 100%  ✅ стабилизированы сиды/контракты и тесты.
  - Фаза 2 (Сервисные пласты): 80%  ▶︎ CRUD, сиды и smoke покрывают все домены; осталось расширить права и аудит.
  - Фаза 3 (UI & фичи): 10%  ⏳ базовые страницы подключены, дальнейшее UI зависит от фаз 1–2.

## Следующий чекпоинт
- Запустить расширенный RBAC (org units, permission matrix, API tokens) и прокинуть его через gateway.
- Расширить аудит/события и собрать BI-витрины (ClickHouse → Superset/Metabase) для CRM/WMS/Analytics.
- Согласовать e2e/Playwright сценарии для ключевых потоков (аутентификация, CRM сделки, WMS каталоги, BPM задачи).

---

## Фаза 1. Фундамент: динамические данные и инфраструктура
**Цель:** гарантировать, что BKN и БД поддерживают расширяемые справочники, сиды, аудит и тесты без ручных вмешательств.

### Чеклист
- [x] Перевести сиды на модульные файлы и автоматизировать `make refresh-demo` / `make check-demo`.
- [x] Добавить индексы и фильтры аудита (дата, action) + обновить smoke/e2e.
- [x] Описать контракт динамических атрибутов (прочие типы, validation) и ограничения.
- [x] Документировать процесс добавления нового справочника/атрибута (настроить README/док).
- [x] Определить правила тестового покрытия (unit/integration/e2e) для любых изменений в справочниках.

### Решения/заметки
- Seeds запускаем из контейнера PostgreSQL по пути `/docker-entrypoint-initdb.d/99_seed.sql`.
- Playwright e2e (directories) — обязательный шаг для проверки демо-данных.
- Контракт динамических атрибутов описан в docs/masterdata/dynamic-attributes.md.
- How-to и требования к тестам: docs/masterdata/how-to-extend-directories.md.

## Фаза 2. Сервисные пласты
**Цель:** выстроить API, связи и интеграции для доменов (CRM, WMS, производство и т.д.).

### Чеклист
- [x] Составить матрицу доменов -> необходимые справочники/связи.
- [x] Определить обязательные события/аудит/Swagger для новых модулей.
- [x] Зафиксировать минимальные API/seed/тесты для доменов.
- [x] Реализовать min viable API по каждому домену (CRUD, фильтры, аудит).
- [x] Обновить сиды/тесты под новые домены.
- [ ] Внедрить расширенный RBAC (org units, permission matrix, API tokens) и обновить gateway/core.
- [ ] Расширить аудит и событийну шину, подготовить ClickHouse витрины и BI-дэшборды.
- [ ] Завершить e2e/Playwright сценарии для CRM, WMS, BPM, Docs, Analytics.

### Решения/заметки
- При добавлении домена используем общие паттерны (аудит, события, smoke/e2e); фокус смещён на права и BI поверх существующих API.
- Матрица доменов/справочников: см. таблицу ниже.

#### Матрица доменов и справочников (обновлено 2025-09-30)

| Домен | Текущие справочники / master data | Планируемые справочники / связи | Зависимости и события |
| --- | --- | --- | --- |
| Core | `core.roles`, `core.users`, `core.user_roles`, `core.audit_log` | `core.org_units`, `core.permission_matrix`, `core.api_tokens` | RBAC и аудит для всех сервисов; события читают gateway и analytics |
| CRM | `crm.customers`, `crm.deals`, `crm.deal_events` | `crm.deal_stage`, `crm.deal_source`, `crm.contact`, `crm.deal_item` (ссылка на WMS item) | Публикует `deal.created` в очередь; опирается на core.users и справочники WMS при формировании офферов |
| WMS | `wms.catalog_node` (category/unit), `wms.attribute_templates`, `wms.item`, `wms.warehouse`, `wms.warehouse_zone`, `wms.warehouse_cell`, `wms.equipment`, `wms.catalog_links`, `wms.stock` | Дополнительные типы `catalog_node` (packaging, service_type), нормализация `zone_type`/`equipment_type`/hazard каталогов, шаблоны атрибутов для warehouse/equipment | Отдаёт мастер-данные CRM/MES/Montage, использует core.user_roles для доступа, публикует изменения в аудит |
| MES (производство) | — | `mes.work_center`, `mes.operation`, `mes.route`, `mes.bill_of_materials`, `mes.shift_calendar` | Потребляет WMS items/stock, CRM заказы; выдаёт статусы в BPM и аудит |
| Montage | — | `montage.crew`, `montage.vehicle`, `montage.region`, `montage.work_type`, `montage.equipment_kit` | Завязан на CRM (монтажные задачи) и WMS (оборудование); требует core.user_roles для допусков |
| Docs | — | `docs.template`, `docs.number_sequence`, `docs.status`, `docs.signer_matrix` | Сервисы CRM/WMS/MES инициируют документы; использует BPM для маршрутов согласования |
| BPM | — | `bpm.process_definition`, `bpm.task`, `bpm.assignment_rule`, `bpm.escalation` | Оркестрирует процессы CRM/WMS/Docs; пишет события в core.audit_log |
| Analytics | `analytics.events` (ClickHouse) | `analytics.fact_deal`, `analytics.fact_inventory`, `analytics.dim_date`, `analytics.dashboard_config` | Подписчик Tarantool queue (CRM, WMS); формирует отчёты и экспорт в BI |

#### Обязательные события, аудит и Swagger (Фаза 2)

| Домен | События (outbox / очередь) | Аудит (core.audit_log) | Swagger / контракты |
| --- | --- | --- | --- |
| Core | `Core.UserInvited`, `Core.UserRoleChanged` | `core.user.create`, `core.user.update`, `core.role.assign` | gateway/docs/openapi/openapi.json (core блок) |
| CRM | `DealCreated` (уже есть), `DealStageChanged`, `DealWon`, `DealLost` | `crm.deal.create` (есть), `crm.deal.update`, `crm.deal.stage_change`, `crm.deal.delete` | modules/crm/docs/openapi/openapi.json |
| WMS | `Wms.ItemCreated`, `Wms.ItemUpdated`, `Wms.StockAdjusted`, `Wms.WarehouseChanged` | `wms.cell.*` (есть), `wms.catalog.*`, `wms.item.*`, `wms.stock.upsert` | modules/wms/docs/openapi/openapi.json |
| MES | `Mes.WorkOrderScheduled`, `Mes.WorkOrderStatusChanged` | `mes.work_order.create`, `mes.work_order.update`, `mes.work_order.complete` | modules/mes/docs/openapi/openapi.json (создать) |
| Montage | `Montage.TaskAssigned`, `Montage.TaskCompleted` | `montage.task.assign`, `montage.task.complete`, `montage.task.cancel` | modules/montage/docs/openapi/openapi.json (создать) |
| Docs | `Docs.DocumentIssued`, `Docs.DocumentSigned`, `Docs.DocumentArchived` | `docs.document.issue`, `docs.document.status_change`, `docs.document.delete` | modules/docs/docs/openapi/openapi.json (создать) |
| BPM | `Bpm.ProcessStarted`, `Bpm.ProcessCompleted`, `Bpm.TaskCompleted` | `bpm.process.start`, `bpm.process.complete`, `bpm.task.complete` | modules/bpm/docs/openapi/openapi.json (создать) |
| Analytics | `Analytics.ReportGenerated`, подписка на CRM/WMS события | `analytics.report.generate`, `analytics.export.run` | modules/analytics/docs/openapi/openapi.json (создать) |

#### Minimal API, сиды и тесты (Фаза 2)

| Домен | Minimal API (CRUD + фильтры) | Seeds / demo data | Тесты / покрытие |
| --- | --- | --- | --- |
| Core | `/api/v1/users` CRUD + фильтр по роли; `/api/v1/roles` список/назначение; журнал `/api/v1/audit` | `deploy/init/postgres/seed/10_core.sql` (roles, admin) | go test core services; smoke health/auth (gateway); e2e login (TODO) |
| CRM | ✅ `/api/v1/crm/deals` CRUD + фильтры (stage, manager), `/api/v1/crm/customers` CRUD, `/api/v1/crm/deals/{id}/history` | `deploy/init/postgres/seed/20_crm.sql` (customers, demo deals) | go test modules/crm/internal/service; smoke CRM сценарий ✅ (`tests/smoke` gateway_crm_customer_deal_crud); Playwright Deals page (TODO) |
| WMS | `/api/v1/master-data/catalog/*`, `/api/v1/master-data/items`, `/api/v1/master-data/warehouses`, `/api/v1/master-data/stock` | `deploy/init/postgres/seed/30_wms.sql` + миграция `0004_seed_dynamic_masterdata.sql` | go test ./modules/wms/...; smoke tests/smoke; Playwright master-data.spec.ts |
| MES | ✅ `/api/v1/mes/work-centers`, `/api/v1/mes/operations`, `/api/v1/mes/routes` CRUD | `deploy/init/postgres/seed/40_mes.sql` (work centers, operations, routes) | go test modules/mes/internal/service; smoke MES минимальный сценарий ✅ (`tests/smoke` mes_minimal_api); e2e рабочий заказ (TODO) |
| Montage | ✅ `/api/v1/montage/crews`, `/api/v1/montage/vehicles`, `/api/v1/montage/tasks` CRUD | `deploy/init/postgres/seed/50_montage.sql` (crews, vehicles, task) | go test modules/montage/internal/service; smoke монтаж сценарий ✅ (`tests/smoke` montage_minimal_api); e2e монтажная задача (TODO) |
| Docs | `/api/v1/docs/templates`, `/api/v1/docs/documents` issue/update/status, `/api/v1/docs/signers` | seed `deploy/init/postgres/seed/60_docs.sql` (templates, number sequences) | go test docs; smoke документооборот (TODO); e2e подписание (TODO) |
| BPM | `/api/v1/bpm/processes`, `/api/v1/bpm/tasks`, `/api/v1/bpm/forms` | seed `deploy/init/postgres/seed/70_bpm.sql` (default processes) | go test BPM (готов); smoke процесс (готов); e2e процесс (TODO) |
| Analytics | `/api/v1/analytics/reports` (conversion, manager load), `/api/v1/analytics/exports` | ClickHouse seed или mock `analytics/seed/*.sql` | go test analytics repo; smoke отчёт API (готов); e2e BI (TODO) |
#### Приоритет реализации minimal API

1. **Core** — базовый RBAC и аудит; требуется для авторизации остальных сервисов.
2. **WMS** — уже ближе всего к production и нужен как источник master data.
3. **CRM** — опирается на WMS каталоги и core.users; обеспечивает основной бизнес-поток.
4. **MES** — зависит от CRM заказов и WMS номенклатуры.
5. **Montage** — использует CRM задачи и WMS оборудование.
6. **Docs** — требует CRM/WMS для генерации документов, взаимодействует с BPM.
7. **BPM** — оркеструет процессы для CRM/WMS/Docs.
8. **Analytics** — строится поверх событий от всех доменов.

#### Ближайшие задачи

- [ ] Провести дизайн RBAC (org units, permission matrix, токены) и внедрить в core/gateway.
- [ ] Расширить аудит и события: гарнизон событий в Tarantool + ClickHouse витрины и BI-дэшборды.
- [ ] Подготовить полноценные e2e/Playwright сценарии (аутентификация, CRM, WMS, BPM, Docs, Analytics) и интегрировать их в CI.


## Фаза 3. UI и прикладные фичи
**Цель:** построить полноценные разделы интерфейса на основе стабильного backend.

### Чеклист
- [ ] Для каждого нового раздела: мок через MSW, сценарии UI (vitest/storybook), e2e.
- [ ] Выстроить соглашения по формам (React Query, динамические поля, валидация).
- [ ] Дополнить документацию по работе с токенами/правами.

### Решения/заметки
- Не начинать полноценный UI раздел, пока не выполнены требования Фаз 1–2 для соответствующего домена.

---

## Правила работы с планом
1. Любой коммит/PR должен ссылаться на пункт roadmap и обновлять чеклист/`PROGRESS.md`.
2. При старте новой сессии: см. «Текущая позиция» -> «Следующий чекпоинт», сообщи в чате, что именно делаем.
3. Если требуется отступление от плана — описать причину и скорректировать roadmap.
4. Каждая локальная задача в чате начинается с пометки фазы (например, `[Фаза 1]`).
