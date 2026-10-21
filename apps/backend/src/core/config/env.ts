import { config as loadDotenv } from 'dotenv'
import type { Duration } from '@nestjs/authentication'
import { z } from 'zod'

const nodeEnv = process.env['NODE_ENV'] ?? 'development'

// `.env.test` wins for tests; dotenv never overwrites an already-set process.env value.
loadDotenv({ path: [`.env.${nodeEnv}`, '.env'], quiet: true })

/** A `Duration` string (`15m`, `1h`, `30d`). */
const duration = () =>
  z
    .string()
    .regex(/^\d+(ms|s|m|h|d|w)$/, 'Expected a duration such as 15m, 1h, 30d')
    .transform((value) => value as Duration)

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  HOST: z.string().default('localhost'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  DATABASE_URL: z.string().min(1),

  /** HS256 secret for access tokens: 32+ bytes. `openssl rand -hex 32`; boot fails without it. */
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: duration().default('15m'),
  REFRESH_EXPIRES_IN: duration().default('30d'),

  /** Comma separated allowlist. Empty reflects any origin, which is the dev default. */
  CORS_ORIGIN: z.string().optional(),
  THROTTLE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),

  POSTHOG_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().default('https://eu.i.posthog.com'),

  SENTRY_DSN: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

export function parseEnv(raw: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(raw)

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')

    throw new Error(`Invalid environment configuration:\n${details}`)
  }

  return result.data
}

export const env = parseEnv(process.env)

export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'

/** CORS origins for the deploy environment; `true` reflects the request origin (dev). */
export function corsOrigins(): true | string[] {
  const configured = (env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (configured.length > 0) {
    return configured
  }

  return isProduction ? [] : true
}
