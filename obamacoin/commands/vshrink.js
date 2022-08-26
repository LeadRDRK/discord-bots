const shrink = require("./shrink");

var help = {
    usage: "<input>",
    desc: "Shorthand for <code>shrink h</code>"
}

function execute(msg, args) {
    args.unshift("height");
    shrink.execute(msg, args);
}

module.exports = {
    help: help,
    execute: execute
}