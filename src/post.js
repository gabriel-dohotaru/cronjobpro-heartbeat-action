// The post step: runs whatever happened, including a job that failed, and
// reports the REAL outcome. `status` is re-evaluated here; it is not the value
// the main step saw.
import { resolveBaseUrl, endOfRunPing } from './ping.js';
import { ping } from './http.js';

const input = (name) => process.env[`INPUT_${name.toUpperCase().replace(/ /g, '_')}`] ?? '';

const base = resolveBaseUrl({ url: input('url'), token: input('token'), server: input('server') });
if (base) {
  const { url, outcome, warn } = endOfRunPing(base, input('status'));
  if (warn) {
    console.log('::warning::No job status was passed, so this run is reported as a success. Failures will NOT be reported until you pass the job status input. See the README.');
  }
  console.log(`Run finished: ${outcome}`);
  await ping(url, { timeoutMs: Number(input('timeout-ms') || 10_000), retries: Number(input('retries') || 2) });
}
