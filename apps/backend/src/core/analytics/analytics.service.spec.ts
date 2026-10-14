import { describe, expect, it } from 'vitest'

import { AnalyticsService } from '@/core/analytics/analytics.service'
import { events } from '@/core/analytics/events'

/** Recursively collect leaf event names, skipping the per-slice `base` keys. */
function leafNames(node: Record<string, unknown>): string[] {
  return Object.entries(node).flatMap(([key, value]) => {
    if (key === 'base') {
      return []
    }
    if (typeof value === 'object' && value !== null) {
      return leafNames(value as typeof node)
    }
    return [String(value)]
  })
}

describe('analytics events', () => {
  it('follows the {slice}.{event_snake} convention', () => {
    for (const name of leafNames(events)) {
      expect(name).toMatch(/^[a-z0-9_.]+$/)
      expect(name).toContain('.')
    }
  })

  it('starts every leaf with its slice base', () => {
    expect(events.auth.signedUp).toBe(`${events.auth.base}.signed_up`)
    expect(events.recipes.created).toBe(`${events.recipes.base}.created`)
  })
})

describe('analytics service', () => {
  it('no-ops (does not throw) when POSTHOG_KEY is unset', async () => {
    const analytics = new AnalyticsService()

    expect(() => analytics.track(events.auth.signedUp, 'user-1', { plan: 'free' })).not.toThrow()
    expect(() => analytics.track('unknown.event', 42)).not.toThrow()
    await expect(analytics.onApplicationShutdown()).resolves.toBeUndefined()
  })
})
