import { Injectable, Logger, type OnApplicationShutdown } from '@nestjs/common'
import { PostHog } from 'posthog-node'

import { env } from '@/config/env'

export type EventProps = Record<string, unknown>

/** Shared free-tier PostHog project — tag keeps insights filterable per app. */
const APP_TAG = 'meal-planner'

/** Analytics facade — the only module importing PostHog. */
@Injectable()
export class AnalyticsService implements OnApplicationShutdown {
  private readonly logger = new Logger(AnalyticsService.name)
  private instance?: PostHog

  private client(): PostHog | undefined {
    const key = env.POSTHOG_KEY

    // ponytail: no-op without a key — app and tests run clean
    if (!key) {
      return undefined
    }

    this.instance ??= new PostHog(key, { host: env.POSTHOG_HOST })

    return this.instance
  }

  /** Fire-and-forget — never await this in a request path. */
  track(event: string, distinctId: string | number, props?: EventProps) {
    // no register() in posthog-node — tag per capture
    this.client()?.capture({
      event,
      distinctId: String(distinctId),
      properties: { app: APP_TAG, ...props },
    })
  }

  /** Flush queued events; Nest calls this on SIGTERM/SIGINT (enableShutdownHooks). */
  async onApplicationShutdown() {
    try {
      await this.client()?.shutdown()
    } catch (error) {
      this.logger.warn(`PostHog shutdown failed: ${String(error)}`)
    }
  }
}
