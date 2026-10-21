import { z } from 'zod'

import { toUserResponse, userResponseSchema } from '@/features/auth/user/user.mapper'

/** Signup and login: the token pair plus the user it belongs to. */
export const sessionResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: userResponseSchema,
})

export type SessionResponse = z.infer<typeof sessionResponseSchema>

/** Refresh: a rotated pair, nothing else — the client already knows the user. */
export const tokenPairSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int().positive(),
})

export type TokenPairResponse = z.infer<typeof tokenPairSchema>

type UserRecord = Parameters<typeof toUserResponse>[0]

export function toSessionResponse(
  user: UserRecord,
  tokenPair: { accessToken: string; refreshToken: string }
): SessionResponse {
  return {
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
    user: toUserResponse(user),
  }
}
