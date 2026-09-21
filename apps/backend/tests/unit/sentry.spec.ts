import { test } from '@japa/runner'
import type { Breadcrumb, ErrorEvent } from '@sentry/node'

import { scrubBreadcrumb, scrubEvent, sentryEnabled } from '#config/sentry'

test.group('Sentry config', () => {
  test('is disabled without a DSN, and never enabled in the test env', ({ assert }) => {
    assert.isFalse(sentryEnabled(undefined, 'production'))
    assert.isFalse(sentryEnabled('', 'production'))
    assert.isFalse(sentryEnabled('https://key@sentry.example/1', 'test'))
    assert.isTrue(sentryEnabled('https://key@sentry.example/1', 'production'))
  })

  test('scrubEvent drops headers, body and extras, keeping only the user id', ({ assert }) => {
    const event: ErrorEvent = {
      type: undefined,
      message: 'boom',
      request: {
        headers: { Authorization: 'Bearer secret' },
        data: { meal: 'overnight oats' },
      },
      extra: { password: 'hunter2' },
      user: { id: 'user-1', email: 'a@b.c', username: 'ada', ip_address: '1.2.3.4' },
    }

    const scrubbed = scrubEvent(event)

    assert.notProperty(scrubbed, 'request')
    assert.notProperty(scrubbed, 'extra')
    assert.deepEqual(scrubbed.user, { id: 'user-1' })
    assert.equal(scrubbed.message, 'boom')
  })

  test('scrubBreadcrumb drops SQL and console output, keeps http', ({ assert }) => {
    assert.isNull(scrubBreadcrumb({ category: 'query', data: { 'db.statement': 'select 1' } }))
    assert.isNull(scrubBreadcrumb({ category: 'console', message: 'user ate 3 pancakes' }))

    const http = { category: 'http', data: { url: '/api/v1/meals' } } as Breadcrumb
    assert.equal(scrubBreadcrumb(http), http)
  })
})
