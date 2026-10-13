import { Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from '@nestjs/common'

import { AnalyticsService } from '@/common/analytics/analytics.service'
import { events } from '@/common/analytics/events'
import { LoginDto, SignupDto } from '@/features/auth/validators/user.schema'
import { toUserResponse, type UserResponse } from '@/features/auth/mappers/user.mapper'
import { UsersService } from '@/features/auth/services/users.service'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly users: UsersService,
    private readonly analytics: AnalyticsService
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() body: SignupDto): Promise<UserResponse> {
    const user = await this.users.create({
      email: body.email,
      fullName: body.fullName ?? null,
    })

    this.analytics.track(events.auth.signedUp, user.id)

    return toUserResponse(user)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto): Promise<UserResponse> {
    const user = await this.users.findByEmail(body.email)

    if (!user) {
      // no password to check — an unknown email is the only way to fail
      throw new UnauthorizedException('Invalid credentials')
    }

    this.analytics.track(events.auth.loggedIn, user.id)

    return toUserResponse(user)
  }
}
