import { Injectable, UnauthorizedException } from '@nestjs/common'

import { PrismaService } from '@/core/database/prisma.service'

/** Login process: email lookup only — no passwords yet, so an unknown email is the sole failure. */
@Injectable()
export class LoginService {
  constructor(private readonly prisma: PrismaService) {}

  async login(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    return user
  }
}
