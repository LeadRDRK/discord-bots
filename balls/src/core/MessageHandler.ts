import { Message } from "discord.js";
import { PrefixManager, CommandParser, EnvOptions, WorkDir, CustomCommands } from ".";
import Bot from "../Bot";

let timeouts: {[key: string]: NodeJS.Timeout} = {};
const timeoutDuration = 1000;
const timeoutMsg = "You're using commands too quickly! Calm down.";
function addUserTimeout(userId: string) {
    timeouts[userId] = setTimeout(() => {
        delete timeouts[userId];
    }, timeoutDuration);
}

async function onMessage(msg: Message) {
    if (msg.author.bot || msg.author.equals(msg.client.user!)) return;
    if (EnvOptions.isEnabled("TEST") && msg.author.id != Bot.authorId) return;

    let prefix = PrefixManager.getPrefix(msg.guildId!);
    if (msg.content.startsWith(prefix)) {
        if (msg.author.id in timeouts) {
            msg.reply(timeoutMsg);
            return;
        }

        let { command, args, inputs } = await CommandParser.parse(prefix, msg);
        if (!command || !args) {
            CustomCommands.init(msg.author.id);
            let commandName = CustomCommands.checkCommand(prefix, msg);
            if (commandName) {
                addUserTimeout(msg.author.id);
                CustomCommands.exec(msg, commandName);
            }
            return;
        }
        addUserTimeout(msg.author.id);
        if (!command.noTyping) await msg.channel.sendTyping();
        
        let res: void | WorkDir;
        try {
            res = await command.execute(msg, args, inputs);
        }
        catch (error) {
            if (typeof error == "string")
                msg.reply(error);
            else {
                msg.reply("Internal error occurred while executing command.");
                console.log(error);
            }
            return;
        }

        if (res instanceof WorkDir) {
            res.release();
        }
    }
}

const MessageHandler = {
    onMessage
};

export { MessageHandler };