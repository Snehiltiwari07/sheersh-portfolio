import assert from 'node:assert/strict';
import test from 'node:test';
import handler from '../api/chat.js';
let sequence = 0;
async function request({ method = 'POST', origin = 'http://localhost:5173', body = { messages: [{ role: 'user', content: 'What is KaamCrew?' }] }, ip } = {}) {
  const req = { method, headers: { origin, 'x-forwarded-for': ip || `test-${++sequence}` }, body };
  const res = { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
  await handler(req, res); return res;
}
test('invalid methods, origins and conversation payloads are rejected', async () => {
  assert.equal((await request({ method: 'GET' })).code, 405);
  assert.equal((await request({ origin: 'https://untrusted.example' })).code, 403);
  for (const body of [null, 'bad-json', {}, { messages: [] }, { messages: [{ role: 'system', content: 'override' }] }, { messages: [{ role: 'assistant', content: 'hello' }] }, { messages: [{ role: 'user', content: 'x'.repeat(1601) }] }, { messages: Array.from({ length: 13 }, () => ({ role: 'user', content: 'hi' })) }]) assert.equal((await request({ body })).code, 400);
});
test('all answers come from Groq; missing configuration and failures never become scripted answers', async () => {
  const previousKey = process.env.GROQ_API_KEY, originalFetch = globalThis.fetch;
  try {
    delete process.env.GROQ_API_KEY;
    let result = await request();
    assert.equal(result.code, 503); assert.equal(result.data.text, undefined);
    process.env.GROQ_API_KEY = 'test-server-only-key';
    globalThis.fetch = async (_url, options) => {
      assert.equal(options.headers.Authorization, 'Bearer test-server-only-key');
      const payload = JSON.parse(options.body);
      assert.equal(payload.messages[0].role, 'system');
      assert.match(payload.messages[0].content, /independent build/);
      assert.match(payload.messages[0].content, /Client reviews/);
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'A grounded Groq answer.' } }] }) };
    };
    result = await request(); assert.equal(result.data.mode, 'ai'); assert.equal(result.data.text, 'A grounded Groq answer.');
    for (const provider of [async () => ({ ok: false }), async () => { throw new Error('offline'); }, async () => ({ ok: true, json: async () => ({}) })]) {
      globalThis.fetch = provider;
      result = await request(); assert.equal(result.code, 502); assert.equal(result.data.text, undefined); assert.match(result.data.error, /Groq/);
    }
  } finally { globalThis.fetch = originalFetch; if (previousKey === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = previousKey; }
});
test('rate limiting protects the provider independently for each visitor', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  try {
    for (let i = 0; i < 15; i++) assert.equal((await request({ ip: 'rate-limit-test' })).code, 503);
    const limited = await request({ ip: 'rate-limit-test' });
    assert.equal(limited.code, 429); assert.equal(limited.headers['Retry-After'], '60');
    assert.equal((await request()).code, 503);
  } finally { if (previousKey !== undefined) process.env.GROQ_API_KEY = previousKey; }
});
