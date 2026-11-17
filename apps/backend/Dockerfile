# syntax=docker/dockerfile:1
# Build context is the REPO ROOT (npm workspaces hoist dependencies there):
#   docker build -f apps/backend/Dockerfile -t meal-planner-api:local .

# Pinned to the exact patch: a bare `24` drifts with every upstream rebuild.
# Bump deliberately, then `docker compose up -d --build api`.
ARG NODE_VERSION=24.22.3

FROM node:${NODE_VERSION}-alpine AS base
WORKDIR /app
# npm ci validates the lockfile against the full workspace tree, so every
# workspace manifest must exist before install — even though only the backend's
# dependencies are installed (the workspace filter keeps mobile's deps out).
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/mobile/package.json apps/mobile/
# The backend postinstall runs `prisma generate`, so the schema must land first.
COPY apps/backend/prisma apps/backend/prisma
COPY apps/backend/prisma7.config.ts apps/backend/

FROM base AS deps
# No --ignore-scripts: `allowScripts` in the root package.json gates the
# prisma / @prisma/engines / @swc/core postinstalls the build and migrate need.
RUN npm ci --workspace @meal-planner/backend --include-workspace-root

FROM deps AS development
COPY --chown=node:node apps/backend/nest-cli.json apps/backend/tsconfig.json apps/backend/tsconfig.build.json apps/backend/
COPY --chown=node:node apps/backend/src apps/backend/src
COPY --chown=node:node apps/backend/test apps/backend/test
COPY --chown=node:node apps/backend/docker/entrypoint.dev.sh apps/backend/docker/entrypoint.dev.sh
# nest-cli's deleteOutDir removes `dist`, which needs a writable parent as `node`.
RUN chown -R node:node /app/apps
WORKDIR /app/apps/backend
USER node
EXPOSE 3333
CMD ["sh", "docker/entrypoint.dev.sh"]

FROM deps AS build
COPY apps/backend/nest-cli.json apps/backend/tsconfig.json apps/backend/tsconfig.build.json apps/backend/
COPY apps/backend/src apps/backend/src
WORKDIR /app/apps/backend
RUN npx prisma generate && npm run build

FROM base AS prod-deps
# Runtime modules only. Scripts are skipped because `prisma` is a devDependency here,
# and the client is already compiled into `dist`.
RUN npm ci --omit=dev --ignore-scripts --workspace @meal-planner/backend --include-workspace-root

# Dev dependencies intact, so the prisma CLI and its engines are available.
FROM deps AS migrate
WORKDIR /app/apps/backend
USER node
CMD ["npx", "prisma", "migrate", "deploy"]

FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=prod-deps --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build --chown=node:node /app/apps/backend/dist ./apps/backend/dist
WORKDIR /app/apps/backend
USER node
EXPOSE 3333
CMD ["node", "dist/main.js"]
