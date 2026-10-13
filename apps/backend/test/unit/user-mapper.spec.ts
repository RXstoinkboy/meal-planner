import { describe, expect, it } from 'vitest'

import { toUserResponse } from '@/features/auth/mappers/user.mapper'

const CREATED_AT = new Date('2026-01-02T03:04:05.000Z')

function fixture(overrides: Partial<Parameters<typeof toUserResponse>[0]> = {}) {
  return {
    id: 7,
    fullName: 'Test User',
    email: 'test@example.com',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    ...overrides,
  }
}

describe('user mapper', () => {
  it('exposes the public shape and no password', () => {
    const output = toUserResponse(fixture())

    expect(Object.keys(output).sort()).toEqual(
      ['id', 'fullName', 'email', 'createdAt', 'updatedAt', 'initials'].sort()
    )
    expect(output).not.toHaveProperty('password')
  })

  it('serializes timestamps as ISO strings', () => {
    const output = toUserResponse(fixture())

    expect(output.createdAt).toBe('2026-01-02T03:04:05.000Z')
    expect(output.updatedAt).toBe('2026-01-02T03:04:05.000Z')
  })

  it('takes initials from both names', () => {
    expect(toUserResponse(fixture()).initials).toBe('TU')
  })

  it('falls back to two letters of a single-word name', () => {
    expect(toUserResponse(fixture({ fullName: 'Madonna' })).initials).toBe('MA')
  })

  it('falls back to the email when there is no name', () => {
    const output = toUserResponse(fixture({ fullName: null, email: 'owner@example.com' }))

    expect(output.initials).toBe('OE')
    expect(output.fullName).toBeNull()
  })
})
