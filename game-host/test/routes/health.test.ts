import { test } from 'node:test'
import * as assert from 'node:assert'
import { build } from '../helper.js'

test('healthcheck returns ok', async (t) => {
  const app = await build(t)

  const res = await app.inject({
    url: '/health'
  })

  assert.equal(res.statusCode, 200)
  const payload = JSON.parse(res.payload)
  assert.equal(payload.status, 'ok')
})