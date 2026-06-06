# BulkSend — developer convenience targets
# All commands assume you're running from the repo root.
.PHONY: help setup infra infra-down migrate seed topics dev build clean reset

DOCKER_DIR := infra/docker

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

# ─── First-time setup ────────────────────────────────────────────────────────

setup: ## Install deps + copy .env files (run once)
	pnpm install
	@[ -f apps/api/.env ]    || (cp apps/api/.env.example    apps/api/.env    && echo "Created apps/api/.env — fill in secrets!")
	@[ -f apps/worker/.env ] || (cp apps/worker/.env.example apps/worker/.env && echo "Created apps/worker/.env — fill in secrets!")
	@[ -f $(DOCKER_DIR)/.env ] || (cp $(DOCKER_DIR)/.env.example $(DOCKER_DIR)/.env && echo "Created infra/docker/.env")

# ─── Infrastructure ──────────────────────────────────────────────────────────

infra: ## Start Postgres, Redis, Kafka, Redpanda Console
	docker compose -f $(DOCKER_DIR)/docker-compose.yml up -d
	@echo "Waiting for services to be healthy..."
	@docker compose -f $(DOCKER_DIR)/docker-compose.yml ps

infra-down: ## Stop and remove containers (data volumes preserved)
	docker compose -f $(DOCKER_DIR)/docker-compose.yml down

infra-reset: ## Stop containers AND wipe all volumes (destructive!)
	docker compose -f $(DOCKER_DIR)/docker-compose.yml down -v

# ─── Database ────────────────────────────────────────────────────────────────

migrate: ## Run Prisma migrations against the local DB
	cd apps/api && pnpm prisma migrate dev

migrate-deploy: ## Apply migrations in production (no prompt, no generate)
	cd apps/api && pnpm prisma migrate deploy

generate: ## Regenerate Prisma client in api + worker
	cd apps/api    && pnpm prisma generate
	cd apps/worker && pnpm prisma generate

seed: ## Seed DB with sample workspace, user, contacts, campaigns
	cd apps/api && pnpm prisma db seed

studio: ## Open Prisma Studio (DB browser)
	cd apps/api && pnpm prisma studio

# ─── Kafka ───────────────────────────────────────────────────────────────────

topics: ## Create all Kafka topics (idempotent)
	KAFKA_CMD=/opt/kafka/bin/kafka-topics.sh \
	docker compose -f $(DOCKER_DIR)/docker-compose.yml exec kafka \
		bash /infra/scripts/create-topics.sh 2>/dev/null || \
	bash infra/scripts/create-topics.sh

# ─── Dev ─────────────────────────────────────────────────────────────────────

dev: ## Start all apps in watch mode (api + worker + web)
	pnpm dev

build: ## Build all packages and apps
	pnpm build

clean: ## Remove all dist/ folders
	pnpm clean

# ─── Full local reset ────────────────────────────────────────────────────────

reset: infra-reset infra migrate seed topics ## Wipe everything and start fresh
	@echo "Local environment reset. Run 'make dev' to start."
