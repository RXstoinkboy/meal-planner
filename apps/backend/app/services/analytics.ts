/**
 * Analytics facade — the only module importing PostHog. Swap PostHog for
 * another provider by rewriting this file; no call sites change.
 */
import { PostHog } from 'posthog-node'
import env from '#start/env'

export type EventProps = Record<string, unknown>

let instance: PostHog | undefined

function client(): PostHog | undefined {
  const key = env.get('POSTHOG_KEY') as string | undefined
  // ponytail: no-op without POSTHOG_KEY — app and tests run clean without it
  if (!key) return undefined
  instance ??= new PostHog(key, {
    host: (env.get('POSTHOG_HOST') as string | undefined) ?? 'https://eu.i.posthog.com',
  })
  return instance
}

/**
 * Fire-and-forget capture. Never await in request paths — posthog-node
 * batches internally and flushes on shutdown (analytics_provider).
 */
export function track(event: string, distinctId: string | number, props?: EventProps) {
  client()?.capture({ event, distinctId: String(distinctId), properties: props })
}

/** Flush queued events; called from analytics_provider on app termination. */
export function shutdownAnalytics(): Promise<void> | undefined {
  return client()?.shutdown()
}
