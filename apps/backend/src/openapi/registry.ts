import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'
import type { ResponseConfig } from '@asteasolutions/zod-to-openapi'

// One registry for the whole app. Slices register their schemas and paths from
// `<slice>/openapi.ts`, which their module imports — so by the time the app module
// is loaded the document is complete.
extendZodWithOpenApi(z)

export const registry = new OpenAPIRegistry()

/** Failure shape produced by HttpExceptionFilter. */
const errorResponseSchema = registry.register(
  'ErrorResponse',
  z.object({
    errors: z.array(
      z.object({
        field: z.string().optional(),
        message: z.string(),
        rule: z.string().optional(),
      })
    ),
  })
)

export const USER_ID_SECURITY = [{ xUserId: [] }]

// Identity is an apiKey-style header for now; swapping in bearer/JWT later is a
// one-line change here plus the decorator that reads it.
registry.registerComponent('securitySchemes', 'xUserId', {
  type: 'apiKey',
  in: 'header',
  name: 'x-user-id',
  description: 'Caller identity until real authentication lands',
})

export function errorResponse(description: string): ResponseConfig {
  return {
    description,
    content: { 'application/json': { schema: errorResponseSchema } },
  }
}
