# ASFP-Pro ERP Skeleton

���� ����������� �������� ������ on-prem ERP/CRM/BPM/WMS ������� ��� ��������, ������������ �������� ��������. ������ ������������ �� ������������ � ���������� ���������� � ������������� ����������� �� ������������� ���������� ��� open-source �����������.

## ������� �����

```
cp deploy/.env.example deploy/.env
make up
```

������� `make up` �������� �������������� (PostgreSQL 16 (community edition), ClickHouse, Tarantool, Redis, nginx, Ceph RGW) � ������� (`gateway`, `crm`, `wms`). ����� ��������� ������� ��������:

- http://localhost:8080/health � ��������� gateway
- http://localhost:8081/health � ��������� CRM
- http://localhost:8082/health � ��������� WMS
- http://localhost:8080/openapi.json � OpenAPI gateway
- http://localhost:8081/openapi.json � OpenAPI CRM
- http://localhost:8082/openapi.json � OpenAPI WMS

## �����������

- ��������� ������� � ������� DDD-��������� � ���������� ����������� ����� Tarantool queue (outbox ��������� �������, ���������� ������������).
- OLTP � PostgreSQL 16 (community edition) 16, �������� ����� goose (`pkg/db/migrations` ��� core � `modules/*/migrations`).
- OLAP � ClickHouse 24.x, ������ ����������� ������� � `modules/analytics` ���������� `DealCreated` � `analytics.events`.
- ����� � Ceph RGW � ���������� ���������������. ������ �������� �������� �� `/api/v1/files` � gateway.

## �������� ����������

- `gateway` � API-����, �����������, �������� ������, ������������� �������.
- `modules/crm` � ������� CRM: �����������, ������, �������, ���������� `DealCreated`.
- `modules/wms` � WMS: ������, �������, �������.
- `modules/analytics` � ��������� �������, ���������� ������� � ClickHouse.
- `pkg` � ����� ������: ������������, ����, ����������� � ��/��������/S3, RBAC ������.
- `deploy` � docker-compose, ���������, init-�������, ������������ nginx.

## ����� � ��������

- `make test` � unit � �������������� �����, ����� � ��������.
- `make lint` � ������ `golangci-lint` (������ ���� ���������� ��������).
- `tests/` � ��������������� ��������, ������� ������.

## ��������� ����

1. ����������� ����������� RBAC � ����� (������� � `core.audit_log`).
2. �������� BPMN-����������� � ���������� �������� ���������.
3. ��������� ������� ClickHouse � �������� � Superset/Metabase.
4. ����������� ������� ���������� � �������24 � 1�.

����������� � � ������������ � ���� � ������������ ������ �������.

## �������� ������������� ����

- ��� ���������� � �������� ������� ������������ �������� ������ `postgres:16` �� Docker Hub.
- ��� �����, �������� � SQL-������� ������ ���������� ������������ � ������� PostgreSQL (��� ����������/����������, ��������� ������ � Postgres Pro).
- ��� �������� �� Postgres Pro ����������� ������ ������ � ������������� ����������, �� ��������� ������ � ��� �������� �����������.
- ����� ���������� ����������� �������� � ����������� � ������������.

