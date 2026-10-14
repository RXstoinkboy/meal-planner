import { z } from 'zod'

export const userResponseSchema = z.object({
  id: z.number().int(),
  fullName: z.string().nullable(),
  email: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  initials: z.string(),
})

export type UserResponse = z.infer<typeof userResponseSchema>

/** Structural input so specs can pass plain objects. */
type UserRecord = {
  id: number
  fullName: string | null
  email: string
  createdAt: Date
  updatedAt: Date
}

/** No `password` field exists anymore — this shape is the whole user contract. */
export function toUserResponse(user: UserRecord): UserResponse {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    initials: initialsOf(user),
  }
}

/** Ported from the Adonis `initials` getter. */
function initialsOf(user: Pick<UserRecord, 'fullName' | 'email'>) {
  const [first, last] = user.fullName ? user.fullName.split(' ') : user.email.split('@')

  if (first && last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
  }

  return (first ?? '').slice(0, 2).toUpperCase()
}
