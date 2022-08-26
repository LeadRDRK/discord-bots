import { Message } from "discord.js"
import { Command, CommandArgs, CustomCommands } from "../core"

async function execute(msg: Message, args: CommandArgs): Promise<void> {
    if (args.length < 1)
        throw "Missing arguments.";

    let name = args.getString(0);

    if (name.length == 0)
        throw "Command name cannot be empty.";

    if (name.indexOf(" ") != -1)
        throw "Command name cannot contain spaces.";

    CustomCommands.remove(msg.author.id, name);
    msg.reply(":white_check_mark: Removed `" + name + "`");
}

export const removecommand: Command = {
    execute: execute,
    noTyping: true,
    parseOptions: { 
        noExecuteScript: true
    },
    
    usage: [
        {name: "name", type: "string", required: true}
    ],
    shortDesc: "Remove a custom command",
    aliases: ["deletecommand"]
}