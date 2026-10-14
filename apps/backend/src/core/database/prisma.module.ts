import { Global, Module } from '@nestjs/common'

import { PrismaService } from './prisma.service'

/** Global: every slice needs the client, none of them should re-provide it. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
