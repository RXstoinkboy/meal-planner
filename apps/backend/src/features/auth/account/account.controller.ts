import { Controller, Get } from '@nestjs/common'
import { ApiOkResponse, ApiSecurity, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { stockErrorResponseSchema } from '@/core/http/error.schema'
import { CurrentUserId } from '@/core/identity/current-user.decorator'
import { responseOptions } from '@/core/swagger/swagger-schema'
import { AccountService } from '@/features/auth/account/account.service'
import {
  toUserResponse,
  type UserResponse,
  userResponseSchema,
} from '@/features/auth/user/user.mapper'

@Controller('account')
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get('profile')
  @ApiSecurity('x-user-id')
  @ApiOkResponse(responseOptions(userResponseSchema, 'Current user'))
  @ApiUnauthorizedResponse(
    responseOptions(stockErrorResponseSchema, 'Missing or unknown x-user-id header')
  )
  async show(@CurrentUserId() userId: number): Promise<UserResponse> {
    return toUserResponse(await this.account.requireById(userId))
  }
}
