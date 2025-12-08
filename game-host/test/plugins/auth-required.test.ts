import { test } from 'node:test';
import * as assert from 'node:assert';
import Fastify from 'fastify';
import AuthPlugin from '../../src/plugins/auth.js';

test('requireAuth returns 401 when no bearer token', async () => {
  const app = Fastify();
  void app.register(AuthPlugin);
  void app.register(async (fastify) => {
    fastify.get('/protected', { preHandler: fastify.requireAuth }, async () => ({ ok: true }));
  });
  await app.ready();

  const res = await app.inject({ url: '/protected' });
  assert.equal(res.statusCode, 401);
  const payload = JSON.parse(res.payload);
  assert.match(payload.message, /Missing or invalid authentication/i);

  await app.close();
});
