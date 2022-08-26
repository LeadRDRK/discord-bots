import { Shard, ShardingManager } from "discord.js";
import { EnvOptions, TaskScheduler, TaskManager } from "./core";
import { IPCServer } from "./ipc";
import nodeCleanup from "node-cleanup";
import Bot from "./Bot";
import http from "node:http";

const herokuOrigin = "http://example.com";

const eventHandlers: [type: string, handler: (shard: Shard, ...args: any[]) => void][] = [
    ["ping", (shard: Shard) => {
        IPCServer.send(shard, "pong");
    }],
    ["addTask", TaskScheduler.addTask],
    ["finishTask", TaskScheduler.finishTask],
    ["queryTasks", TaskScheduler.queryTasks],
    ["queryTaskStats", TaskScheduler.queryTaskStats]
]

const manager = new ShardingManager("./dist/main.js", {
    token: (EnvOptions.isEnabled("TEST") && Bot.testToken.length > 0) ? Bot.testToken : Bot.token,
    totalShards: "auto"

});
manager.on('shardCreate', shard => {
    console.log(`-- Shard ${shard.id} created`);

    let emitter = IPCServer.createEmitter(shard);

    for (const [type, handler] of eventHandlers) {
        emitter.on(type, (...args: any[]) => handler(shard, ...args));
    }
});

function httpListener(req: http.IncomingMessage, res: http.ServerResponse) {
    res.end("Hello world!");
}

function init() {
    console.log(`-- Core process for ${Bot.name} ${Bot.version}`);

    // Heroku stuff
    http.createServer(httpListener).listen(process.env.PORT || 8080);
    if (!EnvOptions.isEnabled("TEST")) {
        setInterval(() => {
            http.get(herokuOrigin)
                .on("error", () => {});
        }, 300000);
    }

    TaskManager.initRootWorkDir();
    manager.spawn();
}

let shuttingDown = false;
nodeCleanup(() => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log("-- Cleanup");
    TaskManager.cleanup();
});

init();