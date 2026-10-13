# Meal Planner

Monorepo for the Meal Planner app: Expo mobile/web client + NestJS API.

## Tech Stack

- **Monorepo**: Turborepo (npm workspaces, npm@11.16)
- **Mobile** (`apps/mobile`): Expo SDK 57 (RN 0.86.3, React 19.2) + Expo Router (file-based routing, typed routes) + Tamagui v2 (UI) + Legend-State (global state) + TanStack Query v5 (server state, persisted to AsyncStorage). Runs on iOS, Android **and web** (metro bundler, static output).
- **Backend** (`apps/backend`): NestJS v12 (Express, CommonJS output) + PostgreSQL via Prisma 7 (`@prisma/adapter-pg` driver adapter) + Zod validation + OpenAPI 3.1 generated from the same Zod schemas + Vitest/supertest (tests)
- **Dev**: TypeScript 6.0.3, ESLint, Prettier, `nest start --watch`

### Version pinning notes

Three toolchain majors exist upstream but are held back by their plugin ecosystems. We are on the newest versions each gate allows. Exact gates:

| Hold | Blocked by | Lift when |
| ------ | ------------ | ----------- |
| TypeScript 7 (native `tsgo` build) unused — on `~6.0.3` bridge release (what the Expo toolchain pins) | `typescript-eslint@8.70.0` peer `typescript <6.1.0`. tseslint drives the JS compiler API; TS 7 ships native binaries without it. Even the 8.70.1-alpha canary still gates at `<6.1.0` | typescript-eslint peer range accepts 7.x |
| ESLint on `^9.39.5` (10.10.0 exists) | `eslint-plugin-react@7.37.5` peer caps at `^9.7`; it still calls removed API `context.getFilename()` (lib/util/version.js:31). Pulled in via `eslint-config-expo`, can't be dropped without forking that config | eslint-plugin-react (or eslint-config-expo) declares ESLint 10 support |
| `@babel/core` on `^7.29.7` (8.0.1 exists) | whole Expo transform chain is Babel 7: `babel-preset-expo` pins every `@babel/*` to `^7`, `@expo/metro-config` depends on `@babel/core ^7.20.0`, worklets/Tamagui plugins assert `^7.0.0-0` | `babel-preset-expo` / `@expo/metro-config` migrate to Babel 8 |
| `prisma@7.10.0` pinned exactly (8.0.0-rc exists) | the npm `latest` dist-tag for the **CLI** points at an 8.0.0 release candidate while `@prisma/client` stays on 7 — never install `prisma` without a version | the 8.0.0 stable line ships and the tags agree |

After lifting a gate: bump the version, then `npx turbo run type-check lint` and `cd apps/mobile && npx expo export --platform web` to verify.

## Project Structure

```text
/
├── apps/
│   ├── mobile/              # Expo app (React Native + web)
│   │   ├── app/             # File-based routes (Expo Router)
│   │   │   ├── _layout.tsx  # Root layout: TamaguiProvider + QueryClientProvider
│   │   │   └── index.tsx    # Placeholder screen
│   │   ├── assets/          # App icons, splash, favicon
│   │   ├── app.json         # Expo config (name/slug/package: com.mazelabs.mealplanner)
│   │   ├── eas.json         # EAS build profiles (development/production)
│   │   ├── babel.config.js  # babel-preset-expo + @tamagui/babel-plugin
│   │   ├── metro.config.js  # npm workspaces hoisting + Tamagui singleton resolution
│   │   ├── tamagui.config.ts# Barebones Tamagui config (default config, NO themes)
│   │   ├── tsconfig.json
│   │   └── .env.example
│   └── backend/             # NestJS v12 API
│       ├── src/
│       │   ├── main.ts              # bootstrap: helmet, CORS, versioning, throttler, swagger, shutdown
│       │   ├── instrument.ts        # Sentry.init — imported first by main.ts
│       │   ├── app.module.ts        # module wiring + global pipe/filter/guard
│       │   ├── common/              # shared: database (Prisma), http, zod, identity, analytics, sentry, health
│       │   ├── config/              # env (zod), logger (pino), swagger, app setup
│       │   ├── common/              # shared: database (Prisma), http, zod, identity, analytics, sentry, health, swagger
│       │   ├── config/              # env (zod), logger (pino), swagger, app setup
│       │   └── features/<slice>/    # controllers/, services/, validators/, mappers/, <slice>.module.ts
│       ├── prisma/                  # schema.prisma + migrations (baseline)
│       ├── test/                    # vitest: *.e2e.spec.ts, unit/, helpers.ts, setup-db.ts
│       ├── docker-compose.yml       # PostgreSQL 18 (project name: meal-planner, host port 5433)
│       ├── prisma7.config.ts
│       └── .env.example
├── package.json             # Root workspace config
└── turbo.json               # Turborepo tasks
```

## Root Tasks (Turborepo)

```sh
npm run dev         # Start all apps in dev mode (turbo tui)
npm run build       # Build all apps
npm run lint        # Lint all apps
npm run type-check  # TypeScript check all apps
npm test            # Run all app test suites (needs the docker db)
```

## Common Tasks

### Mobile

```sh
cd apps/mobile
npm run dev          # expo start (press w for web, a for android)
npm run web          # expo start --web
npm run type-check
npm run lint
```

### Backend

```sh
cd apps/backend
npm run dev                # docker db + nest start --watch (http://localhost:3333)
npm run db                 # docker compose up -d db
npm run db:migrate         # prisma migrate dev (creates + applies)
npm run db:deploy          # prisma migrate deploy (CI/production)
npm run db:studio          # prisma studio
npm run type-check
npm run lint
npm test                   # vitest (needs meal_planner_test, created by compose)
```

### Env vars

- `apps/backend`: copy `.env.example` → `.env` (`DATABASE_URL` for Prisma, `DB_*` for compose, `PORT`). Never commit secrets.
- The dev database listens on **5433** because a local Supabase stack from another project owns 5432.
- `apps/mobile`: copy `.env.example` → `.env` — `EXPO_PUBLIC_API_URL` (use LAN IP like `http://192.168.1.x:3333` for physical devices). All client env vars must be prefixed `EXPO_PUBLIC_`.

## API

Base path `/api/v1`. **There is no authentication yet**: every protected route identifies the
caller with an `x-user-id` header, resolved by one decorator (`src/common/identity/current-user.decorator.ts`).
Replacing that seam is the whole change when Nest passport or Keycloak lands.

| Method | Path | Description |
| -------- | ------ | ------------- |
| POST | `/api/v1/auth/signup` | Create a user (201, 409 duplicate email). Password fields are accepted and ignored |
| POST | `/api/v1/auth/login` | Look up a user by email (200) |
| GET | `/api/v1/account/profile` | Current user, from `x-user-id` |
| GET/POST | `/api/v1/recipes` | List (200) / create (201) |
| GET/PATCH/DELETE | `/api/v1/recipes/:id` | Read / patch / soft delete (204) |
| GET | `/health` | Uptime probe, plain body |
| GET | `/` | hello world |
| GET | `/docs` | Swagger UI (non-production only) |

Success bodies are the bare resource (no envelope). Failures are stock Nest bodies
`{ statusCode, message, error }`: 400 validation with `message` as `[{ field, message }]`
so forms can map inline errors, 401 missing/unknown identity, 404 not found, 409 duplicate
email (thrown at the service).

OpenAPI follows the Nest docs' Standard Schema support: route params take the zod schema
directly (`@Body({ schema })`), validation is the built-in `StandardSchemaValidationPipe`
(with a custom `exceptionFactory` that keeps `[{field, message}]` for the mobile form), and
documentation is generated at runtime by `SwaggerModule.createDocument` (`@ApiOkResponse`
et al. on handlers; `asSwaggerSchema` bridges zod objects past the dated `SchemaObject`
types). No registry, no committed openapi.json

## Key Conventions

- Mobile imports alias: `@/` → `apps/mobile/` root.
- Tamagui v2 with `onlyAllowShorthands: true` (from `@tamagui/config/v5`): use style **shorthands** — `grow`, `justify`, `items`, `p`, `bg` — longhands like `justifyContent` are omitted from the types. Extend `tamagui.config.ts` if you ever need to change this; do not add a themes package unless asked.
- State split (mirrors fitly): Legend-State for persistent app state (`state/`), TanStack Query for server data (`queries/`), API calls only through TanStack Query.
- Vertical slices are **lint-enforced** with `eslint-plugin-boundaries` (`boundaries/dependencies`) in both apps' flat ESLint configs — see `.pi/skills/vertical-slices/SKILL.md`. Both configs need `eslint-import-resolver-typescript` + the `import/resolver.typescript` setting: without it `@/features/*` and the `@/` alias resolve as external and every boundary rule silently no-ops.
- Metro resolves packages hoisted to the repo root; `@tamagui/core`, `@tamagui/web`, `tamagui` are forced to a single copy at the workspace root (root `overrides` pin them together). Keep those in sync when bumping Tamagui.
- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`. Branches: `feat/description`, `fix/description`.
- Don't add dependencies without a good reason — ask first.
- **Track events for every user action** (implementation requirement, not optional). PostHog via the `lib/analytics` facade (mobile) and `AnalyticsService` (backend) — never import PostHog directly.
  - Add the event to `apps/mobile/lib/analytics/events.ts` first, do the same for the backend whenever needed (for example if owner of needed information is backend and frontend it not aware of it) in `apps/backend/src/common/analytics/events.ts` (same name convention). Some events should be tracked on the frontend when they are associated with a specific user action, but some events should be tracked on the backend because it is more reliable that such action is completed. Naming: `{slice}.{event_snake}`, keyed by vertical slice — see the example in `events.ts`.
  - Mobile: `track(events.<slice>.<event>)` at the user action site. Backend: `analytics.track(event, distinctId, props)` where server-side tracking matters.
  - A PR that adds a user action (button press, signup, save, delete, ...) without a corresponding event is incomplete.
- **Error monitoring**: Sentry on both apps, errors only (tracing, replay and log shipping are deliberately off to protect the free tier).
  - Env: `EXPO_PUBLIC_SENTRY_DSN` (mobile), `SENTRY_DSN` + `SENTRY_RELEASE` (backend, release = commit SHA set by the deploy platform). Unset = SDK disabled, so local dev is silent.
  - Init lives in `apps/mobile/lib/sentry.ts` and `apps/backend/src/instrument.ts` (imported first by `main.ts`, so instrumentation attaches). Only those modules import the SDK; call `setSentryUser` / let the exception filter report instead.
  - Backend 4xx (validation/auth/not found) is filtered in `src/common/http/http-exception.filter.ts`; `beforeSend`/`beforeBreadcrumb` in `src/common/sentry/scrubbers.ts` scrub headers, request bodies, SQL and console output. Keep it that way — meal data is sensitive.
  - Mobile org/project slugs live in `app.json` (replace the `replace-me-*` placeholders); `SENTRY_AUTH_TOKEN` is an EAS secret only. `metro.config.js` must keep `getSentryExpoConfig` for debug IDs / symbolicated stacks.
  - Phase 2, deliberately not wired: tracing spans, session replay, Better Stack uptime monitors + status page + on-call (external HTTP probes, zero app code), log shipping via a pino transport in `src/config/logger.ts`.

## Gotchas

- The backend compose project is explicitly named `meal-planner` (folder name `backend` collides with other repos' compose projects) and publishes on host port **5433** — a local Supabase stack from another project already owns 5432. `DATABASE_URL` and `DB_PORT` must agree.
- `apps/backend/src/generated/prisma` is gitignored and produced by `postinstall` (`prisma generate`). Never edit it; re-run `npm install` (or `npx prisma generate`) after changing `prisma/schema.prisma`.
- Prisma reads connection config from `prisma7.config.ts`, not from the datasource block. `npx prisma` resolves the workspace-local 7.10.0 — never let it fall back to the registry `latest` (an 8.0.0-rc).
- Adding a backend slice = `src/features/<name>/` with controllers/services/validators/mappers + a module + an entry in `app.module.ts`. Paths document themselves: request via `@Body({ schema })`, responses via `@Api*Response({ schema: asSwaggerSchema(zodSchema) })`, `x-user-id` via `@ApiSecurity`. No ESLint change needed. Boundaries element patterns must be **folders** — a file pattern in `boundaries/elements` is silently ignored (the plugin warns in debug mode).
- Backend tests truncate `users` (cascades) before each test and refuse to run unless `DATABASE_URL` points at a `*_test` database. The test database is created by `docker/init-test-db.sh` on the first compose init — after migrating from the Adonis setup, run `docker compose down -v` once.
- Expo pins companion packages to `~57.0.x` — run `npx expo install <pkg>` for Expo libs instead of `npm install`, and check with `npx expo install --check`.
- The migration that produced this backend is documented in `docs/migration-p0-findings.md` (why zod stayed, plus the version traps).
