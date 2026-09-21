import * as Sentry from '@sentry/node'
import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  report(error: unknown, ctx: HttpContext) {
    const status = (error as { status?: unknown })?.status

    // 4xx (validation, auth, not found) is a user problem, not a bug — keep it
    // out of the error monitor so the signal stays readable.
    if (typeof status !== 'number' || status >= 500) {
      Sentry.withScope((scope) => {
        scope.setTag('route', ctx.route?.pattern ?? 'unknown')
        scope.setTag('method', ctx.request.method())
        scope.setContext('request', {
          id: ctx.request.id(),
          path: ctx.request.url(),
        })

        const userId = ctx.auth?.user?.id
        if (userId) {
          scope.setUser({ id: String(userId) })
        }

        Sentry.captureException(error)
      })
    }

    return super.report(error, ctx)
  }
}
