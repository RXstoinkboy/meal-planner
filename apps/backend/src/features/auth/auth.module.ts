import { Module } from '@nestjs/common'

import { AccountController } from '@/features/auth/account/account.controller'
import { AccountService } from '@/features/auth/account/account.service'
import { LoginController } from '@/features/auth/login/login.controller'
import { LoginService } from '@/features/auth/login/login.service'
import { SignupController } from '@/features/auth/signup/signup.controller'
import { SignupService } from '@/features/auth/signup/signup.service'

@Module({
  controllers: [SignupController, LoginController, AccountController],
  providers: [SignupService, LoginService, AccountService],
  exports: [SignupService, LoginService, AccountService],
})
export class AuthModule {}
