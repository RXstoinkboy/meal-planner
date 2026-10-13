E# Slice map

Artifact (b). Canonical slice shape for both apps. Pairs with
`docs/data-model.md` (ownership of tables) and `docs/m0-tasks.md` (work queue).

Status: **proposed, editable.** The current ESLint boundary config was a first
proposition, not a constraint. What the config *already* supports is marked
"verified"; what it does not is in §8 as concrete edits.

Rule of thumb: **a slice owns exactly one noun.** If you cannot name the noun,
it is not a slice.

---

## 1. Backend — `apps/backend/src/`

```text
src/
  features/
    recipes/                       owns: recipes, recipe_ingredients, recipe_steps, recipe_sources
      controllers/  services/  validators/  mappers/  openapi.ts  recipes.module.ts
    auth/                          owns: users
      controllers/ (auth, account)  services/  validators/  mappers/  openapi.ts  auth.module.ts
    import/                        owns: nothing (stateless extraction)
      services/  controllers/  validators/
    meal-plan/                     owns: meal_plans, meal_plan_slots
      services/  controllers/  validators/
    shopping/                      owns: shopping_lists, shopping_items
      services/  controllers/
    discovery/                     owns: nothing (search + handoff to import)
      services/  controllers/
    profile/                       owns: user_preferences
      services/  controllers/  validators/
    feedback/                      owns: meal_slot_feedback, user_recipe_preferences
      services/  controllers/
  common/
    database/  http/  zod/  identity/  analytics/  sentry/  health/
  config/    env.ts  logger.ts  swagger.ts  app.setup.ts
  openapi/   registry.ts (shared components)  envelope.ts
  app.module.ts  app.controller.ts  main.ts  instrument.ts
```

There is no `models/` folder: the schema lives in `prisma/schema.prisma`, the generated client in
`src/generated/prisma` (gitignored). The cross-slice surface is a slice's **service** (and its
**module**, for DI wiring) — models are gone, mappers stay slice-private.

Each slice registers its own OpenAPI paths from `<slice>/openapi.ts`, imported by its module; the
document is generated after the module graph loads (`npm run openapi`).

### Ownership & surfaces

| slice | owns (tables) | exposes cross-slice | consumes |
| --- | --- | --- | --- |
| `recipes` | `recipes`, `recipe_ingredients`, `recipe_steps`, `recipe_sources` | `services/recipes.service` | — |
| `auth` | `users` | `services/users.service` | — |
| `import` | — | `services/extract_link`, `services/extract_image`, `services/normalize_recipe` | `services/llm`, `recipes/services/ingredient_normalizer` |
| `meal-plan` | `meal_plans`, `meal_plan_slots` | `services/meal_plans.service` | `recipes/services/recipes.service`, `profile/services/user_preferences.service`, `feedback/services/score`, `services/llm` |
| `shopping` | `shopping_lists`, `shopping_items` | `services/shopping_lists.service` | `meal-plan/services/*`, `recipes/services/*`, `recipes/services/ingredient_normalizer` |
| `discovery` | — | — | `import/services/extract_link`, `services/llm` |
| `profile` | `user_preferences` | `services/user_preferences.service` | — |
| `feedback` | `meal_slot_feedback`, `user_recipe_preferences` | `services/score`, `services/record_signal` | `meal-plan/services/*`, `recipes/services/*` |

### The `feedback` decision (revision from the chat proposal)

`meal_slot_feedback` moved out of `meal-plan` into `feedback` so that **every
signal write happens inside the slice that owns signal tables.**

Cross-feature writes are what the "read-side reuse" rule is there to prevent.
With this split there is none:

- `meal-plan` **reads** `feedback/services/score` → legal, read-side.
- `feedback` **reads** `meal-plan/services/*` → legal, read-side.
- Nobody writes another slice's tables; the signal log is written only by
  `feedback`'s own controller (`POST /feedback`).

Cost: an outcome row is written by a `feedback` endpoint rather than a slot
endpoint. Acceptable — the signal is user-initiated from a screen, not a side
effect of mutating a slot.

Benefit: the whole learning loop (raw signals, the `k` table, the decaying
aggregate, the scoring function) is one folder.

→ This contradicts `docs/data-model.md` §8, which was written before the config
was read. §8 updated to match; SQL keep as-is, ownership is what changed.

### Route groups

One `@Controller('<prefix>')` per slice, mounted under the global `api` prefix + URI versioning
(so `/api/v1/...`). The `x-user-id` identity seam applies to every slice except `auth`.

| prefix | slice | notes |
| --- | --- | --- |
| `recipes` | `recipes` | CRUD |
| `imports` | `import` | `POST` → extraction draft, **not** persisted |
| `plans` | `meal-plan` | CRUD + `POST /plans/:id/generate` |
| `shopping-lists` | `shopping` | CRUD + re-derive |
| `discovery` | `discovery` | `GET` suggestions |
| `preferences` | `profile` | constraints |
| `feedback` | `feedback` | `POST` signal (slot outcome, rating, dislike) |

`auth` / `account` live in `features/auth` (it owns `users`); `/account/logout` is gone — there is
no authentication yet, so logging out is purely client-side.

---

## 2. Mobile — `apps/mobile/`

```text
app/                              # routes: thin, compose slices
  _layout.tsx
  index.tsx                       # cold start redirect → /recipes/new or /plan
  (auth)/login.tsx  (auth)/signup.tsx
  recipes/index.tsx  recipes/new.tsx  recipes/[id].tsx
  plan/index.tsx  plan/[id].tsx
  shopping/index.tsx  shopping/[id].tsx
  discovery/index.tsx
  profile/index.tsx
features/
  auth/         # exists — login/signup only
  recipes/      components/  queries.ts
  meal-plan/    components/  queries.ts
  shopping/     components/  queries.ts
  discovery/    components/  queries.ts
  profile/      components/  queries.ts
  feedback/     queries.ts            # no components — consumed by routes
state/auth.ts   # exists
lib/  components/                   # shared
```

| slice | owns | consumes (via route composition only) |
| --- | --- | --- |
| `recipes` | cookbook list/detail/create | — |
| `meal-plan` | plan list/detail, slot outcomes UI | `feedback` hooks (via route) |
| `shopping` | lists, check-off, manual add | — |
| `discovery` | suggestions list | navigates to `recipes` by path |
| `profile` | constraint form | — |
| `feedback` | `queries.ts` only | — |

### Route ↔ slice naming divergence

Deliberate, and the config does not care either way:

| URL | slice folder | why |
| --- | --- | --- |
| `/plan/*` | `features/meal-plan/` | URL short; slice name is the domain noun. `meal-plan` matches the skill's own example |
| `/recipes/*` | `features/recipes/` | identical |

Pick one convention and hold it. Current: **slice = domain noun, route = short
URL.**

---

## 3. Cross-slice interaction — the three legal moves

Only three, and none of them is "import the other slice".

### 3.1 Backend: feature → feature `services` / modules — enforced

```ts
// src/features/discovery/services/source_search.ts
import { ExtractLinkService } from '@/features/import/services/extract_link.service'
```

```ts
// src/features/shopping/services/derive_shopping_list.ts
import { MealPlansService } from '@/features/meal-plan/services/meal_plans.service'
```

Controllers, validators and mappers of another feature are **not** importable
(the allow rule names `categories: ['service', 'module']` only, so a feature's
`controllers/`, `validators/`, `mappers/` are blocked by omission).

### 3.2 Mobile: the route file is the composition point — verified allowed

Slices cannot import each other. Routes may import any slice, so any cross-slice
interaction is wired at the route:

```tsx
// app/plan/[id].tsx — route, may import two slices
import { PlanView } from '@/features/meal-plan/components/plan-view'
import { useRecordOutcome } from '@/features/feedback/queries'

export default function Screen() {
  const record = useRecordOutcome()
  return <PlanView onSlotOutcome={record.mutate} />
}
```

`meal-plan` stays ignorant of `feedback`; the route owns the seam. Do **not**
promote a shared component for this — the route already is the seam.

For pure navigation there is nothing to import at all:

```tsx
// app/discovery/index.tsx
router.push(`/recipes/new?source=${encodeURIComponent(url)}`)
```

That is how discovery reuses the recipes import flow: a URL, not a dependency.

### 3.3 Mobile: promotion to `lib/` / `components/` — only at 2+ consumers

Shared grows when a second slice needs the exact thing. Not before. If you are
tempted to promote, first check 3.2 covers it (it usually does).

---

## 4. Where domain types live — nothing new needed

Mobile needs `Recipe`, `MealPlan` shapes in four slices. Do **not** create a
shared domain-types folder: `lib/api/schema.d.ts` (generated from the backend's
`openapi.json`) types every endpoint response, and `api` from `@/lib/api/client`
carries those types. Slices infer from the API return type — `unwrap()` gives the
unwrapped payload.

`ponytail:` no shared types module. Add one only if a shape exists client-side
that the API never returns.

---

## 5. What the config already supports — verified

| capability | mobile | backend |
| --- | --- | --- |
| slice → shared/state | ✅ | ✅ (`feature` → `shared`) |
| route → any slice | ✅ | n/a (routes use the generated registry) |
| slice → slice | ❌ banned | ✅ services/modules only, read-side |
| shared → slice | ❌ banned | ❌ banned |
| cross-feature `mappers`/`validators` | ❌ by omission | ❌ by omission |
| nested `components/` inside a slice recognized as slice-owned | ✅ (config comment says so) | ✅ (same mechanism) |

Assumption to verify empirically at A1, not before: patterns are anchored with
`partialMatch: false`, which the config comments say makes a nested `components/`
or `models/` belong to the slice rather than to shared. Confirm with
`ESLINT_PLUGIN_BOUNDARIES_DEBUG=1 npx eslint <file>` after `app/features/recipes`
exists — follow the exact procedure already written into M0 task A1.

---

## 6. Slice catalogue — what earns a slice and what does not

Earns a slice: owns a noun + has its own route group (backend) or route folder
(mobile).

| candidate | verdict | why |
| --- | --- | --- |
| `nutrition` | ❌ capability, not slice | tags on `recipes` + scoring in `meal-plan`. No own noun, no own routes |
| `llm` | ❌ not a slice | shared `app/services/llm.ts`; 3 features consume it, it consumes none |
| `ocr` / `scraper` | ❌ folded into `import` | same output (a draft Recipe), two adapters — one slice, one pipeline |
| `monetization` | ❌ not a slice | a metering gate inside `services/llm.ts` + a flag on `user`. Not a domain |
| `feedback` | ✅ slice | owns two tables and its own endpoint. See §1 |
| `discovery` | ✅ slice | thin, but owns a route group and is the only writer of suggestion provenance |
| `shopping` | ✅ slice | own lifecycle (trips, checked state, store) independent of the plan |
| `onboarding` | ⚠️ deferred | currently one redirect in `app/index.tsx`. Promote to a slice the moment it needs its own routes/state |

---

## 7. Editing this map

Adding a slice = create the folder, its module (which imports `./openapi` to register its paths),
and an entry in `src/app.module.ts`. **No ESLint change** — `features/*` already matches any name.

Renaming a slice = rename the folder, the module and the `@Controller` prefix. No ESLint change.

ESLint change is needed only to alter the *taxonomy* (new top-level element
type, new importable surface) — i.e. §8 below, not ordinary slice work.

---

## 8. Proposed config & doc edits

Three items. Only #1 and #3 have real value; #2 is optional.

### 8.1 Doc bug — `app/shared/` does not exist (done)

`.pi/skills/vertical-slices/SKILL.md` no longer suggests an `app/shared/` folder. The enforced
config has no such element: shared code is `src/common` + `src/config` + `src/openapi`, and the
cross-feature surface is a slice's service (§3.1).

### 8.2 Mapper category is explicit (done)

`boundaries/files` names `mapper` alongside `service`/`controller`/`validator`/`module`, so a
feature's mapper is blocked from cross-feature import by *intent*, not by omission. The same
applies to element patterns: they must be **folders** — a file pattern in `boundaries/elements` is
silently ignored (the plugin warns only in debug mode).

### 8.3 Enforce "routes are thin" (worth doing)

The skill says route files must be thin. Nothing enforces it, and the `route`
element is the entire `app/` directory — so a route file may import *any* slice
and quietly become an orchestration layer. That is the largest unenforced gap in
the mobile taxonomy.

Cheap fix, no new abstraction — a size cap on the one directory that is supposed
to hold no logic:

```js
// apps/mobile/eslint.config.mjs
{
  files: ["app/**/*.tsx"],
  rules: {
    "max-lines": ["error", { max: 60, skipBlankLines: true, skipComments: true }],
  },
},
```

Reuses the linter you already run. Set `max` above the largest legitimate route
after M0 (B2/B3/B4 land) rather than guessing now.

### 8.4 Not proposed

- No new element for a shared domain-types folder (see §4 — the OpenAPI-generated types cover it).
- No mobile config change at all for the slice list in §2; `features/*` matches
  every name.
- The backend `isUnknown` exemption now only covers `scripts/` and the config files — there is no
  legacy controller folder left. Entry points (`src/main.ts`, `src/app.module.ts`, `src/app.controller.ts`)
  are their own `app` element and may reach anywhere; `src/generated` counts as shared.
