# ASFP-Pro ERP Skeleton

Этот репозиторий содержит каркас on-prem ERP/CRM/BPM/WMS системы для компании, занимающейся наружной рекламой. Проект ориентирован на эксплуатацию в российской юрисдикции и соответствует требованиям по использованию российских или open-source компонентов.

## Быстрый старт

```
cp deploy/.env.example deploy/.env
make up
```

Перед запуском убедитесь, что установлен [mkcert](https://github.com/FiloSottile/mkcert). `make up` автоматически вызовет генерацию сертификатов (файлы попадут в `deploy/nginx/certs`).

После первой установки выполните `mkcert -install`, чтобы корневой сертификат попал в системное хранилище (без этого HTTPS smoke-тесты не пройдут).

Если `mkcert` временно недоступен, установите переменную `SKIP_MKCERT=1` и выполните `make up` повторно (HTTPS в nginx при этом использоваться не будет).

Команда `make up` поднимет инфраструктуру (PostgreSQL 16 (community edition), ClickHouse, Tarantool, Redis, nginx, Ceph RGW) и сервисы (`gateway`, `crm`, `wms`). После успешного запуска доступны:

- http://localhost:8080/health — состояние gateway
- http://localhost:8080/ready — проверка зависимостей gateway
- http://localhost:8081/health — состояние CRM
- http://localhost:8081/ready — проверка зависимостей CRM
- http://localhost:8082/health — состояние WMS
- http://localhost:8082/ready — проверка зависимостей WMS
- http://localhost:8080/openapi.json — OpenAPI gateway
- http://localhost:8081/openapi.json — OpenAPI CRM
- http://localhost:8082/openapi.json — OpenAPI WMS

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
- `modules/wms` — WMS: склады, остатки, резервы.
- `modules/analytics` — подписчик очереди, складирует события в ClickHouse.
- `pkg` — общие пакеты: конфигурация, логи, подключения к БД/очередям/S3, RBAC модели.
- `deploy` — docker-compose, окружение, init-скрипты, конфигурация nginx.

## Тесты и качество

- `make test` — unit и интеграционные тесты, отчёт о покрытии.
- `make lint` — запуск `golangci-lint` (должен быть установлен локально).
- `tests/` — вспомогательные сценарии, моковые данные.

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

- Для локального стенда используется `minio/minio` (API-совместимый режим). Переменные окружения по умолчанию находятся в `deploy/.env.example`.
- Для продакшена подготовлен override-файл `deploy/docker-compose.ceph.yml`, переключающий сервис `ceph` на образ `quay.io/ceph/demo`. Пример переменных — в `deploy/.env.ceph.example`.
- Перед запуском Ceph RGW необходимо задать корректные `CEPH_MON_IP`, `CEPH_PUBLIC_NETWORK` и `CEPH_CLUSTER_NETWORK`, соответствующие адресу хоста/подсети, где развёрнут compose.
- Ceph demo-контейнер автоматически создаёт bucket `S3_BUCKET` и пользователя `CEPH_DEMO_UID`, поэтому приложения будут работать с теми же `S3_ACCESS_KEY`/`S3_SECRET_KEY`, что указаны в `.env`.
- Для запуска prod-стека: `docker compose --env-file deploy/.env.ceph.example -f deploy/docker-compose.yml -f deploy/docker-compose.ceph.yml up -d`.
