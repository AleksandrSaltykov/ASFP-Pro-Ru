# syntax=docker/dockerfile:1.6
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download || true
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/mes ./modules/mes/cmd/mes

FROM alpine:3.20
RUN adduser -S -D -H app
USER app
WORKDIR /home/app
COPY --from=build /bin/mes ./mes
COPY --from=build /src/modules/mes/docs/openapi/openapi.json ./openapi.json
ENV MES_HTTP_PORT=8083
EXPOSE 8083
ENTRYPOINT ["./mes"]
