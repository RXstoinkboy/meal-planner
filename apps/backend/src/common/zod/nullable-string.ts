import { z } from 'zod'

/**
 * Nullable text input. Adonis' bodyparser turned `''` into `null`, and RN text
 * inputs happily send empty strings — keep that contract instead of storing `''`.
 */
export function nullableString(maxLength = 255) {
  return z.preprocess(
    (value) => (value === '' ? null : value),
    z.string().trim().max(maxLength).nullable()
  )
}
