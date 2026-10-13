import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { SentryModule } from '@sentry/nestjs/setup'
import { LoggerModule } from 'nestjs-pino'

import { AppController } from '@/app.controller'
import { env } from '@/config/env'
import { loggerOptions } from '@/config/logger'
import { AnalyticsModule } from '@/common/analytics/analytics.module'
import { PrismaModule } from '@/common/database/prisma.module'
import { HealthModule } from '@/common/health/health.module'
import { HttpExceptionFilter } from '@/common/http/http-exception.filter'
import { SentryShutdownService } from '@/common/sentry/sentry-shutdown.service'
import { ZodValidationPipe } from '@/common/zod/zod-validation.pipe'
import { AuthModule } from '@/features/auth/auth.module'
import { RecipesModule } from '@/features/recipes/recipes.module'

@Module({
  imports: [
    // env is already parsed and validated in config/env.ts; ConfigModule only exposes it for DI.
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => env] }),
    LoggerModule.forRoot({ pinoHttp: loggerOptions() }),
    ThrottlerModule.forRoot([{ ttl: env.THROTTLE_TTL_MS, limit: env.THROTTLE_LIMIT }]),
    SentryModule.forRoot(),
    AnalyticsModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    RecipesModule,
  ],
  controllers: [AppController],
  providers: [
    SentryShutdownService,
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
