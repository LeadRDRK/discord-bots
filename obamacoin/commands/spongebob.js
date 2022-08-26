const fifteenAi = require("./utils/fifteenAi");

var help = {
    usage: "<text>",
    desc: "Make SpongeBob say something for you. Powered by 15.ai"
}

function execute(msg, args) {fifteenAi(msg, args, "SpongeBob SquarePants")}

module.exports = {
    help: help,
    execute: execute
}
