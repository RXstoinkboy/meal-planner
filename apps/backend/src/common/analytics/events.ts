/**
 * SERVER events — authoritative facts, emitted where the state change actually
 * happens (controller). Client-side intent lives in
 * apps/mobile/lib/analytics/events.ts.
 *
 * Wire one up where the fact happens:
 *   import { events } from '@/common/analytics/events'
 *   import { AnalyticsService } from '@/common/analytics/analytics.service'
 *   analytics.track(events.recipes.created, userId, { recipe_id: recipe.id })
 *
 * Naming: "{slice}.{event_snake}".
 *   server → completed facts ("signed_up", "created")
 *   client → "{slice}_{ui_element}_clicked"
 * Never reuse a client event name here — same name from both layers
 * double-counts in funnels.
 */
const authBase = 'auth' as const
const recipesBase = 'recipes' as const

export const events = {
  auth: {
    base: authBase,
    signedUp: `${authBase}.signed_up`,
    loggedIn: `${authBase}.logged_in`,
  },
  recipes: {
    base: recipesBase,
    created: `${recipesBase}.created`,
    updated: `${recipesBase}.updated`,
    deleted: `${recipesBase}.deleted`,
  },
} as const
