import { Injectable, Logger, type OnApplicationShutdown } from '@nestjs/common'
import * as Sentry from '@sentry/nestjs'

/** Flushes buffered error events before the process exits (enableShutdownHooks). */
@Injectable()
export class SentryShutdownService implements OnApplicationShutdown {
  private readonly logger = new Logger(SentryShutdownService.name)

  async onApplicationShutdown() {
    try {
      await Sentry.close(2000)
    } catch (error) {
      this.logger.warn(`Sentry shutdown failed: ${String(error)}`)
    }
  }
}
