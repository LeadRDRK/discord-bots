const SAPI4 = require("./utils/SAPI4");

const limits = {
    defSpeed: 150,
    minSpeed: 30,
    defPitch: 100,
    minPitch: 50,
    maxPitch: 200,
    maxSpeed: 450
}

var help = {
    usage: "[pitch] [speed] <text>",
    desc: "SAPI4 - Microsoft Sam."
}

function execute(msg, args) {
    SAPI4(msg, args, "Sam", limits)
};

module.exports = {
    help: help,
    execute: execute
}