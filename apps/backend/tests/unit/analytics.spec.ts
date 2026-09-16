import { test } from '@japa/runner'

import { events } from '#services/events'
import { shutdownAnalytics, track } from '#services/analytics'

/** Recursively collect leaf event names, skipping the per-slice `base` keys. */
function leafNames(node: Record<string, unknown>): string[] {
  return Object.entries(node).flatMap(([key, value]) => {
    if (key === 'base') return []
    if (typeof value === 'object' && value !== null) return leafNames(value as typeof node)
    return [String(value)]
  })
}

test.group('Analytics facade', () => {
  test('no-ops (does not throw) when POSTHOG_KEY is unset', async ({ assert }) => {
    assert.doesNotThrows(() => track(events.auth.signedUp, 'user-1', { plan: 'free' }))
    assert.doesNotThrows(() => track('unknown.event', 42))
    assert.equal(await shutdownAnalytics(), undefined)
  })

  test('event names follow the {slice}.{event_snake} convention', ({ assert }) => {
    for (const name of leafNames(events)) {
      assert.match(name, /^[a-z0-9_.]+$/)
      assert.include(name, '.')
    }
  })

  test('leaf names start with their slice base', ({ assert }) => {
    assert.equal(events.auth.signedUp, `${events.auth.base}.signed_up`)
  })
})
