# Docs Module

Docs-сервис обслуживает документы: шаблоны, подписантов и выпуски договоров. Модуль развёртывается как самостоятельный HTTP-сервис и проксируется через gateway.

## API
- `GET/POST/PUT /api/v1/docs/templates` — CRUD шаблонов с версионированием тела.
- `GET/POST/PUT /api/v1/docs/signers` — управление подписантами и их реквизитами.
- `GET/POST/PUT /api/v1/docs/documents` — выпуск документов, смена статуса, привязка шаблонов/подписантов.

OpenAPI лежит в `modules/docs/docs/openapi/openapi.json`; gateway подключает сервис через `gateway/internal/handlers/docs.go`.

## Данные
- Миграции: `modules/docs/migrations`.
- Сиды: `deploy/init/postgres/seed/60_docs.sql` — базовые шаблоны, нумераторы и демонстрационные документы.

## Тесты и проверки
- `go test ./modules/docs/...` — unit/integration.
- Smoke-сценарий `docs_minimal_api` (`tests/smoke/smoke_test.go`) прогоняет полный CRUD шаблонов, подписантов и документов через gateway.

## План развития
- Подключить статусы согласования и маршруты подписи.
- Реализовать генерацию печатных форм и публикацию артефактов в S3.
- Интегрировать документооборот с BPM задачами и CRM сделками.
