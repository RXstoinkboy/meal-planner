import { z } from 'zod'

/**
 * Failure body produced by the exception filter: stock Nest shape, with validation
 * entries riding in `message` as `{field, message}` objects. Decorators reuse it to
 * document 4xx responses.
 */
export const stockErrorResponseSchema = z.object({
  statusCode: z.number().int(),
  message: z.union([
    z.string(),
    z.array(z.union([z.string(), z.object({ field: z.string().optional(), message: z.string() })])),
  ]),
  error: z.string().optional(),
})
