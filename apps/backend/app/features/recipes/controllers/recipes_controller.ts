import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'
import Recipe from '#features/recipes/models/recipe'
import RecipeTransformer from '#features/recipes/transformers/recipe_transformer'
import { createRecipeValidator, updateRecipeValidator } from '#features/recipes/validators/recipe'

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
function toIngredientRows(ingredients: IngredientInput[]) {
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

function toStepRows(steps: StepInput[]) {
  return steps.map((step, index) => ({
    text: step.text,
    durationMinutes: step.durationMinutes ?? null,
    position: index + 1,
  }))
}

export default class RecipesController {
  async index({ auth, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    const recipes = await Recipe.visibleTo(user.id)
      .preload('ingredients')
      .preload('steps')
      .orderBy('id', 'desc')

    return serialize(RecipeTransformer.transform(recipes))
  }

  async show({ auth, params, serialize }: HttpContext) {
    const user = auth.getUserOrFail()

    const recipe = await Recipe.visibleTo(user.id)
      .preload('ingredients')
      .preload('steps')
      .where('id', params.id)
      .firstOrFail()

    return serialize(RecipeTransformer.transform(recipe))
  }

  async store({ auth, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createRecipeValidator, { data: request.body() })
    const { ingredients, steps, ...fields } = payload

    const created = await db.transaction(async (trx) => {
      const recipe = await Recipe.create({ ...fields, userId: user.id }, { client: trx })

      await recipe.related('ingredients').createMany(toIngredientRows(ingredients), { client: trx })

      if (steps) {
        await recipe.related('steps').createMany(toStepRows(steps), { client: trx })
      }

      return recipe
    })

    const recipe = await Recipe.visibleTo(user.id)
      .preload('ingredients')
      .preload('steps')
      .where('id', created.id)
      .firstOrFail()

    return serialize(RecipeTransformer.transform(recipe))
  }

  async update({ auth, params, request, serialize }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateRecipeValidator, { data: request.body() })
    const { ingredients, steps, ...fields } = payload

    const existing = await Recipe.visibleTo(user.id).where('id', params.id).firstOrFail()

    await db.transaction(async (trx) => {
      existing.useTransaction(trx)
      existing.merge(fields)
      await existing.save()

      // children are replaced wholesale — PATCH sends the full list it wants to keep
      if (ingredients) {
        await existing.related('ingredients').query().delete()
        await existing
          .related('ingredients')
          .createMany(toIngredientRows(ingredients), { client: trx })
      }

      if (steps) {
        await existing.related('steps').query().delete()
        await existing.related('steps').createMany(toStepRows(steps), { client: trx })
      }
    })

    const recipe = await Recipe.visibleTo(user.id)
      .preload('ingredients')
      .preload('steps')
      .where('id', existing.id)
      .firstOrFail()

    return serialize(RecipeTransformer.transform(recipe))
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const recipe = await Recipe.visibleTo(user.id).where('id', params.id).firstOrFail()

    recipe.deletedAt = DateTime.now()
    await recipe.save()

    return response.noContent()
  }
}
