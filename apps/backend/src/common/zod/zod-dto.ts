import type { z } from 'zod'

export type ZodDtoClass<T extends z.ZodType> = (new () => z.infer<T>) & { schema: T }

/**
 * Carries a zod schema on the DTO class so the global validation pipe can find it
 * from the parameter's metatype, and controllers get the inferred type for free.
 */
export function createZodDto<T extends z.ZodType>(schema: T): ZodDtoClass<T> {
  class ZodDto {
    static readonly schema = schema
  }

  return ZodDto as unknown as ZodDtoClass<T>
}
