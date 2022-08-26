const http = require("http");
const Discord = require("discord.js");

var help = {
    usage: "",
    desc: "Generate an inspiring message."
}

function execute(msg) {
    http.get("http://inspirobot.me/api?generate=true", res => {
        let url = "";
        res.on("data", chunk => {
            url += chunk;
        });
        res.on('end', _ => {
            let embed = new Discord.MessageEmbed()
            .setColor(3447003)
            .setTitle("InspiroBot")
            .setImage(url)
            .setFooter("Requested by " + msg.author.username);
            msg.channel.send(embed);
        });
    });
}

module.exports = {
    help: help,
    execute: execute
}
