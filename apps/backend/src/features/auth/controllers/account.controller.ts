import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiSecurity, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { stockErrorResponseSchema } from '@/common/http/error.schema'
import { CurrentUserId } from '@/common/identity/current-user.decorator'
import { responseOptions } from '@/common/swagger/swagger-schema'
import {
  toUserResponse,
  type UserResponse,
  userResponseSchema,
} from '@/features/auth/mappers/user.mapper'
import { UsersService } from '@/features/auth/services/users.service'

@Controller('account')
export class AccountController {
  constructor(private readonly users: UsersService) {}

  @Get('profile')
  @ApiSecurity('x-user-id')
  @ApiOkResponse(responseOptions(userResponseSchema, 'Current user'))
  @ApiUnauthorizedResponse(
    responseOptions(stockErrorResponseSchema, 'Missing or unknown x-user-id header')
  )
  async show(@CurrentUserId() userId: number): Promise<UserResponse> {
    return toUserResponse(await this.users.requireById(userId))
  }
}
