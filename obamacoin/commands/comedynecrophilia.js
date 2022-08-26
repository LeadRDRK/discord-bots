const randomReddit = require("./utils/randomReddit");

var help = {
    usage: "",
    desc: "Fetches a random post from r/ComedyNecrophilia.",
    aliases: ["cn"]
}

function execute(msg) { randomReddit("ComedyNecrophilia", msg) };

module.exports = {
    help: help,
    execute: execute
}