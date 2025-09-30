# Tests

## Типы проверок
- `go test ./...` — unit и интеграционные тесты для Go-сервисов.
- `pnpm test` / `pnpm lint` (в `apps/web`) — фронтенд unit/UI проверки.
- `make check-demo` — верификация демо-данных (`scripts/ci/check-demo-data.sh`).
- `make smoke` — сквозные smoke-сценарии поверх поднятого docker-compose стенда.

## Smoke-suite
- Исходники: `tests/smoke/smoke_test.go`.
- Запуск: `make smoke` сохраняет артефакты в `tests/smoke/artifacts` (HTTP-логи, CSV, скриншоты).
- Покрытие сценариев:
  - health/endpoints gateway (`/health`, `/ready`).
  - CRM: `gateway_crm_customer_deal_crud`.
  - WMS: справочники, динамические атрибуты, складские остатки.
  - MES: `mes_minimal_api`.
  - Montage: `montage_minimal_api` (бригады/транспорт/задачи).
  - Docs: `docs_minimal_api` (шаблоны, подписанты, документы).
  - BPM: `bpm_minimal_api`.
  - Analytics: `gateway_analytics_reports_exports`.
- Переменные: для HTTPS используйте `SMOKE_GATEWAY_HTTPS_URL=https://localhost:8443 make smoke` (потребуется `mkcert -install`).

## Политики
- Тесты должны выполняться на чистом PostgreSQL (без Postgres Pro расширений).
- Перед PR фиксируем результаты прогонов в `PROGRESS.md` с ссылкой на roadmap.
