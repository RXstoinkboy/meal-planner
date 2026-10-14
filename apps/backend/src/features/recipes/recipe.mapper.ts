import { z } from 'zod'

export const ingredientResponseSchema = z.object({
  rawText: z.string(),
  name: z.string(),
  quantity: z.string().nullable(),
  unit: z.string().nullable(),
  category: z.string().nullable(),
  optional: z.boolean(),
  position: z.number().int(),
})

export const stepResponseSchema = z.object({
  position: z.number().int(),
  text: z.string(),
  durationMinutes: z.number().int().nullable(),
})

export const recipeResponseSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  servings: z.number().int(),
  prepMinutes: z.number().int().nullable(),
  cookMinutes: z.number().int().nullable(),
  cuisine: z.string().nullable(),
  notes: z.string().nullable(),
  tags: z.array(z.string()),
  tools: z.array(z.string()),
  sourceType: z.enum(['manual', 'link', 'image', 'pdf', 'suggestion']),
  sourceUrl: z.string().nullable(),
  minutes: z.number().int().nullable(),
  ingredients: z.array(ingredientResponseSchema),
  steps: z.array(stepResponseSchema),
})

export type RecipeResponse = z.infer<typeof recipeResponseSchema>

/**
 * Structural inputs so specs can pass plain objects. Nothing server-owned
 * (userId, sourceRawPath, deletedAt, extraction*) is read, so it cannot leak.
 */
type RecipeLike = {
  id: number
  title: string
  description: string | null
  servings: number
  prepMinutes: number | null
  cookMinutes: number | null
  cuisine: string | null
  notes: string | null
  tags: string[]
  tools: string[]
  sourceType: RecipeResponse['sourceType']
  sourceUrl: string | null
  ingredients: IngredientLike[]
  steps: StepLike[]
}

type IngredientLike = {
  rawText: string
  name: string
  quantity: { toString(): string } | null
  unit: string | null
  category: string | null
  optional: boolean
  position: number
}

type StepLike = {
  position: number
  text: string
  durationMinutes: number | null
}

export function toRecipeResponse(recipe: RecipeLike): RecipeResponse {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    servings: recipe.servings,
    prepMinutes: recipe.prepMinutes,
    cookMinutes: recipe.cookMinutes,
    cuisine: recipe.cuisine,
    notes: recipe.notes,
    tags: recipe.tags,
    tools: recipe.tools,
    sourceType: recipe.sourceType,
    sourceUrl: recipe.sourceUrl,
    minutes: minutesOf(recipe),
    ingredients: recipe.ingredients.map((ingredient) => ({
      rawText: ingredient.rawText,
      name: ingredient.name,
      // Prisma decimals keep their exact value; the wire type stays string | null
      quantity: ingredient.quantity?.toString() ?? null,
      unit: ingredient.unit,
      category: ingredient.category,
      optional: ingredient.optional,
      position: ingredient.position,
    })),
    steps: recipe.steps.map((step) => ({
      position: step.position,
      text: step.text,
      durationMinutes: step.durationMinutes,
    })),
  }
}

function minutesOf(recipe: Pick<RecipeLike, 'prepMinutes' | 'cookMinutes'>) {
  const hasNoTiming = recipe.prepMinutes === null && recipe.cookMinutes === null

  if (hasNoTiming) {
    return null
  }

  return (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0)
}
