// Must be first: the Sentry SDK instruments whatever is loaded after it.
import './instrument'

import { NestFactory } from '@nestjs/core'
import { Logger } from 'nestjs-pino'

import { AppModule } from '@/app.module'
import { configureApp } from '@/core/config/app.setup'
import { env } from '@/core/config/env'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  app.useLogger(app.get(Logger))
  // CSRF (csrf-csrf) is deliberately absent: it protects cookie sessions, and this
  // API is called with an explicit `X-User-Id` identity, so a token handshake would
  // break every mutating request without protecting anything. Revisit with cookies.
  configureApp(app)
  app.enableShutdownHooks()

  await app.listen(env.PORT, env.HOST)
}

void bootstrap()
