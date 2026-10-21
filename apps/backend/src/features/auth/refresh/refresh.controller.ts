import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { Public, TokenService } from '@nestjs/authentication'
import { ApiBadRequestResponse, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger'

import { stockErrorResponseSchema } from '@/core/http/error.schema'
import { responseOptions } from '@/core/swagger/swagger-schema'
import { refreshSchema, type RefreshPayload } from '@/features/auth/refresh/refresh.schema'
import { tokenPairSchema, type TokenPairResponse } from '@/features/auth/session.mapper'

@Public()
@Controller('auth')
export class RefreshController {
  constructor(private readonly tokenService: TokenService) {}

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse(responseOptions(tokenPairSchema, 'Rotated tokens'))
  @ApiBadRequestResponse(responseOptions(stockErrorResponseSchema, 'Validation failed'))
  @ApiUnauthorizedResponse(
    responseOptions(stockErrorResponseSchema, 'Unknown, expired or reused refresh token')
  )
  async refresh(@Body({ schema: refreshSchema }) body: RefreshPayload): Promise<TokenPairResponse> {
    return this.tokenService.refresh(body.refreshToken)
  }
}
