#!/bin/sh
set -e

NETWORK=${MINIO_NETWORK:-deploy_default}
ALIAS=${MINIO_ALIAS:-asfp}
ENDPOINT=${MINIO_ENDPOINT:-http://ceph:7480}
ACCESS_KEY=${S3_ACCESS_KEY:-asfpminio}
SECRET_KEY=${S3_SECRET_KEY:-asfpminio123}
BUCKET=${MINIO_BUCKET:-asfp-files}

if ! docker network ls --format '{{.Name}}' | grep -q "^${NETWORK}$"; then
  echo "Docker network ${NETWORK} not found"
  exit 1
fi

docker run --rm --network "${NETWORK}" minio/mc sh -c "
  set -e
  mc alias set ${ALIAS} ${ENDPOINT} ${ACCESS_KEY} ${SECRET_KEY} >/dev/null
  mc rb --force ${ALIAS}/${BUCKET} >/dev/null 2>&1 || true
  mc mb --ignore-existing ${ALIAS}/${BUCKET}
"
