// Intended to be used by the core process only.
import { Shard } from "discord.js";
import { IPCServer } from "../ipc";

interface TaskBase {
    id: string;
    userId: string;
    running?: boolean;
}

interface Task extends TaskBase {
    shard: Shard;
}

export interface TaskResult extends TaskBase {
    position: number;
}

const maxTaskCount = 1;
const maxUserTaskCount = 3;

let taskQueue: Task[] = [];
let ongoingTasks: Task[] = [];
let userTaskCounts: {[key: string]: number} = {};

function addTask(shard: Shard, id: string, userId: string) {
    if (!(userId in userTaskCounts)) userTaskCounts[userId] = 0;

    if (userTaskCounts[userId] < maxUserTaskCount) {
        taskQueue.push({shard, id, userId});
        ++userTaskCounts[userId];
    }
    else {
        IPCServer.send(shard, "rejectTask", id);
        return;
    }

    checkTasks();
}

function finishTask(shard: Shard, id: string) {
    let task: Task | undefined;
    for (let i = 0; i < ongoingTasks.length; ++i) {
        let t = ongoingTasks[i];
        if (t.id == id) {
            task = t;
            ongoingTasks.splice(i, 1);
            break;
        }
    }
    if (!task) return;

    if (--userTaskCounts[task.userId] == 0)
        delete userTaskCounts[task.userId];

    checkTasks();
}

function checkTasks() {
    if (ongoingTasks.length >= maxTaskCount) return;

    // Number of new tasks to start
    const numTasks = maxTaskCount - ongoingTasks.length;
    for (let i = 0; i < numTasks; ++i) {
        if (taskQueue.length == 0) break;
        startTask(taskQueue.shift()!);
    }
}

function startTask(task: Task) {
    task.running = true;
    ongoingTasks.push(task);
    IPCServer.send(task.shard, "startTask", task.id);
}

function queryTasks(shard: Shard, userId: string) {
    let tasks: TaskResult[] = [];
    for (let i = 0; i < ongoingTasks.length; ++i) {
        let t = ongoingTasks[i];
        if (t.userId == userId) {
            tasks.push({
                id: t.id,
                userId: t.userId,
                running: t.running,
                position: 0
            });
        }
    }

    for (let i = 0; i < taskQueue.length; ++i) {
        let t = taskQueue[i];
        if (t.userId == userId) {
            tasks.push({
                id: t.id,
                userId: t.userId,
                running: t.running,
                position: i + 1
            });
        }
    }

    IPCServer.send(shard, "taskQueryResult", userId, tasks);
}

function queryTaskStats(shard: Shard, userId: string) {
    IPCServer.send(shard, "taskStatsResult", userId, ongoingTasks.length, taskQueue.length);
}

const TaskScheduler = { addTask, finishTask, checkTasks, startTask, queryTasks, queryTaskStats };
export { TaskScheduler };