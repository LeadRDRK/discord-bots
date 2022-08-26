const fifteenAi = require("./utils/fifteenAi");

var help = {
    usage: "<text>",
    desc: "Make Spy from Team Fortress 2 say something for you. Powered by 15.ai"
}

function execute(msg, args) {fifteenAi(msg, args, "Spy")}

module.exports = {
    help: help,
    execute: execute
}
