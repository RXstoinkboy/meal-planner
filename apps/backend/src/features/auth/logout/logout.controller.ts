import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { Public, TokenService } from '@nestjs/authentication'
import { ApiBadRequestResponse, ApiNoContentResponse } from '@nestjs/swagger'

import { stockErrorResponseSchema } from '@/core/http/error.schema'
import { responseOptions } from '@/core/swagger/swagger-schema'
import { logoutSchema, type LogoutPayload } from '@/features/auth/logout/logout.schema'

@Public()
@Controller('auth')
export class LogoutController {
  constructor(private readonly tokenService: TokenService) {}

  /** Revokes the refresh-token family; unknown tokens are ignored (RFC 7009 §2.2). */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Refresh token revoked' })
  @ApiBadRequestResponse(responseOptions(stockErrorResponseSchema, 'Validation failed'))
  async logout(@Body({ schema: logoutSchema }) body: LogoutPayload): Promise<void> {
    await this.tokenService.revoke(body.refreshToken)
  }
}
