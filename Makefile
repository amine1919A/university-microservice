.PHONY: help dev-build dev-up dev-down dev-logs clean

help:
	@echo "University Platform - Makefile"
	@echo ""
	@echo "Usage:"
	@echo "  make dev-build     Build all Docker images for development"
	@echo "  make dev-up        Start all services in development mode"
	@echo "  make dev-down      Stop all services"
	@echo "  make dev-logs      Follow logs from all services"
	@echo "  make clean         Remove all containers, volumes, and images"

dev-build:
	docker compose -f docker-compose.yml build

dev-up:
	docker compose -f docker-compose.yml up -d

dev-down:
	docker compose -f docker-compose.yml down

dev-logs:
	docker compose -f docker-compose.yml logs -f

clean:
	docker compose -f docker-compose.yml down -v --rmi all
