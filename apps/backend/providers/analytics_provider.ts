import type { ApplicationService } from '@adonisjs/core/types'

import { shutdownAnalytics } from '#services/analytics'

/**
 * Flushes queued PostHog events when the application terminates, so
 * fire-and-forget captures issued shortly before shutdown are not lost.
 */
export default class AnalyticsProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    this.app.terminating(async () => {
      await shutdownAnalytics()
    })
  }
}
