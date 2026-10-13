# TODO — deferred work, highest value first

Actionable index of everything deliberately left for later. Rationale and
design detail live in `docs/data-model.md`, `docs/slices.md`,
`docs/m0-tasks.md` — this file is only *what to pick up next* and *why it pays*.

Order = value, not effort. Cheap items sit where their value puts them, not at
the top. `blocked:` marks what cannot be started yet.

---

1. **Onboarding / cold start** — an empty cookbook cannot be planned from, so the first five minutes decide retention; needs import 3–5 or a starter set, not just the redirect M0 ships. *Payoff: the product works on a fresh account.*
2. **Offline-first writes** — `networkMode: 'offlineFirst'` on queries and mutations plus `onlineManager` wired to NetInfo; paused mutations already persist and resume by default (verified in the installed `@tanstack/query-core`), so nothing else is needed. *Payoff: cooking and shopping work in a kitchen with no signal.* `blocked: after A5/B1 — nothing server-side to be offline about yet.`
3. **Auth hydration flash (bug)** — `state/auth.ts` hydrates in `useEffect` and nothing gates rendering, so a logged-in user sees the login screen for a frame on every cold start; ~5 lines. *Payoff: no wrong screen on launch.*
4. **Nutrition numbers** — promote `recipes.tags` to a `recipe_nutrients` table backfilled from `source_raw_path` archives. *Payoff: real iron/macro gaps instead of tags.* `blocked: only if tags measurably fall short — it's the most expensive item on this list.`
5. **Household sharing** — `user_id` on plans/lists today; sharing is a join table. *Payoff: the shopping list stops assuming one person cooks.*
6. **Ingredient substitution** — when a hard constraint conflicts with a nutrient goal ("no meat, but iron is low"), suggest rather than dead-end. *Payoff: constraints stop producing empty plans.*
7. **Unit conversion in the shopping merge** — `g`↔`kg`, `łyżka`↔`ml`; today merging is exact-name-and-unit. *Payoff: no split or falsely-merged list rows.*
8. **Recipe images / hero upload** — beyond `source_raw_path`. *Payoff: browsable cookbook; arrives naturally with M1 OCR/PDF import.*
9. **Store & price awareness** — gives `shopping_lists.store` a real feature: group the list per shop. *Payoff: makes "ulubione sklepy" worth having.*
10. **Enforce thin routes (`max-lines` on `app/**`)** — proposed in `docs/slices.md` §8.3. *Payoff: closes the largest unenforced gap in the mobile taxonomy — the `route` element is all of `app/`, so a route can silently become an orchestration layer.*
11. **Onboarding as a real slice** — currently one redirect in `app/index.tsx`. *Payoff: landing flow gets routes and state instead of a placeholder.* `blocked: promote when item 1 needs its own routes.`
12. **MMKV storage swap** — `ObservablePersistMMKV` ships in `@legendapp/state@2.1.15`, and the TanStack persister needs a small adapter over it. *Payoff: faster, synchronous storage.* `blocked: needs react-native-mmkv (new dev-client build) and a web fallback — measure AsyncStorage pain first.`
13. **Legend-State `persistObservable` migration** — replaces the three hand-rolled `AsyncStorage` calls in `state/auth.ts`. *Payoff: persistence and hydration handled by the library, race removed at the source.*
14. **Pagination on the recipe list** — M0 ships unpaginated. *Payoff: keeps the list usable past ~200 recipes.*
15. **Multi-source UI for `recipe_sources`** — table exists, UI is single-source. *Payoff: one recipe can cite a link, a video and a book.* `blocked: after M1 import exists.`
16. **LLM plan-generation repair loop** — single JSON call with server-side candidate validation for now. *Payoff: recovers slots when dropped-`recipe_id` rate proves non-trivial.* `blocked: measure first.`
17. **Scheduled `pref_weight` decay** — decay is currently applied lazily on signal and on scoring. *Payoff: removes scoring latency if it ever becomes measurable.* `blocked: measure first.`
18. **Web browser plugin** — mobile share-sheet already covers link/image/file import. *Payoff: convenience on desktop.* `blocked: lowest value on this list — share-sheet is ~90% of it.`
19. **Sentry phase 2** — tracing, session replay, Better Stack uptime + status page, log shipping via a pino transport. *Payoff: real observability.* `blocked: see the deliberate scope note in AGENTS.md.`

20. **Real authentication** — `x-user-id` is a temporary seam (`apps/backend/src/common/identity/current-user.decorator.ts`); swap it for Nest passport (access token + refresh rotation) or Keycloak, add `@Roles()`/RolesGuard, and re-introduce password hashing plus the token table (migration). *Payoff: the API can leave the local machine.* `blocked: product decision on passport vs Keycloak.`

---

## Recipe schema follow-ups (A2)

Concrete items from the A2 data-model review. The row-level schema matches
`docs/data-model.md` §2; these are the gaps and the deliberate deferrals on top
of it. Cross-references point at the numbered items above instead of
duplicating them.

### Cheap, fold into A4/A5 or one follow-up migration

- **Lucid relations** — `Recipe hasMany` ingredients/steps/sources, `belongsTo User`; children `belongsTo Recipe`. Order with `onQuery((q) => q.orderBy('position'))`. Do **not** put the reverse `User hasMany Recipe` on shared `app/models/user.ts` — shared → feature violates `boundaries/dependencies`. Add when A4 preloads.
- **`extraction_confidence` type** — jsonb generates `any`; redeclare `Record<string, number>` in the model, same trick already used for `tags`/`tools`/`sourceType`.
- **Composite `UNIQUE(recipe_id, position)`** on `recipe_ingredients` and `recipe_steps` — enforces display order, kills dupes.
- **Partial index** `recipes(user_id) WHERE deleted_at IS NULL` — the plain `user_id` index still scans soft-deleted rows for the cookbook query.
- **GIN on `recipes.tools`** — the kitchen hard filter `recipes.tools <@ user_preferences.kitchen_tools` needs GIN; btree cannot serve subset. (`tags` GIN already landed.)
- **btree on `recipe_ingredients(name)`** — allergen/dislike exclusion filters on `name`; btree serves `= ANY(array)`.
- **CHECK constraints** — `servings > 0`, `position >= 0`, `quantity >= 0`.
- **`quantity` decimal → string** — Lucid returns `string | null` for decimals. Decide now: parse on use, or switch the column to `real`/`double precision` if float math is wanted.
- **Native enum evolution** — `recipe_source_type` / `recipe_source_kind` cannot drop values cheaply. Keep, or switch to `text + CHECK` before data exists.

### Sharing, visibility, recommendation

- ~~**Single access scope in A5**~~ — done: `visibleWhere(userId)` in `apps/backend/src/features/recipes/services/recipes.service.ts` is the only read path, so sharing lands in one place.
- **`recipe_shares`** — `(recipe_id, user_id, role, created_at)`, `UNIQUE(recipe_id, user_id)`, `INDEX(user_id, recipe_id)`. `recipes.user_id` stays as immutable owner/author. Additive backfill: owner implicitly has access, no data rewrite. Related to item 5 (household sharing), but this is per-recipe access, not plans/lists.
- **`recipes.visibility`** — `private | shared | public` (or a separate public catalogue table) for recommending a recipe to users who have no access grant.
- **Recommendation privacy** — publishing to strangers leaks `notes`, `source_raw_path`, private tags. Expose a fork/snapshot or scrubbed projection, not the owner's private row.

### Promote-when-needed (keep array/text staging now)

- **Tags → table** — `tags(id, user_id null, slug, label)` + `recipe_tags(recipe_id, tag_id)`. Promote when tag CRUD UI, per-user tags, or tag analytics appear. Backfill is `SELECT id, unnest(tags) FROM recipes` then drop the column. Ties into item 5.
- **Ingredient dictionary** — `ingredients(id, canonical_name, category, default_unit)` + nullable `recipe_ingredients.ingredient_id`, plus `ingredient_aliases` and a matching pipeline (exact → alias → trigram → review). Keystone: unblocks item 4 (nutrition), item 6 (substitution), item 7 (unit conversion), and reliable shopping merge. `blocked: matching/curation is the cost the tags decision deliberately postponed.`
- **`recipe_ingredients.category` → dictionary** — free-form string today (validator accepts any string, no enum), so imports and manual entry can disagree on spelling (`pantry` vs `przetwory`). Same staging decision as tags and the ingredient dictionary above; promote it **with** that dictionary, not separately. Model the relation as many-to-many (`ingredient_categories`) rather than one column — an ingredient plausibly belongs to several (`canned tomatoes` = produce + pantry; dietary groupings), and a single column would force a second migration. *Payoff: shopping-list grouping becomes exact instead of string-matched.* `blocked: same as the ingredient dictionary — matching/curation is the deferred cost.`
- **Cuisine → table/entity** — free-form string today, but cuisine is a controlled vocabulary that needs translation, filtering and grouping, not user prose. Becomes a `cuisines` table (slug + i18n labels) with `recipes.cuisine_id`; backfill is `SELECT DISTINCT cuisine FROM recipes`. Same staging call as tags/ingredients. *Payoff: localized cuisine names and exact filtering instead of string matching.*
- **`recipe_nutrients`** — see item 4; strictly downstream of the ingredient dictionary and non-nullable quantities.
- **Recipe versioning** — store each extraction run + confidence so a better model can be re-run over `source_raw_path` without losing the prior result.
- **Full-text search** — `tsvector` column on title/description + GIN, for cookbook search.
- **pgvector embeddings** — for discovery ranking / "similar recipes".
- **Soft-delete retention** — archival policy; every extra year of `deleted_at` rows costs the partial index and plan/shopping history resolution.
- **Richer `recipe_sources`** — video timestamps, page numbers; ties into item 15 (multi-source UI).
