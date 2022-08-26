const Discord = require("discord.js")
const os = require("os")

var help = {
    usage: "",
    desc: "Check the bot's stats."
}

function msToTime(duration) {
    var seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  
    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
  
    return hours + "h " + minutes + "m " + seconds + "s";
  }

function execute(msg, _, client) {
    var memoryUsage = (process.memoryUsage().rss / (1024 * 1024)).toFixed(2)
    var embed = new Discord.MessageEmbed()
    .setTitle("Stats")
    .addField("Servers", client.guilds.cache.size, true)
    .addField("Members (est.)", client.users.cache.size, true)
    .addField("CPU", os.cpus()[0].model)
    .addField("Memory Usage", memoryUsage + "MB", true)
    .addField("Uptime", msToTime(client.uptime), true)
    .setThumbnail("https://ballsbot.herokuapp.com/balls.png")
    .setColor("ORANGE");
    msg.channel.send(embed);
}

module.exports = {
    help: help,
    execute: execute
}