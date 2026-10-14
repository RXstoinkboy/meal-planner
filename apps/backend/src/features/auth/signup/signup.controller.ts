import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse } from '@nestjs/swagger'

import { AnalyticsService } from '@/core/analytics/analytics.service'
import { events } from '@/core/analytics/events'
import { stockErrorResponseSchema } from '@/core/http/error.schema'
import { responseOptions } from '@/core/swagger/swagger-schema'
import {
  toUserResponse,
  type UserResponse,
  userResponseSchema,
} from '@/features/auth/user/user.mapper'
import { signupSchema, type SignupPayload } from '@/features/auth/signup/signup.schema'
import { SignupService } from '@/features/auth/signup/signup.service'

@Controller('auth')
export class SignupController {
  constructor(
    private readonly signupService: SignupService,
    private readonly analytics: AnalyticsService
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse(responseOptions(userResponseSchema, 'Created user'))
  @ApiBadRequestResponse(responseOptions(stockErrorResponseSchema, 'Validation failed'))
  @ApiConflictResponse(responseOptions(stockErrorResponseSchema, 'The email is already taken'))
  async signup(@Body({ schema: signupSchema }) body: SignupPayload): Promise<UserResponse> {
    const user = await this.signupService.create({
      email: body.email,
      fullName: body.fullName ?? null,
    })

    this.analytics.track(events.auth.signedUp, user.id)

    return toUserResponse(user)
  }
}
