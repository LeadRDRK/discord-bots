const randomReddit = require("./utils/randomReddit");

var help = {
    usage: "",
    desc: "Fetches a random post from r/okbuddyretard.",
    aliases: ["okbuddyretard"]
}

function execute(msg) { randomReddit("okbuddyretard", msg, true) };

module.exports = {
    help: help,
    execute: execute
}