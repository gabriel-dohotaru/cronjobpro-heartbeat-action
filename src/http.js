// ==================== SENDING IT ====================
//
// The rule this file exists to keep: this action must never break anyone's
// workflow. Every ping failure is logged and swallowed. A monitoring helper
// that fails your build is worse than no monitoring helper.

import { redact } from './ping.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function ping(url, { timeoutMs = 10_000, retries = 2, log = console.log } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        signal: AbortSignal.timeout(timeoutMs),
        headers: { 'user-agent': 'cronjobpro-heartbeat-action' },
      });
      if (res.ok) {
        log(`Heartbeat sent: ${redact(url)} (${res.status})`);
        return true;
      }
      // 404 means the token is unknown. Retrying will not make it known.
      if (res.status === 404) {
        log(`::warning::Unknown token for ${redact(url)} (404). Check the URL or the token.`);
        return false;
      }
      log(`Heartbeat rejected with ${res.status}, attempt ${attempt + 1} of ${retries + 1}`);
    } catch (err) {
      log(`Heartbeat failed (${err?.name ?? 'error'}), attempt ${attempt + 1} of ${retries + 1}`);
    }
    if (attempt < retries) await sleep(1000 * 2 ** attempt);
  }
  log(`::warning::Heartbeat not delivered to ${redact(url)}. The workflow carries on regardless.`);
  return false;
}
