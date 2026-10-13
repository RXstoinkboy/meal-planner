# P0 gate results (verified in /tmp/nest12, throwaway)

Stack that passed, with the fallbacks taken:

| Gate | Result |
| --- | --- |
| NestJS | **12.1.3** (CLI 12.0.8, testing 12.1.3, swagger 12.0.2, config 12.0.1, throttler 6.7.1) |
| TypeScript | 6.0.3, `nest build` OK |
| Zod | 4.6.7 + **`@asteasolutions/zod-to-openapi` 9.1.0** |
| Prisma | **7.10.0** + `@prisma/adapter-pg` (CLI `latest` tag is an 8.0.0-rc → always pin/prefer the local binary) |
| Tests | Vitest 5.0.4 + `unplugin-swc` 2 + `@nestjs/testing` + supertest 7.3.1 |
| Mobile types | `openapi-typescript` 7.13.0 + `openapi-fetch` 0.17.0 |

## Rejected: nestjs-zod 5.5.0 (fallback taken, per plan)

`nestjs-zod` 5.5.0 renders every `T | null` as `{ type: 'array', items: T }` in **both** input and output
OpenAPI modes (zod 4). Untenable — nullable is core to this API (`quantity`, `notes`, `prep_minutes`,
`duration_minutes`, `description`, `source_url`). Also peer-caps Nest at `^11` and `@nestjs/swagger` at `^11`.

Fallback (plan's pre-chosen path): zod schemas + `@asteasolutions/zod-to-openapi` registry, document served
by `SwaggerModule.setup('docs', app, document)` (verified: `/docs` 200 + swagger-ui, `/docs-json` 200) and
written to `openapi.json` by a script. Validation via a ~40-line global pipe reading the schema off a DTO
class created by a ~15-line `createZodDto` shim. Generated `openapi.json` is **OpenAPI 3.1**
(`type: ["string","null"]`), which `openapi-typescript` and Swagger UI both handle.

## Gotchas to apply in the real project

1. `baseUrl` is deprecated in TS 6 → use `paths` without `baseUrl`; Nest's tsc builder rewrites aliases.
2. `nest build` needs explicit `rootDir` (`./src`), else TS5011.
3. `deleteOutDir: true` + `incremental: true` leaves a stale `tsconfig.tsbuildinfo` outside `dist` → files
   silently missing from `dist`. Set `tsBuildInfoFile` inside `dist`, or don't use incremental.
4. Prisma 7 `prisma-client` generator under a CJS build needs `moduleFormat = "cjs"` **and**
   `importFileExtension = "js"` (otherwise `require('./internal/class.ts')` at runtime).
5. Prisma 7 CLI reads `prisma7.config.ts` (not the datasource `url` in the schema); migrations need it.
6. Vitest config must be `vitest.config.mts` in a CommonJS package (Vite native config-loader warning).
7. `openapi-typescript@7` peer-caps TypeScript at `^5.x` → install with a root override
   `"overrides": { "openapi-typescript": { "typescript": "$typescript" } }`; it runs fine on TS 6.
8. `@nestjs/swagger` needs `@nestjs/swagger` 12 with Nest 12 (`@nestjs/swagger@11` peers `@nestjs/core@^11`).

## 2026-07 re-check: the nestjs-zod gate still holds (follow-up)

Fresh `npm view` today: nestjs-zod is still 5.5.0 (latest), still peers `@nestjs/common` at
`^10.0.0 || ^11.0.0` and `@nestjs/swagger` at `^7.4.2 || ^8.0.0 || ^11.0.0` — no Nest 12 — and
the `T | null` → `{ type: 'array' }` OpenAPI rendering it was rejected for remains. The P0
fallback (zod schemas + `zod-to-openapi` registry + the hand-rolled `createZodDto` /
`ZodValidationPipe` shim) stays.

Same round dropped the Adonis-era wire contract: no `{ data }` envelope, no `{ errors: [...] }`
shape, and no committed openapi.json / generated mobile types. Responses are bare resources,
failures are stock Nest bodies (`{ statusCode, message, error }`, 400 validation messages as
`[{ field, message }]`), and `/docs` is runtime-only.
