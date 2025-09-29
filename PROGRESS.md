### 2025-09-29 19:36:39
- Action: Удалил BOM из core/crm миграций, переписал seed на jsonb_build_object и проверил up/down для всех модулей.
- Result: `make migrate-core|crm|wms` и соответствующие `*-down`/`*_DOWN_TO=0` проходят на чистой БД; CI теперь гоняет полный цикл up/down/up для всех модулей.
- Next steps: Подумать об автоматическом `make seed` в CI после откатов и оценить необходимость очистки связанных сервисов при down-to 0.

### 2025-09-29 19:10:45
- Action: Добавил down-таргеты для core/crm, задокументировал команды и встроил прогон `make migrate-wms` + откаты в CI (postgres-only этап).
- Result: Makefile поддерживает `migrate-core-down`/`migrate-crm-down`, README описывает откаты, а workflow CI прогоняет последовательность up/down/up `make migrate-wms`.
- Next steps: Решить, нужны ли аналогичные проверки для core/crm в CI и автоматизировать восстановление демо-данных после полных откатов.

### 2025-09-29 19:06:25
- Action: Добавил таргет `migrate-wms-down` с параметром `WMS_DOWN_TO`, проверил откат/повторный запуск через Makefile.
- Result: `make migrate-wms-down` откатывает последнюю миграцию, `WMS_DOWN_TO=0 make migrate-wms-down` сбрасывает схему, а `make migrate-wms` повторно поднимает версии 0001–0004.
- Next steps: Убедиться, что после полного отката seed наполняет демо-данные, и продумать аналогичные проверки для других модулей.

### 2025-09-29 19:00:50
- Action: Добавил fallback на `go run goose` в Makefile, обновил README по миграциям и прогнал `make migrate-wms` на чистой базе.
- Result: Таргет `make migrate-wms` автоматически подтягивает goose при отсутствии бинаря и успешно применяет миграции 0001–0004; README содержит инструкцию по `DATABASE_URL`.
- Next steps: Подумать над аналогичным fallback для core/CRM миграций в CI и при необходимости добавить `migrate-wms-down` для отката.

### 2025-09-29 18:54:54
- Action: Перекодировал миграцию 0004_seed_dynamic_masterdata.sql в UTF-8, поправил SQL (корневой path) и применил сид через goose.
- Result: В wms.catalog_node появились категории SIGNAGE/PRINT, созданы шаблоны атрибутов и демонстрационный товар DEMO-SIGN-001; команда goose up завершилась успешно.
- Next steps: Обновить Makefile/README для автоматического запуска goose (включая сид 0004) и прогнать make migrate-wms на чистом стенде для проверки.

### 2025-09-29 18:36:25
- Action: Обновил WMS backend, обработчики репозитория и применил миграции 0001–0003 через goose (локально).
- Result: `/api/v1/master-data/warehouses/{id}` отвечает 200, фронтенд раздел «Склад» загружает данные без ошибки; схема WMS синхронизирована с актуальными таблицами.
- Next steps: Перекодировать `modules/wms/migrations/0004_seed_dynamic_masterdata.sql` в UTF-8 и повторить сид; убедиться, что `make migrate-wms` работает без go run на CI.

### 2025-09-29 17:36:56
- Action: Подключил core.audit_log к analytics (consumer+API), добавил документирование и UI-страницу журнала.
- Result: события DealCreated фиксируются в Postgres, отчёты/запросы gateway отражаются в `/api/v1/audit`, веб-клиент показывает журнал для админов.
- Next steps: добавить фильтры по дате/типам событий и расширить покрытие других модулей при появлении новых use-case.

### 2025-09-28 20:55:48
- Action: Доработал динамические мастер-данные WMS (обработка NULL category_path, обновлённые smoke-сценарии, документация).
- Result: `go test ./...` зелёный, контейнер wms пересобран через docker compose, CRUD сценарии master data завершаются без 500.
- Next steps: Зафиксировать изменения в feature/dynamic-masterdata и вернуться к переносу динамических атрибутов в CRM.

﻿### 2025-09-22 21:17:38
- Action: попытка docker compose ... up --build -d
- Result: build failed. go.mod требует go >= 1.23.0, а базовые образы используют golang:1.22-alpine > сборка gateway/crm/wms/analytics остановилась.
- Next steps: обновить Dockerfile сервисов на golang:1.24-alpine (или задать GOTOOLCHAIN=auto) и повторить сборку.

### 2025-09-22 21:22:10
- Action: docker compose up --build -d (after switching to golang:1.24-alpine)
- Result: сервисы собраны, но контейнер ceph упал — в образе quay.io/ceph/ceph:v18 нет бинаря demo, указанный entrypoint demo --rgw не найден.
- Next steps: заменить образ на quay.io/ceph/ceph:v18 с корректным entrypoint либо использовать quay.io/ceph/demo:latest (исторический демо-образ) и обновить команду/окружение.

### 2025-09-22 21:40:40
- Action: docker compose up --build -d после замены Ceph на quay.io/ceph/demo:latest
- Result: все контейнеры собраны и стартовали (redis, postgres, tarantool, clickhouse, ceph, gateway, crm, wms, analytics, nginx).
- Next steps: проверить health-checkи сервисов и убедиться, что Ceph RGW отвечает по демо-портам.

### 2025-09-22 21:59:11
- Action: инициализация git-репозитория, commit и push.
- Result: ветка main опубликована в https://github.com/AleksandrSaltykov/ASFP-Pro-Ru.
- Next steps: после проверки стенда добавить health-checkи и тесты.

### 2025-09-22 22:29:19
- Action: проверка сервисов /health.
- Result: gateway/crm/wms не стартуют из-за ошибки S3 — Ceph demo контейнер падает (требует корректной MON_IP/NETWORK конфигурации). Tarantool фиксирован, Ceph всё ещё в статусе Exited.
- Next steps: настроить ceph-demo (указать CEPH_DEMO_BUCKET, CEPH_PUBLIC_NETWORK, CEPH_CLUSTER_NETWORK, корректный MON_IP/NETWORK_AUTO_DETECT) либо временно заменить на MinIO для dev, затем повторить health-check.

### 2025-09-22 23:16:53
- Action: заменили demo Ceph на MinIO (S3-совместимый стенд), добавили fallback для OpenAPI и пересобрали сервисы.
- Result: MinIO запущен на :7480/:9001, gateway/crm/wms отдают 200 на /health.
- Next steps: уточнить в документации, что для продакшена требуется Ceph RGW, и при необходимости добавить healthcheck MinIO.

### 2025-09-22 23:43:10
- Action: добавлен GitHub Actions workflow (gofmt + go test).
- Result: любой push/PR на main гоняет базовую статическую и тестовую проверку (GOTOOLCHAIN=auto).
- Next steps: при появлении smoke/интеграционных тестов можно расширить job.

### 2025-09-22 23:47:18
- Action: go test ./... и smoke-тесты (ручная выгрузка) выполнены локально.
- Result: все пакеты проходят тесты, MinIO принимает загрузку.
- Next steps: при необходимости расширить unit-тесты CRM/WMS.

### 2025-09-23 00:04:44
- Action: добавлен скрипт scripts/minio-reset.sh и расширены smoke-тесты (проверка OpenAPI + upload).
- Result: make smoke теперь читает /openapi.json; скрипт пересоздает MinIO bucket через minio/mc.
- Next steps: при необходимости интегрировать smoke в CI и автоматизировать вызов minio-reset перед тестами.

### 2025-09-23 00:10:54
- Action: интегрировал make smoke в CI (docker compose up -> smoke -> down).
- Result: GitHub Actions теперь поднимает весь стек, сбрасывает MinIO и гоняет smoke-тесты автоматически.
- Next steps: контролировать длительность job и при необходимости кэшировать docker build.

### 2025-09-24 00:30:00
- Action: ограничены ресурсы docker-compose (mem_limit/cpus), автоматизирован вызов mkcert в Makefile и расширены smoke-тесты (артефакты, HTTPS-ветка). README дополнен инструкциями по сертификатам и лимитам.
- Result: `make up` генерирует локальные сертификаты до старта стенда (поддержан `SKIP_MKCERT`), smoke складывает логи в `tests/smoke/artifacts` и умеет ходить по HTTPS через nginx, документация и конфигурация синхронизированы; gateway отдаёт стартовую страницу Control Center.
- Next steps: прогнать `mkcert -install` и `make up` на чистой машине с `SMOKE_GATEWAY_HTTPS_URL=https://localhost:8443 make smoke`; в CI замерить длительность smoke job и добавить кеширование сборок (Go модули и docker build), если это даст выигрыш.

### 2025-09-24 00:55:00
- Action: добавлен кеш Go модулей/артефактов в CI и прогрев docker buildx через bake + локальный кэш перед docker compose up.
- Result: workflow сохраняет `~/go/pkg/mod`, `~/.cache/go-build` и buildx слои (`cache-to/cache-from`), что сокращает время lint/test и сборки образов в smoke job; compose больше не делает `--build`, используя предварительно собранные образы.
- Next steps: проверить, насколько сократилось время GitHub Actions; при необходимости перенести build-этап на `docker/build-push-action` с `scope` per-service и/или добавить `cache-to=type=gha` для более агрессивного шеринга.

### 2025-09-24 13:22:30
- Action: инициализировали фронтенд-монорепозиторий (pnpm workspace) и scaffold SPA на React/Vite.
- Result: добавлены скрипты, базовые провайдеры (Redux Toolkit, React Query), роутинг, макеты страниц и MSW; тесты Vitest проходят.
- Next steps: подключить дизайн-систему (Ant Design fork или свой UI-kit), сгенерировать API-клиенты из OpenAPI и реализовать авторизацию/канбан CRM.
### 2025-09-24 19:25:00
- Action: Определили необходимость фиксировать прогресс после каждого шага и запросили детальный анализ брендбука (логотипы, палитры, шрифты).
- Result: Брендовые ассеты найдены в d:\работа\asfp soft\Брендбук\...; приступили к расшифровке SVG и палитр.
- Next steps: 1) Проанализировать палитру, типографику, иконки; 2) Обновить фронтенд под стиль брендбука; 3) Вести записи в PROGRESS.md после каждого шага.
### 2025-09-24 19:45:00
- Action: Проанализировали брендовые SVG (цвета #2962FF, #131A2D, белый) и обновили фронтенд-оболочку: ввели theme.ts, пересобрали навигацию и layout, добавили загрузку шрифта Manrope.
- Result: Главный каркас отражает фирменные цвета, есть универсальная тема и стилизованные боковые/верхние меню; eslint-запуск не завершён (в проекте отсутствует eslint.config.js).
- Next steps: 1) Подтвердить фирменный шрифт по брендбуку или заменить; 2) Собрать библиотеку легких иконок в фирменном стиле; 3) Довести до соответствия контентные страницы.
### 2025-09-24 19:55:00
- Action: Уточнили брендовые шрифты (основной Onest, декоративный Inter) и обновили тему/верстку: подключили Google Fonts, обновили theme.ts, MainLayout и навигацию.
- Result: Фронтенд использует Onest для базового текста и Inter 28pt как акцентный, шапка и сайдбар отражают фирменную типографику.
- Next steps: Внедрить новый стиль на внутренних страницах и адаптировать иконки под брендовые гайды.
### 2025-09-24 20:05:00
- Action: Применили фирменную тему на страницах CRM, WMS и Files: карточные описания с Onest/Inter, блоки подсветки, фирменные градиенты.
- Result: Внутренние страницы визуально совпадают с брендбуком, готовы для интеграции виджетов.
- Next steps: Собрать фирменные иконки и подключить их к сайдбару и контентным блокам.
### 2025-09-24 20:10:00
- Action: Запустили фронтенд (Vite, порт 5173) для визуальной проверки обновлённого UI.
- Result: Интерфейс доступен по http://localhost:5173/, тема и страницы выглядят согласно брендбуку.
- Next steps: Сконвертировать брендовые иконки и встроить их в приложение.
### 2025-09-24 20:18:00
- Action: Подготовили набор фирменных иконок (overview/crm/wms/files/system) и внедрили их в боковое меню; иконки построены в цветах #2962FF/#131A2D/#E6EDFF.
- Result: Навигация теперь передаёт смысловые акценты брендбука через векторные пиктограммы; код лежит в @shared/ui/icons.
- Next steps: Завершить настройку lint (eslint.config) и отключить временные devserver артефакты перед коммитом.
### 2025-09-24 20:25:00\n- Action: Перерисовали иконки под стиль образца (grid, clipboard, куб, папка, gear).\n- Result: Иконки минималистичны, stroke 1.7, подчёркивают смысл пунктов меню.\n- Next steps: Проверить визуально и утвердить набор.\n
### 2025-09-27 22:45:00
- Action: git reset --hard origin/main && git clean -fd; сформирован план по универсальным каталогам/атрибутам.
- Result: рабочее дерево приведено к чистому состоянию; зафиксирован roadmap реализации динамического WMS.
- Next steps: 1) подготовить миграции для catalog_node, attribute_templates/values и связей с переносом текущих данных; 2) обновить репозитории/сервисы для generic-справочников, динамических атрибутов и catalog_links; 3) расширить HTTP-handlers и тесты, обеспечить выдачу core+attributes; 4) адаптировать фронтенд (API-клиент, формы, UI) под динамические шаблоны и связи.

### 2025-09-27 23:25:00
- Action: Реализованы сущности, репозитории и сервисы для универсальных каталогов и динамических атрибутов WMS.
- Result: Добавлены entity/catalog.go, entity/attribute.go, entity/item.go; миграция 0003_dynamic_catalogs.sql и embed.go; repository/catalog_repository.go и расширения masterdata_service.go; сборка go test ./... проходит (smoke падал как раньше).
- Next steps: Расширить HTTP-слой (handlers, OpenAPI) для работы с generic-справочниками и динамическими атрибутами и обновить тесты.

### 2025-09-27 23:56:00
- Action: Расширены HTTP-хендлеры WMS, добавлены generic/catalog/item endpoints и тесты конвертации запросов; обновлён OpenAPI.
- Result: masterdata_handler.go обслуживает справочники, товары, связи; добавлен masterdata_handler_test.go; OpenAPI описывает новые маршруты; go test ./... (кроме исторического smoke) проходит.
- Next steps: Обновить фронтенд API/формы для работы с динамическими справочниками и атрибутами, связать с новыми endpoint 'ами. 

### 2025-09-28 12:15:00
- Action: Обновил README под актуальный dev-стек (MinIO по умолчанию, статус smoke/CI), довёл фронтенд lint/tsconfig до рабочего состояния и подключил React Query-клиенты к новым WMS endpoint (каталоги, атрибуты, товары).
- Result: README отражает MinIO-first сценарий и предупреждает о нестабильном smoke, `pnpm lint`/`pnpm build` проходят без js-артефактов (tsconfig `noEmit`), `CatalogManager`/`ItemManager` используют API (`useCatalogNodesQuery`, `useItemsQuery`, `useReplaceCatalogLinksMutation`).
- Next steps: интегрировать формы с реальными бэкенд-токенами и правами, покрыть новые хэндлеры e2e-тестами и зафиксировать smoke-фиксы после стабилизации CI.

