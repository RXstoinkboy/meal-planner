import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common'
import { Public } from '@nestjs/authentication'

@Public()
@Controller({ path: '', version: VERSION_NEUTRAL })
export class AppController {
  @Get()
  root() {
    return { hello: 'world' }
  }
}
