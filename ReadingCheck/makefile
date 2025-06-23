# ======================
# ReadingApp Build System
# ======================

.PHONY: setup install build start test clean help

# Environment
NODE_ENV ?= development
APP_PORT ?= 3000

# ===========
# Main Targets
# ===========

setup: ## Install all dependencies and verify environment
	@echo "🚀 Setting up ReadingApp..."
	@make verify-node
	@make install
	@make verify

install: ## Install Node.js dependencies
	@echo "📦 Installing dependencies..."
	@npm install
	@cd ReadingCheck && npm install

build: ## Build the application
	@echo "🔨 Building application..."
	@cd ReadingCheck && npm run build

start: ## Start the development server
	@echo "💡 Starting ReadingApp..."
	@cd ReadingCheck && npm start

test: ## Run tests
	@echo "🧪 Running tests..."
	@cd ReadingCheck && npm test

clean: ## Remove node_modules and build artifacts
	@echo "🧹 Cleaning up..."
	@rm -rf node_modules
	@cd ReadingCheck && rm -rf node_modules build

# ==============
# Helper Targets
# ==============

verify-node: ## Verify Node.js version
	@echo "🔍 Checking Node.js version..."
	@node -v | grep -q "^v16\|^v18\|^v20" || (echo "❌ Node.js 16.x, 18.x or 20.x required" && exit 1)

verify: ## Verify installation
	@echo "✅ Verifying installation..."
	@cd ReadingCheck && npm ls --depth=0

help: ## Show this help
	@echo "📖 Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# =================
# Shortcut Aliases
# =================
run: start ## Alias for start
dev: start ## Alias for start