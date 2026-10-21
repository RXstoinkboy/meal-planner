import type { AuthenticatedUser } from '@/core/identity/authenticated-user'

declare module '@nestjs/authentication' {
  /** Types `@CurrentUser()`, `AuthenticationContext` and policies against our user. */
  interface AuthenticationTypes {
    user: AuthenticatedUser
  }
}
