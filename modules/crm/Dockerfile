# syntax=docker/dockerfile:1.6
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download || true
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/crm ./modules/crm/cmd/crm

FROM alpine:3.20
RUN adduser -S -D -H app
USER app
WORKDIR /home/app
COPY --from=build /bin/crm ./crm
COPY --from=build /src/modules/crm/docs/openapi/openapi.json ./openapi.json
ENV CRM_HTTP_PORT=8081
EXPOSE 8081
ENTRYPOINT ["./crm"]
