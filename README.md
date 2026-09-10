# meal-planner

Turborepo monorepo for the Meal Planner app.

## Structure

```text
apps/
  mobile/    — Expo (React Native + web) app
  backend/   — AdonisJS API server
```

## Getting Started

```sh
# Install all dependencies from the root
npm install

# Start all apps in development mode
npm run dev

# Or start individual apps
cd apps/mobile && npm run dev
cd apps/backend && npm run dev
```

See `AGENTS.md` for stack details and conventions.
