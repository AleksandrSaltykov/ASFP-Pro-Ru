#!/bin/sh
set -e

HOST=${SMOKE_GATEWAY_URL:-http://localhost:8080}
FILE_CONTENT="smoke-test"
TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT
printf "%s" "$FILE_CONTENT" > "$TMP_FILE"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HOST/health")
if [ "$STATUS" != "200" ]; then
  echo "Gateway health check failed: status $STATUS"
  exit 1
fi

UPLOAD=$(curl -s -F file=@"$TMP_FILE" -F folder=smoke "$HOST/api/v1/files")
URL=$(echo "$UPLOAD" | sed -n 's/.*"url":"\([^"]*\)".*/\1/p')
if [ -z "$URL" ]; then
  echo "Failed to parse upload response: $UPLOAD"
  exit 1
fi

echo "File uploaded to: $URL"
