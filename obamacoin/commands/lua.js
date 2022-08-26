const { execFile } = require("child_process");
const Discord = require("discord.js");

var help = {
    usage: "<code>",
    desc: "Executes Lua code."
}

function execute(msg) {
    var code = msg.content.slice(5);

    var t1 = new Date()/1000;
    execFile("./lua", ["-e", code], {cwd: './commands/utils'}, (err, stdout, stderr) => {
        var t2 = new Date()/1000;
        var embed = new Discord.MessageEmbed();
        embed.setTitle("Lua Result");
        embed.setDescription(`${msg.author}`);
        embed.addField("Source", "```lua\n" + code + "\n```");
        embed.setFooter("Execution time: " + (t2 - t1).toFixed(2) + " seconds.");
        if (err) embed.setColor("RED");
        else embed.setColor("BLUE");

        var lines = stdout.split("\n");
        if (lines.length > 28) lines = lines.slice(0, stderr ? 23 : 28);
        var output = lines.join("\n");
        if (output.length > 1024) output = output.substr(0, 1024);
        output += "\n" + stderr;
        embed.addField("Output", /\S/.test(output) ? output : "No output.");
        msg.channel.send(embed);
    });
}

module.exports = {
    help: help,
    execute: execute
}