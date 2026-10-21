import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { AuthenticationEvents } from '@nestjs/authentication'
import type { Subscription } from 'rxjs'

import { AnalyticsService } from '@/core/analytics/analytics.service'
import { events } from '@/core/analytics/events'

/** Server twin of the mobile click: a revocation is a fact only the backend sees. */
@Injectable()
export class AuthEventsListener implements OnModuleInit, OnModuleDestroy {
  private subscription?: Subscription

  constructor(
    private readonly authenticationEvents: AuthenticationEvents,
    private readonly analytics: AnalyticsService
  ) {}

  onModuleInit() {
    this.subscription = this.authenticationEvents.events$.subscribe((event) => {
      if (event.type === 'sign-out') {
        this.analytics.track(events.auth.loggedOut, Number(event.userId))
      }
    })
  }

  onModuleDestroy() {
    this.subscription?.unsubscribe()
  }
}
