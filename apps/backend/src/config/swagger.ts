import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import type { INestApplication } from '@nestjs/common'

import { isProduction } from '@/config/env'

/**
 * Runtime document from Standard Schemas: route-param `schema` options become
 * request bodies, `@ApiOkResponse({ schema })` response bodies. Swagger UI at
 * `/docs` outside production; there is no committed artifact anymore (the mobile
 * client calls plain URLs, not generated types).
 */
export function serveOpenApi(app: INestApplication) {
  if (isProduction) {
    return
  }

  const config = new DocumentBuilder()
    .setTitle('Meal Planner API')
    .setVersion('1.0.0')
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-user-id',
        description: 'Caller identity until real authentication lands',
      },
      'x-user-id'
    )
    .build()

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config))
}
