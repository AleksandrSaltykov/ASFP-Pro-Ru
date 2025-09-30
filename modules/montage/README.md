# Montage Module

Montage-сервис покрывает монтажные бригады, автопарк и задания. Сервис включён в docker-compose и проксируется через gateway.

## API
- `GET/POST/PUT /api/v1/montage/crews` — бригады, состав и контакты.
- `GET/POST/PUT /api/v1/montage/vehicles` — транспорт: госномер, грузоподъёмность, состояние.
- `GET/POST/PUT /api/v1/montage/tasks` — задания с расписанием, назначением бригад и техники.

Спецификация: `modules/montage/docs/openapi/openapi.json`; gateway-обвязка — `gateway/internal/handlers/montage.go`.

## Данные
- Миграции: `modules/montage/migrations`.
- Сиды: `deploy/init/postgres/seed/50_montage.sql` — демо-бригада, транспорт и задача.

## Тесты и проверки
- `go test ./modules/montage/...` — сервисный слой.
- Smoke `montage_minimal_api` (`tests/smoke/smoke_test.go`) проверяет полный CRUD через gateway.

## План развития
- Расширить планирование (смены, окна доставки, гео-координаты).
- Связать задания с CRM сделками и WMS ресурсами.
- Добавить сбор фото-отчётов и чек-листов (S3 + мобильный клиент).
