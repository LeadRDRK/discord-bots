import { Message, MessageEmbed, User } from "discord.js"
import { Command, CommandArgs } from "../core"
import Utils from "../core/Utils";

async function execute(msg: Message): Promise<void> {
    if (!msg.guild)
        throw "You can only use this command in a server.";

    let url = msg.guild.bannerURL({format: "png", size: 4096});
    if (!url) throw "Server has no banner.";
    
    let embed = new MessageEmbed;
    embed.setTitle(`${msg.guild.name}'s Banner`)
         .setColor("ORANGE")
         .setImage(url);
    msg.channel.send({embeds: [embed]});
}

export const serverbanner: Command = {
    execute: execute,
    
    usage: [],
    shortDesc: "Get the server's banner",
    aliases: ["guildbanner"]
}