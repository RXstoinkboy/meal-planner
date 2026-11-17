# meal-planner

Turborepo monorepo for the Meal Planner app.

## Structure

```text
apps/
  mobile/    — Expo (React Native + web) app
  backend/   — NestJS API server (Prisma + PostgreSQL)
```

## Prerequisites

- **Node.js** (npm@11.16 or newer — workspaces require it)
- **Docker** (or a compatible runtime: Rancher Desktop, Podman, OrbStack) — required for the local PostgreSQL database used by the backend
- **Optional, for device development:**
  - Android emulator via [Android Studio](https://developer.android.com/studio) (or a physical device with Expo Go)
  - iOS Simulator via Xcode (macOS only)
  - Web needs nothing extra: `npm run web` in `apps/mobile`

## Getting Started

```sh
# Install all dependencies from the root
npm install

# Configure the backend (DATABASE_URL, DB_* for compose, PORT)
cp apps/backend/.env.example apps/backend/.env

# Configure the mobile client (API base URL; use LAN IP for physical devices)
cp apps/mobile/.env.example apps/mobile/.env
```

The backend's `npm run dev` runs the whole API as a Docker Compose service (with the PostgreSQL container), then serves it at <http://localhost:3333>. To manage the database manually:

```sh
cd apps/backend
npm run db                 # start just the PostgreSQL container (host port 5433)
npm run db:migrate         # apply migrations (prisma migrate dev)
npm test                   # vitest suite against meal_planner_test
npm run pgadmin            # optional DB browser at http://localhost:5050
```

## Run the backend in Docker

The whole backend runs in compose — the API image builds from the repo root,
because npm workspaces hoist dependencies there. `npm run dev` (backend) **is**
the Docker flow:

```sh
cd apps/backend
npm run dev                # build + start api and db in containers, port 3333
npm run dev:logs           # tail the api logs
npm run dev:down           # stop them (db data survives — named volume)
npm run dev:standalone     # host-node fallback: db container + nest start --watch
```

The dev container bind-mounts `src/`, `prisma/` and `test/`, runs
`prisma generate` on start and then `nest start --watch`, so edits rebuild in
place. Migrations still come from the host (`npm run db:migrate`) unless you run
them inside: `docker compose exec api npx prisma migrate dev`.

Both stacks carry resource limits (CPU/memory) and `no-new-privileges`; the
production stack additionally runs the api with a read-only root filesystem,
rotates logs, and refuses to start without `DB_PASSWORD` in `.env.production`.

Production is a separate stack with its own Postgres, no source mounts, a
one-shot `migrate` service the api waits for, and Traefik as the entry point:
the api container publishes no port — Traefik owns 80/443 and routes by
`Host(DOMAIN)` from `.env.production`.

```sh
cp .env.production.example .env.production   # then fill in the secrets
npm run prod:up                              # migrate -> api, via Traefik
npm run prod:down
# ad-hoc commands need the same file for ${...} interpolation:
docker compose --env-file .env.production -f docker-compose.prod.yml <cmd>
```

TLS is automatic once `DOMAIN` is a real domain and `ACME_EMAIL` is set
(Let's Encrypt, HTTP-01). Until then leave `ACME_EMAIL` empty for plain HTTP and
set `DOMAIN` to the server IP. `PROXY_HTTP(S)_PORT` move the published ports if
something else owns 80/443.

Gotchas: the container reaches Postgres as `db:5432` (the host file says
`localhost:5433`), and `HOST` must be `0.0.0.0` inside a container. Do not run
`dev:standalone` and `npm run dev` at once — both want port 3333. Run
`npm run db:migrate` after `npm run dev` whenever `prisma/schema.prisma` changed
(`dev:standalone` runs its own watcher but not migrations either).
See `AGENTS.md` for stack details and conventions.
