import { describe, expect, it } from 'vitest'

import { parseEnv } from '@/config/env'

const VALID = { DATABASE_URL: 'postgresql://meal_planner:secret@localhost:5433/meal_planner' }

describe('env schema', () => {
  it('applies the defaults', () => {
    const env = parseEnv(VALID)

    expect(env).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3333,
      HOST: 'localhost',
      LOG_LEVEL: 'info',
      THROTTLE_TTL_MS: 60_000,
      THROTTLE_LIMIT: 100,
      POSTHOG_HOST: 'https://eu.i.posthog.com',
    })
  })

  it('coerces numeric strings and keeps the database url', () => {
    const env = parseEnv({ ...VALID, PORT: '4000', NODE_ENV: 'production' })

    expect(env.PORT).toBe(4000)
    expect(env.NODE_ENV).toBe('production')
    expect(env.DATABASE_URL).toBe(VALID.DATABASE_URL)
  })

  it('fails fast on a missing database url', () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/)
  })

  it('fails fast on an unknown node env', () => {
    expect(() => parseEnv({ ...VALID, NODE_ENV: 'staging' })).toThrow(/NODE_ENV/)
  })

  it('leaves optional integrations unset', () => {
    const env = parseEnv(VALID)

    expect(env.POSTHOG_KEY).toBeUndefined()
    expect(env.SENTRY_DSN).toBeUndefined()
    expect(env.CORS_ORIGIN).toBeUndefined()
  })
})
