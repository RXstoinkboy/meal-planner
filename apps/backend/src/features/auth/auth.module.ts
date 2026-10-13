import { Module } from '@nestjs/common'

// Registers this slice's schemas and paths in the shared OpenAPI registry.
import './openapi'

import { AccountController } from '@/features/auth/controllers/account.controller'
import { AuthController } from '@/features/auth/controllers/auth.controller'
import { UsersService } from '@/features/auth/services/users.service'

@Module({
  controllers: [AuthController, AccountController],
  providers: [UsersService],
  exports: [UsersService],
})
export class AuthModule {}
