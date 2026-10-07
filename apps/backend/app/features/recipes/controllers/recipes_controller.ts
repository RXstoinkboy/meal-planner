import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'
import Recipe from '#features/recipes/models/recipe'
import RecipeTransformer from '#features/recipes/transformers/recipe_transformer'
import { createRecipeValidator, updateRecipeValidator } from '#features/recipes/validators/recipe'
import {
  toEventProps,
  toIngredientRows,
  toStepRows,
} from '#features/recipes/services/recipe_payload'
import { events } from '#services/events'
import { track } from '#services/analytics'

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

    track(events.recipes.created, user.id, toEventProps(recipe))

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

    track(events.recipes.updated, user.id, toEventProps(recipe))

    return serialize(RecipeTransformer.transform(recipe))
  }

  async destroy({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const recipe = await Recipe.visibleTo(user.id).where('id', params.id).firstOrFail()

    recipe.deletedAt = DateTime.now()
    await recipe.save()

    track(events.recipes.deleted, user.id, { recipe_id: recipe.id })

    return response.noContent()
  }
}
