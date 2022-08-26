var help = {
    usage: "",
    desc: "Sends the bot's invite link."
}

function execute(msg) {
    msg.channel.send("Bot invite link: <https://bit.ly/38IOmmp>\n" +
                     "Official Discord server: <https://discord.gg/BxkccurFDn>")
}

module.exports = {
    help: help,
    execute: execute
}
