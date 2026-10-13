import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi'
import type { INestApplication } from '@nestjs/common'
import { SwaggerModule, type OpenAPIObject } from '@nestjs/swagger'

import { isProduction } from '@/config/env'
import { registry } from '@/openapi/registry'

const OPENAPI_TITLE = 'Meal Planner API'
const OPENAPI_VERSION = '1.0.0'

export function buildOpenApiDocument() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: { title: OPENAPI_TITLE, version: OPENAPI_VERSION },
  })
}

/** Swagger UI at `/docs` outside production. The committed artifact is `openapi.json`. */
export function serveOpenApi(app: INestApplication) {
  if (isProduction) {
    return
  }

  SwaggerModule.setup('docs', app, buildOpenApiDocument() as unknown as OpenAPIObject)
}
