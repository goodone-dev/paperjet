# PaperJet

A lightweight, cross-platform API client desktop application — built with [Wails](https://wails.io) (Go + React).

## Features

- **Workspaces** — organize API projects into isolated workspaces
- **Collections** — group requests into folders with support for examples
- **Environments** — manage variables across dev, staging, and production
- **Proxy** — built-in HTTP proxy support
- **SQLite storage** — all data stored locally, no account required

## Prerequisites

| Tool | Version |
|------|---------|
| Go | ≥ 1.21 |
| Node.js / Yarn | LTS |
| Wails CLI | v2 |

Install the Wails CLI:

```sh
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

## Getting Started

```sh
# 1. Clone
git clone https://github.com/goodone-dev/paperjet.git
cd paperjet

# 2. Install dev tooling (migrate, mockery, pre-commit, etc.)
make setup

# 3. Run in development mode (hot-reload)
make run
```

The app launches as a native window. A browser-accessible dev server is also available at `http://localhost:34115`.

## Building

```sh
make build
```

Produces a redistributable binary in the `build/` directory via `wails build`.

## Database Migrations

```sh
# Create a new migration
make db-migrate-new NAME=<migration_name> DRIVER=sqlite3

# Apply all pending migrations
make db-migrate-up DRIVER=sqlite3

# Rollback last migration
make db-migrate-down DRIVER=sqlite3
```

## Testing

```sh
make test
```

Runs the full test suite with coverage reporting.

## Code Generation

```sh
# Regenerate all mocks
make mock

# Add a new mock for an interface
make mock-add NAME=<InterfaceName>

# Generate repository layer boilerplate
make gen-repo NAME=<name>

# Generate usecase layer boilerplate
make gen-usecase NAME=<name>

# Regenerate Wails JS bindings
make gen-module
```

## Project Structure

```
paperjet/
├── main.go                  # App entry point & dependency wiring
├── app.go                   # Wails app struct & bound methods
├── menu.go                  # Native menu definition
├── internal/
│   ├── application/         # Use-cases and repository implementations
│   │   ├── collection/
│   │   ├── environment/
│   │   ├── proxy/
│   │   └── workspace/
│   ├── domain/              # Core domain models & interfaces
│   ├── infrastructure/      # SQLite, logger, config adapters
│   ├── config/              # App configuration (viper)
│   └── utils/
├── frontend/                # React frontend (Vite + Yarn)
├── migrations/              # SQL migration files
└── .dev/                    # Dev scripts (install, generate, migrate)
```

## Contributing

Commits follow the [Conventional Commits](https://www.conventionalcommits.org/) spec, enforced via pre-commit hooks.

Allowed types: `feat` `fix` `docs` `style` `refactor` `test` `chore`

Run `make setup` once to install all hooks before your first commit.

## License

© GoodOne — [hello@goodone.dev](mailto:hello@goodone.dev)
