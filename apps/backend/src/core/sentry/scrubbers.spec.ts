import type { Breadcrumb, ErrorEvent } from '@sentry/core'
import { describe, expect, it } from 'vitest'

import {
  isClientException,
  scrubBreadcrumb,
  scrubEvent,
  sentryEnabled,
} from '@/core/sentry/scrubbers'

describe('sentry scrubbers', () => {
  it('is disabled without a DSN, and never enabled in the test env', () => {
    expect(sentryEnabled(undefined, 'production')).toBe(false)
    expect(sentryEnabled('', 'production')).toBe(false)
    expect(sentryEnabled('https://key@sentry.example/1', 'test')).toBe(false)
    expect(sentryEnabled('https://key@sentry.example/1', 'production')).toBe(true)
  })

  it('drops headers, body and extras, keeping only the user id', () => {
    const event: ErrorEvent = {
      type: undefined,
      message: 'boom',
      request: {
        headers: { authorization: 'Bearer secret' },
        data: { meal: 'overnight oats' },
      },
      extra: { password: 'hunter2' },
      user: { id: 'user-1', email: 'a@b.c', username: 'ada', ip_address: '1.2.3.4' },
    }

    const scrubbed = scrubEvent(event)

    expect(scrubbed).not.toHaveProperty('request')
    expect(scrubbed).not.toHaveProperty('extra')
    expect(scrubbed.user).toEqual({ id: 'user-1' })
    expect(scrubbed.message).toBe('boom')
  })

  it('drops SQL and console breadcrumbs, keeps http', () => {
    expect(scrubBreadcrumb({ category: 'query', data: { 'db.statement': 'select 1' } })).toBeNull()
    expect(scrubBreadcrumb({ category: 'console', message: 'user ate 3 pancakes' })).toBeNull()

    const http = { category: 'http', data: { url: '/api/v1/meals' } } as Breadcrumb
    expect(scrubBreadcrumb(http)).toBe(http)
  })

  it('treats 4xx as a client problem and 5xx as a bug', () => {
    expect(isClientException({ status: 404 })).toBe(true)
    expect(isClientException({ getStatus: () => 422 })).toBe(true)
    expect(isClientException({ status: 500 })).toBe(false)
    expect(isClientException(new Error('plain'))).toBe(false)
    expect(isClientException(null)).toBe(false)
  })
})
