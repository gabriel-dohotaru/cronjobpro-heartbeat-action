const keys = ['PROBE_JOB_STATUS', 'STATE_seen_in_main', 'GITHUB_JOB_STATUS', 'GITHUB_JOB', 'JOB_STATUS'];
console.log('POST  ---- ce vede pasul final ----');
for (const k of keys) console.log(`POST  ${k} = ${JSON.stringify(process.env[k])}`);
console.log('POST  toate variabilele care contin STATUS:',
  JSON.stringify(Object.keys(process.env).filter((k) => /STATUS/i.test(k))));
