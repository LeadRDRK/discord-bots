import { rmSync, promises as fs, constants as fsConstants } from "node:fs";
import { v4 as uuid } from "uuid";
import { IPCClient } from "../ipc";

const workDirPath = process.cwd() + "/workdir";

function cleanup() {
    try {
        rmSync(workDirPath, {recursive: true, force: true});
    }
    catch {
    }
}

async function initRootWorkDir() {
    try {
        await fs.access(workDirPath, fsConstants.F_OK);
    } catch {
        await fs.mkdir(workDirPath);
    }
}

async function createWorkDir(taskId?: string): Promise<WorkDir> {
    let path = workDirPath + "/" + (taskId ? taskId : uuid());
    await fs.mkdir(path);

    return new WorkDir(path);
}

export class WorkDir {
    readonly path: string;

    constructor(_path: string) {
        this.path = _path;
    }

    async release() {
        await fs.rm(this.path, {recursive: true, force: true});
    }
}

type TaskCallback = (rejected?: boolean) => Promise<void>;
const queuedTasks: {[key: string]: TaskCallback}= {};

function generateTaskId() {
    return uuid();
}

async function createTask(taskId: string, userId: string, callback: TaskCallback): Promise<void> {
    queuedTasks[taskId] = callback;
    IPCClient.send("addTask", taskId, userId);
}

IPCClient.on("startTask", async id => {
    if (id in queuedTasks) {
        let callback = queuedTasks[id];
        await callback();
        IPCClient.send("finishTask", id);
        delete queuedTasks[id];
    }
});

IPCClient.on("rejectTask", id => {
    if (id in queuedTasks) {
        let callback = queuedTasks[id];
        callback(true);
        delete queuedTasks[id];
    }
});

const TaskManager = {
    cleanup,
    initRootWorkDir,
    createWorkDir,
    generateTaskId,
    createTask
};
export { TaskManager };