const ps = require('ps-node');
const pidusage = require('pidusage');
const memLimit = 268435456;

function checkProcesses(err, list) {
    if (err) return;
    list.forEach(process => {
        if (process) {
            pidusage(process.pid, (err, stats) => {
                if (err) return;
                if (stats.memory > memLimit || stats.elapsed > 15000) {
                    ps.kill(process.pid, "SIGKILL", 
                    () => console.log("[PSWATCH] Killed " + process.pid));
                }
            });
        };
    });
}

function psWatch() {
    ps.lookup({command: 'ffmpeg'}, checkProcesses);
    ps.lookup({command: 'lua'}, checkProcesses);
}

module.exports = psWatch;
