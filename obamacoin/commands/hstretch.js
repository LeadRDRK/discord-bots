const enlarge = require("./enlarge");

var help = {
    usage: "<input>",
    desc: "Shorthand for <code>enlarge w</code>"
}

function execute(msg, args) {
    args.unshift("width");
    enlarge.execute(msg, args);
}

module.exports = {
    help: help,
    execute: execute
}