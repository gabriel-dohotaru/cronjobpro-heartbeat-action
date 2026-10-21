const fs = require('fs');
// Save a value from the main step, to see whether it survives into post.
fs.appendFileSync(process.env.GITHUB_STATE, 'seen_in_main=' + (process.env.PROBE_JOB_STATUS ?? 'undefined') + '\n');
console.log('MAIN  PROBE_JOB_STATUS =', JSON.stringify(process.env.PROBE_JOB_STATUS));
