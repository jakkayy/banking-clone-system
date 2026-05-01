FROM golang:1.26-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o /banking-api ./cmd

FROM alpine:3.22
WORKDIR /app

RUN apk add --no-cache ca-certificates

COPY --from=builder /banking-api /usr/local/bin/banking-api

ENV SERVER_PORT=8080

EXPOSE 8080

CMD ["banking-api"]
