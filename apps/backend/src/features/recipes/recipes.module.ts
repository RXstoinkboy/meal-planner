import { Module } from '@nestjs/common'

// Registers this slice's schemas and paths in the shared OpenAPI registry.
import './openapi'

import { RecipesController } from '@/features/recipes/controllers/recipes.controller'
import { RecipesService } from '@/features/recipes/services/recipes.service'

@Module({
  controllers: [RecipesController],
  providers: [RecipesService],
})
export class RecipesModule {}
