import { Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

import { AnalyticsService } from '@/common/analytics/analytics.service'
import { events } from '@/common/analytics/events'
import { stockErrorResponseSchema } from '@/common/http/error.schema'
import { responseOptions } from '@/common/swagger/swagger-schema'
import {
  toUserResponse,
  type UserResponse,
  userResponseSchema,
} from '@/features/auth/mappers/user.mapper'
import { UsersService } from '@/features/auth/services/users.service'
import {
  loginSchema,
  type LoginPayload,
  signupSchema,
  type SignupPayload,
} from '@/features/auth/validators/user.schema'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly users: UsersService,
    private readonly analytics: AnalyticsService
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse(responseOptions(userResponseSchema, 'Created user'))
  @ApiBadRequestResponse(responseOptions(stockErrorResponseSchema, 'Validation failed'))
  @ApiConflictResponse(responseOptions(stockErrorResponseSchema, 'The email is already taken'))
  async signup(@Body({ schema: signupSchema }) body: SignupPayload): Promise<UserResponse> {
    const user = await this.users.create({
      email: body.email,
      fullName: body.fullName ?? null,
    })

    this.analytics.track(events.auth.signedUp, user.id)

    return toUserResponse(user)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse(responseOptions(userResponseSchema, 'Existing user'))
  @ApiBadRequestResponse(responseOptions(stockErrorResponseSchema, 'Validation failed'))
  @ApiUnauthorizedResponse(responseOptions(stockErrorResponseSchema, 'No user with that email'))
  async login(@Body({ schema: loginSchema }) body: LoginPayload): Promise<UserResponse> {
    const user = await this.users.findByEmail(body.email)

    if (!user) {
      // no password to check — an unknown email is the only way to fail
      throw new UnauthorizedException('Invalid credentials')
    }

    this.analytics.track(events.auth.loggedIn, user.id)

    return toUserResponse(user)
  }
}
