import { configApp, ADONIS_IGNORE_LIST, GLOBAL_IGNORE_LIST } from '@adonisjs/eslint-config'
import securityPlugin from 'eslint-plugin-security'
import boundaries from 'eslint-plugin-boundaries'

/**
 * Vertical slice boundaries. A feature lives in `app/features/<domain>/` with its own
 * controllers/models/validators/services. Features may use `shared` code (models,
 * services, transformers, validators) and read other features' models/services, but
 * never their controllers/validators. Shared code must never depend on a feature.
 *
 * The `typescript` resolver is required: without it the `#models/*` / `#features/*`
 * package.json `imports` aliases stay unresolved, get flagged as external and every
 * rule below silently no-ops.
 *
 * Migrating controllers into features also requires (do it in one commit):
 *   - `"#features/*": "./app/features/*.js"` in package.json imports
 *   - indexEntities() in adonisrc.ts: source `app/features`, importAlias `#features`,
 *     glob covering the feature controllers. Registry keys become nested
 *     (`controllers.auth.NewAccount`), so update start/routes.ts too.
 *   - `hotHook.boundaries` glob for the feature controllers
 *
 * Routes reach controllers through the generated lazy registry (`.adonisjs/**`), which is
 * not linted — that edge is intentionally outside these rules.
 */
const boundariesBlock = {
  name: 'boundaries/vsa',
  files: ['**/*.ts'],
  ignores: [...GLOBAL_IGNORE_LIST, ...ADONIS_IGNORE_LIST],
  plugins: { boundaries },
  settings: {
    'import/resolver': {
      typescript: { project: './tsconfig.json' },
    },
    'boundaries/elements': [
      // partialMatch: false anchors patterns at the app root, so `models/` inside a
      // feature is not mistaken for shared models.
      { type: 'feature', pattern: 'app/features/*', capture: ['domain'], partialMatch: false },
      {
        type: 'shared',
        pattern: ['app/models', 'app/services', 'app/transformers', 'app/validators'],
        partialMatch: false,
      },
    ],
    'boundaries/files': [
      { category: 'test', pattern: '**/*.spec.ts' },
      { category: 'model', pattern: '**/models/**' },
      { category: 'service', pattern: '**/services/**' },
      { category: 'controller', pattern: '**/controllers/**' },
      { category: 'validator', pattern: '**/validators/**' },
    ],
  },
  rules: {
    'boundaries/dependencies': [
      2,
      {
        default: 'disallow',
        policies: [
          // ponytail: files outside the taxonomy (start/, config/, database/, providers/,
          // legacy top-level app/controllers/*, .adonisjs/**). Dependencies *to* unknown
          // files are ignored by the plugin already; only unknown sources need this.
          // Tighten when the legacy controllers move into app/features/*.
          {
            from: { element: { isUnknown: true } },
            allow: { to: { element: { isUnknown: false } } },
          },
          // Tests may reach anywhere.
          {
            from: { file: { categories: 'test' } },
            allow: { to: { element: { isUnknown: false } } },
          },
          // A feature uses shared code, plus its own files (intra-feature imports are
          // skipped by the plugin — checkInternals defaults to false).
          {
            from: { element: { type: 'feature' } },
            allow: { to: { element: { type: 'shared' } } },
          },
          // Read-side reuse of another feature: models and services only.
          {
            from: { element: { type: 'feature' } },
            allow: {
              to: {
                element: { type: 'feature' },
                file: { categories: { anyOf: ['model', 'service'] } },
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

export default configApp(securityPlugin.configs.recommended, boundariesBlock)
