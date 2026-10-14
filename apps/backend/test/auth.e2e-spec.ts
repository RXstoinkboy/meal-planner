import { type INestApplication } from '@nestjs/common'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { createApp, httpServer, signup } from './helpers'

describe('auth', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('creates a user and returns the public shape', async () => {
    const response = await request(httpServer(app))
      .post('/api/v1/auth/signup')
      .send({
        fullName: 'Test User',
        email: 'signup@example.com',
        password: 'password123',
        passwordConfirmation: 'different-but-ignored',
      })
      .expect(201)

    const user = response.body as Record<string, unknown>

    expect(user).toMatchObject({
      email: 'signup@example.com',
      fullName: 'Test User',
      initials: 'TU',
    })
    expect(user).not.toHaveProperty('password')
  })

  it('turns an empty fullName into null', async () => {
    const response = await request(httpServer(app))
      .post('/api/v1/auth/signup')
      .send({ fullName: '', email: 'empty@example.com' })
      .expect(201)

    expect((response.body as { fullName: unknown }).fullName).toBeNull()
  })

  it('rejects a duplicate email with a 409', async () => {
    await signup(app, 'dup@example.com')

    const response = await request(httpServer(app))
      .post('/api/v1/auth/signup')
      .send({ email: 'dup@example.com' })
      .expect(409)

    expect(response.body).toEqual({
      statusCode: 409,
      message: 'The email has already been taken',
      error: 'Conflict',
    })
  })

  it('rejects an invalid email shape with a 400 field error', async () => {
    const response = await request(httpServer(app))
      .post('/api/v1/auth/signup')
      .send({ email: 'not-an-email' })
      .expect(400)

    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: [{ field: 'email' }],
    })
    expect(typeof (response.body as { message: { message: unknown }[] }).message[0]?.message).toBe(
      'string'
    )
  })

  it('logs in an existing user and rejects an unknown email', async () => {
    const user = await signup(app, 'login@example.com', 'Login User')

    const loginResponse = await request(httpServer(app))
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'whatever', fullName: 'ignored' })
      .expect(200)

    expect((loginResponse.body as { id: number }).id).toBe(user.id)

    const unauthorized = await request(httpServer(app))
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com' })
      .expect(401)

    expect(unauthorized.body).toMatchObject({ statusCode: 401 })
  })

  it('reads the profile from the header and refuses unknown or missing identities', async () => {
    const user = await signup(app, 'profile@example.com')

    const profileResponse = await request(httpServer(app))
      .get('/api/v1/account/profile')
      .set('x-user-id', String(user.id))
      .expect(200)

    expect((profileResponse.body as { id: number }).id).toBe(user.id)

    await request(httpServer(app)).get('/api/v1/account/profile').expect(401)
    await request(httpServer(app))
      .get('/api/v1/account/profile')
      .set('x-user-id', '9999')
      .expect(401)
    await request(httpServer(app))
      .get('/api/v1/account/profile')
      .set('x-user-id', 'abc')
      .expect(401)
  })
})
