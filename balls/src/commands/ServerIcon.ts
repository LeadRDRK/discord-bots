import { Message, MessageEmbed } from "discord.js"
import { Command } from "../core"

async function execute(msg: Message): Promise<void> {
    if (!msg.guild)
        throw "You can only use this command in a server.";

    let url = msg.guild.iconURL({format: "png", size: 4096});
    if (!url) throw "Server has no icon.";
    
    let embed = new MessageEmbed;
    embed.setTitle(`${msg.guild.name}'s Icon`)
         .setColor("ORANGE")
         .setImage(url);
    msg.channel.send({embeds: [embed]});
}

export const servericon: Command = {
    execute: execute,
    
    usage: [],
    shortDesc: "Get the server's icon",
    aliases: ["guildicon"]
}