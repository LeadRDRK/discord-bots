import { Message, MessageEmbed, User } from "discord.js"
import { Command, CommandArgs } from "../core"
import Utils from "../core/Utils";

async function execute(msg: Message, args: CommandArgs): Promise<void> {
    let user: User = msg.author;
    if (args.has(0))
        user = await Utils.getArgUser(msg.client, args.getString(0));
    
    try {
        user = await user.fetch(true);
    }
    catch {
        throw "Failed to fetch user.";
    }
    
    let url = user.bannerURL({format: "png", size: 4096, dynamic: true});
    if (!url) throw "User has no banner.";
    
    let embed = new MessageEmbed;
    embed.setTitle(`${user.username}'s Banner`)
         .setColor("ORANGE")
         .setImage(url);
    msg.channel.send({embeds: [embed]});
}

export const banner: Command = {
    execute: execute,
    
    usage: [
        {name: "user", type: "string", required: false,
         desc: "The user's id or mention. If not specified, your own user id will be used."}
    ],
    shortDesc: "Get a user's banner image",
    desc: "The highest quality is always automatically selected."
}