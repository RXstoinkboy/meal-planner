import { Module } from '@nestjs/common'

import { RecipesController } from '@/features/recipes/controllers/recipes.controller'
import { RecipesService } from '@/features/recipes/services/recipes.service'

@Module({
  controllers: [RecipesController],
  providers: [RecipesService],
})
export class RecipesModule {}
