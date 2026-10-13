/**
 * Vertical slice boundaries, Nest edition. A feature lives in `src/features/<domain>/` with
 * its own controllers/services/validators/mappers and its own module. Features may use shared
 * code (`src/common`, `src/config`) and read another feature through its module and services
 * only — never its controller, validator or mapper. Shared code must never depend on a feature.
 *
 * Files outside the taxonomy (`src/main.ts`, `src/app.module.ts`, `src/openapi`, `scripts/`,
 * `test/`, `prisma7.config.ts`) are exempt: dependencies they participate in are not checked.
 * That is the deliberate seam where the OpenAPI document and module wiring live.
 *
 * The `typescript` resolver is required: without it the `@/*` alias stays unresolved, the
 * plugin classifies every local import as external and the rules below silently no-op.
 */
import js from '@eslint/js'
import boundaries from 'eslint-plugin-boundaries'
import security from 'eslint-plugin-security'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const ignores = [
  'dist/**',
  'coverage/**',
  'src/generated/**',
  'openapi.json',
  '*.md',
  'eslint.config.mjs',
  'vitest.config.mts',
]

const boundariesBlock = {
  name: 'boundaries/vsa',
  files: ['**/*.ts'],
  plugins: { boundaries },
  settings: {
    'import/resolver': {
      typescript: { project: './tsconfig.json' },
    },
    // Element patterns match folders; partialMatch: false anchors them at the
    // package root so a nested `services/` inside a feature is not mistaken for
    // shared code. Order matters: the specific patterns must win over the `src`
    // catch-all that holds the entry files.
    'boundaries/elements': [
      { type: 'feature', pattern: 'src/features/*', capture: ['domain'], partialMatch: false },
      {
        type: 'shared',
        pattern: ['src/common', 'src/config', 'src/openapi', 'src/generated'],
        partialMatch: false,
      },
      { type: 'test', pattern: 'test', partialMatch: false },
      { type: 'app', pattern: 'src', partialMatch: false },
    ],
    'boundaries/files': [
      { category: 'test', pattern: '**/*.spec.ts' },
      { category: 'module', pattern: '**/*.module.ts' },
      { category: 'controller', pattern: '**/controllers/**' },
      { category: 'service', pattern: '**/services/**' },
      { category: 'validator', pattern: '**/validators/**' },
      { category: 'mapper', pattern: '**/mappers/**' },
    ],
  },
  rules: {
    'boundaries/dependencies': [
      2,
      {
        default: 'disallow',
        policies: [
          // Files outside the taxonomy (scripts, prisma/vitest configs) may reach
          // anything that is classified. Dependencies *to* unclassified files are
          // ignored by the plugin.
          {
            from: { element: { isUnknown: true } },
            allow: { to: { element: { isUnknown: false } } },
          },
          // Tests reach into slices, shared code and the app module on purpose.
          {
            from: { element: { type: 'test' } },
            allow: { to: { element: { isUnknown: false } } },
          },
          // Entry points wire slices together.
          {
            from: { element: { type: 'app' } },
            allow: { to: { element: { isUnknown: false } } },
          },
          // A feature uses shared code plus its own files (intra-feature imports are
          // skipped by the plugin — checkInternals defaults to false).
          {
            from: { element: { type: 'feature' } },
            allow: { to: { element: { type: 'shared' } } },
          },
          // Read-side reuse of another feature: its module (for DI wiring) and its services.
          {
            from: { element: { type: 'feature' } },
            allow: {
              to: {
                element: { type: 'feature' },
                file: { categories: { anyOf: ['service', 'module'] } },
              },
            },
          },
          // Shared code must never depend on a feature.
          {
            from: { element: { type: 'shared' } },
            allow: { to: { element: { type: 'shared' } } },
          },
        ],
      },
    ],
  },
}

export default tseslint.config(
  { ignores },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  security.configs.recommended,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  boundariesBlock
)
