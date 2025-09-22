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

