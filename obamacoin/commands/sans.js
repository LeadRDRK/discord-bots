const fifteenAi = require("./utils/fifteenAi");

var help = {
    usage: "<text>",
    desc: "ehehhehehehehehehehehehehehehehe."
}

function execute(msg, args) {fifteenAi(msg, args, "Sans")};

module.exports = {
    help: help,
    execute: execute
}