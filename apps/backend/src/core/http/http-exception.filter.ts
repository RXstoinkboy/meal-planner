import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import * as Sentry from '@sentry/nestjs'
import type { Request, Response } from 'express'

/** Prisma known request errors, duck-typed so no runtime import is needed. */
function prismaErrorCode(exception: unknown): string | undefined {
  const code = (exception as { code?: unknown } | null)?.code

  return typeof code === 'string' && code.startsWith('P') ? code : undefined
}

type RequestWithUser = Omit<Request, 'route'> & { route?: { path?: string } }

type Failure = { status: number; body: unknown }

/** Anything below 500 is a client problem and stays out of Sentry. */
const SERVER_ERROR_STATUS = 500

/**
 * Single exit point for failures, all bodies in stock Nest shape. HttpExceptions
 * pass through verbatim; Prisma codes are translated (P2003 → 401 — the only FK is
 * recipes.user_id, so this is an unknown identity, not a malformed payload; P2025 →
 * 404). Anything else is a 500 that reaches Sentry; 4xx never does.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp()
    const response = context.getResponse<Response>()
    const request = context.getRequest<RequestWithUser>()

    const failure = this.toFailure(exception)
    const isServerError = failure.status >= SERVER_ERROR_STATUS

    if (isServerError) {
      this.report(exception, request)
      this.logger.error(`${request.method} ${request.originalUrl} -> ${failure.status}`, exception)
    }

    response.status(failure.status).json(failure.body)
  }

  private toFailure(exception: unknown): Failure {
    if (exception instanceof HttpException) {
      return { status: exception.getStatus(), body: exception.getResponse() }
    }

    const code = prismaErrorCode(exception)

    if (code === 'P2003') {
      const translated = new UnauthorizedException('Unknown user')

      return { status: translated.getStatus(), body: translated.getResponse() }
    }

    if (code === 'P2025') {
      const translated = new NotFoundException()

      return { status: translated.getStatus(), body: translated.getResponse() }
    }

    const translated = new InternalServerErrorException()

    return { status: translated.getStatus(), body: translated.getResponse() }
  }

  private report(exception: unknown, request: RequestWithUser) {
    Sentry.captureException(exception, (scope) => {
      scope.setTag('route', request.route?.path ?? 'unknown')
      scope.setTag('method', request.method)
      scope.setContext('request', { path: request.originalUrl })

      const user = request.user

      if (user) {
        scope.setUser({ id: String(user.id) })
      }

      return scope
    })
  }
}
