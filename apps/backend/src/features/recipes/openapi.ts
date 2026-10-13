import { z } from 'zod'

import { errorResponse, registry, USER_ID_SECURITY } from '@/openapi/registry'
import {
  ingredientResponseSchema,
  recipeResponseSchema,
  stepResponseSchema,
} from '@/features/recipes/mappers/recipe.mapper'
import { createRecipeSchema, updateRecipeSchema } from '@/features/recipes/validators/recipe.schema'

const recipeSchema = registry.register('Recipe', recipeResponseSchema)
registry.register('RecipeIngredient', ingredientResponseSchema)
registry.register('RecipeStep', stepResponseSchema)

const idParams = z.object({ id: z.coerce.number().int().positive() })

const listResponse = z.array(recipeSchema)

const VALIDATION_ERROR = errorResponse('Validation failed')
const NOT_FOUND_ERROR = errorResponse('Recipe not found')
const UNAUTHORIZED_ERROR = errorResponse('Missing or unknown x-user-id header')

registry.registerPath({
  method: 'get',
  path: '/api/v1/recipes',
  summary: 'List the caller’s recipes',
  security: USER_ID_SECURITY,
  responses: {
    200: { description: 'Recipes', content: { 'application/json': { schema: listResponse } } },
    401: UNAUTHORIZED_ERROR,
  },
})

registry.registerPath({
  method: 'get',
  path: '/api/v1/recipes/{id}',
  summary: 'Read one recipe',
  security: USER_ID_SECURITY,
  request: { params: idParams },
  responses: {
    200: { description: 'Recipe', content: { 'application/json': { schema: recipeSchema } } },
    401: UNAUTHORIZED_ERROR,
    404: NOT_FOUND_ERROR,
  },
})

registry.registerPath({
  method: 'post',
  path: '/api/v1/recipes',
  summary: 'Create a recipe',
  security: USER_ID_SECURITY,
  request: { body: { content: { 'application/json': { schema: createRecipeSchema } } } },
  responses: {
    201: {
      description: 'Created recipe',
      content: { 'application/json': { schema: recipeSchema } },
    },
    400: VALIDATION_ERROR,
    401: UNAUTHORIZED_ERROR,
  },
})

registry.registerPath({
  method: 'patch',
  path: '/api/v1/recipes/{id}',
  summary: 'Patch a recipe; ingredients/steps are replaced wholesale when present',
  security: USER_ID_SECURITY,
  request: {
    params: idParams,
    body: { content: { 'application/json': { schema: updateRecipeSchema } } },
  },
  responses: {
    200: {
      description: 'Updated recipe',
      content: { 'application/json': { schema: recipeSchema } },
    },
    400: VALIDATION_ERROR,
    401: UNAUTHORIZED_ERROR,
    404: NOT_FOUND_ERROR,
  },
})

registry.registerPath({
  method: 'delete',
  path: '/api/v1/recipes/{id}',
  summary: 'Soft delete a recipe',
  security: USER_ID_SECURITY,
  request: { params: idParams },
  responses: {
    204: { description: 'Deleted' },
    401: UNAUTHORIZED_ERROR,
    404: NOT_FOUND_ERROR,
  },
})
