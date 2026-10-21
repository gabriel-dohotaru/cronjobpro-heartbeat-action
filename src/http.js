// ==================== TRIMITEREA PROPRIU-ZISA ====================
//
// Regula de capatai: aceasta actiune nu are voie sa strice workflow-ul nimanui.
// Orice esec al pingului se logheaza si se inghite. Un ajutor de monitorizare
// care pica build-ul e mai rau decat lipsa lui.

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
        log(`heartbeat trimis: ${redact(url)} (${res.status})`);
        return true;
      }
      // 404 inseamna jeton necunoscut. Reincercarea nu-l face cunoscut.
      if (res.status === 404) {
        log(`::warning::Jeton necunoscut pentru ${redact(url)} (404). Verifica adresa sau jetonul.`);
        return false;
      }
      log(`heartbeat respins cu ${res.status}, incercarea ${attempt + 1} din ${retries + 1}`);
    } catch (err) {
      log(`heartbeat nereusit (${err?.name ?? 'eroare'}), incercarea ${attempt + 1} din ${retries + 1}`);
    }
    if (attempt < retries) await sleep(1000 * 2 ** attempt);
  }
  log(`::warning::Heartbeat netrimis catre ${redact(url)}. Workflow-ul continua normal.`);
  return false;
}
