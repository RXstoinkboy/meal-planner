import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { Public, TokenService } from '@nestjs/authentication'
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse } from '@nestjs/swagger'

import { AnalyticsService } from '@/core/analytics/analytics.service'
import { events } from '@/core/analytics/events'
import { stockErrorResponseSchema } from '@/core/http/error.schema'
import { responseOptions } from '@/core/swagger/swagger-schema'
import {
  sessionResponseSchema,
  toSessionResponse,
  type SessionResponse,
} from '@/features/auth/session.mapper'
import { signupSchema, type SignupPayload } from '@/features/auth/signup/signup.schema'
import { SignupService } from '@/features/auth/signup/signup.service'

@Public()
@Controller('auth')
export class SignupController {
  constructor(
    private readonly signupService: SignupService,
    private readonly tokenService: TokenService,
    private readonly analytics: AnalyticsService
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse(responseOptions(sessionResponseSchema, 'Created user, signed in'))
  @ApiBadRequestResponse(responseOptions(stockErrorResponseSchema, 'Validation failed'))
  @ApiConflictResponse(responseOptions(stockErrorResponseSchema, 'The email is already taken'))
  async signup(@Body({ schema: signupSchema }) body: SignupPayload): Promise<SessionResponse> {
    const user = await this.signupService.create({
      email: body.email,
      fullName: body.fullName ?? null,
      password: body.password,
    })

    const tokenPair = await this.tokenService.issue(String(user.id), {
      method: 'password',
      claims: { amr: ['pwd'] },
    })

    this.analytics.track(events.auth.signedUp, user.id)

    return toSessionResponse(user, tokenPair)
  }
}
