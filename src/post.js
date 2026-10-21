// Pasul final: ruleaza intotdeauna, inclusiv cand jobul a cazut, si raporteaza
// rezultatul REAL. `status` se reevalueaza aici, nu e cel din pasul principal.
import { resolveBaseUrl, endOfRunPing } from './ping.js';
import { ping } from './http.js';

const input = (name) => process.env[`INPUT_${name.toUpperCase().replace(/ /g, '_')}`] ?? '';

const base = resolveBaseUrl({ url: input('url'), token: input('token'), server: input('server') });
if (base) {
  const { url, outcome, warn } = endOfRunPing(base, input('status'));
  if (warn) {
    console.log('::warning::Nu am primit `status: ${{ job.status }}`, asa ca raportez reusita. Esecurile NU vor fi raportate pana nu adaugi linia aceea.');
  }
  console.log(`Rularea s-a incheiat cu: ${outcome}`);
  await ping(url, { timeoutMs: Number(input('timeout-ms') || 10_000), retries: Number(input('retries') || 2) });
}
