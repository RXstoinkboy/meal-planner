import { Injectable, UnauthorizedException } from '@nestjs/common'

import { PrismaService } from '@/core/database/prisma.service'

/** Profile process: a valid token whose user vanished is a 401, not a 404. */
@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async requireById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id }, omit: { passwordHash: true } })

    if (!user) {
      throw new UnauthorizedException('Unknown user')
    }

    return user
  }
}
