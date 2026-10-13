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
import { z } from 'zod'

import { AnalyticsService } from '@/common/analytics/analytics.service'
import { events } from '@/common/analytics/events'
import { stockErrorResponseSchema } from '@/common/http/error.schema'
import { ParseIdPipe } from '@/common/http/parse-id.pipe'
import { CurrentUserId } from '@/common/identity/current-user.decorator'
import { responseOptions } from '@/common/swagger/swagger-schema'
import {
  toRecipeResponse,
  type RecipeResponse,
  recipeResponseSchema,
} from '@/features/recipes/mappers/recipe.mapper'
import { toEventProps } from '@/features/recipes/services/recipe_payload'
import { RecipesService } from '@/features/recipes/services/recipes.service'
import {
  createRecipeSchema,
  type CreateRecipeInput,
  updateRecipeSchema,
  type UpdateRecipeInput,
} from '@/features/recipes/validators/recipe.schema'

const idParamSchema = { type: 'integer', minimum: 1 }

@Controller('recipes')
export class RecipesController {
  constructor(
    private readonly recipes: RecipesService,
    private readonly analytics: AnalyticsService
  ) {}

  @Get()
  @ApiSecurity('x-user-id')
  @ApiOkResponse(responseOptions(z.array(recipeResponseSchema), 'Recipes'))
  @ApiUnauthorizedResponse(responseOptions(stockErrorResponseSchema, 'Missing x-user-id header'))
  async index(@CurrentUserId() userId: number): Promise<RecipeResponse[]> {
    const recipes = await this.recipes.listVisibleTo(userId)

    return recipes.map(toRecipeResponse)
  }

  @Get(':id')
  @ApiSecurity('x-user-id')
  @ApiParam({ name: 'id', schema: idParamSchema, description: 'Recipe id' })
  @ApiOkResponse(responseOptions(recipeResponseSchema, 'Recipe'))
  @ApiUnauthorizedResponse(responseOptions(stockErrorResponseSchema, 'Missing x-user-id header'))
  @ApiNotFoundResponse(responseOptions(stockErrorResponseSchema, 'Recipe not found'))
  async show(
    @CurrentUserId() userId: number,
    @Param('id', ParseIdPipe) id: number
  ): Promise<RecipeResponse> {
    return toRecipeResponse(await this.recipes.findVisible(userId, id))
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiSecurity('x-user-id')
  @ApiCreatedResponse(responseOptions(recipeResponseSchema, 'Created recipe'))
  @ApiBadRequestResponse(responseOptions(stockErrorResponseSchema, 'Validation failed'))
  @ApiUnauthorizedResponse(responseOptions(stockErrorResponseSchema, 'Missing x-user-id header'))
  async store(
    @CurrentUserId() userId: number,
    @Body({ schema: createRecipeSchema }) body: CreateRecipeInput
  ): Promise<RecipeResponse> {
    const recipe = await this.recipes.create(userId, body)

    this.analytics.track(events.recipes.created, userId, toEventProps(recipe))

    return toRecipeResponse(recipe)
  }

  @Patch(':id')
  @ApiSecurity('x-user-id')
  @ApiParam({ name: 'id', schema: idParamSchema, description: 'Recipe id' })
  @ApiOkResponse(responseOptions(recipeResponseSchema, 'Updated recipe'))
  @ApiBadRequestResponse(responseOptions(stockErrorResponseSchema, 'Validation failed'))
  @ApiUnauthorizedResponse(responseOptions(stockErrorResponseSchema, 'Missing x-user-id header'))
  @ApiNotFoundResponse(responseOptions(stockErrorResponseSchema, 'Recipe not found'))
  async update(
    @CurrentUserId() userId: number,
    @Param('id', ParseIdPipe) id: number,
    @Body({ schema: updateRecipeSchema }) body: UpdateRecipeInput
  ): Promise<RecipeResponse> {
    const recipe = await this.recipes.update(userId, id, body)

    this.analytics.track(events.recipes.updated, userId, toEventProps(recipe))

    return toRecipeResponse(recipe)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiSecurity('x-user-id')
  @ApiParam({ name: 'id', schema: idParamSchema, description: 'Recipe id' })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiUnauthorizedResponse(responseOptions(stockErrorResponseSchema, 'Missing x-user-id header'))
  @ApiNotFoundResponse(responseOptions(stockErrorResponseSchema, 'Recipe not found'))
  async destroy(
    @CurrentUserId() userId: number,
    @Param('id', ParseIdPipe) id: number
  ): Promise<void> {
    await this.recipes.softDelete(userId, id)

    this.analytics.track(events.recipes.deleted, userId, { recipe_id: id })
  }
}
