// Pasul principal: anunta ca rularea a inceput.
import { resolveBaseUrl } from './ping.js';
import { ping } from './http.js';

const input = (name) => process.env[`INPUT_${name.toUpperCase().replace(/ /g, '_')}`] ?? '';
const bool = (name, fallback) => { const v = input(name).trim().toLowerCase(); return v ? v === 'true' : fallback; };

const base = resolveBaseUrl({ url: input('url'), token: input('token'), server: input('server') });
if (!base) {
  console.log('::error::Lipseste `url` sau `token`. Fara una dintre ele nu am unde trimite semnalul.');
  process.exit(1);   // singurul caz in care oprim: configurare gresita, vizibila imediat
}
if (bool('ping-start', true)) {
  await ping(`${base}/start`, { timeoutMs: Number(input('timeout-ms') || 10_000), retries: Number(input('retries') || 2) });
} else {
  console.log('Semnalul de pornire e dezactivat; raportez doar la final.');
}
