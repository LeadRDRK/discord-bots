const enlarge = require("./enlarge");

var help = {
    usage: "<input>",
    desc: "Shorthand for <code>enlarge h</code>"
}

function execute(msg, args) {
    args.unshift("height");
    enlarge.execute(msg, args);
}

module.exports = {
    help: help,
    execute: execute
}