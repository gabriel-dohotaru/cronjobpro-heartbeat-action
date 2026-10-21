import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveBaseUrl, endOfRunPing, redact } from '../src/ping.js';

test('o adresa intreaga e folosita ca atare', () => {
  assert.equal(resolveBaseUrl({ url: 'https://hc-ping.com/abc' }), 'https://hc-ping.com/abc');
});

test('bara de la final nu produce o adresa cu doua bare', () => {
  assert.equal(endOfRunPing(resolveBaseUrl({ url: 'https://hc-ping.com/abc/' }), 'failure').url, 'https://hc-ping.com/abc/fail');
});

test('un jeton singur construieste adresa CronJobPro', () => {
  assert.equal(resolveBaseUrl({ token: 'tok123' }), 'https://api.cronjobpro.com/ping/tok123');
});

test('alt server poate fi indicat', () => {
  assert.equal(resolveBaseUrl({ token: 'tok123', server: 'https://hc-ping.com/' }), 'https://hc-ping.com/ping/tok123');
});

test('adresa are intaietate fata de jeton', () => {
  assert.equal(resolveBaseUrl({ url: 'https://a/b', token: 'tok' }), 'https://a/b');
});

test('fara adresa si fara jeton nu se poate trimite nimic', () => {
  assert.equal(resolveBaseUrl({}), null);
  assert.equal(resolveBaseUrl({ url: '   ', token: '  ' }), null);
});

test('reusita trimite la adresa de baza', () => {
  assert.deepEqual(endOfRunPing('https://x/p', 'success'), { url: 'https://x/p', outcome: 'success' });
});

test('esecul si anularea trimit la /fail', () => {
  assert.equal(endOfRunPing('https://x/p', 'failure').url, 'https://x/p/fail');
  assert.equal(endOfRunPing('https://x/p', 'cancelled').url, 'https://x/p/fail');
});

test('starea vine cu majuscule sau cu spatii si tot e inteleasa', () => {
  assert.equal(endOfRunPing('https://x/p', '  Failure ').url, 'https://x/p/fail');
});

// Daca cineva uita linia cu job.status, o rulare corecta nu trebuie sa dea
// alarma falsa. Raportam reusita, dar cu avertisment vizibil.
test('fara status raportam reusita, dar avertizam', () => {
  const r = endOfRunPing('https://x/p', '');
  assert.equal(r.url, 'https://x/p');
  assert.equal(r.warn, true);
});

test('jetonul nu ajunge in jurnal', () => {
  assert.equal(redact('ping https://api.cronjobpro.com/ping/SECRET_TOKEN_123/fail'),
    'ping https://api.cronjobpro.com/ping/***/fail');
});
