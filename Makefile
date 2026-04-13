.PHONY: up down logs dev-backend dev-frontend tidy

# Docker
up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

# Backend
dev-backend:
	cd backend && go run ./cmd/main.go

tidy:
	cd backend && go mod tidy

build-backend:
	cd backend && go build -o bin/server ./cmd/main.go

# Frontend
dev-frontend:
	cd frontend && npm run dev
