# ASFP-Pro ERP Skeleton

Этот репозиторий содержит каркас on-prem ERP/CRM/BPM/WMS системы для компании, занимающейся наружной рекламой. Проект ориентирован на эксплуатацию в российской юрисдикции и соответствует требованиям по использованию российских или open-source компонентов.

## Быстрый старт

```
cp deploy/.env.example deploy/.env
make up
```

Команда `make up` поднимет инфраструктуру (PostgreSQL 16 (community edition), ClickHouse, Tarantool, Redis, nginx, Ceph RGW) и сервисы (`gateway`, `crm`, `wms`). После успешного запуска доступны:

- http://localhost:8080/health — состояние gateway
- http://localhost:8081/health — состояние CRM
- http://localhost:8082/health — состояние WMS
- http://localhost:8080/openapi.json — OpenAPI gateway
- http://localhost:8081/openapi.json — OpenAPI CRM
- http://localhost:8082/openapi.json — OpenAPI WMS

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

