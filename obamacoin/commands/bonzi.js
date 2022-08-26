const SAPI4 = require("./utils/SAPI4");

const limits = {
    defSpeed: 157,
    minSpeed: 50,
    defPitch: 140,
    minPitch: 50,
    maxPitch: 400,
    maxSpeed: 250
}

var help = {
    usage: "[pitch] [speed] <text>",
    desc: "SAPI4 - BonziBUDDY."
}

function execute(msg, args) {
    // Adult Male #2, American English (TruVoice)
    SAPI4(msg, args, "Adult%20Male%20%232%2C%20American%20English%20(TruVoice)", limits, "BonziBUDDY")
};1

module.exports = {
    help: help,
    execute: execute
}