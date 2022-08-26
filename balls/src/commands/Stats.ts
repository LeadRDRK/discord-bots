import { Message, MessageEmbed } from "discord.js"
import { Command } from "../core"
import os from "node:os";
import Bot from "../Bot";
import { IPCClient } from "../ipc"

let replyMsgs: {[key: string]: Message} = {};

function msToTime(t: number): string {
    t /= 1000
    let seconds = Math.floor(t % 60),
        minutes = Math.floor(t / 60 % 60),
        hours = Math.floor(t / 3600 % 24);
  
    return hours + "h " + minutes + "m " + seconds + "s";
}

IPCClient.on("taskStatsResult", async (userId: string, runningTasks: number, queuedTasks: number) => {
    if (userId in replyMsgs) {
        let msg = replyMsgs[userId];
        let serverCount: number;
        if (msg.client.shard) {
            let res = await msg.client.shard.fetchClientValues("guilds.cache.size");
            // @ts-ignore
            serverCount = res.reduce((acc, guildCount) => acc + guildCount, 0);
        }
        else serverCount = msg.client.guilds.cache.size;
        let uptime = msg.client.uptime ? msg.client.uptime : 0;
        
        var embed = new MessageEmbed;
        embed.setTitle("Stats")
            .addField("Servers", serverCount.toString())
            .addField("Running tasks", runningTasks.toString(), true)
            .addField("Queued tasks", queuedTasks.toString(), true)
            .addField("CPU", os.cpus()[0].model)
            .addField("Uptime", msToTime(uptime), true)
            .addField("Version", Bot.version, true)
            .setThumbnail("https://leadrdrk.eu.org/assets/img/balls.png")
            .setColor("ORANGE");
        msg.reply({embeds: [embed]});
        delete replyMsgs[userId];
    }
});

async function execute(msg: Message): Promise<void> {
    if (msg.author.id in replyMsgs)
        throw "Calm down.";

    replyMsgs[msg.author.id] = msg;
    IPCClient.send("queryTaskStats", msg.author.id);
}

export const stats: Command = {
    execute: execute,
    noTyping: true,
    
    usage: [],
    shortDesc: "Check the bot's stats"
}