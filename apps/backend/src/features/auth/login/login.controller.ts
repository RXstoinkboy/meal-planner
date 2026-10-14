import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiBadRequestResponse, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { AnalyticsService } from '@/core/analytics/analytics.service'
import { events } from '@/core/analytics/events'
import { stockErrorResponseSchema } from '@/core/http/error.schema'
import { responseOptions } from '@/core/swagger/swagger-schema'
import {
  toUserResponse,
  type UserResponse,
  userResponseSchema,
} from '@/features/auth/user/user.mapper'
import { loginSchema, type LoginPayload } from '@/features/auth/login/login.schema'
import { LoginService } from '@/features/auth/login/login.service'

@Controller('auth')
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly analytics: AnalyticsService
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse(responseOptions(userResponseSchema, 'Existing user'))
  @ApiBadRequestResponse(responseOptions(stockErrorResponseSchema, 'Validation failed'))
  @ApiUnauthorizedResponse(responseOptions(stockErrorResponseSchema, 'No user with that email'))
  async login(@Body({ schema: loginSchema }) body: LoginPayload): Promise<UserResponse> {
    const user = await this.loginService.login(body.email)

    this.analytics.track(events.auth.loggedIn, user.id)

    return toUserResponse(user)
  }
}
