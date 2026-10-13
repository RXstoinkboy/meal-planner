import { type INestApplication, VersioningType } from '@nestjs/common'
import helmet from 'helmet'

import { corsOrigins } from '@/config/env'
import { serveOpenApi } from '@/config/swagger'

type ConfigureOptions = {
  withDocs?: boolean
}

/**
 * Imperative app configuration, shared by `main.ts` and the test harness so both
 * see the same prefixes, versioning and security headers.
 */
export function configureApp(app: INestApplication, options: ConfigureOptions = {}) {
  app.use(helmet())
  app.enableCors({ origin: corsOrigins(), credentials: true, maxAge: 90 })
  app.setGlobalPrefix('api', { exclude: ['health', '/'] })
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })

  if (options.withDocs !== false) {
    serveOpenApi(app)
  }
}
