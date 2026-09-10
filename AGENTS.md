# Meal Planner

Monorepo for the Meal Planner app: Expo mobile/web client + AdonisJS API.

## Tech Stack

- **Monorepo**: Turborepo (npm workspaces, npm@11.16)
- **Mobile** (`apps/mobile`): Expo SDK 57 (RN 0.86.3, React 19.2) + Expo Router (file-based routing, typed routes) + Tamagui v2 (UI) + Legend-State (global state) + TanStack Query v5 (server state, persisted to AsyncStorage). Runs on iOS, Android **and web** (metro bundler, static output).
- **Backend** (`apps/backend`): AdonisJS v7 (Node.js ESM) + PostgreSQL via Lucid ORM (pg) + VineJS validation + Tuyau (typed API client registry) + Japa (tests)
- **Dev**: TypeScript 6.0.3, ESLint, Prettier, `node ace serve --hmr`

### Version pinning notes

Three toolchain majors exist upstream but are held back by their plugin ecosystems. We are on the newest versions each gate allows. Exact gates:

| Hold | Blocked by | Lift when |
| ------ | ------------ | ----------- |
| TypeScript 7 (native `tsgo` build) unused — on `~6.0.3` bridge release (what Adonis/Expo toolchains pin) | `typescript-eslint@8.70.0` peer `typescript <6.1.0`. tseslint drives the JS compiler API; TS 7 ships native binaries without it. Even the 8.70.1-alpha canary still gates at `<6.1.0` | typescript-eslint peer range accepts 7.x |
| ESLint on `^9.39.5` (10.10.0 exists) | `eslint-plugin-react@7.37.5` peer caps at `^9.7`; it still calls removed API `context.getFilename()` (lib/util/version.js:31). Pulled in via `eslint-config-expo`, can't be dropped without forking that config | eslint-plugin-react (or eslint-config-expo) declares ESLint 10 support |
| `@babel/core` on `^7.29.7` (8.0.1 exists) | whole Expo transform chain is Babel 7: `babel-preset-expo` pins every `@babel/*` to `^7`, `@expo/metro-config` depends on `@babel/core ^7.20.0`, worklets/Tamagui plugins assert `^7.0.0-0` | `babel-preset-expo` / `@expo/metro-config` migrate to Babel 8 |

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
│   └── backend/             # AdonisJS v7 API
│       ├── app/             # controllers/, middleware/, models/, transformers/, validators/
│       ├── config/          # AdonisJS config (app, auth, cors, database, ...)
│       ├── database/        # migrations/, schema generation
│       ├── start/           # routes.ts, kernel.ts, env.ts
│       ├── tests/           # Japa suites (unit/, functional/)
│       ├── docker-compose.yml  # PostgreSQL 18 (project name: meal-planner)
│       ├── adonisrc.ts
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
npm run dev                # starts docker db + ace serve --hmr (http://localhost:3333)
npm run db                 # docker compose up -d db
npm run ace migration:run  # run migrations (or: node ace migration:run)
npm run type-check
npm run lint
npm test                   # japa test suites
```

### Env vars

- `apps/backend`: copy `.env.example` → `.env` (APP_KEY, DB_*, PORT). Never commit secrets.
- `apps/mobile`: copy `.env.example` → `.env` — `EXPO_PUBLIC_API_URL` (use LAN IP like `http://192.168.1.x:3333` for physical devices). All client env vars must be prefixed `EXPO_PUBLIC_`.

## API

Base path `/api/v1`. Starter-kit auth is wired up:

| Method | Path | Description |
| -------- | ------ | ------------- |
| POST | `/api/v1/auth/signup` | Create user, returns user + access token |
| POST | `/api/v1/auth/login` | Returns access token |
| GET | `/api/v1/account/profile` | Requires `Authorization: Bearer <token>` |
| POST | `/api/v1/account/logout` | Revoke token |
| GET | `/` | hello world |

## Key Conventions

- Mobile imports alias: `@/` → `apps/mobile/` root.
- Tamagui v2 with `onlyAllowShorthands: true` (from `@tamagui/config/v5`): use style **shorthands** — `grow`, `justify`, `items`, `p`, `bg` — longhands like `justifyContent` are omitted from the types. Extend `tamagui.config.ts` if you ever need to change this; do not add a themes package unless asked.
- State split (mirrors fitly): Legend-State for persistent app state (`state/`), TanStack Query for server data (`queries/`), API calls only through TanStack Query.
- Metro resolves packages hoisted to the repo root; `@tamagui/core`, `@tamagui/web`, `tamagui` are forced to a single copy at the workspace root (root `overrides` pin them together). Keep those in sync when bumping Tamagui.
- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`. Branches: `feat/description`, `fix/description`.
- Don't add dependencies without a good reason — ask first.

## Gotchas

- The backend compose project is explicitly named `meal-planner` (folder name `backend` collides with other repos' compose projects).
- `apps/backend/.adonisjs/` contains generated API registry types (`#generated/*` imports in routes). It regenerates on `ace` commands but is committed so `turbo type-check` works on fresh clones.
- Expo pins companion packages to `~57.0.x` — run `npx expo install <pkg>` for Expo libs instead of `npm install`, and check with `npx expo install --check`.
