import { Controller, Get, ServiceUnavailableException, VERSION_NEUTRAL } from '@nestjs/common'

import { PrismaService } from '@/core/database/prisma.service'

/** Uptime probes (deploy platform, Better Stack). Outside `/api/v1` and the envelope. */
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const isDatabaseUp = await this.isDatabaseUp()

    if (!isDatabaseUp) {
      throw new ServiceUnavailableException('Database is not reachable')
    }

    return { status: 'ok', db: 'up' }
  }

  private async isDatabaseUp() {
    try {
      await this.prisma.$queryRaw`SELECT 1`

      return true
    } catch {
      return false
    }
  }
}
