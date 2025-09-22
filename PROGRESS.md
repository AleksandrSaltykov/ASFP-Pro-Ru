### 2025-09-22 21:17:38
- Action: попытка docker compose ... up --build -d
- Result: build failed. go.mod требует go >= 1.23.0, а базовые образы используют golang:1.22-alpine > сборка gateway/crm/wms/analytics остановилась.
- Next steps: обновить Dockerfile сервисов на golang:1.24-alpine (или задать GOTOOLCHAIN=auto) и повторить сборку.

### 2025-09-22 21:22:10
- Action: docker compose up --build -d (after switching to golang:1.24-alpine)
- Result: сервисы собраны, но контейнер ceph упал Ч в образе quay.io/ceph/ceph:v18 нет бинар€ demo, указанный entrypoint demo --rgw не найден.
- Next steps: заменить образ на quay.io/ceph/ceph:v18 с корректным entrypoint либо использовать quay.io/ceph/demo:latest (исторический демо-образ) и обновить команду/окружение.

### 2025-09-22 21:40:40
- Action: docker compose up --build -d после замены Ceph на quay.io/ceph/demo:latest
- Result: все контейнеры собраны и стартовали (redis, postgres, tarantool, clickhouse, ceph, gateway, crm, wms, analytics, nginx).
- Next steps: проверить health-checkи сервисов и убедитьс€, что Ceph RGW отвечает по демо-портам.

### 2025-09-22 21:59:11
- Action: инициализаци€ git-репозитори€, commit и push.
- Result: ветка main опубликована в https://github.com/AleksandrSaltykov/ASFP-Pro-Ru.
- Next steps: после проверки стенда добавить health-checkи и тесты.

### 2025-09-22 22:29:19
- Action: проверка сервисов /health.
- Result: gateway/crm/wms не стартуют из-за ошибки S3 Ч Ceph demo контейнер падает (требует корректной MON_IP/NETWORK конфигурации). Tarantool фиксирован, Ceph всЄ ещЄ в статусе Exited.
- Next steps: настроить ceph-demo (указать CEPH_DEMO_BUCKET, CEPH_PUBLIC_NETWORK, CEPH_CLUSTER_NETWORK, корректный MON_IP/NETWORK_AUTO_DETECT) либо временно заменить на MinIO дл€ dev, затем повторить health-check.

### 2025-09-22 23:16:53
- Action: заменили demo Ceph на MinIO (S3-совместимый стенд), добавили fallback дл€ OpenAPI и пересобрали сервисы.
- Result: MinIO запущен на :7480/:9001, gateway/crm/wms отдают 200 на /health.
- Next steps: уточнить в документации, что дл€ продакшена требуетс€ Ceph RGW, и при необходимости добавить healthcheck MinIO.

### 2025-09-22 23:43:10
- Action: добавлен GitHub Actions workflow (gofmt + go test).
- Result: любой push/PR на main гон€ет базовую статическую и тестовую проверку (GOTOOLCHAIN=auto).
- Next steps: при по€влении smoke/интеграционных тестов можно расширить job.

### 2025-09-22 23:47:18
- Action: go test ./... и smoke-тесты (ручна€ выгрузка) выполнены локально.
- Result: все пакеты проход€т тесты, MinIO принимает загрузку.
- Next steps: при необходимости расширить unit-тесты CRM/WMS.

