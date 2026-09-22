/** Analytics facade — only module importing PostHog; swapping providers means rewriting just this file. */
import { PostHog } from 'posthog-node'
import env from '#start/env'

export type EventProps = Record<string, unknown>

// shared free-tier PostHog project — tag keeps insights filterable per app
const APP_TAG = 'meal-planner'

let instance: PostHog | undefined

function client(): PostHog | undefined {
  const key = env.get('POSTHOG_KEY') as string | undefined
  // ponytail: no-op without a key — app and tests run clean
  if (!key) return undefined
  instance ??= new PostHog(key, {
    host: (env.get('POSTHOG_HOST') as string | undefined) ?? 'https://eu.i.posthog.com',
  })
  return instance
}

/** Fire-and-forget — never await in request paths; flushed on shutdown (analytics_provider). */
export function track(event: string, distinctId: string | number, props?: EventProps) {
  // no register() in posthog-node — tag per capture
  client()?.capture({
    event,
    distinctId: String(distinctId),
    properties: { app: APP_TAG, ...props },
  })
}

/** Flush queued events; called from analytics_provider on app termination. */
export function shutdownAnalytics(): Promise<void> | undefined {
  return client()?.shutdown()
}
