# M0 — task queue

> Historical: A1–A7 were completed on AdonisJS and then superseded by the NestJS + Prisma
> migration (`docs/migration-p0-findings.md`). The backend task list below no longer matches the
> code — the mobile tasks and the definition of done still do.

Artifact (c). Work queue for milestone 0: **the cookbook exists and survives a
user session.** One row = one branch = one PR.

Prereq: `docs/data-model.md` §2 accepted first. Task B2 writes the recipe
migrations — if the field list is still moving, that PR becomes a migration on
already-entered rows.

Later milestones get their own file. M0 only.

---

## Definition of done

A signed-up user can manually add a recipe, see it in a list, open it, edit it,
and delete it — and it is still there after a reload. Nothing else.

## Out of scope for M0

Import (link scrape, OCR, PDF), planning, shopping, discovery, feedback, LLM of
any kind, nutrition, sharing, monetization. If a PR for M0 touches any of these,
it is out of scope.

Deliberately deferred despite being cheap, because M0 has no slice to attach
them to yet: recipe `servings` scaling math, `recipe_sources` multi-origin UI.

---

## Dependency order

```text
A1 ─┬─> A2 ─┬─> A3 ─> A5 ─┬─> A6
    │       └─> A4 ───────┘
    │                        └─> A7
    └─> B1 (needs A5's registry) ─> B2 ─> B3 ─> B4
                                              └─> B5
    C1, C2 last
```

---

## A. Backend

### A1 — `#features/*` slice migration

One commit, four edits, documented in `apps/backend/eslint.config.js` header:
`package.json` `imports` adds `"#features/*"`; `adonisrc.ts` `indexEntities()`
gets `source: 'app/features'` + `#features` alias + controller glob; TS path for
`#features/*`; `hotHook.boundaries` glob. Registry keys turn nested —
`controllers.Recipes` → `controllers.recipes.Recipes` in `start/routes.ts`.

**Acceptance:** `app/features/recipes/` exists with a trivial controller;
`npm run type-check && npm run lint` green in `apps/backend`; lint enforcement
verified live with `ESLINT_PLUGIN_BOUNDARIES_DEBUG=1 npx eslint <file>` showing
`origin: local` (not `external` — silent no-op otherwise).

**Note:** do this at M0, not later. Cost scales with every controller still in
legacy `app/controllers/`.

### A2 — recipe models + migrations

Five migrations per `docs/data-model.md` §2: `recipes` (incl. soft-delete
`deleted_at`, `source_*` provenance, `tags`/`tools` arrays),
`recipe_ingredients` (incl. mandatory `raw_text`), `recipe_steps`,
`recipe_sources`, plus `recipes.tags` GIN index if list filtering lands here.

Lucid models in `app/features/recipes/models/` extending the generated
`#database/schema` classes (same pattern as `app/models/user.ts`).

**Acceptance:** `node ace migration:run` succeeds, regenerates
`database/schema.ts` (generated file is committed), `migration:rollback` clean,
`npm run type-check` green.

### A3 — recipe validator

VineJS validator in `app/features/recipes/validators/recipe.ts` for store and
update payloads. Reject unknown fields; require `title` + at least one
ingredient. Never skipped — this is the trust boundary.

**Acceptance:** validator spec passes for valid, missing-title, empty-ingredient
and wrong-type payloads.

### A4 — recipe transformer

`app/features/recipes/transformers/` (or the shared `app/transformers/` if a
second slice needs the shape). ~15 lines: expose `id`, `title`, `servings`,
minutes, ingredients, steps, tags, tools, `sourceType`. Do not leak
`user_id`/`source_raw_path`.

**Acceptance:** transformer spec asserts the response shape has no
`user_id`, `source_raw_path`, or `deleted_at`.

### A5 — recipes controller + routes

`app/features/recipes/controllers/recipes_controller.ts`: `index`, `show`,
`store`, `update`, `destroy`. Scoped to `auth.user` — every query filters by
`user_id` (an unscoped `Recipe.find()` is a data leak and the easiest mistake to
make here). `destroy` sets `deleted_at`; `index` excludes soft-deleted.

Route group in `start/routes.ts`, prefix `recipes`, `.as('recipes')`, inside the
existing `.prefix('/api/v1')` + `middleware.auth()` group.

**Acceptance:** functional tests assert a second user cannot read, update or
delete the first user's recipe (404/403, not 500).

### A6 — functional tests

`tests/functional/recipes/` mirroring the slice: index/show/store/update/destroy
happy paths, validation failures, cross-user isolation, soft-delete
disappearance.

### A7 — server analytics events

Add a `recipes` block to `app/services/events.ts`
(`recipes.created` / `.updated` / `.deleted` — `{slice}.{event_snake}`), and
call `track(...)` in the controller where the fact actually happens.

**Acceptance:** `grep` shows no event name defined and emitted from two layers
(client event with the same string double-counts funnels).

---

## B. Mobile

### B1 — `features/recipes/queries.ts`

TanStack Query hooks (`useRecipes`, `useRecipe`, `useCreateRecipe`,
`useUpdateRecipe`, `useDeleteRecipe`) calling `api.recipes.*` from
`@/lib/client`. No `fetch`, no direct `client` use. Invalidate the list on
mutate.

**Blocked by A5** — the Tuyau registry must have regenerated.

**Acceptance:** no `fetch`/axios in the slice; query keys exported from one
place.

### B2 — list screen

`features/recipes/components/` + thin `app/recipes/index.tsx`. Empty state
matters here: it is the cold-start screen (see B5). Show title, minutes,
tags. No pagination in M0.

### B3 — detail screen

`app/recipes/[id].tsx` thin, view in `features/recipes/components/`. Shows
ingredients (`raw_text` when `quantity` is null — do not render a broken
number), steps, notes, source. Edit + delete actions.

### B4 — manual create/edit form

`app/recipes/new.tsx`. Ingredient rows add/remove; `name` required, `quantity`
optional. This form is the fallback path every future import route reuses, so
its shape becomes the review UI at M1 — keep field order matching
`docs/data-model.md` §6.1.

### B5 — cold-start redirect

`app/index.tsx` becomes a redirect: no recipes → `/recipes/new`, otherwise →
plan placeholder. This is the onboarding decision from the architecture review
made concrete; without it the app opens on nothing.

**Acceptance:** fresh account lands on the create form, not a blank list.

### B6 — mobile analytics events

`recipes` block in `apps/mobile/lib/analytics/events.ts` using the repo's
underscore convention (`recipes_create_button_clicked`,
`recipes_delete_button_clicked`, …), `track(events.recipes.*)` at the action
sites in the views. Nested-slice pattern per the file's header comment.

**Acceptance:** every button that mutates data has a matching event — a mutating
PR without one is incomplete by `AGENTS.md`.

### B7 — i18n keys

Add all new strings to `lib/i18n/locales/*.json`. No hardcoded user-facing
strings in components.

---

## C. Verification

### C1 — gates

`npx turbo run type-check lint` from root, both apps green. Mobile:
`cd apps/mobile && npx expo export --platform web` succeeds.

### C2 — smoke

Sign up → add recipe manually → appears in list → open → edit → survives reload
→ delete → gone from list. On web and one native target.

---

## Deliberate M0 shortcuts

`ponytail:` tracked so they are visible, not forgotten:

- No pagination on the recipe list — add when the list exceeds ~200 rows.
- No optimistic updates — TanStack invalidation only.
- No recipe images beyond `source_raw_path` — the hero-image upload flow is an
  M1 concern (it arrives with OCR/PDF imports anyway).
- `recipe_sources` table created but single-source UI only — multi-origin is
  not reachable until import exists.
