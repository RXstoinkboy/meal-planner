import { Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common'
import { Public, TokenService } from '@nestjs/authentication'
import { ApiBadRequestResponse, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { AnalyticsService } from '@/core/analytics/analytics.service'
import { events } from '@/core/analytics/events'
import { stockErrorResponseSchema } from '@/core/http/error.schema'
import { responseOptions } from '@/core/swagger/swagger-schema'
import { loginSchema, type LoginPayload } from '@/features/auth/login/login.schema'
import { LoginService } from '@/features/auth/login/login.service'
import {
  sessionResponseSchema,
  toSessionResponse,
  type SessionResponse,
} from '@/features/auth/session.mapper'

@Public()
@Controller('auth')
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly tokenService: TokenService,
    private readonly analytics: AnalyticsService
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse(responseOptions(sessionResponseSchema, 'Signed in'))
  @ApiBadRequestResponse(responseOptions(stockErrorResponseSchema, 'Validation failed'))
  @ApiUnauthorizedResponse(responseOptions(stockErrorResponseSchema, 'Invalid credentials'))
  async login(@Body({ schema: loginSchema }) body: LoginPayload): Promise<SessionResponse> {
    const user = await this.loginService.verify(body.email, body.password)

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const tokenPair = await this.tokenService.issue(String(user.id), {
      method: 'password',
      claims: { amr: ['pwd'] },
    })

    this.analytics.track(events.auth.loggedIn, user.id)

    return toSessionResponse(user, tokenPair)
  }
}
