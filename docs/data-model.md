# Data model & contracts

Artifact (a). Design decisions that are cheap now and migrations later.

Scope: entities, the hard/soft constraint split, the scoring model, the LLM
response contracts, provenance rules. No code, no migrations here.

Read with `.pi/skills/vertical-slices/SKILL.md` — table names map 1:1 to
feature slices, and which slice owns a table is stated per entity.

Slug convention: snake_case, plural, owned by the feature whose folder holds
the model.

---

## 1. Why this doc exists

`Recipe` is the hub. Every slice reads it: planning selects from it, shopping
projects it, discovery fills it, feedback scores it. Get the shape wrong and
the first wrong guess becomes a migration on live plans and shopping history,
in a database that already has users' hand-entered recipes.

Two decisions here are load-bearing and cannot be retrofitted cheaply:

1. **Hard vs soft constraints** (§4) — determines whether the planner is
   auditable or a slot machine.
2. **`recipe_id`-only LLM output, validated against a pre-filtered candidate
   set** (§6) — makes allergen leakage structurally impossible rather than
   prompt-dependent.

---

## 2. Recipes — slice `recipes`

### `recipes`

| column | type | notes |
| --- | --- | --- |
| `id` | increments | |
| `user_id` | int FK users | owner. Present from day one — sharing becomes a join table later, not a rewrite |
| `title` | string | |
| `description` | text null | |
| `servings` | int | base yield. Shopping math multiplies by `slot.servings / recipe.servings` |
| `prep_minutes` | int null | |
| `cook_minutes` | int null | |
| `cuisine` | string null | |
| `tags` | text[] | see §3 — nutrition substitute lives here |
| `tools` | text[] | required equipment keys (`thermomix`, `blender`, `oven`, `air_fryer`). Empty = no special tool |
| `notes` | text null | user's own free text ("mama robi z mniej soli") |
| `source_type` | enum | `manual` \| `link` \| `image` \| `pdf` \| `suggestion` |
| `source_url` | string null | |
| `source_raw_path` | string null | stored original (PDF/image/HTML) |
| `source_fetched_at` | timestamp null | |
| `extraction_model` | string null | |
| `extraction_confidence` | jsonb null | per-section, from §6 |
| `source_stale` | bool | true when the source URL died on re-check |
| `created_at` / `updated_at` | timestamp | |
| `deleted_at` | timestamp null | **soft delete** |

Soft delete is required, not a preference: plans and shopping history reference
recipes. Hard delete leaves dangling slots and rewrites what the user actually
ate. `deleted_at` filters out of the cookbook, stays resolvable in history.

### `recipe_ingredients`

| column | type | notes |
| --- | --- | --- |
| `id`, `recipe_id` | | |
| `position` | int | display order |
| `raw_text` | string | **as written in the source**: `"2 łyżki oliwy"`. Never lost |
| `name` | string | normalized: `"oliwa z oliwek"`. Merge key for shopping |
| `quantity` | decimal null | null when unparseable — never guessed |
| `unit` | string null | |
| `category` | string null | `produce`/`dairy`/`pantry`/`meat`/`frozen`/`bakery` — drives shopping-list grouping |
| `optional` | bool | |

`raw_text` alongside normalized fields is the whole point: parsers fail, and
without the original you cannot re-normalize later.

### `recipe_steps`

`id`, `recipe_id`, `position`, `text`, `duration_minutes` (null).

### `recipe_sources`

`id`, `recipe_id`, `url`, `kind` (`link`/`video`/`book`), `label`, `added_at`.
Separate from `recipes.source_url` — one recipe can cite several origins.
The two `*_url`/`source_raw_path` columns above record where *this instance*
was imported from.

Ownership: all five tables in `app/features/recipes/models/`.

---

## 3. Nutrition — deliberately tags, not numbers

`recipes.tags` (`text[]`) carries `iron-rich`, `vegetarian-protein`,
`high-protein`, `quick`, `one-pot`, `low-carb`.

Reason: real nutrient math needs per-ingredient nutrient data → an ingredient
database → matching on every import and every manual entry. That is the single
largest cost item in the whole product plan and it is currently one line in the
feature list ("uzupełnić niedobory żelaza").

Tags get ~80% of the value (iron-rich matters more than 4.2 mg) at ~2% of the
cost, and needs no data source. Promote to numbers only if tags demonstrably
fall short.

`ponytail:` tags until a user complains a tag lied. Upgrade path: add
`recipe_nutrients` table, backfill by running extraction over
`source_raw_path` archives.

---

## 4. Constraints — the hard/soft split

Hard constraints are **code/SQL filters applied before the LLM sees anything**.
Soft preferences are **score inputs**. Nothing hard is ever delegated to a
model.

### `user_preferences` — slice `profile`, 1:1 with `users`

| column | type | kind | notes |
| --- | --- | --- | --- |
| `user_id` | int FK unique | | |
| `diet` | enum | **HARD** | `omnivore`\|`vegetarian`\|`vegan`\|`pescatarian`\|`keto` |
| `allergies` | text[] | **HARD** | ingredient names; exclude any recipe whose `recipe_ingredients.name` intersects |
| `disliked_ingredients` | text[] | **HARD** (default) | user explicitly never wants them; soft-able per-recipe later |
| `excluded_meal_types` | text[] | **HARD** | your "bez kolacji" — filter which slots get generated at all |
| `kitchen_tools` | text[] | **HARD** | |
| `max_weekday_minutes` | int | **HARD** | default filter, overridable |
| `max_weekend_minutes` | int | **HARD** | |
| `household_size` | int | | default servings |
| `iron_target_tag` | text null | **SOFT** | e.g. `iron-rich` → scoring bonus weight |

Why a separate table rather than columns on `users`: `app/models/user.ts` is
**shared** code, and shared must never depend on a feature. A 1:1 table owned
by `profile` keeps the auth model clean and lets the constraint shape change
without touching shared code. Cost: one join.

| Constraint | Kind | Enforcement |
| --- | --- | --- |
| allergies | HARD | SQL exclude on ingredient name |
| diet | HARD | tag/enum filter |
| `excluded_meal_types` | HARD | slot generation |
| kitchen tools | HARD | `recipes.tools <@ user_preferences.kitchen_tools` (array subset — exact fit in one operator) |
| time budget | HARD | `prep_minutes + cook_minutes <= max` |
| disliked ingredients | HARD | SQL exclude |
| prefer/avoid recipe (history) | SOFT | signed score term, §5 |
| nutrient tags | SOFT | score bonus |
| variety / recency | SOFT | score penalty |
| novelty | SOFT | bonus for never-cooked |
| store count, cost | SOFT | **deferred** |

---

## 5. Preference weight — one signed number, decaying

Your product instinct: *"jak user zaznaczy, że nie lubi, to mniejsza szansa, ale
nie nigdy, bo smaki się zmieniają."* That is a time-decayed weight, not a
blocklist. One **signed** float covers both directions — no separate like and
dislike fields to keep consistent.

Per `(user_id, recipe_id)` row in `user_recipe_preferences` (slice
`feedback`, see §1 of `docs/slices.md`):

```text
pref_weight = pref_weight * exp(-Δdays / tau) + k
tau ≈ 60 days
```

| signal | `k` | why |
| --- | --- | --- |
| `rated` 5 | +1.0 | strongest positive |
| `cooked` | +0.4 | weak positive: choosing it again is mild endorsement |
| `rated` 1 | −1.0 | strongest negative |
| `swapped_out` | −0.8 | **active rejection** — deliberately replaced it |
| `dislike` (explicit) | −1.0 | |
| `skipped` | −0.1 | nearly no signal — see below |

Then `meal_scoring` contributes `+β * pref_weight`.

Decay is applied **lazily**, on each new signal and on each scoring pass. No
cron job. `ponytail:` lazy decay; scheduled decay only if scoring latency
becomes measurable.

### ⚠️ `skipped` is an ambiguous signal — the UI must disambiguate

"Didn't cook it" conflates *no time*, *ate out spontaneously*, and *don't like
this recipe*. Treating it as dislike poisons the model with false negatives;
treating it as neutral wastes the most common signal.

Therefore the committed-slot UI in `plan/[id].tsx` must offer three outcomes,
not a checkbox:

- **Zrobione** → `cooked` (+)
- **Zamienione** → `swapped_out` (−, strong)
- **Pominięte** → `skipped` (−, almost nothing)

`k=-0.1` on `skipped` is the compromise until you have real data. Revisit once
you can see the distribution.

---

## 6. LLM contracts

Two contracts, both **structured JSON, schema-validated server-side**. The
model never writes recipe prose that reaches the cookbook.

### 6.1 Extraction (slice `import`) — source text/image → normalized recipe

```json
{
  "title": "string",
  "servings": 4,
  "prep_minutes": 10,
  "cook_minutes": 25,
  "ingredients": [
    {
      "raw_text": "2 łyżki oliwy",
      "name": "oliwa z oliwek",
      "quantity": 2,
      "unit": "łyżka",
      "category": "pantry",
      "optional": false
    }
  ],
  "steps": [{ "position": 1, "text": "string", "duration_minutes": null }],
  "tags": ["iron-rich"],
  "tools": ["blender"],
  "confidence": { "title": 0.98, "ingredients": 0.8, "steps": 0.95 }
}
```

Rules:

- **Never invent** an ingredient or step absent from the source. Missing data →
  `null`, never a plausible guess.
- Unparseable quantity → `quantity: null`, keep `raw_text`.
- `confidence` per section drives which fields the review UI highlights for
  human correction.
- Output is always a **draft**. Nothing is saved to `recipes` before the user
  confirms §7.

This contract is why `quantity` is nullable and `raw_text` is mandatory: the
model's job is normalization, not completion.

### 6.2 Plan generation (slice `meal-plan`) — slots + candidates → assignment

Input the server builds (not the model):

```text
period, slots (dates × non-excluded meal types), servings,
candidates: [ { recipe_id, title, tags, tools, minutes, pref_weight, last_cooked_at } ]
```

`candidates` is already **hard-filtered** per §4. Output:

```json
{
  "slots": [
    {
      "date": "2026-01-05",
      "meal_type": "dinner",
      "recipe_id": 42,
      "reason": "high iron, not cooked in 3 weeks"
    }
  ]
}
```

Rules:

- **`recipe_id` MUST exist in `candidates`.** Every returned id is validated
  against the candidate set; unknown or non-candidate ids are **dropped**, and
  the slot re-filled from the remaining pool. An allergen cannot reach a plan
  because the model never had the allergen recipe to begin with, and the
  validator catches it if the model invents an id.
- No free-text recipes, no invented ingredient lists. Discovery gets new
  recipes through §7, not through this call.
- `reason` is stored on the slot and surfaced in the UI — explainability builds
  the trust that makes the feedback loop worth anything.

`ponytail:` a single JSON-mode call with server-side validation. Add a
multi-pass/repair loop only if dropped-id rate proves non-trivial in practice.

---

## 7. Provenance — real URLs only

Non-negotiable rule: **no recipe text originates from model memory.** Model
output is only ever a normalization of text that came from a real source.

Discovery therefore = *search → real URLs → existing `import` extraction
pipeline* (slice `discovery` calls `import`'s **service**, which your ESLint
feature→feature policy permits). Consequences:

- Hallucinated recipes are structurally impossible — no source, nothing to
  extract.
- Zero new ingestion code; M1's pipeline already exists.
- The LLM's only job in discovery is choosing *what to search for*
  ("more iron-rich, no meat, has Thermomix") and ranking returned candidates.

Every imported recipe keeps `source_url` + `source_raw_path`. When a scraper
rots or a model improves, re-run extraction over the archive instead of asking
the user to re-enter their book. When a link dies, flag `source_stale` — the
recipe survives, its provenance is marked uncertain.

Slots store `locked` (bool): user-pinned meals survive a regenerate. Add it in
the first plan migration, not after the first complaint about lost edits.

---

## 8. Planning & feedback — slices `meal-plan` + `feedback`

### `meal_plans`

`id`, `user_id`, `name`, `date_from`, `date_to`, `status`
(`draft`/`active`/`archived`), `generated_at`, `generator_model`,
`created_at`/`updated_at`.

### `meal_plan_slots` — the propose/commit boundary

`id`, `meal_plan_id`, `date`, `meal_type`, `position`, `recipe_id` (null =
empty or eating out), `status` (`proposed`/`committed`/`skipped`), `servings`,
`locked` (bool), `source` (`llm`/`manual`), `reason` (text null), `score`
(decimal null), `created_at`/`updated_at`.

`status` is the boundary your feature list correctly identified ("zaznacz które
posiłki z proponowanych będziemy robić"). Shopping derives **from `committed`
only** — a proposed meal the user ignored must not appear on the list.

### `meal_slot_feedback` — slice `feedback`

`id`, `slot_id` nullable, `user_id`, `recipe_id`, `signal`
(`cooked`/`skipped`/`swapped_out`/`rated`/`disliked`), `value` (int null, 1–5),
`created_at`.

Append-only. `user_recipe_preferences.pref_weight` is a derived aggregate,
recomputable from this table — so a bad `k` can be corrected retroactively
without losing the raw signal history. That property is why both exist.

**Ownership:** this table belongs to slice `feedback`, together with
`user_recipe_preferences` and the scoring service — *not* to `meal-plan`, which
owns only `meal_plans` and `meal_plan_slots`. Reason: every signal must be
written by the slice that owns signal tables, so no feature writes another's
data. Cross-slice flow is read-only in both directions:

- `meal-plan` reads `feedback/services/score`
- `feedback` reads `meal-plan/models/meal_plan_slot` (for `slot_id`)

Writes arrive only through `feedback`'s own endpoint (`POST /v1/feedback`).
See `docs/slices.md` §1 for the full ownership table.

Feedback schema lands **with** the plan schema, not in a later milestone — it
is part of the slot lifecycle, and the three-outcome UI in §5 must exist the
first time a user commits a meal. Landing together does not mean living in the
same slice.

---

## 9. Shopping — slice `shopping`

### `shopping_lists`

`id`, `user_id`, `name`, `meal_plan_id` null, `date_from`, `date_to`,
`store` (string null — your "ulubione sklepy", optional field now, no migration
later), `completed_at` null, `created_at`/`updated_at`.

A list is **per trip**, not per plan period. A month plan is not one shopping
trip; the list is derived from a date range (or a chosen subset) of
**committed** slots. This is the mismatch in the original plan and the reason
`store` keeps feeling needed.

### `shopping_items`

`id`, `list_id`, `name` (normalized = merge key), `quantity` decimal null,
`unit` null, `category` null, `checked` bool, `manual` bool,
`source_slot_ids` jsonb, `note` null.

Derivation (`services/derive_shopping_list.ts`): committed slots → their
recipes' ingredients → multiply by `slot.servings / recipe.servings` → merge by
`name` + `unit` → sum `quantity` → group by `category`.

`source_slot_ids` is required, not bookkeeping: it answers "why is this on my
list", and lets a changed commitment re-derive the list incrementally without
clobbering items the user already checked or added by hand.

`ponytail:` merge on exact normalized `name`+`unit`; unit conversion
(g → kg, łyżka → ml) only when a real list proves ambiguous.

---

## 10. Explicitly deferred

Recorded so they are decisions, not omissions:

- **Nutrient numbers** — tags suffice (§3).
- **Household sharing** — `user_id` on plans/lists now; sharing later is a join
  table, not a schema rewrite. UX currently assumes single user.
- **Ultimate shopping quantities across stores / price awareness** — out of
  scope. `shopping_lists.store` is the only hook left in place.
- **Ingredient substitution suggestions** ("nie lubi mięsa, ale brakuje
  żelaza") — this is a *scoring/tag* problem before it is an LLM problem.
  Revisit after M5 with real `pref_weight` data.
- **Web browser plugin** — mobile share-sheet covers it at a fraction of the
  cost.
