import { Message } from "discord.js";
import { ScriptExecutor } from "./ScriptExecutor";

function init(userId: string) {
    // TODO
}

let commands: {[key: string]: {[key: string]: string}} = {};

async function exec(msg: Message, name: string) {
    if (!(msg.author.id in commands) || !(name in commands[msg.author.id])) return;
    let script = commands[msg.author.id][name];
    let scriptInit = ScriptExecutor.getScriptInit(msg);

    try {
        let output = await ScriptExecutor.run(script, scriptInit);
        if (output.trim().length == 0)
            msg.reply("No output.");
        else
            msg.reply(output.slice(0, 2000));
    }
    catch (error) {
        if (typeof error == "string")
            msg.reply(error);
    }
}

function checkCommand(prefix: string, msg: Message): string | undefined {
    let end = msg.content.indexOf(" ", prefix.length);
    if (end == -1) end = msg.content.length;
    let name = msg.content.slice(prefix.length, end).toLowerCase();

    if (msg.author.id in commands && name in commands[msg.author.id]) return name;
}

function assign(userId: string, name: string, script: string) {
    if (!(userId in commands)) commands[userId] = {};
    commands[userId][name] = script;
}

function remove(userId: string, name: string) {
    if (userId in commands && name in commands[userId])
        delete commands[userId][name];
}

const CustomCommands = {
    init,
    exec,
    checkCommand,
    assign,
    remove
}
export { CustomCommands }