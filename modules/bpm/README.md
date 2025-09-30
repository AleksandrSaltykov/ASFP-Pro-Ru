# BPM Module

BPM-сервис управляет процессами, задачами и формами, обеспечивая оркестрацию бэкенд-доменов. Запускается как отдельный Go-сервис (`modules/bpm/cmd/server`).

## API
- `GET/POST/PUT /api/v1/bpm/processes` — жизненный цикл процессов, статусы `draft/active/archived`.
- `GET/POST/PUT /api/v1/bpm/forms` — формы ввода, JSON-схемы и версии.
- `GET/POST/PUT /api/v1/bpm/tasks` — задачи с дедлайнами, исполнителями, правилами эскалации.

OpenAPI спецификация: `modules/bpm/docs/openapi/openapi.json`; gateway подключает сервис через `gateway/internal/handlers/bpm.go`.

## Данные
- Миграции: `modules/bpm/migrations`.
- Сиды: `deploy/init/postgres/seed/70_bpm.sql` — базовый процесс, форма и задачи для smoke.

## Тесты и проверки
- `go test ./modules/bpm/...` — сервисный слой покрыт unit-тестами (`service_test.go`).
- Smoke-сценарий `bpm_minimal_api` в `tests/smoke/smoke_test.go` проверяет CRUD процессов/форм/задач через gateway.

## План развития
- Подключить BPMN-исполнитель и слоты web-hook действий.
- Связать задачи с CRM/Montage/MES событиями и RBAC.
- Подготовить UI-конструктор форм и бизнес-процессов во фронтенде.
