import { Injectable } from '@nestjs/common'
import { AuthenticationRegistry, JwtBearerProvider, type JwtClaims } from '@nestjs/authentication'

import { PrismaService } from '@/core/database/prisma.service'
import type { AuthenticatedUser } from '@/core/identity/authenticated-user'

/** Bearer access tokens: loads the user the `sub` claim names; a deleted user rejects the token. */
@Injectable()
export class JwtAuth extends JwtBearerProvider<AuthenticatedUser> {
  constructor(
    private readonly prisma: PrismaService,
    registry: AuthenticationRegistry
  ) {
    super({ realm: 'meal-planner' })
    registry.registerProvider(this)
  }

  validate({ sub }: JwtClaims) {
    const id = Number(sub)

    return Number.isInteger(id) ? this.findUser(id) : null
  }

  private findUser(id: number) {
    return this.prisma.user.findUnique({ where: { id }, omit: { passwordHash: true } })
  }
}
