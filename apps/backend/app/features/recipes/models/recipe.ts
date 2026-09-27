import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { RecipeSchema } from '#database/schema'
import RecipeIngredient from '#features/recipes/models/recipe_ingredient'
import RecipeStep from '#features/recipes/models/recipe_step'

export default class Recipe extends RecipeSchema {
  declare sourceType: 'manual' | 'link' | 'image' | 'pdf' | 'suggestion'
  declare tags: string[]
  declare tools: string[]

  @hasMany(() => RecipeIngredient, { onQuery: (query) => query.orderBy('position') })
  declare ingredients: HasMany<typeof RecipeIngredient>

  @hasMany(() => RecipeStep, { onQuery: (query) => query.orderBy('position') })
  declare steps: HasMany<typeof RecipeStep>

  /** Only read path for a user's recipes — wider access (sharing) changes this, not every query. */
  static visibleTo(userId: number) {
    return this.query().where('userId', userId).whereNull('deletedAt')
  }
}
