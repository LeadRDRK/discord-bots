import { initEmitter } from "./IPCClient";
import EventEmitter from "node:events"
import { Shard } from "discord.js";

// Dumb wrapper
function send(shard: Shard, type: string, ...data: any[]) {
    shard.send!({type, data});
}

function createEmitter(process: EventEmitter) {
    let emitter = new EventEmitter();
    initEmitter(process, emitter);
    return emitter;
}

const IPCServer = { send, createEmitter }
export { IPCServer }
