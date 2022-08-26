import { Message } from "discord.js"
import { Command, CommandArgs, CustomCommands } from "../core"

async function execute(msg: Message, args: CommandArgs): Promise<void> {
    if (args.length < 2)
        throw "Missing arguments.";

    let name = args.getString(0).toLowerCase();
    let script = args.getString(1);

    if (name.length == 0)
        throw "Command name cannot be empty.";

    if (name.indexOf(" ") != -1)
        throw "Command name cannot contain spaces.";

    CustomCommands.assign(msg.author.id, name, script);
    msg.reply(":white_check_mark: Added `" + name + "`");
}

export const addcommand: Command = {
    execute: execute,
    noTyping: true,
    parseOptions: { 
        noExecuteScript: true
    },
    
    usage: [
        {name: "name",   type: "string", required: true},
        {name: "script", type: "string", required: true},
    ],
    shortDesc: "Add a custom command",
    desc: "Custom commands are locally defined, meaning only the author will be able to use it. " +
          "Adding a command with the same name as a built-in command will override it. Use `removecommand` to remove a " +
          "command that you've added."
}