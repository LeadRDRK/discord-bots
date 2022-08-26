const SAPI4 = require("./utils/SAPI4");

const limits = {
    defSpeed: 170,
    minSpeed: 30,
    defPitch: 113,
    minPitch: 56,
    maxPitch: 226,
    maxSpeed: 510
}

var help = {
    usage: "[pitch] [speed] <text>",
    desc: "SAPI4 - Microsoft Mike."
}

function execute(msg, args) {
    SAPI4(msg, args, "Mike", limits)
};

module.exports = {
    help: help,
    execute: execute
}