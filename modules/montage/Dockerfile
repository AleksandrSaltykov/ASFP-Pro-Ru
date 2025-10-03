# syntax=docker/dockerfile:1.6
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download || true
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/montage ./modules/montage/cmd/montage

FROM alpine:3.20
RUN adduser -S -D -H app
USER app
WORKDIR /home/app
COPY --from=build /bin/montage ./montage
COPY --from=build /src/modules/montage/docs/openapi/openapi.json ./openapi.json
ENV MONTAGE_HTTP_PORT=8084
EXPOSE 8084
ENTRYPOINT ["./montage"]
