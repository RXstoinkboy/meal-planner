import { type INestApplication } from '@nestjs/common'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createApp, httpServer } from './helpers'

describe('app routes', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('serves the root and the health probe as bare bodies', async () => {
    const root = await request(httpServer(app)).get('/').expect(200)
    expect(root.body).toEqual({ hello: 'world' })

    const health = await request(httpServer(app)).get('/health').expect(200)
    expect(health.body).toEqual({ status: 'ok', db: 'up' })
  })

  it('sets security headers and throttle metadata', async () => {
    const response = await request(httpServer(app)).get('/health').expect(200)

    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['x-ratelimit-limit']).toBeDefined()
  })

  it('answers unknown api routes with the default 404 shape', async () => {
    const response = await request(httpServer(app)).get('/api/v1/nope').expect(404)

    expect(response.body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      message: 'Cannot GET /api/v1/nope',
    })
  })
})
