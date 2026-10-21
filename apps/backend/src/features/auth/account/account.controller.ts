import { Controller, Get } from '@nestjs/common'
import { CurrentUser } from '@nestjs/authentication'
import { Can } from '@nestjs/authorization'
import { ApiOkResponse, ApiSecurity, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { stockErrorResponseSchema } from '@/core/http/error.schema'
import { responseOptions } from '@/core/swagger/swagger-schema'
import { AccountService } from '@/features/auth/account/account.service'
import {
  toUserResponse,
  type UserResponse,
  userResponseSchema,
} from '@/features/auth/user/user.mapper'

@Can.Anyone()
@Controller('account')
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get('profile')
  @ApiSecurity('bearer')
  @ApiOkResponse(responseOptions(userResponseSchema, 'Current user'))
  @ApiUnauthorizedResponse(
    responseOptions(stockErrorResponseSchema, 'Missing, unknown or expired bearer token')
  )
  async show(@CurrentUser('id') userId: number): Promise<UserResponse> {
    return toUserResponse(await this.account.requireById(userId))
  }
}
