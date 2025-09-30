# MES Module

MES-сервис описывает производственные мощности: рабочие центры, операции и маршруты. Он служит источником данных для планирования производственных заказов и интеграции с Montage/MES.

## API
- `GET/POST/PUT /api/v1/mes/work-centers` — рабочие центры, сменные характеристики, статусы.
- `GET/POST/PUT /api/v1/mes/operations` — операции с длительностью, ресурсами и очередностью.
- `GET/POST/PUT /api/v1/mes/routes` — маршруты производства, последовательности операций.

OpenAPI: `modules/mes/docs/openapi/openapi.json`; gateway регистрирует маршруты в `gateway/internal/handlers/mes.go`.

## Данные
- Миграции: `modules/mes/migrations`.
- Сиды: `deploy/init/postgres/seed/40_mes.sql` — демонстрационные рабочие центры, операции и маршрут.

## Тесты и проверки
- `go test ./modules/mes/...` — сервисный слой покрыт unit-тестами (`service/service.go`).
- Smoke `mes_minimal_api` (`tests/smoke/smoke_test.go`) валидирует CRUD через gateway.

## План развития
- Добавить производственные заказы, расписание смен и интеграцию с CRM/Montage задачами.
- Настроить расчёт загрузки и KPI (передача в Analytics).
- Подготовить UI для планирования и диспетчеризации.
