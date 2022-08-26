const fifteenAi = require("./utils/fifteenAi");

var help = {
    usage: "<text>",
    desc: "Make Wheatley from Portal say something for you. Powered by 15.ai"
}

function execute(msg, args) {fifteenAi(msg, args, "Wheatley")}

module.exports = {
    help: help,
    execute: execute
}