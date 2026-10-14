import type { Breadcrumb, ErrorEvent } from '@sentry/core'

/**
 * Sentry is off unless a DSN is configured, and never runs under the test suite
 * (tests must not emit events).
 */
export function sentryEnabled(dsn: string | undefined, nodeEnv: string) {
  return Boolean(dsn) && nodeEnv !== 'test'
}

/**
 * Strip anything that could carry a bearer token, an email or the user's
 * meal/health data. `request` = headers + body, `extra` = arbitrary controller
 * payloads. User id only.
 */
export function scrubEvent(event: ErrorEvent) {
  delete event.request
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

/**
 * 4xx is a user problem, not a bug — keep it out of the error monitor.
 * Duck-typed on purpose: this module must not pull the framework in before
 * `Sentry.init` has run.
 */
export function isClientException(error: unknown): boolean {
  if (error === null || error === undefined) {
    return false
  }

  const withStatus = error as { getStatus?: () => number; status?: unknown }
  const status =
    typeof withStatus.getStatus === 'function' ? withStatus.getStatus() : withStatus.status

  return typeof status === 'number' && status < 500
}
