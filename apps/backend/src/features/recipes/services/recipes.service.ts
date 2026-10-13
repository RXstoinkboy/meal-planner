import { Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@/generated/prisma/client'

import { PrismaService } from '@/common/database/prisma.service'
import type {
  CreateRecipeInput,
  UpdateRecipeInput,
} from '@/features/recipes/validators/recipe.schema'
import { toIngredientRows, toStepRows } from '@/features/recipes/services/recipe_payload'

const CHILD_ORDER = { orderBy: { position: 'asc' } } as const

/** Prisma treats `undefined` as "leave unchanged", so absent PATCH keys are inert. */
function definedScalars(input: UpdateRecipeInput): Prisma.RecipeUpdateInput {
  const { ingredients: _ingredients, steps: _steps, ...scalars } = input

  return scalars
}

/**
 * Owns every read and write of `recipes` (and its children). All access goes
 * through `visibleWhere` so sharing can land in one place instead of every query.
 */
@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  listVisibleTo(userId: number) {
    return this.prisma.recipe.findMany({
      where: visibleWhere(userId),
      include: { ingredients: CHILD_ORDER, steps: CHILD_ORDER },
      orderBy: { id: 'desc' },
    })
  }

  async findVisible(userId: number, id: number) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, ...visibleWhere(userId) },
      include: { ingredients: CHILD_ORDER, steps: CHILD_ORDER },
    })

    if (!recipe) {
      throw new NotFoundException('Recipe not found')
    }

    return recipe
  }

  create(userId: number, input: CreateRecipeInput) {
    return this.prisma.recipe.create({
      data: {
        userId,
        title: input.title,
        servings: input.servings,
        description: input.description ?? null,
        prepMinutes: input.prepMinutes ?? null,
        cookMinutes: input.cookMinutes ?? null,
        cuisine: input.cuisine ?? null,
        tags: input.tags ?? [],
        tools: input.tools ?? [],
        notes: input.notes ?? null,
        ingredients: { create: toIngredientRows(input.ingredients) },
        steps: { create: toStepRows(input.steps ?? []) },
      },
      include: { ingredients: CHILD_ORDER, steps: CHILD_ORDER },
    })
  }

  async update(userId: number, id: number, input: UpdateRecipeInput) {
    await this.findVisible(userId, id)

    // children are replaced wholesale — PATCH sends the full list it wants to keep
    const data = definedScalars(input)

    if (input.ingredients !== undefined) {
      data.ingredients = { deleteMany: {}, create: toIngredientRows(input.ingredients) }
    }

    if (input.steps !== undefined) {
      data.steps = { deleteMany: {}, create: toStepRows(input.steps) }
    }

    // one nested write = one transaction
    return this.prisma.recipe.update({
      where: { id },
      data,
      include: { ingredients: CHILD_ORDER, steps: CHILD_ORDER },
    })
  }

  async softDelete(userId: number, id: number) {
    await this.findVisible(userId, id)

    await this.prisma.recipe.update({ where: { id }, data: { deletedAt: new Date() } })
  }
}

function visibleWhere(userId: number) {
  return { userId, deletedAt: null }
}
