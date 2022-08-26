interface IPCMessage {
    type: string,
    data: any
}

function isIPCMessage(msg: any): msg is IPCMessage {
    return "type" in msg && "data" in msg;
}

export { IPCMessage, isIPCMessage }