import { BadRequestException } from '@nestjs/common'

/** Standard Schema issue as delivered by `~standard.validate` (message + optional path). */
type SchemaIssue = { message: string; path?: readonly unknown[] }

/** Path segments may arrive as `{ key }` objects (spec allows raw and key forms). */
function fieldOf(path: readonly unknown[] | undefined): string | undefined {
  const hasPath = Array.isArray(path) && path.length > 0

  if (!hasPath) {
    return undefined
  }

  return path
    .map((segment) =>
      String(segment && typeof segment === 'object' ? (segment as { key: unknown }).key : segment)
    )
    .join('.')
}

/**
 * Keeps the `{field, message}` 400 body the mobile form parses, on top of the stock
 * built-in pipe. Root-level issues (empty patch, unknown keys) carry no field, so
 * clients fall back to their generic error line.
 */
export function fieldExceptionFactory(issues: readonly SchemaIssue[]) {
  return new BadRequestException(
    issues.map((issue) => ({ field: fieldOf(issue.path), message: issue.message }))
  )
}
