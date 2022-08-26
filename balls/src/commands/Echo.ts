import { Message } from "discord.js"
import { Command, CommandArgs } from "../core"

async function execute(msg: Message, _args: CommandArgs): Promise<void> {
    let args = _args.getArray();
    if (args.length == 0)
        throw "No arguments.";

    let str = args.join(" | ");
    msg.reply(str);
}

export const echo: Command = {
    execute: execute,
    noTyping: true,
    
    usage: [],
    shortDesc: "Print arguments"
}