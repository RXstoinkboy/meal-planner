import { Injectable } from '@nestjs/common'
import { PasswordHasher } from '@nestjs/authentication'

import { PrismaService } from '@/core/database/prisma.service'

/** Password sign-in: one answer for every failure, with an upgrade path for old hashes. */
@Injectable()
export class LoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async verify(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    const isValid = await this.passwordHasher.verify(password, user?.passwordHash)

    if (!user || !isValid) {
      return null
    }

    if (user.passwordHash && this.passwordHasher.needsRehash(user.passwordHash)) {
      const passwordHash = await this.passwordHasher.hash(password)

      await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
    }

    const { passwordHash: _passwordHash, ...authenticated } = user

    return authenticated
  }
}
