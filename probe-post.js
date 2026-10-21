const keys = ['PROBE_JOB_STATUS', 'INPUT_STATUS', 'STATE_seen_in_main'];
console.log('POST  ---- ce vede pasul final ----');
for (const k of keys) console.log(`POST  ${k} = ${JSON.stringify(process.env[k])}`);
