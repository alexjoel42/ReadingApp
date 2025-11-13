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
	npm install

build: ## Build the application
	@echo "🔨 Building application..."
	npm run build

start: ## Start the development server
	@echo "💡 Starting ReadingApp..."
	npm start

test: ## Run tests
	@echo "🧪 Running tests..."
	npm test

clean: ## Remove node_modules and build artifacts (cross-platform)
	@echo "🧹 Cleaning up..."
ifeq ($(OS),Windows_NT)
	@powershell -Command "Get-ChildItem -Directory -Recurse -Force -Include 'node_modules','build' | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue"
else
	@find . -type d \( -name "node_modules" -o -name "build" \) -exec rm -rf {} + 2>/dev/null || true
endif

# ==============
# Helper Targets
# ==============

verify-node: ## Verify Node.js version
	@echo "🔍 Checking Node.js version..."
	@node -v | grep -q "^v16\|^v18\|^v20" || (echo "❌ Node.js 16.x, 18.x or 20.x required" && exit 1)

verify: ## Verify installation
	@echo "✅ Verifying installation..."
	npm ls --depth=0

help: ## Show this help
	@echo "📖 Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

# =================
# Shortcut Aliases
# =================
run: start ## Alias for start
dev: start ## Alias for start