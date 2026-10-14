import { Injectable, UnauthorizedException } from '@nestjs/common'

import { PrismaService } from '@/core/database/prisma.service'
import { X_USER_ID_HEADER } from '@/core/identity/current-user.decorator'

/** Profile process: resolve the `X-User-Id` seam; an unknown id is a 401, not a 404. */
@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async requireById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } })

    if (!user) {
      throw new UnauthorizedException(`Unknown user for ${X_USER_ID_HEADER}`)
    }

    return user
  }
}
