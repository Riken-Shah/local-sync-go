# Makefile to check for conda, setup environment, and activate it

# Check if conda is installed
CONDA_EXISTS := $(shell command -v conda 2> /dev/null)

# Environment file
ENV_FILE := environment.yml

# Conda environment name
ENV_NAME := $(shell awk '/name:/ {print $$2}' $(ENV_FILE))

# Target: Check if conda exists
check_conda:
ifndef CONDA_EXISTS
	$(error "conda is not installed. Please install conda.")
endif
	@echo "conda is installed."

# Target: Setup conda environment from environment.yml
setup_env: check_conda
	@if conda info --envs | grep -q $(ENV_NAME); then \
		echo "Updating existing conda environment: $(ENV_NAME)"; \
		conda env update --file $(ENV_FILE); \
	else \
		echo "Creating new conda environment: $(ENV_NAME)"; \
		conda env create --file $(ENV_FILE); \
	fi

activate_env:
	@if [ -z "$$(conda info --env | grep '^$(ENV_NAME) *')" ]; then \
		conda activate $(ENV_NAME); \
		echo "Activated conda environment: $(ENV_NAME)"; \
	else \
		echo "Conda environment $(ENV_NAME) is already active."; \
	fi

update_env:
	conda env export | grep -v "^prefix: " > environment.yml

tidy:
	go mod tidy

# Target: Default target to setup and activate environment
all: tidy setup_env activate_env
	@echo "Environment setup and activation complete."

# Target: Help
help:
	@echo "Available targets:"
	@echo "  check_conda   - Check if conda is installed"
	@echo "  setup_env     - Setup conda environment from environment.yml"
	@echo "  activate_env  - Activate conda environment if not already activated"
	@echo "  all           - Setup and activate environment"
	@echo "  help          - Show this help message"

.PHONY: check_conda setup_env activate_env all help
