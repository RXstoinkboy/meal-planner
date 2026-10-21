import { type INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import type { App } from 'supertest/types'

import { AppModule } from '@/app.module'
import { configureApp } from '@/core/config/app.setup'

/** Nest types `getHttpServer()` as `any`; supertest wants its own `App`. */
export function httpServer(app: INestApplication): App {
  return app.getHttpServer() as App
}

/** Same wiring as main.ts (minus docs and logging) so URLs match production. */
export function createApp(): Promise<INestApplication> {
  return Test.createTestingModule({ imports: [AppModule] })
    .compile()
    .then(async (moduleRef) => {
      const app = moduleRef.createNestApplication()
      configureApp(app, { withDocs: false })

      return app.init()
    })
}

type UserBody = { id: number; email: string; fullName: string | null; initials: string }

export type SessionBody = {
  accessToken: string
  refreshToken: string
  user: UserBody
}

/** Long enough for the signup policy; sign-in has no length rule. */
export const TEST_PASSWORD = 'correct-horse-battery'

export async function signup(
  app: INestApplication,
  email: string,
  fullName?: string
): Promise<SessionBody> {
  const response = await request(httpServer(app))
    .post('/api/v1/auth/signup')
    .send({
      email,
      fullName: fullName ?? 'Test User',
      password: TEST_PASSWORD,
      passwordConfirmation: TEST_PASSWORD,
    })
    .expect(201)

  return response.body as SessionBody
}

export async function login(app: INestApplication, email: string): Promise<SessionBody> {
  const response = await request(httpServer(app))
    .post('/api/v1/auth/login')
    .send({ email, password: TEST_PASSWORD })
    .expect(200)

  return response.body as SessionBody
}

/** `set()` argument for a session: `.set(bearer(session))`. */
export function bearer(session: SessionBody) {
  return { Authorization: `Bearer ${session.accessToken}` }
}
