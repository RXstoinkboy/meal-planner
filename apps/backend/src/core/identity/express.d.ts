import type { AuthenticatedUser } from '@/core/identity/authenticated-user'

declare global {
  namespace Express {
    interface Request {
      /** Mirrored by the authentication guard; `null` on anonymous calls. */
      user?: AuthenticatedUser | null
    }
  }
}
