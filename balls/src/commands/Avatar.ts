import { Message, MessageEmbed, User } from "discord.js"
import { Command, CommandArgs } from "../core"
import Utils from "../core/Utils";

async function execute(msg: Message, args: CommandArgs): Promise<void> {
    let user: User = msg.author;
    if (args.has(0))
        user = await Utils.getArgUser(msg.client, args.getString(0));
    
    let url = user.avatarURL({format: "png", size: 4096, dynamic: true});
    if (!url) throw "User has no avatar.";
    
    let embed = new MessageEmbed;
    embed.setTitle(`${user.username}'s Avatar`)
         .setColor("ORANGE")
         .setImage(url);
    msg.channel.send({embeds: [embed]});
}

export const avatar: Command = {
    execute: execute,
    noTyping: true,
    
    usage: [
        {name: "user", type: "string", required: false,
         desc: "The user's id or mention. If not specified, your own user id will be used."}
    ],
    shortDesc: "Get a user's avatar/profile pic",
    desc: "The highest quality is always automatically selected.",
    aliases: ["pfp"]
}