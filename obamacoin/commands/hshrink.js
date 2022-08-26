const shrink = require("./shrink");

var help = {
    usage: "<input>",
    desc: "Shorthand for <code>shrink w</code>"
}

function execute(msg, args) {
    args.unshift("width");
    shrink.execute(msg, args);
}

module.exports = {
    help: help,
    execute: execute
}