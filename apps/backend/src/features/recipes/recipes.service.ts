import { Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@/generated/prisma/client'

import { PrismaService } from '@/core/database/prisma.service'
import type {
  CreateRecipeInput,
  IngredientInput,
  StepInput,
  UpdateRecipeInput,
} from '@/features/recipes/recipe.schema'

const CHILD_ORDER = { orderBy: { position: 'asc' } } as const

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
