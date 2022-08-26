import { Message } from "discord.js"
import { Command, CommandArgs } from "../core"
import { InputFetcher } from "../core"
import Utils from "../core/Utils";

async function execute(msg: Message, args: CommandArgs): Promise<void> {
    if (args.length < 1)
        throw "Missing arguments";
    
    let url = Utils.getArgUrl(args.getString(0));
    msg.reply(await InputFetcher.getYoutubeDlLink(url, "twitter.com"));
}

export const twittervideo: Command = {
    execute: execute,
    
    usage: [
        {name: "url", type: "string", required: true,
         desc: "The link to the tweet."}
    ],
    shortDesc: "Get a video link from a Twitter post",
    desc: "The highest quality is always automatically selected. Note that the URL provided to this command is not " +
          "considered as an input specifier.",
    aliases: ["twittervid", "twvid"]
}