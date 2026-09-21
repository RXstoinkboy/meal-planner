import type { Breadcrumb, ErrorEvent } from '@sentry/node'

import env from '#start/env'

/**
 * Sentry is off unless a DSN is configured, and never runs under the test
 * suite (tests must not emit events).
 */
export function sentryEnabled(dsn: string | undefined, nodeEnv: string) {
  return Boolean(dsn) && nodeEnv !== 'test'
}

/**
 * Strip anything that could carry a bearer token, an email or the user's
 * meal/health data. `request` = headers (`Authorization`!) + body,
 * `extra` = arbitrary controller payloads. User id only.
 */
export function scrubEvent(event: ErrorEvent) {
  // pi-lens-ignore: ast-grep:ts-delete-property
  delete event.request
  // pi-lens-ignore: ast-grep:ts-delete-property
  delete event.extra
  if (event.user) {
    event.user = { id: event.user.id }
  }
  return event
}

/**
 * SQL text (`query`) and console output are free-form and can contain meal
 * or health data — never ship them. HTTP/db breadcrumb metadata is kept.
 */
export function scrubBreadcrumb(breadcrumb: Breadcrumb) {
  if (breadcrumb.category === 'query' || breadcrumb.category === 'console') {
    return null
  }
  return breadcrumb
}

const dsn = env.get('SENTRY_DSN')
const nodeEnv = env.get('NODE_ENV')

/**
 * AdonisJS does not auto-load `config/*`, so `bin/server.ts` imports this
 * module explicitly and calls `Sentry.init` before the app is loaded.
 */
export default {
  dsn,
  enabled: sentryEnabled(dsn, nodeEnv),
  environment: nodeEnv,
  release: env.get('SENTRY_RELEASE'),
  tracesSampleRate: 0,
  sendDefaultPii: false,
  beforeSend: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb,
}
