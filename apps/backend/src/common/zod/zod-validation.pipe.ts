import {
  BadRequestException,
  type ArgumentMetadata,
  Injectable,
  type PipeTransform,
} from '@nestjs/common'
import type { z } from 'zod'

type ZodDtoMetatype = { schema?: unknown }

/** `createZodDto` classes carry the schema as a static; zod schemas carry `_zod`. */
function schemaOf(metatype: unknown): z.ZodType | undefined {
  if (typeof metatype !== 'function') {
    return undefined
  }

  const schema = (metatype as ZodDtoMetatype).schema
  const isZodSchema = typeof schema === 'object' && schema !== null && '_zod' in schema

  return isZodSchema ? (schema as z.ZodType) : undefined
}

/** Root-level issues (refinements like `emptyPatch`) have no usable field. */
function fieldOf(issue: z.core.$ZodIssue): string | undefined {
  const path = issue.path.join('.')

  return path === '' ? undefined : path
}

/**
 * Global pipe: validates any parameter whose metatype came from `createZodDto`.
 * Everything else (`@Param('id')`, primitives, no DTO) passes through.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    const schema = schemaOf(metadata.metatype)

    if (!schema) {
      return value
    }

    const result = schema.safeParse(value)

    if (!result.success) {
      // {field, message} objects ride in the stock `message` field so clients can
      // map inline form errors; root-level refinements carry no field.
      throw new BadRequestException(
        result.error.issues.flatMap((issue) => {
          if (issue.code !== 'unrecognized_keys') {
            return [{ field: fieldOf(issue), message: issue.message }]
          }

          return issue.keys.map((key) => ({
            field: [...issue.path, key].join('.'),
            message: `The "${key}" field is not allowed`,
          }))
        })
      )
    }

    return result.data
  }
}
