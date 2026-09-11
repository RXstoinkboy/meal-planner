# meal-planner

Turborepo monorepo for the Meal Planner app.

## Structure

```text
apps/
  mobile/    — Expo (React Native + web) app
  backend/   — AdonisJS API server
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

# Configure the backend (APP_KEY, DB_* etc.)
cp apps/backend/.env.example apps/backend/.env

# Configure the mobile client (API base URL; use LAN IP for physical devices)
cp apps/mobile/.env.example apps/mobile/.env
```

The backend's `npm run dev` starts the PostgreSQL container via Docker Compose automatically, then serves the API at <http://localhost:3333>. To manage the database manually:

```sh
cd apps/backend
npm run db                 # start PostgreSQL container
npm run ace migration:run  # apply migrations
```

See `AGENTS.md` for stack details and conventions.
