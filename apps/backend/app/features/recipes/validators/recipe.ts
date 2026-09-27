import vine from '@vinejs/vine'

/** Rule name reported for a key outside the schema; reused by specs. */
export const UNKNOWN_KEY_RULE = 'unknownKey'

/** Rule name reported for an update payload with no fields; reused by specs. */
export const EMPTY_PATCH_RULE = 'emptyPatch'

/**
 * Recipe trust boundary. camelCase keys are the API contract; A5 maps them to
 * snake_case columns. Server-owned columns (user_id, source_*, extraction_*, deleted_at)
 * are deliberately absent.
 */
const ingredientProps = {
  name: vine.string().trim().minLength(1),
  // optional here; A5 defaults it to `name` — the column is NOT NULL
  rawText: vine.string().trim().minLength(1).optional(),
  quantity: vine.number().min(0).nullable().optional(),
  unit: vine.string().trim().nullable().optional(),
  // free-form: DB column is string and imports may add categories (see TODO.md)
  category: vine.string().trim().nullable().optional(),
  optional: vine.boolean().optional(),
}

const stepProps = {
  text: vine.string().trim().minLength(1),
  durationMinutes: vine.number().withoutDecimals().min(0).nullable().optional(),
}

const recipeProps = {
  title: vine.string().trim().minLength(1).maxLength(255),
  servings: vine.number().withoutDecimals().min(1),
  description: vine.string().trim().nullable().optional(),
  prepMinutes: vine.number().withoutDecimals().min(0).nullable().optional(),
  cookMinutes: vine.number().withoutDecimals().min(0).nullable().optional(),
  cuisine: vine.string().trim().nullable().optional(),
  tags: vine.array(vine.string().trim().minLength(1)).optional(),
  tools: vine.array(vine.string().trim().minLength(1)).optional(),
  notes: vine.string().trim().nullable().optional(),
  ingredients: vine
    .array(vine.object(ingredientProps).use(rejectUnknownKeys(ingredientProps)))
    .minLength(1),
  steps: vine.array(vine.object(stepProps).use(rejectUnknownKeys(stepProps))).optional(),
}

/**
 * VineJS 4.4 strips unknown keys at runtime instead of erroring (only its JSON Schema
 * output sets additionalProperties: false), so the rejection is enforced here.
 */
function rejectUnknownKeys(properties: Record<string, unknown>) {
  const allowed = Object.keys(properties)
  return vine.createRule((value, _options, field) => {
    const isObject = typeof value === 'object' && value !== null

    if (!isObject) {
      return
    }
    for (const key of Object.keys(value)) {
      const isAllowedKey = allowed.includes(key)

      if (!isAllowedKey) {
        field.report(`The "${key}" field is not allowed`, UNKNOWN_KEY_RULE, field)
      }
    }
  })()
}

/** An update must change something — an empty body is a client bug. */
const rejectEmptyPatch = vine.createRule((value, _options, field) => {
  const isObject = typeof value === 'object' && value !== null

  if (!isObject) {
    return
  }
  const isEmpty = Object.keys(value).length === 0

  if (isEmpty) {
    field.report('At least one field is required', EMPTY_PATCH_RULE, field)
  }
})()

/** Create a recipe (full payload). */
export const createRecipeValidator = vine.create(
  vine.object(recipeProps).use(rejectUnknownKeys(recipeProps))
)

/** Patch a recipe — every field optional; `ingredients`, if present, stays non-empty; at least one field required. */
export const updateRecipeValidator = vine.create(
  vine
    .object(vine.helpers.optional(recipeProps))
    .use(rejectUnknownKeys(recipeProps))
    .use(rejectEmptyPatch)
)
