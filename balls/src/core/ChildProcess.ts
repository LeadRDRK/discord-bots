import { exec as _exec, execFile as _execFile, ChildProcess } from "node:child_process"
import pidusage from "pidusage"

let pidList: Set<number> = new Set;
const memoryLimit = 629145600;
const timeLimit = 20000; // juust a bit higher than the usual limit

async function checkProcesses() {
    for (const pid of pidList) {
        try {
            let usage = await pidusage(pid);
            if (usage.memory > memoryLimit || usage.elapsed > timeLimit) {
                process.kill(pid, "SIGKILL");
                console.log("[Watcher] Killed " + pid);
            }
        }
        catch {
        }
    }
}
setInterval(checkProcesses, 1000);

const wrap = <T extends Array<any>>(fn: (...args: T) => ChildProcess) => {
    return (...args: T): ChildProcess => {
        let process = fn(...args);
        if (process.pid) {
            let pid = process.pid;
            pidList.add(pid);
            process.once("exit", () => pidList.delete(pid));
        }
        return process;
    };
}

const exec = wrap(_exec);
const execFile = wrap(_execFile);
// NOTE: When using execFile, // @ts-ignore is needed when accessing stdout or stderr.
// TypeScript couldn't figure out if it's a string or a Buffer.
export { exec, execFile, ChildProcess }