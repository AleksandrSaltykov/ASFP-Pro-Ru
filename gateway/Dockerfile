# syntax=docker/dockerfile:1.6
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download || true
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/gateway ./gateway/cmd/gateway

FROM alpine:3.20
RUN adduser -S -D -H app
USER app
WORKDIR /home/app
COPY --from=build /bin/gateway ./gateway
COPY --from=build /src/gateway/docs/openapi/openapi.json ./openapi.json
ENV GATEWAY_HTTP_PORT=8080
EXPOSE 8080
ENTRYPOINT ["./gateway"]
