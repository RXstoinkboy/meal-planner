/**
 * Event names keyed by vertical slice, mirroring the app structure.
 * Naming convention: "{slice}.{event_snake}" — same contract as the mobile
 * app (apps/mobile/lib/analytics/events.ts), kept in sync by convention.
 *
 * Slices can nest; every level exposes `base` and reuses the previous
 * level's base to derive its own (see mobile events.ts for an example).
 */
const authBase = 'auth' as const

export const events = {
  auth: {
    base: authBase,
    signedUp: `${authBase}.signed_up`,
  },
} as const
