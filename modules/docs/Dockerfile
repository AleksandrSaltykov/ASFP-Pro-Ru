# syntax=docker/dockerfile:1.6
FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download || true
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/docs ./modules/docs/cmd/docs

FROM alpine:3.20
RUN adduser -S -D -H app
USER app
WORKDIR /home/app
COPY --from=build /bin/docs ./docs
COPY --from=build /src/modules/docs/docs/openapi/openapi.json ./openapi.json
ENV DOCS_HTTP_PORT=8085
EXPOSE 8085
ENTRYPOINT ["./docs"]
