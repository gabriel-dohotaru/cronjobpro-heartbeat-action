// The main step: say that the run has begun.
import { resolveBaseUrl } from './ping.js';
import { ping } from './http.js';

const input = (name) => process.env[`INPUT_${name.toUpperCase().replace(/ /g, '_')}`] ?? '';
const bool = (name, fallback) => { const v = input(name).trim().toLowerCase(); return v ? v === 'true' : fallback; };

const base = resolveBaseUrl({ url: input('url'), token: input('token'), server: input('server') });
if (!base) {
  console.log('::error::Neither `url` nor `token` was given, so there is nowhere to send the heartbeat.');
  process.exit(1);   // the one thing worth stopping for: a misconfiguration, visible at once
}
if (bool('ping-start', true)) {
  await ping(`${base}/start`, { timeoutMs: Number(input('timeout-ms') || 10_000), retries: Number(input('retries') || 2) });
} else {
  console.log('Start signal disabled; reporting only at the end of the job.');
}
