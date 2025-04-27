const { exec } = require('child_process');
const os = require('os');

const isWindows = os.platform() === 'win32';

const killCommand = isWindows
  ? 'taskkill /F /IM node.exe'
  : 'pkill -f node';

exec(killCommand, (error, stdout, stderr) => {
  if (error) {
    console.log('No running Node.js processes found or error occurred:', error.message);
  } else {
    console.log('Successfully terminated all Node.js processes');
    if (stdout) console.log(stdout);
    if (stderr) console.log(stderr);
  }
}); 