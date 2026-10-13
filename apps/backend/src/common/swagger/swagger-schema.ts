import type { ApiResponseMetadata } from '@nestjs/swagger'

type StandardSchemaInput = NonNullable<ApiResponseMetadata['standardSchema']>

/**
 * `@Api*Response` runs Standard Schema objects through the native converter with the
 * `output` variant; its type expects them under `standardSchema` (not `schema`).
 */
export function responseOptions(schema: StandardSchemaInput, description: string): ApiResponseMetadata {
  return { description, standardSchema: schema }
}
