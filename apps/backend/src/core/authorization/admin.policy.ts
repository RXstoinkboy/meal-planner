import { Policy } from '@nestjs/authorization'

import type { AuthenticatedUser } from '@/core/identity/authenticated-user'

/**
 * Minimal global RBAC: `@Can(AdminPolicy, 'isAdmin')` on a future admin route.
 * Record-level rules (recipe sharing, families) belong in resource policies.
 */
@Policy()
export class AdminPolicy {
  isAdmin(user: AuthenticatedUser | null) {
    return user?.role === 'admin'
  }
}
