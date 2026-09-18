/**
 * SERVER events — authoritative facts, emitted where the state change
 * actually happens (controller). Client-side intent lives in
 * apps/mobile/lib/analytics/events.ts.
 *
 * TEMPLATE — nothing emits these yet. Wire one up where the fact happens:
 *   import { events } from '#services/events'
 *   import { track } from '#services/analytics'
 *   track(events.auth.signedUp, user.id)
 *
 * Naming: "{slice}.{event_snake}".
 *   server → completed facts ("signed_up", "logged_in", "logged_out")
 *   client → "{slice}.{ui_element}.clicked"
 * Never reuse a client event name here — same name from both layers
 * double-counts in funnels.
 *
 * Slices can nest; every level exposes `base` and reuses the previous
 * level's base to derive its own (see mobile events.ts for an example).
 */
const authBase = 'auth' as const

export const events = {
  auth: {
    base: authBase,
    signedUp: `${authBase}.signed_up`,
    loggedIn: `${authBase}.logged_in`,
    loggedOut: `${authBase}.logged_out`,
  },
} as const
