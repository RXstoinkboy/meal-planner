import { describe, expect, it } from 'vitest'

import { AdminPolicy } from '@/core/authorization/admin.policy'
import type { AuthenticatedUser } from '@/core/identity/authenticated-user'

const TIMESTAMP = new Date('2026-01-01T00:00:00Z')

const ADMIN: AuthenticatedUser = {
  id: 1,
  fullName: 'Ada Admin',
  email: 'ada@example.com',
  role: 'admin',
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
}

const MEMBER: AuthenticatedUser = { ...ADMIN, id: 2, email: 'member@example.com', role: 'user' }

const policy = new AdminPolicy()

describe('AdminPolicy', () => {
  it('lets an admin through', () => {
    expect(policy.isAdmin(ADMIN)).toBe(true)
  })

  it('denies a regular user', () => {
    expect(policy.isAdmin(MEMBER)).toBe(false)
  })

  it('denies a guest', () => {
    expect(policy.isAdmin(null)).toBe(false)
  })
})
