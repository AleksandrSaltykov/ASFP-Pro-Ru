# syntax=docker/dockerfile:1.6
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download || true
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/analytics-consumer ./modules/analytics/cmd/consumer
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/analytics-api ./modules/analytics/cmd/api

FROM alpine:3.20
RUN adduser -S -D -H app
USER app
WORKDIR /home/app
COPY --from=build /bin/analytics-consumer ./analytics-consumer
COPY --from=build /bin/analytics-api ./analytics-api
COPY --from=build /src/modules/analytics/docs/openapi/openapi.json ./openapi.json
ENV ANALYTICS_QUEUE_NAME=analytics.events
ENTRYPOINT ["./analytics-consumer"]
