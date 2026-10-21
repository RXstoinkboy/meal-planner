import { Injectable } from '@nestjs/common'
import {
  AuthenticationStorage,
  type RefreshTokenRecord,
  type RefreshTokenStore,
} from '@nestjs/authentication'
import type { Prisma } from '@/generated/prisma/client'

import { PrismaService } from '@/core/database/prisma.service'

/**
 * The package's RefreshTokenStore on Prisma. `markRefreshTokenUsed()` is one
 * conditional write, so of two concurrent refreshes exactly one wins.
 */
@Injectable()
export class PrismaRefreshTokenStore implements RefreshTokenStore {
  constructor(
    private readonly prisma: PrismaService,
    storage: AuthenticationStorage
  ) {
    storage.registerSource({ refreshTokens: this })
  }

  async getRefreshToken(id: string) {
    const token = await this.prisma.refreshToken.findUnique({ where: { id } })

    if (!token) {
      return undefined
    }

    const { revoked: _revoked, userId, usedAt, claims, ...rest } = token

    return {
      ...rest,
      userId: String(userId),
      usedAt: usedAt ?? undefined,
      claims: (claims ?? undefined) as Record<string, unknown> | undefined,
    }
  }

  async saveRefreshToken(record: RefreshTokenRecord) {
    const { userId, claims, ...token } = record

    await this.prisma.refreshToken.create({
      data: {
        ...token,
        userId: Number(userId),
        claims: claims as Prisma.InputJsonValue | undefined,
      },
    })

    // The package never prunes rows: its contract expects the store to. Delete only
    // families that had already expired when this token was created, so the family
    // that just started can never be swept.
    await this.prisma.refreshToken.deleteMany({
      where: { familyExpiresAt: { lte: record.createdAt } },
    })
  }

  async markRefreshTokenUsed(id: string, at: Date) {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id, usedAt: null },
      data: { usedAt: at },
    })

    return count === 1
  }

  async revokeRefreshTokenFamily(familyId: string) {
    await this.prisma.refreshToken.updateMany({ where: { familyId }, data: { revoked: true } })
  }

  async isRefreshTokenFamilyRevoked(familyId: string) {
    const revokedToken = await this.prisma.refreshToken.findFirst({
      where: { familyId, revoked: true },
      select: { id: true },
    })

    return revokedToken !== null
  }

  async revokeUserRefreshTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId: Number(userId) },
      data: { revoked: true },
    })
  }
}
