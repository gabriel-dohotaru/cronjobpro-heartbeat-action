// Proba pe bune: pornim un server care noteaza ce primeste, rulam pasii
// actiunii ca procese separate exact cum ii ruleaza GitHub, si verificam ce a
// ajuns la celalalt capat.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const step = (f) => path.join(here, '..', 'src', f);

async function withRecorder(fn) {
  const hits = [];
  const server = http.createServer((req, res) => { hits.push(`${req.method} ${req.url}`); res.writeHead(200).end('{"status":"ok"}'); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/ping/tok`;
  try { await fn(base, hits); } finally { server.close(); }
}

const env = (base, extra) => ({ ...process.env, INPUT_URL: base, INPUT_RETRIES: '0', INPUT_TIMEOUT_MS: '3000', ...extra });

test('pasul principal anunta pornirea', async () => {
  await withRecorder(async (base, hits) => {
    await run(process.execPath, [step('main.js')], { env: env(base) });
    assert.deepEqual(hits, ['POST /ping/tok/start']);
  });
});

test('pornirea poate fi oprita', async () => {
  await withRecorder(async (base, hits) => {
    await run(process.execPath, [step('main.js')], { env: env(base, { 'INPUT_PING-START': 'false' }) });
    assert.deepEqual(hits, []);
  });
});

test('un job reusit raporteaza la adresa de baza', async () => {
  await withRecorder(async (base, hits) => {
    await run(process.execPath, [step('post.js')], { env: env(base, { INPUT_STATUS: 'success' }) });
    assert.deepEqual(hits, ['POST /ping/tok']);
  });
});

test('un job cazut raporteaza la /fail', async () => {
  await withRecorder(async (base, hits) => {
    await run(process.execPath, [step('post.js')], { env: env(base, { INPUT_STATUS: 'failure' }) });
    assert.deepEqual(hits, ['POST /ping/tok/fail']);
  });
});

test('un job anulat raporteaza tot la /fail', async () => {
  await withRecorder(async (base, hits) => {
    await run(process.execPath, [step('post.js')], { env: env(base, { INPUT_STATUS: 'cancelled' }) });
    assert.deepEqual(hits, ['POST /ping/tok/fail']);
  });
});

test('un server mort nu pica pasul', async () => {
  const { stdout } = await run(process.execPath, [step('post.js')],
    { env: { ...process.env, INPUT_URL: 'http://127.0.0.1:1/ping/tok', INPUT_STATUS: 'success', INPUT_RETRIES: '0', INPUT_TIMEOUT_MS: '1000' } });
  assert.match(stdout, /Heartbeat netrimis/);
});

test('fara adresa si fara jeton, pasul principal se opreste cu eroare', async () => {
  await assert.rejects(() => run(process.execPath, [step('main.js')], { env: { ...process.env, INPUT_URL: '', INPUT_TOKEN: '' } }));
});

test('jetonul nu apare in ce se scrie in jurnal', async () => {
  await withRecorder(async (base) => {
    const url = base.replace('/ping/tok', '/ping/JETON_FOARTE_SECRET_123');
    const { stdout } = await run(process.execPath, [step('post.js')], { env: env(url, { INPUT_STATUS: 'success' }) });
    assert.doesNotMatch(stdout, /JETON_FOARTE_SECRET_123/);
    assert.match(stdout, /\/ping\/\*\*\*/);
  });
});
