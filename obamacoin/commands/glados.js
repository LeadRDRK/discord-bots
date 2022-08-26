const fifteenAi = require("./utils/fifteenAi");

var help = {
    usage: "<text>",
    desc: "Make GLaDOS say something for you. Powered by 15.ai"
}

function execute(msg, args) {fifteenAi(msg, args, "GLaDOS")};

module.exports = {
    help: help,
    execute: execute
}