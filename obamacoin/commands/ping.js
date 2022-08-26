var help = {
    usage: "",
    desc: "Check the bot's ping."
}

function execute(msg, _, client) {
    msg.channel.send("Websocket: `" + client.ws.ping + "ms`\n" +
                     "Message: `" + (Date.now() - msg.createdTimestamp) + "ms`")
}

module.exports = {
    help: help,
    execute: execute
}