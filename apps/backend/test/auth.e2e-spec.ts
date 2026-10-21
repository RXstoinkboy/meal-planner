import { type INestApplication } from '@nestjs/common'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { PrismaService } from '@/core/database/prisma.service'
import { bearer, createApp, httpServer, login, signup } from './helpers'

const PROFILE = '/api/v1/account/profile'

async function refresh(app: INestApplication, refreshToken: string) {
  const response = await request(httpServer(app))
    .post('/api/v1/auth/refresh')
    .send({ refreshToken })
    .expect(200)

  return response.body as { accessToken: string; refreshToken: string; expiresIn: number }
}

describe('auth', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('creates a user, signs it in, and leaks no password field', async () => {
    const response = await request(httpServer(app))
      .post('/api/v1/auth/signup')
      .send({
        fullName: 'Test User',
        email: 'signup@example.com',
        password: 'long-enough-password',
        passwordConfirmation: 'long-enough-password',
      })
      .expect(201)

    const session = response.body as {
      accessToken: unknown
      refreshToken: unknown
      user: Record<string, unknown>
    }

    expect(typeof session.accessToken).toBe('string')
    expect(typeof session.refreshToken).toBe('string')
    expect(session.user).toMatchObject({
      email: 'signup@example.com',
      fullName: 'Test User',
      initials: 'TU',
    })
    expect(JSON.stringify(session)).not.toContain('password')
  })

  it('turns an empty fullName into null', async () => {
    const response = await request(httpServer(app))
      .post('/api/v1/auth/signup')
      .send({
        fullName: '',
        email: 'empty@example.com',
        password: 'long-enough-password',
        passwordConfirmation: 'long-enough-password',
      })
      .expect(201)

    expect((response.body as { user: { fullName: unknown } }).user.fullName).toBeNull()
  })

  it('normalizes the email to lower case for signup and login', async () => {
    const session = await signup(app, 'Mixed@Example.com')

    expect(session.user.email).toBe('mixed@example.com')

    const again = await login(app, 'MIXED@example.com')

    expect(again.user.id).toBe(session.user.id)
  })

  it('rejects a short password, a mismatched confirmation and a missing password', async () => {
    const short = await request(httpServer(app))
      .post('/api/v1/auth/signup')
      .send({ email: 'short@example.com', password: 'short', passwordConfirmation: 'short' })
      .expect(400)

    const shortFields = (short.body as { message: { field: string }[] }).message.map(
      (entry) => entry.field
    )

    expect(shortFields).toContain('password')

    const mismatch = await request(httpServer(app))
      .post('/api/v1/auth/signup')
      .send({
        email: 'mismatch@example.com',
        password: 'long-enough-password',
        passwordConfirmation: 'different-password',
      })
      .expect(400)

    expect((mismatch.body as { message: { field: string }[] }).message[0]?.field).toBe(
      'passwordConfirmation'
    )

    await request(httpServer(app))
      .post('/api/v1/auth/signup')
      .send({ email: 'nopass@example.com' })
      .expect(400)
  })

  it('rejects a duplicate email with a 409', async () => {
    await signup(app, 'dup@example.com')

    const response = await request(httpServer(app))
      .post('/api/v1/auth/signup')
      .send({
        email: 'dup@example.com',
        password: 'long-enough-password',
        passwordConfirmation: 'long-enough-password',
      })
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
      .send({
        email: 'not-an-email',
        password: 'long-enough-password',
        passwordConfirmation: 'long-enough-password',
      })
      .expect(400)

    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: [{ field: 'email' }],
    })
  })

  it('signs in with the right password and refuses a wrong one or an unknown email alike', async () => {
    const session = await signup(app, 'login@example.com', 'Login User')

    const again = await login(app, 'login@example.com')

    expect(again.user.id).toBe(session.user.id)

    const wrongPassword = await request(httpServer(app))
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'wrong-password' })
      .expect(401)

    const unknownEmail = await request(httpServer(app))
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'wrong-password' })
      .expect(401)

    expect(wrongPassword.body).toEqual(unknownEmail.body)
    expect(wrongPassword.body).toMatchObject({ message: 'Invalid credentials' })
  })

  it('refuses login for a user that has no password hash', async () => {
    const prisma = app.get(PrismaService)

    await prisma.user.create({ data: { email: 'legacy@example.com' } })

    await request(httpServer(app))
      .post('/api/v1/auth/login')
      .send({ email: 'legacy@example.com', password: 'long-enough-password' })
      .expect(401)
  })

  it('rotates the refresh token; a spent token is 401 and revokes the family', async () => {
    const session = await signup(app, 'rotate@example.com')

    const rotated = await refresh(app, session.refreshToken)

    expect(rotated.refreshToken).not.toBe(session.refreshToken)
    expect(rotated.expiresIn).toBeGreaterThan(0)

    await request(httpServer(app))
      .get(PROFILE)
      .set('Authorization', `Bearer ${rotated.accessToken}`)
      .expect(200)

    // Reuse of a spent token: 401, and the whole family dies with it.
    await request(httpServer(app))
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: session.refreshToken })
      .expect(401)

    await request(httpServer(app))
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: rotated.refreshToken })
      .expect(401)
  })

  it('two concurrent refreshes of one token: exactly one wins, and the family dies', async () => {
    const session = await signup(app, 'race@example.com')

    const responses = await Promise.all([
      request(httpServer(app))
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: session.refreshToken }),
      request(httpServer(app))
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: session.refreshToken }),
    ])

    const statuses = responses.map((response) => response.status).sort()

    expect(statuses).toEqual([200, 401])

    const winner = responses.find((response) => response.status === 200)?.body as {
      refreshToken: string
    }

    // The loser's reuse detection revoked the family, successor included.
    await request(httpServer(app))
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: winner.refreshToken })
      .expect(401)
  })

  it('rejects an unknown refresh token with 401 and a missing one with 400', async () => {
    await request(httpServer(app))
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'not-a-real-token' })
      .expect(401)

    await request(httpServer(app)).post('/api/v1/auth/refresh').send({}).expect(400)
  })

  it('logout revokes the family and answers 204 for unknown tokens', async () => {
    const session = await signup(app, 'logout@example.com')

    await request(httpServer(app))
      .post('/api/v1/auth/logout')
      .send({ refreshToken: session.refreshToken })
      .expect(204)

    await request(httpServer(app))
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: session.refreshToken })
      .expect(401)

    await request(httpServer(app))
      .post('/api/v1/auth/logout')
      .send({ refreshToken: session.refreshToken })
      .expect(204)
  })

  it('reads the profile from the bearer token and refuses missing, stale or x-user-id identity', async () => {
    const session = await signup(app, 'profile@example.com')

    const profile = await request(httpServer(app)).get(PROFILE).set(bearer(session)).expect(200)

    expect((profile.body as { id: number }).id).toBe(session.user.id)

    const missing = await request(httpServer(app)).get(PROFILE).expect(401)

    expect(missing.body).toMatchObject({ statusCode: 401, errorCode: 'missing_credentials' })

    await request(httpServer(app)).get(PROFILE).set('Authorization', 'Bearer not.a.jwt').expect(401)

    // The old header must no longer identify anyone.
    await request(httpServer(app))
      .get(PROFILE)
      .set('x-user-id', String(session.user.id))
      .expect(401)
  })

  it('rejects a token whose user was deleted', async () => {
    const session = await signup(app, 'deleted@example.com')
    const prisma = app.get(PrismaService)

    await prisma.user.delete({ where: { id: session.user.id } })

    await request(httpServer(app)).get(PROFILE).set(bearer(session)).expect(401)
  })
})
