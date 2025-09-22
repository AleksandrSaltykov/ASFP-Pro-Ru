# syntax=docker/dockerfile:1.6
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download || true
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/wms ./modules/wms/cmd/wms

FROM alpine:3.20
RUN adduser -S -D -H app
USER app
WORKDIR /home/app
COPY --from=build /bin/wms ./wms
COPY --from=build /src/modules/wms/docs/openapi/openapi.json ./openapi.json
ENV WMS_HTTP_PORT=8082
EXPOSE 8082
ENTRYPOINT ["./wms"]
