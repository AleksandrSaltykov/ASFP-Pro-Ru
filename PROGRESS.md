### 2025-09-22 21:17:38
- Action: ������� docker compose ... up --build -d
- Result: build failed. go.mod ������� go >= 1.23.0, � ������� ������ ���������� golang:1.22-alpine > ������ gateway/crm/wms/analytics ������������.
- Next steps: �������� Dockerfile �������� �� golang:1.24-alpine (��� ������ GOTOOLCHAIN=auto) � ��������� ������.

### 2025-09-22 21:22:10
- Action: docker compose up --build -d (after switching to golang:1.24-alpine)
- Result: ������� �������, �� ��������� ceph ���� � � ������ quay.io/ceph/ceph:v18 ��� ������ demo, ��������� entrypoint demo --rgw �� ������.
- Next steps: �������� ����� �� quay.io/ceph/ceph:v18 � ���������� entrypoint ���� ������������ quay.io/ceph/demo:latest (������������ ����-�����) � �������� �������/���������.

### 2025-09-22 21:40:40
- Action: docker compose up --build -d ����� ������ Ceph �� quay.io/ceph/demo:latest
- Result: ��� ���������� ������� � ���������� (redis, postgres, tarantool, clickhouse, ceph, gateway, crm, wms, analytics, nginx).
- Next steps: ��������� health-check� �������� � ���������, ��� Ceph RGW �������� �� ����-������.

### 2025-09-22 21:59:11
- Action: ������������� git-�����������, commit � push.
- Result: ����� main ������������ � https://github.com/AleksandrSaltykov/ASFP-Pro-Ru.
- Next steps: ����� �������� ������ �������� health-check� � �����.

### 2025-09-22 22:29:19
- Action: �������� �������� /health.
- Result: gateway/crm/wms �� �������� ��-�� ������ S3 � Ceph demo ��������� ������ (������� ���������� MON_IP/NETWORK ������������). Tarantool ����������, Ceph �� ��� � ������� Exited.
- Next steps: ��������� ceph-demo (������� CEPH_DEMO_BUCKET, CEPH_PUBLIC_NETWORK, CEPH_CLUSTER_NETWORK, ���������� MON_IP/NETWORK_AUTO_DETECT) ���� �������� �������� �� MinIO ��� dev, ����� ��������� health-check.

### 2025-09-22 23:16:53
- Action: �������� demo Ceph �� MinIO (S3-����������� �����), �������� fallback ��� OpenAPI � ����������� �������.
- Result: MinIO ������� �� :7480/:9001, gateway/crm/wms ������ 200 �� /health.
- Next steps: �������� � ������������, ��� ��� ���������� ��������� Ceph RGW, � ��� ������������� �������� healthcheck MinIO.

### 2025-09-22 23:43:10
- Action: �������� GitHub Actions workflow (gofmt + go test).
- Result: ����� push/PR �� main ������ ������� ����������� � �������� �������� (GOTOOLCHAIN=auto).
- Next steps: ��� ��������� smoke/�������������� ������ ����� ��������� job.

### 2025-09-22 23:47:18
- Action: go test ./... � smoke-����� (������ ��������) ��������� ��������.
- Result: ��� ������ �������� �����, MinIO ��������� ��������.
- Next steps: ��� ������������� ��������� unit-����� CRM/WMS.

