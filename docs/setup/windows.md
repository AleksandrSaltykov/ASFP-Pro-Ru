# Windows Setup Guide

This guide covers preparing a fresh Windows workstation for local development of **ASFP-Pro**.
It assumes Windows 11 (or 10 22H2) on x86_64 hardware. For the best Docker performance we strongly recommend enabling WSL2 (Windows Subsystem for Linux v2).

## 1. Prerequisites Checklist

Run through the list below and install anything that is missing.

| Component | Why it is needed | Recommended install command |
|-----------|------------------|-----------------------------|
| [Git for Windows](https://git-scm.com/download/win) | Clone/pull the repository | `winget install --id Git.Git -e` |
| [Node.js 20 LTS](https://nodejs.org/en/download) | Runtime for Vite, pnpm, tooling (corepack ships with Node 16+) | `winget install OpenJS.NodeJS.LTS` |
| [pnpm](https://pnpm.io/installation) | Package manager for the frontend | Enable via `corepack enable pnpm` after installing Node |
| [Go 1.24.x](https://go.dev/dl/) | Backend services use Go modules | `winget install --id Golang.Go.1.24 -e` |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) (with WSL2 backend) | Runs Postgres, ClickHouse, Redis, Tarantool, gateway/CRM/WMS containers | `winget install Docker.DockerDesktop` |
| [mkcert](https://github.com/FiloSottile/mkcert) | Generates local TLS certificates for nginx | `choco install mkcert` (requires [Chocolatey](https://chocolatey.org/install)) |
| `make` utility | Used by project Makefile | `choco install make` (or use Git Bash/WSL) |
| PowerShell 7+ (optional but recommended) | Runs helper scripts | `winget install Microsoft.PowerShell` |

Additional tools that are useful but optional:

- [Visual Studio Code](https://code.visualstudio.com/) with Go, Docker, ESLint, and TypeScript extensions
- [WSL2](https://learn.microsoft.com/windows/wsl/install) + Ubuntu distribution for Linux shell compatibility (if you prefer running `make` and Docker commands inside WSL)

## 2. Clone & Configure the Repository

```powershell
# inside a PowerShell terminal with developer privileges
cd $env:USERPROFILE\dev
git clone https://github.com/<your-org>/ASFP-Pro-ru.git
cd ASFP-Pro-ru

# copy env templates
Copy-Item deploy/.env.example deploy/.env
Copy-Item apps/web/.env.example apps/web/.env -ErrorAction SilentlyContinue
```

> The `deploy/.env` file is required by docker-compose. Adjust credentials if you already run services on the same ports (5432, 8080-8086, etc.).

## 3. Verify Toolchain

A helper script is available to check commonly required binaries. Run it whenever you set up a new workstation or after updating tooling:

```powershell
pwsh -File scripts/check-prereqs.ps1
```

The script prints a ✅/⚠️ status for Git, Node, pnpm, Go, Docker, mkcert, make, and WSL. It exits with code `0` when everything is available.

## 4. Install Dependencies

```powershell
# enable pnpm via corepack (shipped with Node >=16)
corepack enable
corepack prepare pnpm@latest --activate

# install frontend packages
corepack pnpm install
```

> pnpm creates a single lockfile at the repo root (`pnpm-lock.yaml`). The `corepack` commands only need to be executed once per machine.

## 5. Run the Stack

1. Start infrastructure & backend services
   ```powershell
   # requires Docker Desktop running and mkcert available
   make up
   ```
   If `make` is not available, run the equivalent docker command:
   ```powershell
   docker compose --env-file deploy/.env -f deploy/docker-compose.yml up --build -d
   ```

2. Apply database migrations (optional for fresh Compose run; containers already seed data)
   ```powershell
   make migrate-wms
   ```

3. Launch the frontend dev server in a separate terminal
   ```powershell
   corepack pnpm --filter web dev
   ```
   The application is available at <http://localhost:5173> (or the next free port reported by Vite).

## 6. Useful Commands

| Command | Description |
|---------|-------------|
| `make up` | Build and start all docker-compose services |
| `make down` | Stop and remove containers & volumes |
| `go test ./...` | Run Go unit tests |
| `corepack pnpm --filter web lint` | Run ESLint for the frontend |
| `corepack pnpm --filter web build` | Create a production bundle (Vite) |

## 7. Troubleshooting Tips

- **Docker fails to start containers**: verify WSL2 is enabled and Docker Desktop is using the WSL backend.
- **mkcert errors**: run `mkcert -install` once to trust the local CA, then rerun `make up`.
- **Port conflicts**: adjust ports in `deploy/.env` (e.g., change `GATEWAY_HTTP_PORT`) and restart containers.
- **pnpm not found**: rerun `corepack enable pnpm` and open a fresh shell so the shim is in PATH.
- **make command missing**: install via Chocolatey or invoke docker compose manually.

## 8. Next Steps

After confirming the stack works:

- run `go test ./...`
- run `corepack pnpm --filter web lint`
- optionally execute `make smoke` for end-to-end smoke tests (requires the full docker stack running)

You are now ready to continue development on your Windows workstation.
