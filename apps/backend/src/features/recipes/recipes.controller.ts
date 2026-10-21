import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiSecurity,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { CurrentUser } from '@nestjs/authentication'
import { Can } from '@nestjs/authorization'
import { z } from 'zod'

import { AnalyticsService } from '@/core/analytics/analytics.service'
import { events } from '@/core/analytics/events'
import { stockErrorResponseSchema } from '@/core/http/error.schema'
import { ParseIdPipe } from '@/core/http/parse-id.pipe'
import { responseOptions } from '@/core/swagger/swagger-schema'
import {
  toRecipeResponse,
  type RecipeResponse,
  recipeResponseSchema,
} from '@/features/recipes/recipe.mapper'
import { RecipesService } from '@/features/recipes/recipes.service'
import {
  createRecipeSchema,
  type CreateRecipeInput,
  updateRecipeSchema,
  type UpdateRecipeInput,
} from '@/features/recipes/recipe.schema'

const idParamSchema = { type: 'integer', minimum: 1 }

// Anyone authentication lets through; RecipesService scopes rows to the caller.
@Can.Anyone()
@Controller('recipes')
export class RecipesController {
  constructor(
    private readonly recipes: RecipesService,
    private readonly analytics: AnalyticsService
  ) {}

  @Get()
  @ApiSecurity('bearer')
  @ApiOkResponse(responseOptions(z.array(recipeResponseSchema), 'Recipes'))
  @ApiUnauthorizedResponse(
    responseOptions(stockErrorResponseSchema, 'Missing or expired bearer token')
  )
  async index(@CurrentUser('id') userId: number): Promise<RecipeResponse[]> {
    const recipes = await this.recipes.listVisibleTo(userId)

    return recipes.map(toRecipeResponse)
  }

  @Get(':id')
  @ApiSecurity('bearer')
  @ApiParam({ name: 'id', schema: idParamSchema, description: 'Recipe id' })
  @ApiOkResponse(responseOptions(recipeResponseSchema, 'Recipe'))
  @ApiUnauthorizedResponse(
    responseOptions(stockErrorResponseSchema, 'Missing or expired bearer token')
  )
  @ApiNotFoundResponse(responseOptions(stockErrorResponseSchema, 'Recipe not found'))
  async show(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIdPipe) id: number
  ): Promise<RecipeResponse> {
    return toRecipeResponse(await this.recipes.findVisible(userId, id))
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiSecurity('bearer')
  @ApiCreatedResponse(responseOptions(recipeResponseSchema, 'Created recipe'))
  @ApiBadRequestResponse(responseOptions(stockErrorResponseSchema, 'Validation failed'))
  @ApiUnauthorizedResponse(
    responseOptions(stockErrorResponseSchema, 'Missing or expired bearer token')
  )
  async store(
    @CurrentUser('id') userId: number,
    @Body({ schema: createRecipeSchema }) body: CreateRecipeInput
  ): Promise<RecipeResponse> {
    const recipe = await this.recipes.create(userId, body)

    this.analytics.track(events.recipes.created, userId, toEventProps(recipe))

    return toRecipeResponse(recipe)
  }

  @Patch(':id')
  @ApiSecurity('bearer')
  @ApiParam({ name: 'id', schema: idParamSchema, description: 'Recipe id' })
  @ApiOkResponse(responseOptions(recipeResponseSchema, 'Updated recipe'))
  @ApiBadRequestResponse(responseOptions(stockErrorResponseSchema, 'Validation failed'))
  @ApiUnauthorizedResponse(
    responseOptions(stockErrorResponseSchema, 'Missing or expired bearer token')
  )
  @ApiNotFoundResponse(responseOptions(stockErrorResponseSchema, 'Recipe not found'))
  async update(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIdPipe) id: number,
    @Body({ schema: updateRecipeSchema }) body: UpdateRecipeInput
  ): Promise<RecipeResponse> {
    const recipe = await this.recipes.update(userId, id, body)

    this.analytics.track(events.recipes.updated, userId, toEventProps(recipe))

    return toRecipeResponse(recipe)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiSecurity('bearer')
  @ApiParam({ name: 'id', schema: idParamSchema, description: 'Recipe id' })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiUnauthorizedResponse(
    responseOptions(stockErrorResponseSchema, 'Missing or expired bearer token')
  )
  @ApiNotFoundResponse(responseOptions(stockErrorResponseSchema, 'Recipe not found'))
  async destroy(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIdPipe) id: number
  ): Promise<void> {
    await this.recipes.softDelete(userId, id)

    this.analytics.track(events.recipes.deleted, userId, { recipe_id: id })
  }
}

type RecipeLike = {
  id: number
  servings: number
  sourceType: string
  ingredients: unknown[]
  steps: unknown[]
}

/** Analytics props for a hydrated recipe — camelCase model fields become snake_case event props. */
export function toEventProps(recipe: RecipeLike) {
  return {
    recipe_id: recipe.id,
    servings: recipe.servings,
    source_type: recipe.sourceType,
    ingredient_count: recipe.ingredients.length,
    step_count: recipe.steps.length,
  }
}
