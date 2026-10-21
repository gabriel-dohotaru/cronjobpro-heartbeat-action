// ==================== WHICH URL, AND WHEN ====================
//
// Kept apart from the GitHub plumbing so it can be tested without a runner.
// The contract is the one Healthchecks established and CronJobPro implements:
//   <base>         the run finished, and finished well
//   <base>/start   the run began
//   <base>/fail    the run finished badly

/** The ping URL, either given whole or built from a token. */
export function resolveBaseUrl({ url, token, server }) {
  const trimmed = (url ?? '').trim();
  if (trimmed) return trimmed.replace(/\/+$/, '');
  const t = (token ?? '').trim();
  if (!t) return null;
  const host = ((server ?? '').trim() || 'https://api.cronjobpro.com').replace(/\/+$/, '');
  return `${host}/ping/${t}`;
}

/**
 * What to send when the job is over.
 *
 * `status` comes from the job-status expression in the workflow, and GitHub
 * re-evaluates it when the post step runs. Verified on a real runner: in a
 * failing job the main step reads 'success' and the post step reads 'failure'
 * from the same input. That is why nothing is carried over from the main step,
 * where it would be frozen at 'success'.
 *
 * With no status at all we report success and say loudly that failures will go
 * unreported. The alternative, sending nothing, would raise a false alarm on
 * every correct run of anyone who missed one line.
 */
export function endOfRunPing(baseUrl, status) {
  const s = (status ?? '').trim().toLowerCase();
  if (s === 'failure' || s === 'cancelled') return { url: `${baseUrl}/fail`, outcome: s };
  if (s === 'success') return { url: baseUrl, outcome: 'success' };
  return { url: baseUrl, outcome: 'unknown', warn: true };
}

/** Nobody's token belongs in a public build log. */
export function redact(text) {
  return String(text).replace(/(\/ping\/)[A-Za-z0-9_-]{8,}/g, '$1***');
}
