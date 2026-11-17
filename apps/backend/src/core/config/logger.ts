import { createRequire } from 'node:module'
import type { Params } from 'nestjs-pino'

import { env, isProduction, isTest } from '@/core/config/env'

// pino resolves transport targets from its own directory, and pino-pretty is not
// hoisted to the workspace root — resolve it from this module instead. Lazy: it is
// a devDependency, and production images install without it.
function resolvePinoPrettyTarget() {
  return createRequire(__filename).resolve('pino-pretty')
}

/** Structured logs everywhere; pretty-printed in development only. */
export function loggerOptions(): Params['pinoHttp'] {
  const isDevelopment = !isProduction && !isTest

  return {
    level: env.LOG_LEVEL,
    redact: { paths: ['req.headers.authorization', 'req.headers.cookie'], remove: true },
    transport: isDevelopment
      ? {
          target: resolvePinoPrettyTarget(),
          options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' },
        }
      : undefined,
  }
}
