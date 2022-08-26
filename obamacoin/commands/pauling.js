const fifteenAi = require("./utils/fifteenAi");

var help = {
    usage: "<text>",
    desc: "Make Miss Pauling from Team Fortress 2 say something for you. Powered by 15.ai"
}

function execute(msg, args) {fifteenAi(msg, args, "Miss Pauling")}

module.exports = {
    help: help,
    execute: execute
}