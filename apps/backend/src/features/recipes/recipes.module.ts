import { Module } from '@nestjs/common'

import { RecipesController } from '@/features/recipes/recipes.controller'
import { RecipesService } from '@/features/recipes/recipes.service'

@Module({
  controllers: [RecipesController],
  providers: [RecipesService],
})
export class RecipesModule {}
