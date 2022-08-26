const randomReddit = require("./utils/randomReddit");

var help = {
    usage: "",
    desc: "Fetches a random post from r/arabfunny."
}

function execute(msg) { randomReddit("arabfunny", msg) };

module.exports = {
    help: help,
    execute: execute
}