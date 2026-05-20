.PHONY: help install setup dev start debug build start-prod
.PHONY: db-generate db-migrate db-push db-studio db-drop
.PHONY: openapi
.PHONY: test test-watch test-cov test-e2e
.PHONY: lint lint-check format format-check typecheck validate
.PHONY: docker-up docker-down docker-restart docker-logs docker-clean
.PHONY: clean clean-all

.DEFAULT_GOAL := help

YARN := yarn

help:
	@echo ""
	@echo "wedtech-be — available commands"
	@echo ""
	@echo "  Setup:"
	@echo "    make install          Install dependencies"
	@echo "    make setup            Full setup (install + docker + migrate)"
	@echo ""
	@echo "  Development:"
	@echo "    make dev              Start dev server (watch mode)"
	@echo "    make start            Start server"
	@echo "    make debug            Start with debug mode"
	@echo ""
	@echo "  Build & Production:"
	@echo "    make build            Build for production"
	@echo "    make start-prod       Start production server"
	@echo ""
	@echo "  Database:"
	@echo "    make db-generate      Generate migrations from schema"
	@echo "    make db-migrate       Apply pending migrations"
	@echo "    make db-push          Push schema directly (dev only)"
	@echo "    make db-studio        Open Drizzle Studio"
	@echo "    make db-drop          Drop migration"
	@echo ""
	@echo "  OpenAPI:"
	@echo "    make openapi          Generate docs/openapi.json"
	@echo ""
	@echo "  Testing:"
	@echo "    make test             Run unit tests"
	@echo "    make test-watch       Run tests in watch mode"
	@echo "    make test-cov         Run tests with coverage"
	@echo "    make test-e2e         Run E2E tests"
	@echo ""
	@echo "  Code Quality:"
	@echo "    make lint             Lint and fix"
	@echo "    make lint-check       Check linting (no fix)"
	@echo "    make format           Format with Prettier"
	@echo "    make format-check     Check formatting (no fix)"
	@echo "    make typecheck        TypeScript type check"
	@echo "    make validate         Run all checks"
	@echo ""
	@echo "  Docker:"
	@echo "    make docker-up        Start all services"
	@echo "    make docker-down      Stop all services"
	@echo "    make docker-restart   Restart all services"
	@echo "    make docker-logs      Tail logs"
	@echo "    make docker-clean     Remove volumes"
	@echo ""
	@echo "  Cleanup:"
	@echo "    make clean            Remove dist + coverage"
	@echo "    make clean-all        Remove dist + coverage + node_modules"
	@echo ""

# ─── Setup ────────────────────────────────────────────────────────────────────

install:
	$(YARN) install

setup: install docker-up
	@echo "Waiting for services..."
	@sleep 5
	$(MAKE) db-migrate
	@echo "Setup complete."

# ─── Development ──────────────────────────────────────────────────────────────

dev:
	$(YARN) start:dev

start:
	$(YARN) start

debug:
	$(YARN) start:debug

# ─── Build ────────────────────────────────────────────────────────────────────

build:
	$(YARN) build

start-prod: build
	$(YARN) start:prod

# ─── Database ─────────────────────────────────────────────────────────────────

db-generate:
	$(YARN) db:generate

db-migrate:
	$(YARN) db:migrate

db-push:
	$(YARN) db:push

db-studio:
	$(YARN) db:studio

db-drop:
	$(YARN) db:drop

# ─── OpenAPI ──────────────────────────────────────────────────────────────────

openapi:
	$(YARN) openapi:generate

# ─── Testing ──────────────────────────────────────────────────────────────────

test:
	$(YARN) test

test-watch:
	$(YARN) test:watch

test-cov:
	$(YARN) test:cov

test-e2e:
	$(YARN) test:e2e

# ─── Code Quality ─────────────────────────────────────────────────────────────

lint:
	$(YARN) lint

lint-check:
	$(YARN) lint:check

format:
	$(YARN) format

format-check:
	$(YARN) format:check

typecheck:
	$(YARN) typecheck

validate: lint-check format-check typecheck test
	@echo "All checks passed."

# ─── Docker ───────────────────────────────────────────────────────────────────

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-restart: docker-down docker-up

docker-logs:
	docker compose logs -f

docker-clean:
	docker compose down -v

# ─── Cleanup ──────────────────────────────────────────────────────────────────

clean:
	rm -rf dist coverage .temp .tmp

clean-all: clean
	rm -rf node_modules
