const Discord = require("discord.js");

var help = {
    usage: "[user]",
    desc: "Gets a user's avatar.",
    aliases: ["pfp"]
}

async function execute(msg, args) {
    var arg = args[0];
    var avatarUrl, user;
    if (arg) {
        if (arg.startsWith("<@")) {
            user = msg.mentions.users.first()
        } else if (/^\d+$/.test(arg) && arg.length == 18) {
            user = await msg.client.users.fetch(arg);
        } else {
            msg.channel.send("Invalid arguments.");
            return;
        }
    } else {
        user = msg.author;
    }
    avatarUrl = user.displayAvatarURL({format: "png", dynamic: true, size: 512});
    var embed = new Discord.MessageEmbed()
    .setTitle(user.username + "'s Avatar")
    .setImage(avatarUrl);
    msg.channel.send(embed);
}

module.exports = {
    help: help,
    execute: execute
}