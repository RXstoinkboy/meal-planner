import type Recipe from '#features/recipes/models/recipe'

type IngredientInput = {
  name: string
  rawText?: string | null
  quantity?: number | null
  unit?: string | null
  category?: string | null
  optional?: boolean
}

type StepInput = {
  text: string
  durationMinutes?: number | null
}

function toDecimalString(quantity: number | null | undefined) {
  const isMissing = quantity === undefined || quantity === null

  return isMissing ? null : String(quantity)
}

/** Server-owned values the client may omit: position, rawText fallback, decimal-as-string quantity. */
export function toIngredientRows(ingredients: IngredientInput[]) {
  return ingredients.map((ingredient, index) => ({
    name: ingredient.name,
    rawText: ingredient.rawText ?? ingredient.name,
    quantity: toDecimalString(ingredient.quantity),
    unit: ingredient.unit ?? null,
    category: ingredient.category ?? null,
    optional: ingredient.optional ?? false,
    position: index + 1,
  }))
}

export function toStepRows(steps: StepInput[]) {
  return steps.map((step, index) => ({
    text: step.text,
    durationMinutes: step.durationMinutes ?? null,
    position: index + 1,
  }))
}

/** Analytics props for a hydrated recipe — camelCase model fields become snake_case event props. */
export function toEventProps(recipe: Recipe) {
  return {
    recipe_id: recipe.id,
    servings: recipe.servings,
    source_type: recipe.sourceType,
    ingredient_count: recipe.ingredients.length,
    step_count: recipe.steps.length,
  }
}
