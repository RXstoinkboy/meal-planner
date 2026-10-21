/**
 * What every credential provider's `validate()` returns: the users row minus
 * `passwordHash`. Guards, `@CurrentUser()` and policies see this shape.
 */
export type AuthenticatedUser = {
  id: number
  fullName: string | null
  email: string
  role: string
  createdAt: Date
  updatedAt: Date
}
