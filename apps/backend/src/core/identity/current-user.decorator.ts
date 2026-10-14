import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'

export const X_USER_ID_HEADER = 'x-user-id'

type RequestWithUser = Request & { userId?: number }

/**
 * Identity seam. There is no authentication yet — the caller identifies with
 * `X-User-Id`. Swapping this decorator (or adding a guard ahead of it) is the whole
 * change when Nest passport or Keycloak lands; nothing else reads the header.
 */
export const CurrentUserId = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<RequestWithUser>()
  const raw = request.header(X_USER_ID_HEADER)
  const userId = Number(raw)

  const isValid =
    typeof raw === 'string' && raw.trim() !== '' && Number.isInteger(userId) && userId > 0

  if (!isValid) {
    throw new UnauthorizedException(`Missing or invalid ${X_USER_ID_HEADER} header`)
  }

  // so the exception filter and logs can attach the caller without re-parsing
  request.userId = userId

  return userId
})
