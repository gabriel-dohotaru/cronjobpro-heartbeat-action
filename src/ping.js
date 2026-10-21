// ==================== CE ADRESA SE APELEAZA SI CAND ====================
//
// Tinut separat de intrarile GitHub ca sa poata fi testat fara un runner.
// Contractul e cel al Healthchecks, pe care CronJobPro il implementeaza la fel:
//   <base>         rularea s-a terminat cu bine
//   <base>/start   rularea a inceput
//   <base>/fail    rularea a esuat

/** Adresa de ping, fie data intreaga, fie construita din jeton. */
export function resolveBaseUrl({ url, token, server }) {
  const trimmed = (url ?? '').trim();
  if (trimmed) return trimmed.replace(/\/+$/, '');
  const t = (token ?? '').trim();
  if (!t) return null;
  const host = ((server ?? '').trim() || 'https://api.cronjobpro.com').replace(/\/+$/, '');
  return `${host}/ping/${t}`;
}

/**
 * Ce se trimite la finalul jobului.
 *
 * `status` vine din `${{ job.status }}`, iar expresia e reevaluata cand ruleaza
 * pasul final — verificat pe un runner real: pe un job cazut, pasul principal
 * citeste 'success' si cel final 'failure'. De asta starea nu se salveaza din
 * pasul principal, ar ingheta la 'success'.
 *
 * Fara status explicit raportam reusita, dar spunem raspicat in jurnal ca
 * esecurile nu vor fi raportate. Alternativa, sa nu trimitem nimic, ar aprinde
 * o alarma falsa la fiecare rulare corecta a cuiva caruia i-a scapat o linie.
 */
export function endOfRunPing(baseUrl, status) {
  const s = (status ?? '').trim().toLowerCase();
  if (s === 'failure' || s === 'cancelled') return { url: `${baseUrl}/fail`, outcome: s };
  if (s === 'success') return { url: baseUrl, outcome: 'success' };
  return { url: baseUrl, outcome: 'unknown', warn: true };
}

/** Jetonul nu are ce cauta in jurnalul public al nimanui. */
export function redact(text) {
  return String(text).replace(/(\/ping\/)[A-Za-z0-9_-]{8,}/g, '$1***');
}
