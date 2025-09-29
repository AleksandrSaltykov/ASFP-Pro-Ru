# ASFP-Pro ERP Skeleton

Этот репозиторий содержит каркас on-prem ERP/CRM/BPM/WMS системы для компании, занимающейся наружной рекламой. Проект ориентирован на эксплуатацию в российской юрисдикции и соответствует требованиям по использованию российских или open-source компонентов.

## Быстрый старт

```
cp deploy/.env.example deploy/.env
make up
```

Перед запуском убедитесь, что установлен [mkcert](https://github.com/FiloSottile/mkcert). `make up` автоматически вызовет генерацию сертификатов (файлы попадут в `deploy/nginx/certs`).

После первой установки выполните `mkcert -install`, чтобы корневой сертификат попал в системное хранилище (без этого HTTPS smoke-тесты не пройдут).

Дополнительные инструкции для Windows находятся в [docs/setup/windows.md](docs/setup/windows.md).

Если `mkcert` временно недоступен, установите переменную `SKIP_MKCERT=1` и выполните `make up` повторно (HTTPS в nginx при этом использоваться не будет).

Команда `make up` поднимет инфраструктуру (PostgreSQL 16 (community edition), ClickHouse, Tarantool, Redis, nginx, MinIO) и сервисы (`gateway`, `crm`, `wms`). Ceph RGW подключается через отдельный override, см. раздел «S3 в режимах разработки и продакшена». После успешного запуска доступны:

- http://localhost:8080/health — состояние gateway
- http://localhost:8080/ready — проверка зависимостей gateway
- http://localhost:8081/health — состояние CRM
- http://localhost:8081/ready — проверка зависимостей CRM
- http://localhost:8082/health — состояние WMS
- http://localhost:8082/ready — проверка зависимостей WMS
- http://localhost:8080/openapi.json — OpenAPI gateway
- http://localhost:8081/openapi.json — OpenAPI CRM
- http://localhost:8082/openapi.json — OpenAPI WMS

## Аудит

- `GET /api/v1/audit` — список записей `core.audit_log`. Поддерживаются параметры `actorId`, `entity`, `entityId`, `afterId`, `limit` (по умолчанию 50, максимум 200). Эндпоинт защищён Basic Auth.
- Для локального веб-клиента укажите `VITE_GATEWAY_BASIC_AUTH=admin@asfp.pro:admin123` (или другую пару) в `apps/web/.env`, после чего страница `/admin/audit` отобразит журнал аудита.
- Полное описание контрактов доступно в `gateway/docs/openapi/openapi.json`.

### Ограничения ресурсов контейнеров

- compose-файл задаёт базовые лимиты по CPU/памяти (см. `mem_limit` и `cpus` в `deploy/docker-compose.yml`), чтобы окружение не выжирало всю машину.
- Значения подобраны для локальной разработки (Postgres/ClickHouse ≈ 1.5–2 CPU, 1.5–2 ГБ, сервисы — 0.5–0.75 CPU, 512 МБ); при необходимости скорректируйте и перезапустите `make up`.
- Для временного изменения можно создать `docker-compose.override.yml` и переопределить нужные поля.

## Архитектура

- Модульный монолит с жёсткими DDD-границами и событийной интеграцией через Tarantool queue (outbox публикует события, подписчики идемпотентны).
- OLTP — PostgreSQL 16 (community edition) 16, миграции через goose (`pkg/db/migrations` для core и `modules/*/migrations`).
- OLAP — ClickHouse 24.x, пример потребителя событий в `modules/analytics` записывает `DealCreated` в `analytics.events`.
- Файлы — Ceph RGW с поддержкой версионирования. Пример загрузки доступен по `/api/v1/files` в gateway.

## Основные директории

- `gateway` — API-шлюз, авторизация, загрузка файлов, проксирование модулей.
- `modules/crm` — базовая CRM: контрагенты, сделки, события, публикация `DealCreated`.
- `modules/wms` — WMS: склады, зоны, ячейки, оборудование и API мастер-данных.
- `modules/analytics` — подписчик очереди, складирует события в ClickHouse.
- `pkg` — общие пакеты: конфигурация, логи, подключения к БД/очередям/S3, RBAC модели.
- `deploy` — docker-compose, окружение, init-скрипты, конфигурация nginx.

## Текущий статус WMS

- Применены миграции мастер-данных WMS `0001`–`0003`. Для локального стенда выполните `make migrate-wms` или `go run github.com/pressly/goose/v3/cmd/goose@latest -dir modules/wms/migrations postgres "$DATABASE_URL" up`, если `goose` не установлен.
- Backend теперь корректно обрабатывает `NULL` в полях складов, зон, ячеек и техники; `/api/v1/master-data/warehouses/{id}` отвечает 200, а раздел «Склад» во фронтенде отображает данные без ошибок.
- Сид `0004_seed_dynamic_masterdata.sql` содержит символы вне UTF-8 и требует перекодировки перед запуском; до исправления шаг можно пропустить.

## Тесты и качество

- `make test` — unit и интеграционные тесты, отчёт о покрытии.
- `make lint` — запуск `golangci-lint` (должен быть установлен локально).
- `tests/` — вспомогательные сценарии, моковые данные.

## CI и smoke

- GitHub Actions выполняет gofmt/go test для каждого push/PR (используется GOTOOLCHAIN=auto, кешируются `~/go/pkg/mod`, `~/.cache/go-build` и слои buildx).
- job `smoke` разворачивает Docker Compose стенд, сбрасывает MinIO через `scripts/minio-reset.sh`, прогоняет smoke-сценарии и сохраняет артефакты в `tests/smoke/artifacts`.
- По состоянию на 2025-09-27 smoke остаётся нестабильным из-за доработок WMS (см. PROGRESS.md), поэтому результаты job стоит проверять вручную.
- Smoke-тесты покрывают CRUD-операции мастер-данных WMS (склады, зоны, ячейки, техника).
- Для локальной проверки HTTPS используйте `mkcert -install`, затем `SMOKE_GATEWAY_HTTPS_URL=https://localhost:8443 make smoke`.

## Следующие шаги

1. Реализовать полноценный RBAC и аудит (история в `core.audit_log`).
2. Добавить BPMN-исполнитель и визуальный редактор процессов.
3. Настроить витрины ClickHouse и дашборды в Superset/Metabase.
4. Подготовить контуры интеграции с Битрикс24 и 1С.

Подробности — в комментариях к коду и документации внутри модулей.

## Политика использования СУБД

- Для разработки и тестовых стендов используется открытая сборка `postgres:16` из Docker Hub.
- Все схемы, миграции и SQL-запросы должны оставаться совместимыми с базовым PostgreSQL (без расширений/параметров, доступных только в Postgres Pro).
- При переходе на Postgres Pro допускается замена образа и перенастройка параметров, но структура данных и код остаются неизменными.
- Любые исключения фиксируются отдельно и согласуются с архитектором.


### S3 в режимах разработки и продакшена

- По умолчанию `make up` запускает `minio/minio` (API-совместимый режим) для локального стенда. Переменные окружения по умолчанию находятся в `deploy/.env.example`.
- Для продакшена подготовлен override-файл `deploy/docker-compose.ceph.yml`, переключающий сервис `ceph` на образ `quay.io/ceph/demo`. Пример переменных — в `deploy/.env.ceph.example`.
- Перед запуском Ceph RGW необходимо задать корректные `CEPH_MON_IP`, `CEPH_PUBLIC_NETWORK` и `CEPH_CLUSTER_NETWORK`, соответствующие адресу хоста/подсети, где развёрнут compose.
- Ceph demo-контейнер автоматически создаёт bucket `S3_BUCKET` и пользователя `CEPH_DEMO_UID`, поэтому приложения будут работать с теми же `S3_ACCESS_KEY`/`S3_SECRET_KEY`, что указаны в `.env`.
- Для запуска prod-стека: `docker compose --env-file deploy/.env.ceph.example -f deploy/docker-compose.yml -f deploy/docker-compose.ceph.yml up -d`.


### Правила фиксации прогресса
- После каждого завершенного шага обязательно добавляйте запись в файл PROGRESS.md.

