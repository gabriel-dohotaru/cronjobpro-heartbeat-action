import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveBaseUrl, endOfRunPing, redact } from '../src/ping.js';

test('a full URL is used as given', () => {
  assert.equal(resolveBaseUrl({ url: 'https://hc-ping.com/abc' }), 'https://hc-ping.com/abc');
});

test('a trailing slash does not produce a double slash', () => {
  assert.equal(endOfRunPing(resolveBaseUrl({ url: 'https://hc-ping.com/abc/' }), 'failure').url, 'https://hc-ping.com/abc/fail');
});

test('a bare token builds the CronJobPro URL', () => {
  assert.equal(resolveBaseUrl({ token: 'tok123' }), 'https://api.cronjobpro.com/ping/tok123');
});

test('another server can be named', () => {
  assert.equal(resolveBaseUrl({ token: 'tok123', server: 'https://hc-ping.com/' }), 'https://hc-ping.com/ping/tok123');
});

test('the URL wins over the token', () => {
  assert.equal(resolveBaseUrl({ url: 'https://a/b', token: 'tok' }), 'https://a/b');
});

test('with neither URL nor token there is nowhere to send', () => {
  assert.equal(resolveBaseUrl({}), null);
  assert.equal(resolveBaseUrl({ url: '   ', token: '  ' }), null);
});

test('success pings the base URL', () => {
  assert.deepEqual(endOfRunPing('https://x/p', 'success'), { url: 'https://x/p', outcome: 'success' });
});

test('failure and cancellation both ping /fail', () => {
  assert.equal(endOfRunPing('https://x/p', 'failure').url, 'https://x/p/fail');
  assert.equal(endOfRunPing('https://x/p', 'cancelled').url, 'https://x/p/fail');
});

test('status is understood whatever its case or padding', () => {
  assert.equal(endOfRunPing('https://x/p', '  Failure ').url, 'https://x/p/fail');
});

// If someone forgets the job-status line, a correct run must not raise a false
// alarm. We report success, with a warning they cannot miss.
test('with no status we report success, but we warn', () => {
  const r = endOfRunPing('https://x/p', '');
  assert.equal(r.url, 'https://x/p');
  assert.equal(r.warn, true);
});

test('the token never reaches the log', () => {
  assert.equal(redact('ping https://api.cronjobpro.com/ping/SECRET_TOKEN_123/fail'),
    'ping https://api.cronjobpro.com/ping/***/fail');
});
