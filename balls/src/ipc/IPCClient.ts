import EventEmitter from "node:events"
import { isIPCMessage } from "./IPCMessage"

class IPCClient_t extends EventEmitter {
    send(type: string, ...data: any[]) {
        process.send!({type, data});
    }
}

const IPCClient = new IPCClient_t();

function initEmitter(process: EventEmitter, ee: EventEmitter) {
    process.on("message", msg => {
        if (msg && typeof msg == "object" && isIPCMessage(msg)) {
            if (Array.isArray(msg.data))
                ee.emit(msg.type, ...msg.data);
            else if (typeof msg.data != "undefined")
                ee.emit(msg.type, msg.data);
            else
                ee.emit(msg.type);
        }
        /*
        else
            console.log("WARNING: Invalid IPC message received");
        */
    })
}
initEmitter(process, IPCClient);

export { IPCClient, initEmitter };