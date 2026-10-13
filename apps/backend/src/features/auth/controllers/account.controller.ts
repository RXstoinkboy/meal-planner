import { Controller, Get } from '@nestjs/common'

import { CurrentUserId } from '@/common/identity/current-user.decorator'
import { toUserResponse, type UserResponse } from '@/features/auth/mappers/user.mapper'
import { UsersService } from '@/features/auth/services/users.service'

@Controller('account')
export class AccountController {
  constructor(private readonly users: UsersService) {}

  @Get('profile')
  async show(@CurrentUserId() userId: number): Promise<UserResponse> {
    return toUserResponse(await this.users.requireById(userId))
  }
}
