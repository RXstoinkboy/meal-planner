import { Module } from '@nestjs/common'
import { AuthenticationModule } from '@nestjs/authentication'

import { env, isTest } from '@/core/config/env'
import { AccountController } from '@/features/auth/account/account.controller'
import { AccountService } from '@/features/auth/account/account.service'
import { AuthEventsListener } from '@/features/auth/auth-events.listener'
import { JwtAuth } from '@/features/auth/jwt-auth.provider'
import { LoginController } from '@/features/auth/login/login.controller'
import { LoginService } from '@/features/auth/login/login.service'
import { LogoutController } from '@/features/auth/logout/logout.controller'
import { PrismaRefreshTokenStore } from '@/features/auth/refresh-token.store'
import { RefreshController } from '@/features/auth/refresh/refresh.controller'
import { SignupController } from '@/features/auth/signup/signup.controller'
import { SignupService } from '@/features/auth/signup/signup.service'

@Module({
  imports: [
    AuthenticationModule.forRoot({
      accessToken: { key: env.JWT_SECRET, ttl: env.JWT_EXPIRES_IN },
      refreshToken: { ttl: env.REFRESH_EXPIRES_IN },
      password: isTest ? { logN: 10 } : undefined,
    }),
  ],
  controllers: [
    SignupController,
    LoginController,
    RefreshController,
    LogoutController,
    AccountController,
  ],
  providers: [
    SignupService,
    LoginService,
    AccountService,
    JwtAuth,
    PrismaRefreshTokenStore,
    AuthEventsListener,
  ],
  exports: [SignupService, LoginService, AccountService],
})
export class AuthModule {}
