import { BaseTransformer } from '@adonisjs/core/transformers'
import type Recipe from '#features/recipes/models/recipe'
import type RecipeIngredient from '#features/recipes/models/recipe_ingredient'
import type RecipeStep from '#features/recipes/models/recipe_step'

const RECIPE_FIELDS = [
  'id',
  'title',
  'description',
  'servings',
  'prepMinutes',
  'cookMinutes',
  'cuisine',
  'notes',
  'tags',
  'tools',
  'sourceType',
  'sourceUrl',
] as const

const INGREDIENT_FIELDS = [
  'rawText',
  'name',
  'quantity',
  'unit',
  'category',
  'optional',
  'position',
] as const

const STEP_FIELDS = ['position', 'text', 'durationMinutes'] as const

export default class RecipeTransformer extends BaseTransformer<Recipe> {
  toObject() {
    const { prepMinutes, cookMinutes, ingredients, steps } = this.resource

    return {
      ...this.pick(this.resource, RECIPE_FIELDS),
      minutes:
        prepMinutes === null && cookMinutes === null
          ? null
          : (prepMinutes ?? 0) + (cookMinutes ?? 0),
      ingredients: (ingredients ?? []).map((ingredient: RecipeIngredient) =>
        this.pick(ingredient, INGREDIENT_FIELDS)
      ),
      steps: (steps ?? []).map((step: RecipeStep) => this.pick(step, STEP_FIELDS)),
    }
  }
}
