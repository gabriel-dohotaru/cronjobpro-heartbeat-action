const fs = require('fs');
fs.appendFileSync(process.env.GITHUB_STATE, 'seen_in_main=' + (process.env.INPUT_STATUS ?? 'undefined') + '\n');
console.log('MAIN  INPUT_STATUS =', JSON.stringify(process.env.INPUT_STATUS));
