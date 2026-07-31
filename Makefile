setup:
	@chmod -v +x .dev/script/*.sh
	@echo "✅ All .sh files in .dev/script directory are executable"
	@.dev/script/install-test-coverage.sh -f -v
	@.dev/script/install-migrate.sh -f -v
	@.dev/script/install-mockery.sh -f -v
	@.dev/script/install-pre-commit.sh -f -v

install-test-coverage:
	@.dev/script/install-test-coverage.sh

install-migrate:
	@.dev/script/install-migrate.sh

install-mockery:
	@.dev/script/install-mockery.sh

install-pre-commit:
	@.dev/script/install-pre-commit.sh

db-migrate-new: install-migrate
	@.dev/script/db-migrate-new.sh -n $(NAME) -d $(DRIVER)

db-migrate-up: install-migrate
	@.dev/script/db-migrate-up.sh -d $(DRIVER)

db-migrate-down: install-migrate
	@.dev/script/db-migrate-down.sh -d $(DRIVER)

mock: install-mockery
	@.dev/script/mock.sh

mock-add: install-mockery
	@.dev/script/mock-add.sh -n $(NAME)

test: install-test-coverage
	@.dev/script/test.sh

run:
	@wails dev

build:
	@wails build

gen-module:
	@wails generate module

gen-repo:
	@.dev/script/gen-repo.sh $(NAME)

gen-usecase:
	@.dev/script/gen-usecase.sh $(NAME)

help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Setup targets:"
	@echo "  setup                                             Setup development environment"
	@echo ""
	@echo "Development targets:"
	@echo "  run                                               Run application"
	@echo "  build                                             Build application"
	@echo "  gen-module                                        Generate module"
	@echo ""
	@echo "Layer generation targets:"
	@echo "  gen-repo NAME=<name>                              Generate repository layer"
	@echo "  gen-usecase NAME=<name>                           Generate usecase layer"
	@echo ""
	@echo "Migration targets:"
	@echo "  db-migrate-new NAME=<name> DRIVER=<driver>        Create new migration file"
	@echo "  db-migrate-up DRIVER=<driver>                     Apply all pending migrations"
	@echo "  db-migrate-down DRIVER=<driver>                   Rollback last migration"
	@echo ""
	@echo "Test targets:"
	@echo "  test                                              Run tests with coverage check"
	@echo ""
	@echo "Mock targets:"
	@echo "  mock                                              Generate all mocks"
	@echo "  mock-add NAME=<interface>                         Add new mock configuration"

.PHONY: help setup \
		install-test-coverage install-migrate install-mockery install-pre-commit \
		run build gen-module \
		gen-repo gen-usecase \
		db-migrate-new db-migrate-up db-migrate-down \
		test \
		mock mock-add
