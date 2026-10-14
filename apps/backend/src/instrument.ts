import * as Sentry from '@sentry/nestjs'

import { env } from '@/core/config/env'
import {
  isClientException,
  scrubBreadcrumb,
  scrubEvent,
  sentryEnabled,
} from '@/core/sentry/scrubbers'

Sentry.init({
  dsn: env.SENTRY_DSN,
  enabled: sentryEnabled(env.SENTRY_DSN, env.NODE_ENV),
  environment: env.NODE_ENV,
  release: env.SENTRY_RELEASE,
  tracesSampleRate: 0,
  // Sentry 11 replaced `sendDefaultPii` with per-source switches. Meal, health and
  // identity data must never leave the process; the scrubbers are the second line.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: { request: false, response: false },
    httpBodies: [],
    urlQueryParams: false,
    databaseQueryData: false,
    stackFrameVariables: false,
    genAI: { inputs: false, outputs: false },
  },
  beforeSend(event, hint) {
    if (isClientException(hint.originalException)) {
      return null
    }

    return scrubEvent(event)
  },
  beforeBreadcrumb: scrubBreadcrumb,
})
