import { Message, MessageEmbed } from "discord.js"
import { Command, TaskResult } from "../core"
import { IPCClient } from "../ipc"

let replyMsgs: {[key: string]: Message} = {};

IPCClient.on("taskQueryResult", (userId: string, tasks: TaskResult[]) => {
    if (userId in replyMsgs) {
        let msg = replyMsgs[userId];
        let embed = new MessageEmbed;
        embed.setColor("ORANGE")
             .setTitle("Your Tasks");

        let description = "";

        let i = 1;
        for (const task of tasks) {
            description += `Task #${i}: **${task.running ? "Running" : "Queued"}** | ` +
                           `Position: ${task.position} | ID: ${task.id}\n`;
            ++i;
        }
        if (tasks.length == 0)
            description = "None.";

        embed.setDescription(description);
        msg.reply({embeds: [embed]});
        delete replyMsgs[userId];
    }
})

async function execute(msg: Message): Promise<void> {
    if (msg.author.id in replyMsgs)
        throw "I know how hard you want your task done but please calm down.";

    replyMsgs[msg.author.id] = msg;
    IPCClient.send("queryTasks", msg.author.id);
}

export const tasks: Command = {
    execute: execute,
    noTyping: true,
    
    usage: [],
    shortDesc: "Check your currently running/queued tasks"
}