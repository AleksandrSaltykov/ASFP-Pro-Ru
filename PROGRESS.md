### 2025-09-22 21:17:38
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
