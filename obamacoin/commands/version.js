const version = require("../version");

var help = {
    usage: "",
    desc: "Check the bot's version."
}

function execute(msg) {
    msg.channel.send("v" + version.string + ", updated on " + version.date);
}

module.exports = {
    help: help,
    execute: execute
}