# syntax=docker/dockerfile:1.6
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download || true
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/bpm ./modules/bpm/cmd/bpm

FROM alpine:3.20
RUN adduser -S -D -H app
USER app
WORKDIR /home/app
COPY --from=build /bin/bpm ./bpm
COPY --from=build /src/modules/bpm/docs/openapi/openapi.json ./openapi.json
ENV BPM_HTTP_PORT=8086
EXPOSE 8086
ENTRYPOINT ["./bpm"]
