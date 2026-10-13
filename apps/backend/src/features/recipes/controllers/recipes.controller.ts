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

import { AnalyticsService } from '@/common/analytics/analytics.service'
import { events } from '@/common/analytics/events'
import { CurrentUserId } from '@/common/identity/current-user.decorator'
import { ParseIdPipe } from '@/common/http/parse-id.pipe'
import { toRecipeResponse, type RecipeResponse } from '@/features/recipes/mappers/recipe.mapper'
import { toEventProps } from '@/features/recipes/services/recipe_payload'
import { RecipesService } from '@/features/recipes/services/recipes.service'
import { CreateRecipeDto, UpdateRecipeDto } from '@/features/recipes/validators/recipe.schema'

@Controller('recipes')
export class RecipesController {
  constructor(
    private readonly recipes: RecipesService,
    private readonly analytics: AnalyticsService
  ) {}

  @Get()
  async index(@CurrentUserId() userId: number): Promise<RecipeResponse[]> {
    const recipes = await this.recipes.listVisibleTo(userId)

    return recipes.map(toRecipeResponse)
  }

  @Get(':id')
  async show(
    @CurrentUserId() userId: number,
    @Param('id', ParseIdPipe) id: number
  ): Promise<RecipeResponse> {
    return toRecipeResponse(await this.recipes.findVisible(userId, id))
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async store(
    @CurrentUserId() userId: number,
    @Body() body: CreateRecipeDto
  ): Promise<RecipeResponse> {
    const recipe = await this.recipes.create(userId, body)

    this.analytics.track(events.recipes.created, userId, toEventProps(recipe))

    return toRecipeResponse(recipe)
  }

  @Patch(':id')
  async update(
    @CurrentUserId() userId: number,
    @Param('id', ParseIdPipe) id: number,
    @Body() body: UpdateRecipeDto
  ): Promise<RecipeResponse> {
    const recipe = await this.recipes.update(userId, id, body)

    this.analytics.track(events.recipes.updated, userId, toEventProps(recipe))

    return toRecipeResponse(recipe)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async destroy(
    @CurrentUserId() userId: number,
    @Param('id', ParseIdPipe) id: number
  ): Promise<void> {
    await this.recipes.softDelete(userId, id)

    this.analytics.track(events.recipes.deleted, userId, { recipe_id: id })
  }
}
