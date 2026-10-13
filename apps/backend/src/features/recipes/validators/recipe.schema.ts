import { z } from 'zod'

import { createZodDto } from '@/common/zod/zod-dto'
import { nullableString } from '@/common/zod/nullable-string'

/** Rule reported for an update payload with no fields; reused by specs. */
export const EMPTY_PATCH_RULE = 'emptyPatch'

/**
 * Recipe trust boundary. camelCase keys are the API contract; Prisma maps them to
 * snake_case columns. Server-owned columns (userId, source*, extraction*, deletedAt)
 * are deliberately absent, and unknown keys are rejected rather than stripped.
 */
const ingredientInput = z.strictObject({
  name: z.string().trim().min(1).max(255),
  // optional here; the payload builder defaults it to `name` — the column is NOT NULL
  rawText: z.string().trim().min(1).max(255).optional(),
  quantity: z.number().min(0).nullable().optional(),
  unit: nullableString().optional(),
  // free-form: the DB column is a string and imports may add categories (see TODO.md)
  category: nullableString().optional(),
  optional: z.boolean().optional(),
})

const stepInput = z.strictObject({
  text: z.string().trim().min(1),
  durationMinutes: z.number().int().min(0).nullable().optional(),
})

const recipeProps = {
  title: z.string().trim().min(1).max(255),
  servings: z.number().int().min(1),
  description: nullableString().optional(),
  prepMinutes: z.number().int().min(0).nullable().optional(),
  cookMinutes: z.number().int().min(0).nullable().optional(),
  cuisine: nullableString().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  tools: z.array(z.string().trim().min(1)).optional(),
  notes: nullableString().optional(),
  ingredients: z.array(ingredientInput).min(1),
  steps: z.array(stepInput).optional(),
}

/** Create a recipe (full payload). */
export const createRecipeSchema = z.strictObject(recipeProps)

/** Patch a recipe — every field optional; `ingredients`, if present, stays non-empty; at least one field required. */
export const updateRecipeSchema = z
  .strictObject({
    ...recipeProps,
    title: recipeProps.title.optional(),
    servings: recipeProps.servings.optional(),
    ingredients: recipeProps.ingredients.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    params: { rule: EMPTY_PATCH_RULE },
    error: 'At least one field is required',
  })

export type CreateRecipeInput = z.infer<typeof createRecipeSchema>
export type UpdateRecipeInput = z.infer<typeof updateRecipeSchema>

export class CreateRecipeDto extends createZodDto(createRecipeSchema) {}
export class UpdateRecipeDto extends createZodDto(updateRecipeSchema) {}
