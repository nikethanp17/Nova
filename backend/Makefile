# ===========================================================================
# NOVA Backend — Development Commands
# ===========================================================================

.PHONY: install dev lint format type-check test test-unit test-integration \
        docker-build docker-up docker-down clean help

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

## Install all dependencies (including dev)
install:
	uv sync --all-extras

## Copy .env.example to .env if it doesn't exist
env:
	@test -f .env || cp .env.example .env && echo "Created .env from .env.example"

# ---------------------------------------------------------------------------
# Development
# ---------------------------------------------------------------------------

## Start development server with hot reload
dev: env
	uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

## Start production server
serve:
	uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# ---------------------------------------------------------------------------
# Code Quality
# ---------------------------------------------------------------------------

## Run Ruff linter
lint:
	uv run ruff check .

## Run Ruff formatter
format:
	uv run ruff format .

## Run Ruff formatter check (no changes)
format-check:
	uv run ruff format --check .

## Fix linting issues automatically
fix:
	uv run ruff check --fix .

## Run mypy type checker
type-check:
	uv run mypy app

## Run all code quality checks
check: lint format-check type-check

# ---------------------------------------------------------------------------
# Testing
# ---------------------------------------------------------------------------

## Run all tests
test:
	uv run pytest

## Run unit tests only
test-unit:
	uv run pytest tests/unit -v

## Run integration tests only
test-integration:
	uv run pytest tests/integration -v

## Run tests with coverage
test-cov:
	uv run pytest --cov=app --cov-report=html

# ---------------------------------------------------------------------------
# Docker
# ---------------------------------------------------------------------------

## Build Docker image
docker-build:
	docker compose -f docker/docker-compose.yml build

## Start Docker containers
docker-up:
	docker compose -f docker/docker-compose.yml up -d

## Stop Docker containers
docker-down:
	docker compose -f docker/docker-compose.yml down

## View Docker logs
docker-logs:
	docker compose -f docker/docker-compose.yml logs -f

# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------

## Remove generated files and caches
clean:
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name ".coverage" -delete 2>/dev/null || true

# ---------------------------------------------------------------------------
# Help
# ---------------------------------------------------------------------------

## Show this help message
help:
	@echo ""
	@echo "NOVA Backend — Available Commands"
	@echo "=================================="
	@echo ""
	@grep -E '^## ' Makefile | sed 's/## /  /'
	@echo ""
